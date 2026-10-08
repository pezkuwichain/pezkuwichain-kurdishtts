"""Voice donation: read a sentence, record it, check others' recordings.

A donor signs in with a wallet -- or starts with a donation code (auth.py),
which records but does not vote -- gives the five confirmations of
legal/consent.md once (recordings train our own models only), says which
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

import calendar
import os
import random
import re
import subprocess
import time
from pathlib import Path

import numpy as np
from fastapi import APIRouter, Cookie, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from . import auth

CLIPS_DIR = Path(os.environ.get("KTTS_CLIPS", "/opt/kurdishtts/data/clips"))
# Bumped whenever the consent text changes; a donor who accepted an older text
# is asked again before recording more. cc0-2026-10 (open data) was withdrawn
# on 2026-10-03: recordings are for training our own models only.
CONSENT_VERSION = "train-only-2026-10-03-dialect"   # must equal legal/consent.md
DIALECTS = ("kmr", "ckb")
SR = 48000
MAX_UPLOAD = 6 * 1024 * 1024
# The floor follows the sentence: the fastest human pace (CPS_RANGE[1]) sets
# how short a true reading of it can be, and 0.6 s is the least any clip may
# be. A fixed one second refused "Ez ê nebiriqînim." read at a normal pace
# (2026-10-06): three words, fifteen letters, under a second of voice.
MIN_FLOOR_S, MAX_S = 0.6, 15.0
# Sentences shorter than this are not offered: two- and three-word lines are
# the ones a phone clips, and they teach a voice little. 20% of the corpus.
MIN_SENTENCE_CHARS = int(os.environ.get("KTTS_MIN_SENTENCE_CHARS", "20"))
MIN_RMS_DB = -42.0           # quieter than this is a silent or far-away recording
CLIP_RATIO_MAX = 0.002       # more than 0.2 % of samples at full scale is clipping
CPS_RANGE = (3.0, 28.0)      # characters per second a human reading aloud can do
PER_DAY = int(os.environ.get("KTTS_CLIPS_PER_DAY", "400"))
# Anonymous donors are counted per network address too: one person can make
# many codes, and each code has its own daily limit.
ANON_CLIPS_PER_HOUR_PER_IP = int(os.environ.get("KTTS_ANON_CLIPS_PER_HOUR", "150"))
VOTES_TO_DECIDE = 2

router = APIRouter()
STATE: dict = {}   # "store"



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
    if secs < max(MIN_FLOOR_S, letters / CPS_RANGE[1]):
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
    # The dialect is all we ask: it decides which model a recording trains.
    # Age, gender and region were asked, used nowhere, and weighed on the
    # consent a donor had to give -- dropped on 2026-10-03.
    dialect: str
    # The five confirmations of legal/consent.md, in its order: 18+, own voice,
    # explicit consent, deletion and its limit, model service/release. Every
    # one must be true; they are never inferred from a single "I agree".
    boxes: list[bool] = []
    lang: str = "en"


@router.post("/api/donate/profile")
def profile(body: ProfileIn, kt_ses: str | None = Cookie(None), x_csrf: str | None = Header(None)):
    addr = auth.require(kt_ses, x_csrf)
    if body.dialect not in DIALECTS:
        raise HTTPException(400, "profile")
    if len(body.boxes) != 5 or not all(body.boxes):
        raise HTTPException(400, "consent")
    now = int(time.time())
    with STATE["store"].db() as db:
        db.execute("INSERT INTO consent_log (addr, version, lang, boxes, at) VALUES (?,?,?,?,?)",
                   (addr, CONSENT_VERSION, body.lang[:5], "".join("1" if b else "0" for b in body.boxes), now))
        db.execute("UPDATE speaker SET dialect=?, gender=NULL, age_band=NULL, region=NULL, consent_version=?, "
                   "consent_at=? WHERE addr=?", (body.dialect, CONSENT_VERSION, now, addr))
    return {"ok": True, "consent_version": CONSENT_VERSION}


def _wallet_only(addr: str) -> None:
    """Checking recordings needs a wallet. Two agreeing votes decide a clip, and
    anyone can make as many donation codes as they like: if codes could vote,
    one person could pass their own recordings."""
    if auth.is_anon(addr):
        raise HTTPException(403, "WALLET_NEEDED")


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
          WHERE s.dialect=? AND s.active=1 AND LENGTH(s.text) >= ?
            AND s.id NOT IN (SELECT sentence_id FROM clip WHERE addr=?)
          GROUP BY s.id ORDER BY COUNT(c.id), RANDOM() LIMIT 40""", (sp["dialect"], MIN_SENTENCE_CHARS, addr)).fetchall()
    rows = [dict(r) for r in rows]
    random.shuffle(rows)
    return {"dialect": sp["dialect"], "sentences": rows[:8]}


@router.post("/api/donate/clip")
async def upload(request: Request, sentence_id: int = Form(...), audio: UploadFile = File(...),
                 kt_ses: str | None = Cookie(None), x_csrf: str | None = Header(None)):
    addr = auth.require(kt_ses, x_csrf)
    if auth.is_anon(addr):
        auth.limit("clip:" + auth.client_ip(request), ANON_CLIPS_PER_HOUR_PER_IP)
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
    _wallet_only(addr)
    with STATE["store"].db() as db:
        sp = _speaker(db, addr)
        r = db.execute("""
          SELECT c.id, s.text, c.seconds FROM clip c JOIN sentence s ON s.id = c.sentence_id
          WHERE c.dialect=? AND c.status='pending' AND c.addr<>?
            AND c.id NOT IN (SELECT clip_id FROM vote WHERE addr=?)
          ORDER BY (c.up + c.down) DESC, c.created LIMIT 1""", (sp["dialect"], addr, addr)).fetchone()
    if not r:
        return {"clip": None}
    # The recording is opened to this reviewer, for this clip, for 30 minutes,
    # and to no one else: a signed-in wallet cannot walk the clip ids.
    with STATE["store"].db() as db:
        db.execute("INSERT OR REPLACE INTO review_grant (clip_id, addr, exp) VALUES (?,?,?)",
                   (r["id"], addr, int(time.time()) + 1800))
    return {"clip": {**dict(r), "audio": f"/api/donate/audio/{r['id']}"}}


@router.get("/api/donate/audio/{clip_id}")
def clip_audio(clip_id: int, kt_ses: str | None = Cookie(None)):
    addr = auth.require(kt_ses, None, write=False)
    _wallet_only(addr)
    with STATE["store"].db() as db:
        r = db.execute("""SELECT c.file FROM clip c JOIN review_grant g ON g.clip_id = c.id
                          WHERE c.id=? AND g.addr=? AND g.exp > ?""", (clip_id, addr, int(time.time()))).fetchone()
    if not r:
        raise HTTPException(404, "clip")
    return FileResponse(CLIPS_DIR / r["file"], media_type="audio/flac", headers={"Cache-Control": "private, no-store"})


class VoteIn(BaseModel):
    clip_id: int
    val: int


@router.post("/api/donate/vote")
def vote(body: VoteIn, kt_ses: str | None = Cookie(None), x_csrf: str | None = Header(None)):
    addr = auth.require(kt_ses, x_csrf)
    _wallet_only(addr)
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


@router.post("/api/donate/forget")
def forget(kt_ses: str | None = Cookie(None), x_csrf: str | None = Header(None)):
    """Delete everything this donor gave: recordings (files and rows), their
    votes on others' recordings, their profile and sessions. The votes they
    cast are taken back out of the counts, so a clip decided by their vote
    goes back to pending."""
    addr = auth.require(kt_ses, x_csrf)
    store = STATE["store"]
    import hashlib
    with store.db() as db:
        files = [r["file"] for r in db.execute("SELECT file FROM clip WHERE addr=?", (addr,))]
        mine = [r["id"] for r in db.execute("SELECT id FROM clip WHERE addr=?", (addr,))]
        for cid, val in db.execute("SELECT clip_id, val FROM vote WHERE addr=?", (addr,)).fetchall():
            if val == 1:
                db.execute("UPDATE clip SET up = up - 1 WHERE id=?", (cid,))
            else:
                db.execute("UPDATE clip SET down = down - 1 WHERE id=?", (cid,))
            up, down = db.execute("SELECT up, down FROM clip WHERE id=?", (cid,)).fetchone()
            status = "valid" if (up >= VOTES_TO_DECIDE and up > down) else \
                     "invalid" if (down >= VOTES_TO_DECIDE and down > up) else "pending"
            db.execute("UPDATE clip SET status=? WHERE id=?", (status, cid))
        db.execute("DELETE FROM vote WHERE addr=?", (addr,))
        db.executemany("DELETE FROM vote WHERE clip_id=?", [(c,) for c in mine])
        db.execute("DELETE FROM clip WHERE addr=?", (addr,))
        db.execute("DELETE FROM session WHERE addr=?", (addr,))
        db.execute("DELETE FROM speaker WHERE addr=?", (addr,))
        db.execute("DELETE FROM review_grant WHERE addr=?", (addr,))
        db.execute("INSERT INTO deletion_log (addr_hash, clips, at) VALUES (?,?,?)",
                   (hashlib.sha256(addr.encode()).hexdigest(), len(files), int(time.time())))
    for f in files:
        (CLIPS_DIR / f).unlink(missing_ok=True)
    return {"ok": True, "deleted_recordings": len(files)}


@router.get("/api/donate/stats")
def stats(kt_ses: str | None = Cookie(None)):
    out: dict = {}
    with STATE["store"].db() as db:
        for d in DIALECTS:
            r = db.execute("""SELECT COUNT(*) n, COALESCE(SUM(seconds),0) s,
                                     COALESCE(SUM(CASE WHEN status='valid' THEN seconds END),0) v,
                                     COUNT(CASE WHEN status='valid' THEN 1 END) vn,
                                     COUNT(DISTINCT addr) speakers FROM clip WHERE dialect=?""", (d,)).fetchone()
            # Seconds as well as hours: rounded to hours, the first weeks of a
            # campaign read as "0", which is true and tells a visitor nothing.
            out[d] = {"clips": r["n"], "hours": round(r["s"] / 3600, 2), "valid_hours": round(r["v"] / 3600, 2),
                      "seconds": round(r["s"], 1), "valid_seconds": round(r["v"], 1),
                      "valid_clips": r["vn"],
                      "speakers": r["speakers"],
                      "sentences": db.execute("SELECT COUNT(*) FROM sentence WHERE dialect=? AND active=1 AND LENGTH(text) >= ?",
                                             (d, MIN_SENTENCE_CHARS)).fetchone()[0]}
        # One person may donate in both dialects: the sum of the two counts
        # above would count them twice, so the total is counted on its own.
        out["donors"] = db.execute("SELECT COUNT(DISTINCT addr) FROM clip").fetchone()[0]
        c = campaign()
        if c:
            done = {d: db.execute("SELECT COALESCE(SUM(seconds),0) FROM clip WHERE dialect=? AND created >= ? AND created < ?",
                                  (d, c["t0"], c["t1"])).fetchone()[0] for d in c["goals"]}
            out["campaign"] = {"start": c["start"], "end": c["end"], "ends_at": c["t1"], "now": int(time.time()),
                               "goals": c["goals"], "seconds": {d: round(v, 1) for d, v in done.items()}}
        s = auth.session(kt_ses)
        if s:
            mine = db.execute("SELECT COUNT(*), COALESCE(SUM(seconds),0) FROM clip WHERE addr=?", (s["addr"],)).fetchone()
            votes = db.execute("SELECT COUNT(*) FROM vote WHERE addr=?", (s["addr"],)).fetchone()[0]
            out["me"] = {"clips": mine[0], "minutes": round(mine[1] / 60, 1), "votes": votes}
    return out


# ── the way to a donation, counted ─────────────────────────────────────────
# Where do people stop? The page sends each step once per browser tab; the
# server adds one to that day's count. No identity is stored, not even the IP
# (it only feeds the in-memory rate limit). Read with tools/funnel.py.
FUNNEL_STEPS = ("visit", "start", "consent", "first_rec", "sent", "share")
REF = re.compile(r"[a-z0-9-]{1,24}")
REFS_PER_DAY = 100          # past this many channels in a day, the rest count as "other"


class FunnelIn(BaseModel):
    step: str
    ref: str | None = None


@router.post("/api/funnel")
def funnel(body: FunnelIn, request: Request):
    if body.step not in FUNNEL_STEPS:
        raise HTTPException(400, "STEP")
    auth.limit("funnel:" + auth.client_ip(request), 60)
    day = time.strftime("%Y-%m-%d", time.gmtime())
    with STATE["store"].db() as db:
        db.execute("INSERT INTO funnel (day, step, n) VALUES (?,?,1) "
                   "ON CONFLICT(day, step) DO UPDATE SET n = n + 1", (day, body.step))
        ref = body.ref if body.ref and REF.fullmatch(body.ref) else None
        if ref:
            known = db.execute("SELECT 1 FROM funnel_ref WHERE day=? AND ref=? LIMIT 1", (day, ref)).fetchone()
            if not known and db.execute("SELECT COUNT(DISTINCT ref) FROM funnel_ref WHERE day=?",
                                        (day,)).fetchone()[0] >= REFS_PER_DAY:
                ref = "other"
            db.execute("INSERT INTO funnel_ref (day, step, ref, n) VALUES (?,?,?,1) "
                       "ON CONFLICT(day, step, ref) DO UPDATE SET n = n + 1", (day, body.step, ref))
    return {"ok": True}


# ── a campaign: a goal in hours per dialect, between two dates ──────────────
# KTTS_CAMPAIGN="2026-10-10/2026-10-17/kmr:10,ckb:5" (UTC days, both included).
# Unset or malformed, there is no campaign and the pages show nothing of it.
def campaign(spec: str | None = None) -> dict | None:
    spec = os.environ.get("KTTS_CAMPAIGN", "") if spec is None else spec
    try:
        start, end, goals = spec.strip().split("/")
        t0 = calendar.timegm(time.strptime(start, "%Y-%m-%d"))
        t1 = calendar.timegm(time.strptime(end, "%Y-%m-%d")) + 86400
        g = {d: float(h) for d, h in (x.split(":") for x in goals.split(","))}
    except (ValueError, OverflowError):
        return None
    if t1 <= t0 or not g or any(d not in DIALECTS or h <= 0 for d, h in g.items()):
        return None
    return {"start": start, "end": end, "t0": t0, "t1": t1, "goals": g}

