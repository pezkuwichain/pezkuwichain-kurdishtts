"""Voice donation: read a sentence, record it, check others' recordings.

A donor signs in with a wallet, accepts the CC0 dedication once, says which
dialect they speak, and reads sentences from a CC0 corpus (Common Voice's
sentence collector). Every recording is checked here for what a machine can
check — length, silence, clipping, a reading speed that fits the sentence —
and then by other donors for what it cannot: does the voice say the sentence?
Two agreeing votes decide a clip. Only "valid" clips go into training.

Recordings are kept as 48 kHz mono 16-bit FLAC, trimmed of leading and
trailing silence. The browser's own format (webm/opus, mp4/aac, wav) is
decoded by ffmpeg and never stored.
"""
from __future__ import annotations

import os
import random
import subprocess
import time
from pathlib import Path

import numpy as np
from fastapi import APIRouter, Cookie, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from . import auth

CLIPS_DIR = Path(os.environ.get("KTTS_CLIPS", "/opt/kurdishtts/data/clips"))
CONSENT_VERSION = "cc0-2026-10"
DIALECTS = ("kmr", "ckb")
SR = 48000
MAX_UPLOAD = 6 * 1024 * 1024
MIN_S, MAX_S = 1.0, 15.0
MIN_RMS_DB = -42.0           # quieter than this is a silent or far-away recording
CLIP_RATIO_MAX = 0.002       # more than 0.2 % of samples at full scale is clipping
CPS_RANGE = (3.0, 28.0)      # characters per second a human reading aloud can do
PER_DAY = int(os.environ.get("KTTS_CLIPS_PER_DAY", "400"))
VOTES_TO_DECIDE = 2

router = APIRouter()
STATE: dict = {}   # "store"

GENDERS = ("female", "male", "other", "")
AGES = ("18-29", "30-44", "45-59", "60+", "")


# ── audio ────────────────────────────────────────────────────────────────────
class Rejected(ValueError):
    """A recording a machine can tell is unusable. The code names why, in no language."""


def analyse(raw: bytes, text: str) -> tuple[np.ndarray, dict]:
    try:
        r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-ac", "1", "-ar", str(SR),
                            "-f", "s16le", "pipe:1"], input=raw, capture_output=True, timeout=60, check=True)
    except (subprocess.SubprocessError, OSError) as e:
        raise Rejected("UNREADABLE") from e
    pcm = np.frombuffer(r.stdout, dtype=np.int16)
    if pcm.size < SR * 0.5:
        raise Rejected("TOO_SHORT")
    x = pcm.astype(np.float32) / 32768.0
    # Trim leading/trailing silence: 20 ms frames below -45 dBFS, keep 150 ms either side.
    frame = SR // 50
    n = x.size // frame
    energy = 10 * np.log10(np.maximum((x[: n * frame].reshape(n, frame) ** 2).mean(axis=1), 1e-10))
    voiced = np.where(energy > -45)[0]
    if voiced.size == 0:
        raise Rejected("SILENT")
    pad = int(0.15 * SR)
    a = max(0, voiced[0] * frame - pad)
    b = min(x.size, (voiced[-1] + 1) * frame + pad)
    x, pcm = x[a:b], pcm[a:b]
    secs = x.size / SR
    rms_db = float(10 * np.log10(max(float((x**2).mean()), 1e-10)))
    peak_db = float(20 * np.log10(max(float(np.abs(x).max()), 1e-10)))
    clipped = float((np.abs(pcm.astype(np.int32)) >= 32700).mean())
    letters = sum(ch.isalpha() for ch in text)
    cps = letters / secs if secs else 0
    if secs < MIN_S:
        raise Rejected("TOO_SHORT")
    if secs > MAX_S:
        raise Rejected("TOO_LONG")
    if rms_db < MIN_RMS_DB:
        raise Rejected("TOO_QUIET")
    if clipped > CLIP_RATIO_MAX:
        raise Rejected("CLIPPING")
    if not (CPS_RANGE[0] <= cps <= CPS_RANGE[1]):
        raise Rejected("PACE")
    return pcm, {"seconds": round(secs, 3), "rms_db": round(rms_db, 1), "peak_db": round(peak_db, 1)}


def write_flac(pcm: np.ndarray, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp.flac")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
                    "-codec:a", "flac", str(tmp)], input=pcm.tobytes(), check=True, timeout=60)
    os.replace(tmp, path)


# ── routes ───────────────────────────────────────────────────────────────────
class ProfileIn(BaseModel):
    dialect: str
    gender: str = ""
    age_band: str = ""
    region: str = ""
    consent: bool


@router.post("/api/donate/profile")
def profile(body: ProfileIn, kt_ses: str | None = Cookie(None), x_csrf: str | None = Header(None)):
    addr = auth.require(kt_ses, x_csrf)
    if body.dialect not in DIALECTS or body.gender not in GENDERS or body.age_band not in AGES:
        raise HTTPException(400, "profile")
    if not body.consent:
        raise HTTPException(400, "consent")
    with STATE["store"].db() as db:
        db.execute("UPDATE speaker SET dialect=?, gender=?, age_band=?, region=?, consent_version=?, consent_at=? "
                   "WHERE addr=?", (body.dialect, body.gender, body.age_band, body.region.strip()[:60],
                                    CONSENT_VERSION, int(time.time()), addr))
    return {"ok": True, "consent_version": CONSENT_VERSION}


def _speaker(db, addr: str) -> dict:
    sp = db.execute("SELECT * FROM speaker WHERE addr=?", (addr,)).fetchone()
    if not sp or sp["consent_version"] != CONSENT_VERSION or not sp["dialect"]:
        raise HTTPException(409, "profile")
    if sp["blocked"]:
        raise HTTPException(403, "blocked")
    return dict(sp)


@router.get("/api/donate/next")
def next_sentences(kt_ses: str | None = Cookie(None)):
    addr = auth.require(kt_ses, None, write=False)
    with STATE["store"].db() as db:
        sp = _speaker(db, addr)
        # Sentences this donor has not read, the least-read first, so the corpus
        # is covered rather than the same lines recorded a hundred times.
        rows = db.execute("""
          SELECT s.id, s.text FROM sentence s
          LEFT JOIN clip c ON c.sentence_id = s.id
          WHERE s.dialect=? AND s.active=1
            AND s.id NOT IN (SELECT sentence_id FROM clip WHERE addr=?)
          GROUP BY s.id ORDER BY COUNT(c.id), RANDOM() LIMIT 40""", (sp["dialect"], addr)).fetchall()
    rows = [dict(r) for r in rows]
    random.shuffle(rows)
    return {"dialect": sp["dialect"], "sentences": rows[:8]}


@router.post("/api/donate/clip")
async def upload(sentence_id: int = Form(...), audio: UploadFile = File(...),
                 kt_ses: str | None = Cookie(None), x_csrf: str | None = Header(None)):
    addr = auth.require(kt_ses, x_csrf)
    raw = await audio.read(MAX_UPLOAD + 1)
    if len(raw) > MAX_UPLOAD:
        raise HTTPException(413, "TOO_BIG")
    store = STATE["store"]
    with store.db() as db:
        sp = _speaker(db, addr)
        s = db.execute("SELECT id, text, dialect FROM sentence WHERE id=? AND active=1", (sentence_id,)).fetchone()
        if not s or s["dialect"] != sp["dialect"]:
            raise HTTPException(404, "sentence")
        today = db.execute("SELECT COUNT(*) FROM clip WHERE addr=? AND created > ?",
                           (addr, int(time.time()) - 86400)).fetchone()[0]
        if today >= PER_DAY:
            raise HTTPException(429, "DAILY_LIMIT")
    from starlette.concurrency import run_in_threadpool
    try:
        pcm, m = await run_in_threadpool(analyse, raw, s["text"])
    except Rejected as e:
        raise HTTPException(422, str(e)) from e
    name = f"{sp['dialect']}/{int(time.time())}-{os.urandom(6).hex()}.flac"
    await run_in_threadpool(write_flac, pcm, CLIPS_DIR / name)
    with store.db() as db:
        try:
            cur = db.execute("INSERT INTO clip (addr, sentence_id, dialect, file, seconds, rms_db, peak_db, created) "
                             "VALUES (?,?,?,?,?,?,?,?)", (addr, s["id"], s["dialect"], name, m["seconds"],
                                                          m["rms_db"], m["peak_db"], int(time.time())))
        except Exception as e:
            (CLIPS_DIR / name).unlink(missing_ok=True)
            raise HTTPException(409, "ALREADY_RECORDED") from e
    return {"id": cur.lastrowid, **m}


@router.get("/api/donate/review")
def review(kt_ses: str | None = Cookie(None)):
    addr = auth.require(kt_ses, None, write=False)
    with STATE["store"].db() as db:
        sp = _speaker(db, addr)
        r = db.execute("""
          SELECT c.id, s.text, c.seconds FROM clip c JOIN sentence s ON s.id = c.sentence_id
          WHERE c.dialect=? AND c.status='pending' AND c.addr<>?
            AND c.id NOT IN (SELECT clip_id FROM vote WHERE addr=?)
          ORDER BY (c.up + c.down) DESC, c.created LIMIT 1""", (sp["dialect"], addr, addr)).fetchone()
    if not r:
        return {"clip": None}
    return {"clip": {**dict(r), "audio": f"/api/donate/audio/{r['id']}"}}


@router.get("/api/donate/audio/{clip_id}")
def clip_audio(clip_id: int, kt_ses: str | None = Cookie(None)):
    auth.require(kt_ses, None, write=False)
    with STATE["store"].db() as db:
        r = db.execute("SELECT file FROM clip WHERE id=?", (clip_id,)).fetchone()
    if not r:
        raise HTTPException(404, "clip")
    return FileResponse(CLIPS_DIR / r["file"], media_type="audio/flac", headers={"Cache-Control": "private, max-age=3600"})


class VoteIn(BaseModel):
    clip_id: int
    val: int


@router.post("/api/donate/vote")
def vote(body: VoteIn, kt_ses: str | None = Cookie(None), x_csrf: str | None = Header(None)):
    addr = auth.require(kt_ses, x_csrf)
    if body.val not in (1, -1):
        raise HTTPException(400, "val")
    with STATE["store"].db() as db:
        _speaker(db, addr)
        c = db.execute("SELECT addr, status FROM clip WHERE id=?", (body.clip_id,)).fetchone()
        if not c:
            raise HTTPException(404, "clip")
        if c["addr"] == addr:
            raise HTTPException(403, "OWN_CLIP")
        try:
            db.execute("INSERT INTO vote (clip_id, addr, val, created) VALUES (?,?,?,?)",
                       (body.clip_id, addr, body.val, int(time.time())))
        except Exception as e:
            raise HTTPException(409, "ALREADY_VOTED") from e
        if body.val == 1:
            db.execute("UPDATE clip SET up = up + 1 WHERE id=?", (body.clip_id,))
        else:
            db.execute("UPDATE clip SET down = down + 1 WHERE id=?", (body.clip_id,))
        up, down = db.execute("SELECT up, down FROM clip WHERE id=?", (body.clip_id,)).fetchone()
        status = "pending"
        if up >= VOTES_TO_DECIDE and up > down:
            status = "valid"
        elif down >= VOTES_TO_DECIDE and down > up:
            status = "invalid"
        if status != "pending" and c["status"] == "pending":
            db.execute("UPDATE clip SET status=? WHERE id=?", (status, body.clip_id))
    return {"ok": True, "status": status}


@router.get("/api/donate/stats")
def stats(kt_ses: str | None = Cookie(None)):
    out: dict = {}
    with STATE["store"].db() as db:
        for d in DIALECTS:
            r = db.execute("""SELECT COUNT(*) n, COALESCE(SUM(seconds),0) s,
                                     COALESCE(SUM(CASE WHEN status='valid' THEN seconds END),0) v,
                                     COUNT(CASE WHEN status='valid' THEN 1 END) vn,
                                     COUNT(DISTINCT addr) speakers FROM clip WHERE dialect=?""", (d,)).fetchone()
            out[d] = {"clips": r["n"], "hours": round(r["s"] / 3600, 2), "valid_hours": round(r["v"] / 3600, 2),
                      "valid_clips": r["vn"],
                      "speakers": r["speakers"],
                      "sentences": db.execute("SELECT COUNT(*) FROM sentence WHERE dialect=? AND active=1", (d,)).fetchone()[0]}
        s = auth.session(kt_ses)
        if s:
            mine = db.execute("SELECT COUNT(*), COALESCE(SUM(seconds),0) FROM clip WHERE addr=?", (s["addr"],)).fetchone()
            votes = db.execute("SELECT COUNT(*) FROM vote WHERE addr=?", (s["addr"],)).fetchone()[0]
            out["me"] = {"clips": mine[0], "minutes": round(mine[1] / 60, 1), "votes": votes}
    return out
