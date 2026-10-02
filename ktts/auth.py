"""Sign-in with a Pezkuwi wallet: one-time challenge, signature, session.

The same contract as dks.news's comments service (POST /api/c/nonce, then
POST /api/c/login), so the browser side is the one readers already know.
The signature is checked by sigverify/verify.mjs — see there for why Node.

Session: an opaque id in an HttpOnly, Secure, SameSite=Lax cookie, and a CSRF
token the page sends back in X-CSRF on every write. Nothing about the session
is readable by page script except the CSRF token.
"""
from __future__ import annotations

import json
import os
import secrets
import subprocess
import time
from pathlib import Path

from fastapi import APIRouter, Cookie, Header, HTTPException, Response
from pydantic import BaseModel

APP_NAME = "KurdishTTS · Dijital Kurdistan"
NONCE_TTL_S = 600
SESSION_TTL_S = 30 * 24 * 3600
COOKIE = "kt_ses"
VERIFY = Path(os.environ.get("KTTS_SIGVERIFY", Path(__file__).resolve().parent.parent / "sigverify" / "verify.mjs"))

router = APIRouter()
STATE: dict = {}   # "store", set by the app


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
        sid, csrf = secrets.token_hex(32), secrets.token_hex(32)
        db.execute("INSERT INTO session (id, addr, csrf, exp) VALUES (?,?,?,?)",
                   (sid, body.address, csrf, int(time.time()) + SESSION_TTL_S))
        db.execute("INSERT OR IGNORE INTO speaker (addr, created) VALUES (?,?)", (body.address, int(time.time())))
    response.set_cookie(COOKIE, sid, max_age=SESSION_TTL_S, httponly=True, secure=True, samesite="lax", path="/")
    return {"addr": body.address, "csrf": csrf}


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
        sp = db.execute("SELECT dialect, gender, age_band, region, consent_version FROM speaker WHERE addr=?",
                        (s["addr"],)).fetchone()
    return {"addr": s["addr"], "csrf": s["csrf"], "speaker": dict(sp) if sp else None}


@router.post("/api/c/logout")
def logout(response: Response, kt_ses: str | None = Cookie(None), x_csrf: str | None = Header(None)):
    require(kt_ses, x_csrf)
    with STATE["store"].db() as db:
        db.execute("DELETE FROM session WHERE id=?", (kt_ses,))
    response.delete_cookie(COOKIE, path="/")
    return {"ok": True}
