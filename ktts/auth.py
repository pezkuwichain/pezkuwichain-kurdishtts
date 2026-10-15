"""Sign-in with a Pezkuwi wallet: one-time challenge, signature, session.

The same contract as dks.news's comments service (POST /api/c/nonce, then
POST /api/c/login), so the browser side is the one readers already know.
The signature is checked by sigverify/verify.mjs — see there for why Node.

Session: an opaque id in an HttpOnly, Secure, SameSite=Lax cookie, and a CSRF
token the page sends back in X-CSRF on every write. Nothing about the session
is readable by page script except the CSRF token.

Anonymous donation (2026-10-06). A wallet is the one step most people who
would read a few sentences never take. So a donor may also start with a
donation code: 20 random characters, made here, shown once, never stored --
only a hash of it, which is the donor's identity ("anon:<sha256>"). The code
signs them back in on any device and lets them delete what they gave. Lose
it and we cannot tell which recordings were theirs: the right to delete
stays theirs, but nobody, us included, can find the recordings without it.
Anonymous donors record; only wallet donors check recordings (donate.py), so
a person with fifty codes cannot vote their own clips valid.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import subprocess
import time
from collections import defaultdict, deque
from pathlib import Path

from fastapi import APIRouter, Cookie, Header, HTTPException, Request, Response
from pydantic import BaseModel

APP_NAME = "KurdAi Voice · Dijital Kurdistan"
NONCE_TTL_S = 600
SESSION_TTL_S = 30 * 24 * 3600
COOKIE = "kt_ses"
VERIFY = Path(os.environ.get("KTTS_SIGVERIFY", Path(__file__).resolve().parent.parent / "sigverify" / "verify.mjs"))

router = APIRouter()
STATE: dict = {}   # "store", set by the app

ANON = "anon:"
# Crockford's base32: no I, L, O or U, so a code read aloud or copied by hand
# survives the letters people confuse. 20 characters are 100 bits.
CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"
CODE_LEN = 20
ANON_STARTS_PER_HOUR = int(os.environ.get("KTTS_ANON_STARTS_PER_HOUR", "10"))
CODE_TRIES_PER_HOUR = int(os.environ.get("KTTS_CODE_TRIES_PER_HOUR", "30"))


def new_code() -> str:
    raw = "".join(secrets.choice(CODE_ALPHABET) for _ in range(CODE_LEN))
    return "KV-" + "-".join(raw[i:i + 5] for i in range(0, CODE_LEN, 5))


def normalize_code(code: str) -> str | None:
    """A code as typed -- any case, with or without dashes and spaces, the
    letters O, I and L for the digits they look like -- or None."""
    s = re.sub(r"[\s\-_.]", "", (code or "").upper())
    if s.startswith("KV"):
        s = s[2:]
    s = s.translate(str.maketrans("OIL", "011"))
    if len(s) != CODE_LEN or any(ch not in CODE_ALPHABET for ch in s):
        return None
    return s


def anon_addr(normalized: str) -> str:
    return ANON + hashlib.sha256(("kurdai-voice:" + normalized).encode()).hexdigest()


def is_anon(addr: str) -> bool:
    return addr.startswith(ANON)


def client_ip(request: Request) -> str:
    # nginx is the only thing in front, on loopback, and sets X-Real-IP itself.
    peer = request.client.host if request.client else ""
    if peer in ("127.0.0.1", "::1"):
        return request.headers.get("x-real-ip", peer)
    return peer


_hits: dict[str, deque] = defaultdict(deque)


def limit(key: str, n: int, window_s: int = 3600) -> None:
    """At most n events per key in the window; in memory, forgotten on restart."""
    now = time.monotonic()
    q = _hits[key]
    while q and now - q[0] > window_s:
        q.popleft()
    if len(q) >= n:
        raise HTTPException(429, "RATE")
    q.append(now)
    if len(_hits) > 20000:
        for k in [k for k, v in _hits.items() if not v or now - v[-1] > window_s]:
            _hits.pop(k, None)


def challenge(nonce: str, dem: int) -> str:
    """The exact text the wallet signs. The page builds nothing; it signs what it is given."""
    return "\n".join([
        APP_NAME,
        "Ez vê peyamê îmze dikim da ku dengê xwe bexşî kurdishtts.dks.news bikim.",
        f"nonce:{nonce}",
        f"dem:{dem}",
    ])


def verify_signature(message: str, signature: str, address: str) -> bool:
    try:
        r = subprocess.run(["node", str(VERIFY)], input=json.dumps(
            {"address": address, "message": message, "signature": signature}),
            capture_output=True, text=True, timeout=20)
        return json.loads(r.stdout or "{}").get("ok") is True
    except (subprocess.SubprocessError, ValueError):
        return False


class LoginIn(BaseModel):
    address: str
    signature: str
    nonce: str
    dem: int


@router.post("/api/c/nonce")
def nonce():
    store = STATE["store"]
    store.sweep()
    n = secrets.token_hex(24)
    dem = int(time.time())
    with store.db() as db:
        db.execute("INSERT INTO nonce (nonce, dem) VALUES (?,?)", (n, dem))
    return {"nonce": n, "dem": dem, "peyam": challenge(n, dem)}


@router.post("/api/c/login")
def login(body: LoginIn, response: Response):
    store = STATE["store"]
    if not (len(body.address) < 64 and body.address.isalnum()):
        raise HTTPException(400, "address")
    if not verify_signature(challenge(body.nonce, body.dem), body.signature, body.address):
        raise HTTPException(401, "signature")
    with store.db() as db:
        # Burn the nonce only once the signature checks out, and exactly once.
        burned = db.execute("DELETE FROM nonce WHERE nonce=? AND dem=? AND dem > ?",
                            (body.nonce, body.dem, int(time.time()) - NONCE_TTL_S)).rowcount
        if burned != 1:
            raise HTTPException(401, "nonce")
        # A blocked donor may still sign in: only to delete what they gave.
        # Recording and voting check `blocked` themselves (donate._speaker).
        db.execute("INSERT OR IGNORE INTO speaker (addr, created) VALUES (?,?)", (body.address, int(time.time())))
        csrf = _open_session(db, body.address, response)
    return {"addr": body.address, "csrf": csrf}


def _open_session(db, addr: str, response: Response) -> str:
    sid, csrf = secrets.token_hex(32), secrets.token_hex(32)
    db.execute("INSERT INTO session (id, addr, csrf, exp) VALUES (?,?,?,?)",
               (sid, addr, csrf, int(time.time()) + SESSION_TTL_S))
    response.set_cookie(COOKIE, sid, max_age=SESSION_TTL_S, httponly=True, secure=True, samesite="lax", path="/")
    return csrf


@router.post("/api/c/anon/start")
def anon_start(request: Request, response: Response):
    """A new anonymous donor: a code, shown once, and a session. Only the hash is kept."""
    limit("start:" + client_ip(request), ANON_STARTS_PER_HOUR)
    code = new_code()
    addr = anon_addr(normalize_code(code))
    with STATE["store"].db() as db:
        db.execute("INSERT OR IGNORE INTO speaker (addr, created) VALUES (?,?)", (addr, int(time.time())))
        csrf = _open_session(db, addr, response)
    return {"addr": addr, "csrf": csrf, "code": code}


class CodeIn(BaseModel):
    code: str


@router.post("/api/c/anon/login")
def anon_login(body: CodeIn, request: Request, response: Response):
    """Back in with the code: on another device, after the cookie expired, or to delete."""
    limit("code:" + client_ip(request), CODE_TRIES_PER_HOUR)
    norm = normalize_code(body.code)
    if not norm:
        raise HTTPException(400, "CODE")
    addr = anon_addr(norm)
    with STATE["store"].db() as db:
        # A deleted donor's row is gone, and so is the code: it opens nothing.
        if not db.execute("SELECT 1 FROM speaker WHERE addr=?", (addr,)).fetchone():
            raise HTTPException(404, "CODE")
        csrf = _open_session(db, addr, response)
    return {"addr": addr, "csrf": csrf}


def session(sid: str | None) -> dict | None:
    if not sid or len(sid) != 64:
        return None
    with STATE["store"].db() as db:
        r = db.execute("SELECT addr, csrf FROM session WHERE id=? AND exp > ?", (sid, int(time.time()))).fetchone()
    return dict(r) if r else None


def require(sid: str | None, csrf: str | None, write: bool = True) -> str:
    s = session(sid)
    if not s:
        raise HTTPException(401, "sign in")
    if write and not (csrf and secrets.compare_digest(csrf, s["csrf"])):
        raise HTTPException(403, "csrf")
    return s["addr"]


@router.get("/api/c/me")
def me(kt_ses: str | None = Cookie(None)):
    s = session(kt_ses)
    if not s:
        return {"addr": None}
    with STATE["store"].db() as db:
        sp = db.execute("SELECT dialect, consent_version FROM speaker WHERE addr=?",
                        (s["addr"],)).fetchone()
    return {"addr": s["addr"], "csrf": s["csrf"], "anon": is_anon(s["addr"]), "speaker": dict(sp) if sp else None}


@router.post("/api/c/logout")
def logout(response: Response, kt_ses: str | None = Cookie(None), x_csrf: str | None = Header(None)):
    require(kt_ses, x_csrf)
    with STATE["store"].db() as db:
        db.execute("DELETE FROM session WHERE id=?", (kt_ses,))
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}
