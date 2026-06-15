"""
Kurdish auto-dubbing pipeline.

Input : an audio or video file in (almost) any language.
Output: the same video with a Kurdish voice-over track (Kurmancî or Soranî).

Stages:
  1. ffmpeg            -> extract 16 kHz mono WAV from the upload
  2. faster-whisper    -> transcribe into timestamped segments + detect source language
  3. NLLB-200          -> translate each segment into Kurdish (kmr_Latn / ckb_Arab)
  4. MMS-TTS           -> synthesize each Kurdish segment to speech
  5. time-fit + mix    -> place each clip at its segment start (atempo if too long)
  6. ffmpeg            -> mux the Kurdish track back onto the original video

Designed for a CPU-only box; keep inputs short (<= ~3 min). Models are loaded
lazily and cached process-wide.
"""

from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, List, Optional

# ── Configuration ──────────────────────────────────────────────────────────
WHISPER_MODEL = os.environ.get("DUB_WHISPER_MODEL", "large-v3")
NLLB_MODEL = os.environ.get("DUB_NLLB_MODEL", "facebook/nllb-200-distilled-600M")
MMS_MODELS = {
    "kmr": "facebook/mms-tts-kmr-script_latin",  # Kurmancî (Latin)
    "ckb": "razhan/mms-tts-ckb",                 # Soranî (Arabic)
}
NLLB_TARGET = {"kmr": "kmr_Latn", "ckb": "ckb_Arab"}

# Whisper ISO-639-1 (and a few 639-3) -> NLLB FLORES-200 source code.
WHISPER_TO_NLLB = {
    "en": "eng_Latn", "tr": "tur_Latn", "ar": "arb_Arab", "fa": "pes_Arab",
    "de": "deu_Latn", "fr": "fra_Latn", "es": "spa_Latn", "it": "ita_Latn",
    "ru": "rus_Cyrl", "nl": "nld_Latn", "pt": "por_Latn", "az": "azj_Latn",
    "ku": "kmr_Latn", "ckb": "ckb_Arab", "ckb_arab": "ckb_Arab",
    "hi": "hin_Deva", "ur": "urd_Arab", "uk": "ukr_Cyrl", "pl": "pol_Latn",
    "sv": "swe_Latn", "ja": "jpn_Jpan", "zh": "zho_Hans", "ko": "kor_Hang",
}

MAX_ATEMPO = 1.8   # cap clip speed-up so speech stays intelligible

ProgressCb = Callable[[str, int], None]   # (message, percent 0-100)


def _noop(_msg: str, _pct: int) -> None:
    pass


# ── Lazy model holders ─────────────────────────────────────────────────────
_whisper = None
_nllb_tok = None
_nllb_model = None
_mms = {}  # dialect -> (model, tokenizer)


def _load_whisper():
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
    return _whisper


def _load_nllb():
    global _nllb_tok, _nllb_model
    if _nllb_model is None:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        _nllb_tok = AutoTokenizer.from_pretrained(NLLB_MODEL)
        _nllb_model = AutoModelForSeq2SeqLM.from_pretrained(NLLB_MODEL)
    return _nllb_tok, _nllb_model


def _load_mms(dialect: str):
    if dialect not in _mms:
        from transformers import AutoTokenizer, VitsModel
        name = MMS_MODELS[dialect]
        _mms[dialect] = (
            VitsModel.from_pretrained(name),
            AutoTokenizer.from_pretrained(name),
        )
    return _mms[dialect]


# ── Small ffmpeg helpers ───────────────────────────────────────────────────
def _run(cmd: List[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def _probe_duration(path: str) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    try:
        return float(out)
    except ValueError:
        return 0.0


def _has_video(path: str) -> bool:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=codec_type", "-of", "csv=p=0", path],
        capture_output=True, text=True,
    ).stdout.strip()
    return out == "video"


@dataclass
class Segment:
    start: float
    end: float
    text: str


# ── Stage implementations ──────────────────────────────────────────────────
def extract_audio(src: str, dst_wav: str) -> None:
    _run(["ffmpeg", "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000", dst_wav])


def transcribe(wav: str) -> tuple[List[Segment], str]:
    model = _load_whisper()
    segments_iter, info = model.transcribe(wav, vad_filter=True, beam_size=1)
    segs = [
        Segment(s.start, s.end, s.text.strip())
        for s in segments_iter
        if s.text and s.text.strip()
    ]
    return segs, info.language


def translate_segments(segs: List[Segment], src_lang: str, dialect: str) -> List[str]:
    tok, model = _load_nllb()
    src = WHISPER_TO_NLLB.get(src_lang, "eng_Latn")
    tgt = NLLB_TARGET[dialect]
    tok.src_lang = src
    bos = tok.convert_tokens_to_ids(tgt)
    out: List[str] = []
    for seg in segs:
        enc = tok(seg.text, return_tensors="pt", truncation=True, max_length=256)
        gen = model.generate(**enc, forced_bos_token_id=bos, max_length=256)
        out.append(tok.batch_decode(gen, skip_special_tokens=True)[0].strip())
    return out


def synth_clip(text: str, dialect: str, out_wav: str) -> float:
    """Synthesize Kurdish text → WAV. Returns duration in seconds."""
    import numpy as np
    import scipy.io.wavfile as wavfile
    import torch

    model, tok = _load_mms(dialect)
    inputs = tok(text, return_tensors="pt")
    with torch.no_grad():
        wave = model(**inputs).waveform[0].cpu().numpy()
    rate = model.config.sampling_rate
    audio = (wave / (np.max(np.abs(wave)) + 1e-8) * 0.95 * 32767).astype(np.int16)
    wavfile.write(out_wav, rate=rate, data=audio)
    return len(audio) / rate


def _fit_speed(in_wav: str, out_wav: str, factor: float) -> None:
    """Speed up a clip by `factor` (1.0 = unchanged) using ffmpeg atempo."""
    if factor <= 1.01:
        _run(["ffmpeg", "-y", "-i", in_wav, out_wav])
        return
    factor = min(factor, MAX_ATEMPO)
    _run(["ffmpeg", "-y", "-i", in_wav, "-filter:a", f"atempo={factor:.3f}", out_wav])


def build_dub_track(
    segs: List[Segment], clips: List[str], total_dur: float, out_wav: str
) -> None:
    """Place each clip at its segment start on a silent track of total_dur."""
    from pydub import AudioSegment

    base = AudioSegment.silent(duration=int(total_dur * 1000) + 500, frame_rate=16000)
    for seg, clip in zip(segs, clips):
        if not clip or not os.path.exists(clip):
            continue
        a = AudioSegment.from_wav(clip)
        slot_ms = max(int((seg.end - seg.start) * 1000), 300)
        if len(a) > slot_ms * 1.25:
            factor = len(a) / slot_ms
            sped = clip + ".fit.wav"
            _fit_speed(clip, sped, factor)
            a = AudioSegment.from_wav(sped)
        base = base.overlay(a, position=int(seg.start * 1000))
    base.export(out_wav, format="wav")


def mux(video: str, dub_wav: str, out_path: str, keep_original_at: float = 0.0) -> None:
    """Mux the Kurdish track onto the video. keep_original_at>0 mixes the
    original audio in quietly (ducking); 0 replaces it entirely."""
    if keep_original_at > 0:
        _run([
            "ffmpeg", "-y", "-i", video, "-i", dub_wav,
            "-filter_complex",
            f"[0:a]volume={keep_original_at}[o];[1:a]volume=1.0[d];[o][d]amix=inputs=2:duration=longest[a]",
            "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-shortest",
            out_path,
        ])
    else:
        _run([
            "ffmpeg", "-y", "-i", video, "-i", dub_wav,
            "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-shortest",
            out_path,
        ])


# ── Orchestrator ───────────────────────────────────────────────────────────
def dub(
    input_path: str,
    dialect: str,
    work_dir: str,
    progress: Optional[ProgressCb] = None,
) -> dict:
    """Run the full pipeline. Returns {output, language, segments, is_video}."""
    progress = progress or _noop
    if dialect not in MMS_MODELS:
        raise ValueError(f"Unknown dialect: {dialect}")
    work = Path(work_dir)
    work.mkdir(parents=True, exist_ok=True)

    is_video = _has_video(input_path)
    total_dur = _probe_duration(input_path)

    progress("Extracting audio…", 5)
    wav = str(work / "source.wav")
    extract_audio(input_path, wav)

    progress("Transcribing (speech-to-text)…", 20)
    segs, src_lang = transcribe(wav)
    if not segs:
        raise RuntimeError("No speech detected in the file.")

    progress(f"Translating to Kurdish ({dialect})…", 45)
    kurdish = translate_segments(segs, src_lang, dialect)

    progress("Synthesizing Kurdish voice…", 65)
    clips: List[str] = []
    for i, txt in enumerate(kurdish):
        clip = str(work / f"clip_{i:04d}.wav")
        try:
            synth_clip(txt, dialect, clip) if txt else None
            clips.append(clip if txt else "")
        except Exception:
            clips.append("")

    progress("Aligning & mixing audio…", 85)
    dub_wav = str(work / "dub.wav")
    build_dub_track(segs, clips, total_dur, dub_wav)

    progress("Rendering final video…", 92)
    ext = ".mp4" if is_video else ".m4a"
    out_path = str(work / f"dubbed{ext}")
    if is_video:
        mux(input_path, dub_wav, out_path, keep_original_at=0.08)
    else:
        _run(["ffmpeg", "-y", "-i", dub_wav, "-c:a", "aac", out_path])

    progress("Done.", 100)
    return {
        "output": out_path,
        "language": src_lang,
        "segments": [
            {"start": s.start, "end": s.end, "src": s.text, "ku": k}
            for s, k in zip(segs, kurdish)
        ],
        "is_video": is_video,
    }
