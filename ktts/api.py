"""HTTP API for Kurdish speech.

  POST /api/tts                {text, dialect}  → audio/mpeg      public, short text, rate-limited
  POST /api/tts/jobs           {text, dialect}  → {id, status}    API key, up to an article
  GET  /api/tts/jobs/{id}                       → {status, ...}   API key
  GET  /api/tts/audio/{key}.mp3                 → audio/mpeg      anyone holding the key (a hash)
  GET  /api/tts/health                          → models, queue depth

API keys are stored as SHA-256 hashes, one per line ("<name> <sha256>"), in
KTTS_KEYS; the key itself is shown once, when it is made, and never kept here.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import re
import time
from collections import defaultdict, deque
from pathlib import Path

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import FileResponse
from pydantic import BaseModel

from . import engine as eng

PUBLIC_MAX_CHARS = int(os.environ.get("KTTS_PUBLIC_MAX_CHARS", "600"))
JOB_MAX_CHARS = int(os.environ.get("KTTS_JOB_MAX_CHARS", "60000"))
PUBLIC_PER_MIN = int(os.environ.get("KTTS_PUBLIC_PER_MIN", "8"))
KEYS_FILE = Path(os.environ.get("KTTS_KEYS", "/opt/kurdishtts/data/api_keys"))

router = APIRouter()
STATE: dict = {}   # engine and jobs, set by the app at startup


class SpeakIn(BaseModel):
    text: str
    dialect: str


# ── who is asking ────────────────────────────────────────────────────────────
def client_ip(request: Request) -> str:
    # nginx is the only thing in front, on loopback, and sets X-Real-IP itself.
    peer = request.client.host if request.client else ""
    if peer in ("127.0.0.1", "::1"):
        return request.headers.get("x-real-ip", peer)
    return peer


def api_client(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "API key required")
    digest = hashlib.sha256(authorization[7:].strip().encode()).hexdigest()
    try:
        lines = KEYS_FILE.read_text().splitlines()
    except FileNotFoundError:
        lines = []
    for line in lines:
        parts = line.split()
        if len(parts) == 2 and hmac.compare_digest(parts[1], digest):
            return parts[0]
    raise HTTPException(401, "API key not recognised")


_hits: dict[str, deque] = defaultdict(deque)


def rate_limit(ip: str) -> None:
    now = time.monotonic()
    q = _hits[ip]
    while q and now - q[0] > 60:
        q.popleft()
    if len(q) >= PUBLIC_PER_MIN:
        raise HTTPException(429, "Too many requests — try again in a minute")
    q.append(now)
    if len(_hits) > 10000:      # forget idle addresses rather than grow forever
        for k in [k for k, v in _hits.items() if not v or now - v[-1] > 60]:
            _hits.pop(k, None)


def _check(body: SpeakIn, limit: int) -> None:
    if body.dialect not in eng.DIALECTS:
        raise HTTPException(400, f"dialect must be one of {', '.join(eng.DIALECTS)}")
    text = body.text.strip()
    if not text:
        raise HTTPException(400, "text is empty")
    if len(text) > limit:
        raise HTTPException(413, f"text is longer than {limit} characters")


def _audio(path: Path) -> FileResponse:
    return FileResponse(path, media_type="audio/mpeg",
                        headers={"Cache-Control": "public, max-age=31536000, immutable"})


# ── routes ───────────────────────────────────────────────────────────────────
@router.post("/api/tts")
async def speak(body: SpeakIn, request: Request):
    _check(body, PUBLIC_MAX_CHARS)
    rate_limit(client_ip(request))
    from starlette.concurrency import run_in_threadpool
    try:
        path, _secs = await run_in_threadpool(STATE["engine"].synthesize, body.text, body.dialect, "interactive")
    except ValueError as e:
        raise HTTPException(400, str(e)) from e
    return _audio(path)


@router.post("/api/tts/jobs", status_code=202)
def submit(body: SpeakIn, authorization: str | None = Header(None)):
    who = api_client(authorization)
    _check(body, JOB_MAX_CHARS)
    return STATE["jobs"].submit(who, body.dialect, body.text)


@router.get("/api/tts/jobs/{jid}")
def status(jid: str, authorization: str | None = Header(None)):
    who = api_client(authorization)
    if not re.fullmatch(r"[0-9a-f]{32}", jid):
        raise HTTPException(404, "no such job")
    job = STATE["jobs"].get(jid, who)
    if not job:
        raise HTTPException(404, "no such job")
    if job["status"] == "done":
        job["audio_url"] = f"/api/tts/audio/{job['audio_key']}.mp3"
    return job


@router.get("/api/tts/audio/{key}.mp3")
def audio(key: str):
    if not re.fullmatch(r"[0-9a-f]{64}", key):
        raise HTTPException(404, "not found")
    path = eng.Engine.cache_path(key)
    if not path.exists():
        raise HTTPException(404, "not found")
    return _audio(path)


@router.get("/api/tts/health")
def health():
    return {"ok": True, "models": eng.MODELS, "queue": STATE["jobs"].depth()}
