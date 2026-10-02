"""Kurdish speech synthesis: models, worker processes, encoding, cache.

Measured on the production box (6 vCPU EPYC, no GPU) with MMS-TTS:
  - one long input runs at 1.45x real time; the same text as sentences 0.6x;
  - torch threads past 2 make it slower, not faster (6 threads: 1.53x), while
    plain CPU work scales across all six cores.
So synthesis is done sentence by sentence, in separate processes of 2 threads
each, and never by giving one process more threads.

Two pools, so that a reader trying a sentence on the site never waits behind
a 3,000-word article: "interactive" (short, public) and "batch" (long jobs).

The model per dialect is configuration (KTTS_MODEL_KMR / KTTS_MODEL_CKB). The
MMS models are a stop-gap under a non-commercial licence; the voice trained
from donated recordings replaces them by changing these two values.
"""
from __future__ import annotations

import hashlib
import multiprocessing as mp
import os
import subprocess
from pathlib import Path

from . import normalize

MODELS = {
    "kmr": os.environ.get("KTTS_MODEL_KMR", "facebook/mms-tts-kmr-script_latin"),
    "ckb": os.environ.get("KTTS_MODEL_CKB", "razhan/mms-tts-ckb"),
}
DIALECTS = tuple(MODELS)
THREADS = int(os.environ.get("KTTS_THREADS", "2"))
INTERACTIVE_WORKERS = int(os.environ.get("KTTS_INTERACTIVE_WORKERS", "1"))
BATCH_WORKERS = int(os.environ.get("KTTS_BATCH_WORKERS", "2"))
CACHE_DIR = Path(os.environ.get("KTTS_CACHE", "/opt/kurdishtts/cache"))
PAUSE_S = 0.28          # silence between sentences
MP3_BITRATE = "48k"     # mono speech at 16 kHz: 48k is transparent and small

# ── inside a worker process ──────────────────────────────────────────────────
_models: dict = {}


def _init_worker(threads: int) -> None:
    import torch
    torch.set_num_threads(threads)
    torch.set_num_interop_threads(1)


def _load(dialect: str):
    if dialect not in _models:
        from transformers import AutoTokenizer, VitsModel
        name = MODELS[dialect]
        model = VitsModel.from_pretrained(name).eval()
        _models[dialect] = (model, AutoTokenizer.from_pretrained(name), model.config.sampling_rate)
    return _models[dialect]


def _synth_one(args: tuple[str, str]) -> tuple[bytes, int]:
    """One sentence → 16-bit PCM bytes and the sample rate."""
    import numpy as np
    import torch
    dialect, text = args
    model, tok, sr = _load(dialect)
    inputs = tok(text, return_tensors="pt")
    if inputs["input_ids"].shape[-1] == 0:
        return b"", sr
    with torch.inference_mode():
        wav = model(**inputs).waveform[0].numpy()
    peak = float(np.abs(wav).max()) or 1.0
    # Normalise each sentence to the same peak, so loudness does not jump.
    pcm = (wav / peak * 0.89 * 32767).astype(np.int16)
    return pcm.tobytes(), sr


def _warm(dialect: str) -> bool:
    _synth_one((dialect, "a" if dialect == "kmr" else "ا"))
    return True


# ── in the server process ────────────────────────────────────────────────────
class Engine:
    def __init__(self) -> None:
        ctx = mp.get_context("spawn")
        self.pools = {
            "interactive": ctx.Pool(INTERACTIVE_WORKERS, _init_worker, (THREADS,), maxtasksperchild=2000),
            "batch": ctx.Pool(BATCH_WORKERS, _init_worker, (THREADS,), maxtasksperchild=2000),
        }
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def warm(self) -> None:
        """Load every model in every worker before the first request needs it."""
        for name, pool in self.pools.items():
            n = INTERACTIVE_WORKERS if name == "interactive" else BATCH_WORKERS
            pool.map(_warm, [d for d in DIALECTS for _ in range(n)], chunksize=1)

    @staticmethod
    def key(dialect: str, text: str) -> str:
        h = hashlib.sha256(f"{MODELS[dialect]}\n{dialect}\n{text}".encode()).hexdigest()
        return h

    @staticmethod
    def cache_path(key: str, lane: str = "batch") -> Path:
        """Two caches with two lifetimes (privacy policy rows 4 and 5): what a
        visitor typed is kept at most 7 days, under public/; article audio
        made for an API client is kept 90 days, under jobs/."""
        return CACHE_DIR / ("public" if lane == "interactive" else "jobs") / key[:2] / f"{key}.mp3"

    def synthesize(self, text: str, dialect: str, lane: str = "interactive") -> tuple[Path, float]:
        """Clean, split, synthesise and encode. Returns the cached MP3 and its length in seconds."""
        if dialect not in MODELS:
            raise ValueError(f"unknown dialect: {dialect}")
        cleaned = normalize.clean(text, dialect)
        sents = normalize.sentences(cleaned)
        if not sents:
            raise ValueError("nothing to read after cleaning")
        key = self.key(dialect, "\n".join(sents))
        out = self.cache_path(key, lane)
        if out.exists():
            return out, _duration(out)
        parts = self.pools[lane].map(_synth_one, [(dialect, s) for s in sents], chunksize=1)
        sr = parts[0][1]
        gap = b"\x00\x00" * int(sr * PAUSE_S)
        pcm = gap.join(p for p, _ in parts if p)
        out.parent.mkdir(parents=True, exist_ok=True)
        tmp = out.with_suffix(f".{os.getpid()}.tmp.mp3")
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(sr), "-ac", "1", "-i", "pipe:0",
             "-codec:a", "libmp3lame", "-b:a", MP3_BITRATE, str(tmp)],
            input=pcm, check=True,
        )
        os.replace(tmp, out)
        return out, len(pcm) / 2 / sr

    def close(self) -> None:
        for pool in self.pools.values():
            pool.terminate()


def _duration(path: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True, text=True)
    try:
        return float(r.stdout.strip())
    except ValueError:
        return 0.0
