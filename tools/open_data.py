"""Gather the Kurdish speech our own voice is trained on: open data and donations.

  python tools/open_data.py list                 # every source, its licence and state
  python tools/open_data.py fetch [ID ...]       # download into $KTTS_TRAIN/raw/<ID>
  python tools/open_data.py prepare [ID ...]     # mono FLAC + manifest in $KTTS_TRAIN/sets/<ID>
  python tools/open_data.py donations            # the donated clips that passed review
  python tools/open_data.py stats                # hours per dialect and source
  python tools/open_data.py attribution          # $KTTS_TRAIN/ATTRIBUTION.md, for the model card

Only sources whose licence allows training a model that may be offered
commercially are listed (training/SOURCES.md says what was left out, and why).
Every set ends as the same thing: audio/<n>.flac at the source's own sample
rate, mono, and manifest.jsonl with one line per clip:

  {"audio": "audio/000001.flac", "text": "...", "dialect": "kmr", "speaker": "cv-kmr:3f9a...",
   "seconds": 4.2, "split": "train", "source": "cv-kmr", "license": "CC0-1.0"}

Speakers are labels, never identities: Common Voice's own ids and donors'
addresses are hashed, and nothing here tries to tell who anyone is (the Mozilla
Data Collective's terms forbid it, and so does our own consent).

Environment: KTTS_TRAIN (default /opt/kurdishtts/train); MDC_API_KEY for the
Mozilla Data Collective, from mozilladatacollective.com, profile, API keys,
after accepting each dataset's terms on its page once.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

TRAIN = Path(os.environ.get("KTTS_TRAIN", "/opt/kurdishtts/train"))
MDC = "https://mozilladatacollective.com/api"
HF = "https://huggingface.co"
UA = {"User-Agent": "KurdAi-Voice/1.0 (+https://kurdishtts.dks.news)"}
csv.field_size_limit(1 << 24)


@dataclass(frozen=True)
class Source:
    id: str
    name: str
    dialect: str                 # kmr | ckb | zza | hac
    license: str
    hours: float                 # as published, before our own filtering
    where: str                   # "mdc:<dataset id>" or "hf:<repo>"
    files: tuple[str, ...] = ()  # hf: the files to take
    credit: str = ""             # the attribution line the licence asks for
    url: str = ""
    meta: str = ""               # one-speaker sets: the metadata file pairing audio and text
    meta_alt: str = ""           # ...and another spelling of the same text, kept as text_alt


SOURCES: tuple[Source, ...] = (
    Source("cv-kmr", "Common Voice Scripted Speech 27.0 — Kurmanji", "kmr", "CC0-1.0", 111.26,
           "mdc:cmu5wfe5300boo107fblbekt9",
           credit="Mozilla Common Voice 27.0, Kurmanji (CC0-1.0)",
           url="https://mozilladatacollective.com/datasets/cmu5wfe5300boo107fblbekt9"),
    Source("cv-ckb", "Common Voice Scripted Speech 27.0 — Central Kurdish", "ckb", "CC0-1.0", 196.08,
           "mdc:cmu5wr35b00donq07jqzj68wa",
           credit="Mozilla Common Voice 27.0, Central Kurdish (CC0-1.0)",
           url="https://mozilladatacollective.com/datasets/cmu5wr35b00donq07jqzj68wa"),
    Source("cv-zza", "Common Voice Scripted Speech 27.0 — Zaza", "zza", "CC0-1.0", 2.72,
           "mdc:cmu614kvl00k9nq07ffk51v85",
           credit="Mozilla Common Voice 27.0, Zaza (CC0-1.0)",
           url="https://mozilladatacollective.com/datasets/cmu614kvl00k9nq07ffk51v85"),
    Source("cv-sps-hac", "Common Voice Spontaneous Speech 5.0 — Gorani (Hawrami)", "hac", "CC0-1.0", 0.0,
           "mdc:cmu5n57fs00ttmi07bda1eg8r",
           credit="Mozilla Common Voice Spontaneous Speech 5.0, Gorani (CC0-1.0)",
           url="https://mozilladatacollective.com/datasets/cmu5n57fs00ttmi07bda1eg8r"),
    Source("unimelb-ckb", "Central Kurdish TTS dataset 1.0 (one speaker)", "ckb", "CC-BY-4.0", 2.3,
           "mdc:cmj77njd701ljmb07m97pw1p3",
           credit="Central Kurdish TTS dataset 1.0, read by Aso Mahmudi, The University of Melbourne (CC BY 4.0)",
           url="https://mozilladatacollective.com/datasets/cmj77njd701ljmb07m97pw1p3",
           meta="metadata.csv"),
    Source("unimelb-hac", "Hawrami Kurdish TTS dataset 1.0 (one speaker)", "hac", "CC-BY-4.0", 5.25,
           "mdc:cml0wtouz026wno075aq7v201",
           credit="Hawrami Kurdish TTS dataset 1.0, read by Ako Marani, The University of Melbourne (CC BY 4.0)",
           url="https://mozilladatacollective.com/datasets/cml0wtouz026wno075aq7v201",
           # Three spellings of Hawrami; the first is the writers' own and the
           # speaker's, the third the nearest to the standard Sorani alphabet.
           meta="metadata_var1.csv", meta_alt="metadata_var3.csv"),
    Source("fleurs-ckb", "Google FLEURS — Central Kurdish", "ckb", "CC-BY-4.0", 14.7,
           "hf:datasets/google/fleurs",
           files=tuple(f"data/ckb_iq/{p}" for p in (
               "train.tsv", "dev.tsv", "test.tsv",
               "audio/train.tar.gz", "audio/dev.tar.gz", "audio/test.tar.gz")),
           credit="FLEURS, Conneau et al. 2022, Google (CC BY 4.0)",
           url="https://huggingface.co/datasets/google/fleurs"),
    Source("openbible-ckb", "OpenBibleTTS — Central Kurdish", "ckb", "CC-BY-SA-4.0", 85.4,
           "hf:datasets/multilingual-tts/open-bible",
           files=tuple(f"Central Kurdish/train-{i:05d}-of-00030.parquet" for i in range(30)),
           credit="OpenBibleTTS, Guzmán et al. 2026, from Open Bible (open.bible) (CC BY-SA 4.0)",
           url="https://huggingface.co/datasets/multilingual-tts/open-bible"),
    Source("genc-zza", "Genç Zazaki teaching recordings (one speaker)", "zza", "CC0-1.0", 2.5,
           "hf:datasets/stronganchor/zazaki-genc-speech",
           files=("data/reviewed_20260719/full.parquet",),
           credit="Genç Zazaki speech, stronganchor (CC0-1.0)",
           url="https://huggingface.co/datasets/stronganchor/zazaki-genc-speech"),
)
BY_ID = {s.id: s for s in SOURCES}


# ── small helpers ────────────────────────────────────────────────────────────
def say(*a) -> None:
    print(*a, flush=True)


def anon(source: str, who: str) -> str:
    """A stable speaker label that names no one."""
    digest = hashlib.sha256(f"{source}\n{who}".encode()).hexdigest()[:12]
    return f"{source}:{digest}"


def download(url: str, dest: Path, headers: dict | None = None, size: int | None = None) -> Path:
    """Stream to dest, resuming a partial file; a finished file is not fetched again."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and (size is None or dest.stat().st_size == size):
        return dest
    part = dest.with_suffix(dest.suffix + ".part")
    have = part.stat().st_size if part.exists() else 0
    req = urllib.request.Request(url, headers={**UA, **(headers or {}), **({"Range": f"bytes={have}-"} if have else {})})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as r, open(part, "ab" if r.status == 206 else "wb") as f:
                shutil.copyfileobj(r, f, 1 << 20)
            break
        except OSError as e:
            if attempt == 4:
                raise
            say(f"  retry {attempt + 1} after {e}")
            time.sleep(2 ** attempt)
            have = part.stat().st_size if part.exists() else 0
            req = urllib.request.Request(url, headers={**UA, **(headers or {}), **({"Range": f"bytes={have}-"} if have else {})})
    if size is not None and part.stat().st_size != size:
        raise RuntimeError(f"{dest.name}: got {part.stat().st_size} bytes, expected {size}")
    part.rename(dest)
    return dest


def untar(archive: Path, into: Path) -> None:
    with tarfile.open(archive) as t:
        try:
            t.extractall(into, filter="data")   # refuses paths that leave `into`
        except TypeError:                       # Python before 3.11.4 has no filter
            for m in t.getmembers():
                if m.name.startswith("/") or ".." in Path(m.name).parts or m.issym() or m.islnk():
                    raise RuntimeError(f"{archive.name}: unsafe member {m.name}") from None
            t.extractall(into)


def to_flac(src: Path | bytes, dest: Path) -> float:
    """Any audio to mono FLAC at its own rate; returns its length in seconds."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    data = src if isinstance(src, bytes) else None
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", "pipe:0" if data else str(src),
           "-ac", "1", "-c:a", "flac", "-sample_fmt", "s16", str(dest)]
    subprocess.run(cmd, input=data, check=True, capture_output=True)
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(dest)],
                         check=True, capture_output=True, text=True).stdout.strip()
    return round(float(out or 0), 3)


class Writer:
    """audio/<n>.flac and manifest.jsonl for one set, converted in parallel."""

    def __init__(self, src: Source | None, out: Path) -> None:
        self.src, self.out = src, out
        if out.exists():
            shutil.rmtree(out)
        (out / "audio").mkdir(parents=True)
        self.workers = os.cpu_count() or 4
        self.pool = ThreadPoolExecutor(max_workers=self.workers)
        self.jobs: list = []
        self.n = 0
        self.waited = 0

    def add(self, audio: Path | bytes, text: str, speaker: str, split: str = "train", **extra) -> None:
        text = " ".join((text or "").split())
        if not text:
            return
        self.n += 1
        rel = f"audio/{self.n:06d}.flac"
        row = {"audio": rel, "text": text, "dialect": extra.pop("dialect", self.src.dialect if self.src else None),
               "speaker": speaker, "split": split, "source": extra.pop("source", self.src.id if self.src else None),
               "license": extra.pop("license", self.src.license if self.src else None), **extra}
        self.jobs.append((row, self.pool.submit(to_flac, audio, self.out / rel)))
        # Audio from a parquet file arrives as bytes: never hold more than a few
        # batches of it in memory while ffmpeg catches up.
        while len(self.jobs) - self.waited > self.workers * 4:
            self.jobs[self.waited][1].exception()
            self.waited += 1

    def close(self) -> int:
        kept = 0
        with open(self.out / "manifest.jsonl", "w", encoding="utf-8") as f:
            for row, job in self.jobs:
                try:
                    row["seconds"] = job.result()
                except subprocess.CalledProcessError as e:
                    say(f"  skipped {row['audio']}: {e.stderr.decode(errors='replace').strip()[:120]}")
                    continue
                if row["seconds"] <= 0:
                    continue
                f.write(json.dumps(row, ensure_ascii=False) + "\n")
                kept += 1
        self.pool.shutdown()
        return kept


# ── fetch ────────────────────────────────────────────────────────────────────
def fetch(src: Source) -> None:
    raw = TRAIN / "raw" / src.id
    kind, ref = src.where.split(":", 1)
    if kind == "mdc":
        key = os.environ.get("MDC_API_KEY")
        if not key:
            raise SystemExit("MDC_API_KEY is not set (mozilladatacollective.com, profile, API keys)")
        req = urllib.request.Request(f"{MDC}/datasets/{ref}/download", method="POST",
                                     headers={**UA, "Authorization": f"Bearer {key}"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                d = json.load(r)
        except urllib.error.HTTPError as e:
            hint = {403: "accept the dataset's terms on its page first: " + src.url,
                    429: "the Data Collective allows 30 downloads a day; try tomorrow"}.get(e.code, "")
            raise SystemExit(f"{src.id}: {e.code} {e.reason}. {hint}") from e
        tgz = download(d["downloadUrl"], raw / d.get("filename", f"{src.id}.tar.gz"), size=d.get("sizeBytes"))
        done = raw / ".extracted"
        if not done.exists():
            say(f"  extracting {tgz.name}")
            untar(tgz, raw / "x")
            done.touch()
    else:
        for f in src.files:
            meta = json.load(urllib.request.urlopen(urllib.request.Request(
                f"{HF}/api/{ref}/paths-info/main", data=json.dumps({"paths": [f]}).encode(),
                headers={**UA, "Content-Type": "application/json"}), timeout=60))
            size = meta[0].get("size") if meta else None
            say(f"  {f} ({(size or 0) / 1e6:.0f} MB)")
            download(f"{HF}/{ref}/resolve/main/{urllib.parse.quote(f)}", raw / f, size=size)


# ── prepare: one reader per kind of source ───────────────────────────────────
def _common_voice(src: Source, w: Writer) -> None:
    """Scripted speech: validated.tsv (only what other speakers confirmed), the
    split from train/dev/test.tsv. Spontaneous speech: the transcribed answers."""
    base = TRAIN / "raw" / src.id / "x"
    validated = sorted(base.rglob("validated.tsv"))
    if validated:
        d = validated[0].parent
        split = {}
        for name in ("train", "dev", "test"):
            p = d / f"{name}.tsv"
            if p.exists():
                with open(p, encoding="utf-8") as f:
                    for r in csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
                        split[r["path"]] = name
        with open(validated[0], encoding="utf-8") as f:
            for r in csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
                clip = d / "clips" / r["path"]
                if clip.exists():
                    w.add(clip, r["sentence"], anon(src.id, r["client_id"]), split.get(r["path"], "train"))
        return
    for tsv in sorted(base.rglob("*.tsv")):
        with open(tsv, encoding="utf-8") as f:
            rows = list(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE))
        if not rows or "transcription" not in rows[0]:
            continue
        for r in rows:
            name = r.get("audio_file") or r.get("path") or ""
            hits = list(tsv.parent.rglob(Path(name).name)) if name else []
            if hits and (r.get("transcription") or "").strip():
                w.add(hits[0], r["transcription"], anon(src.id, r.get("client_id", "")))
        return
    raise SystemExit(f"{src.id}: no validated.tsv or transcribed .tsv under {base}")


def _pairs(src: Source, w: Writer) -> None:
    """A one-speaker TTS set: `name.wav|text` lines in its metadata file
    (measured on the downloaded archives, 2026-10-08)."""
    base = TRAIN / "raw" / src.id / "x"

    def read(name: str) -> dict[str, str]:
        found = sorted(base.rglob(name))
        if not found:
            raise SystemExit(f"{src.id}: no {name} under {base}")
        out = {}
        for line in found[0].read_text(encoding="utf-8").splitlines():
            key, sep, text = line.partition("|")
            if sep and text.strip():
                out[Path(key.strip()).stem] = text.strip()
        return out

    texts = read(src.meta)
    alt = read(src.meta_alt) if src.meta_alt else {}
    wavs = {p.stem: p for p in base.rglob("*.wav")}
    for key in sorted(texts):
        if key in wavs:
            extra = {"text_alt": alt[key]} if key in alt else {}
            w.add(wavs[key], texts[key], anon(src.id, "one"), **extra)


def _fleurs(src: Source, w: Writer) -> None:
    raw = TRAIN / "raw" / src.id / "data" / "ckb_iq"
    for split in ("train", "dev", "test"):
        texts, gender = {}, {}
        with open(raw / f"{split}.tsv", encoding="utf-8") as f:
            for row in csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
                texts[row[1]] = row[2]          # the transcript as written, with punctuation
                gender[row[1]] = row[6] if len(row) > 6 else ""
        out = TRAIN / "raw" / src.id / "wav" / split
        if not out.exists():
            untar(raw / "audio" / f"{split}.tar.gz", out)
        for wav in sorted(out.rglob("*.wav")):
            if wav.name in texts:
                # FLEURS does not name its speakers; each recording is its own label.
                w.add(wav, texts[wav.name], anon(src.id, wav.name), split, gender=gender[wav.name])


def _parquet(src: Source, w: Writer) -> None:
    import pyarrow.parquet as pq
    for f in src.files:
        for batch in pq.ParquetFile(TRAIN / "raw" / src.id / f).iter_batches(batch_size=64):
            for r in batch.to_pylist():
                a = r.get("audio")
                audio = a.get("bytes") if isinstance(a, dict) else a
                if audio:
                    w.add(audio, r.get("text") or "", anon(src.id, str(r.get("speaker_id") or "one")))


READERS = {"cv-kmr": _common_voice, "cv-ckb": _common_voice, "cv-zza": _common_voice,
           "cv-sps-hac": _common_voice, "unimelb-ckb": _pairs, "unimelb-hac": _pairs,
           "fleurs-ckb": _fleurs, "openbible-ckb": _parquet, "genc-zza": _parquet}


def prepare(src: Source) -> int:
    w = Writer(src, TRAIN / "sets" / src.id)
    READERS[src.id](src, w)
    return w.close()


# ── our own: donations that passed review ────────────────────────────────────
def donations(db_path: Path, clips_dir: Path) -> int:
    """The set is rebuilt from the database every time, never added to: a donor
    who deleted their recordings is gone from it, as the consent promises
    ("not used in any later training")."""
    from ktts.store import Store
    store = Store(db_path)
    with store.db() as db:
        rows = db.execute("""SELECT c.id, c.addr, c.file, c.dialect, s.text, sp.consent_version
                             FROM clip c JOIN sentence s ON s.id = c.sentence_id
                             JOIN speaker sp ON sp.addr = c.addr
                             WHERE c.status = 'valid'""").fetchall()
    w = Writer(None, TRAIN / "sets" / "donations")
    for r in rows:
        f = clips_dir / r["file"]
        if f.exists():
            w.add(f, r["text"], anon("donations", r["addr"]), dialect=r["dialect"], source="donations",
                  license="KurdAi Voice donation: training our own models only, never published",
                  consent=r["consent_version"])
    return w.close()


# ── reports ──────────────────────────────────────────────────────────────────
def manifests() -> list[Path]:
    return sorted((TRAIN / "sets").glob("*/manifest.jsonl"))


def stats() -> dict:
    out: dict = {}
    for m in manifests():
        for line in open(m, encoding="utf-8"):
            r = json.loads(line)
            d = out.setdefault(r["dialect"], {}).setdefault(r["source"], {"seconds": 0.0, "clips": 0, "speakers": set()})
            d["seconds"] += r["seconds"]
            d["clips"] += 1
            d["speakers"].add(r["speaker"])
    return out


def attribution() -> str:
    used = {m.parent.name for m in manifests()}
    lines = ["# Training data", "",
             "This model was trained on the following speech, with thanks to everyone who gave their voice.", ""]
    for s in SOURCES:
        if s.id in used:
            lines.append(f"- {s.credit} — {s.url}")
    if "donations" in used:
        lines.append("- Voices donated to KurdAi Voice (kurdishtts.dks.news), under its consent: "
                     "used only to train our own models, never published.")
    if any(BY_ID[i].license.startswith("CC-BY-SA") for i in used if i in BY_ID):
        lines += ["", "Material under CC BY-SA 4.0 is used as the licence requires: credited above, "
                  "and anything derived from it that is shared is shared under the same licence."]
    return "\n".join(lines) + "\n"


def main(argv: list[str]) -> None:
    cmd, ids = (argv[0] if argv else "list"), argv[1:]
    pick = [BY_ID[i] for i in ids] if ids else list(SOURCES)
    unknown = [i for i in ids if i not in BY_ID]
    if unknown:
        raise SystemExit(f"unknown source: {', '.join(unknown)} (see: list)")
    if cmd == "list":
        for s in SOURCES:
            state = "prepared" if (TRAIN / "sets" / s.id / "manifest.jsonl").exists() else \
                    "fetched" if (TRAIN / "raw" / s.id).exists() else "-"
            say(f"{s.id:14} {s.dialect:4} {s.hours:7.1f} h  {s.license:13} {state:9} {s.name}")
    elif cmd == "fetch":
        for s in pick:
            say(f"fetch {s.id}")
            fetch(s)
    elif cmd == "prepare":
        for s in pick:
            say(f"prepare {s.id}")
            say(f"  {prepare(s)} clips")
    elif cmd == "donations":
        data = Path(os.environ.get("KTTS_DATA", "/opt/kurdishtts/data"))
        clips = Path(os.environ.get("KTTS_CLIPS", data / "clips"))
        say(f"donations: {donations(data / 'kurdishtts.db', clips)} clips")
    elif cmd == "stats":
        total = 0.0
        for dialect, by in sorted(stats().items()):
            h = sum(v["seconds"] for v in by.values()) / 3600
            total += h
            say(f"{dialect}  {h:8.1f} h")
            for src, v in sorted(by.items()):
                say(f"   {src:14} {v['seconds'] / 3600:7.1f} h  {v['clips']:7} clips  {len(v['speakers']):5} speakers")
        say(f"all  {total:8.1f} h")
    elif cmd == "attribution":
        (TRAIN / "ATTRIBUTION.md").write_text(attribution(), encoding="utf-8")
        say(TRAIN / "ATTRIBUTION.md")
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
