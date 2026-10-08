"""Voice donation, end to end, without the speech engine.

Real Pezkuwi signatures (sigverify/verify.mjs, keys from test-only URIs),
real ffmpeg, a throwaway database. What it holds:
  sign-in proves the key and spends the nonce once; nothing is recorded
  without the CC0 consent; machine checks refuse silence, clipping and a
  recording that does not fit its sentence; a donor cannot vote on their own
  clip or vote twice; two agreeing votes make a clip valid; the CSRF token is
  required on every write.
"""
from __future__ import annotations

import io
import json
import os
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

import numpy as np
from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parent.parent
TMP = Path(tempfile.mkdtemp(prefix="ktts-test-"))
os.environ["KTTS_CLIPS"] = str(TMP / "clips")
sys.path.insert(0, str(ROOT))

from ktts import auth, donate  # noqa: E402
from ktts.store import Store  # noqa: E402

SIGN = r"""
import { Keyring } from '@pezkuwi/keyring';
import { cryptoWaitReady } from '@pezkuwi/util-crypto';
import { u8aToHex, u8aWrapBytes } from '@pezkuwi/util';
let s = ''; for await (const c of process.stdin) s += c;
await cryptoWaitReady();
const { uri, message } = JSON.parse(s);
const p = new Keyring({ type: 'sr25519', ss58Format: 42 }).addFromUri(uri);
process.stdout.write(JSON.stringify({ address: p.address, signature: message ? u8aToHex(p.sign(u8aWrapBytes(message))) : '' }));
"""


def sign(uri: str, message: str = "") -> dict:
    r = subprocess.run(["node", "--input-type=module", "-e", SIGN], input=json.dumps({"uri": uri, "message": message}),
                       capture_output=True, text=True, cwd=ROOT / "sigverify", check=True)
    return json.loads(r.stdout)


def wav(seconds: float, amp: float = 0.3, silent: bool = False) -> bytes:
    sr = 48000
    t = np.arange(int(sr * seconds)) / sr
    # A voice-like signal: a 160 Hz tone with syllable-rate amplitude modulation.
    x = 0 if silent else amp * np.sin(2 * np.pi * 160 * t) * (0.55 + 0.45 * np.sin(2 * np.pi * 4 * t))
    pcm = (np.zeros_like(t) if silent else x) * 32767
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(np.clip(pcm, -32768, 32767).astype(np.int16).tobytes())
    return buf.getvalue()


def client(store: Store) -> TestClient:
    app = FastAPI()
    app.include_router(auth.router)
    app.include_router(donate.router)
    auth.STATE["store"] = donate.STATE["store"] = store
    return TestClient(app, base_url="https://testserver")


def login(c: TestClient, uri: str) -> str:
    ch = c.post("/api/c/nonce").json()
    s = sign(uri, ch["peyam"])
    r = c.post("/api/c/login", json={"address": s["address"], "signature": s["signature"], "nonce": ch["nonce"], "dem": ch["dem"]})
    assert r.status_code == 200, r.text
    return r.json()["csrf"]


def test_flow():
    store = Store(TMP / "t.db")
    store.load_sentences("kmr", ["Ziman nasnameya me ye.", "Roj hiltê û cîhan ronî dibe."], "test")
    a, b, v = client(store), client(store), client(store)

    # sign-in: a wrong signature is refused, and a nonce is spent exactly once
    ch = a.post("/api/c/nonce").json()
    other = sign("//ktts-test-other", ch["peyam"])
    me = sign("//ktts-test-a")
    assert a.post("/api/c/login", json={"address": me["address"], "signature": other["signature"],
                                       "nonce": ch["nonce"], "dem": ch["dem"]}).status_code == 401
    good = sign("//ktts-test-a", ch["peyam"])
    body = {"address": good["address"], "signature": good["signature"], "nonce": ch["nonce"], "dem": ch["dem"]}
    assert a.post("/api/c/login", json=body).status_code == 200
    assert a.post("/api/c/login", json=body).status_code == 401          # replay
    csrf_a = a.get("/api/c/me").json()["csrf"]

    # nothing without consent; CSRF required
    assert a.get("/api/donate/next").status_code == 409
    assert a.post("/api/donate/profile", json={"dialect": "kmr", "boxes": [True, True, True, True, True]}).status_code == 403
    # all five confirmations, each one: four are not consent
    for missing in range(5):
        boxes = [i != missing for i in range(5)]
        assert a.post("/api/donate/profile", json={"dialect": "kmr", "boxes": boxes},
                      headers={"X-CSRF": csrf_a}).status_code == 400
    assert a.post("/api/donate/profile", json={"dialect": "kmr", "boxes": [True] * 4},
                  headers={"X-CSRF": csrf_a}).status_code == 400
    assert a.post("/api/donate/profile", json={"dialect": "kmr", "boxes": [True, True, True, True, True], "lang": "tr"},
                  headers={"X-CSRF": csrf_a}).status_code == 200
    with store.db() as db:
        assert [tuple(r) for r in db.execute("SELECT boxes, lang FROM consent_log")] == [("11111", "tr")]
        # nothing about the donor is kept but the dialect
        assert tuple(db.execute("SELECT gender, age_band, region FROM speaker").fetchone()) == (None, None, None)
    sents = a.get("/api/donate/next").json()["sentences"]
    assert len(sents) == 2
    sid = next(s["id"] for s in sents if s["text"].startswith("Ziman"))

    # machine checks
    def up(c, csrf, data, sentence=sid):
        return c.post("/api/donate/clip", data={"sentence_id": str(sentence)}, files={"audio": ("c.wav", data)},
                      headers={"X-CSRF": csrf})
    assert up(a, csrf_a, wav(2, silent=True)).json()["detail"] == "SILENT"
    assert up(a, csrf_a, wav(2, amp=1.4)).json()["detail"] == "CLIPPING"
    assert up(a, csrf_a, wav(13)).json()["detail"] == "PACE"            # 18 letters in 13 s
    r = up(a, csrf_a, wav(2.4))
    assert r.status_code == 200, r.text
    clip = r.json()["id"]
    assert up(a, csrf_a, wav(2.4)).status_code == 409                    # same sentence twice
    assert (TMP / "clips").rglob("*.flac").__next__().stat().st_size > 0

    # review: not one's own; two agreeing votes decide
    assert a.post("/api/donate/vote", json={"clip_id": clip, "val": 1}, headers={"X-CSRF": csrf_a}).status_code == 403
    for c, uri in ((b, "//ktts-test-b"), (v, "//ktts-test-v")):
        csrf = login(c, uri)
        c.post("/api/donate/profile", json={"dialect": "kmr", "boxes": [True, True, True, True, True]}, headers={"X-CSRF": csrf})
        # a recording cannot be fetched by id; only the reviewer it was handed to can hear it
        assert c.get(f"/api/donate/audio/{clip}").status_code == 404
        assert c.get("/api/donate/review").json()["clip"]["id"] == clip
        assert c.get(f"/api/donate/audio/{clip}").status_code == 200
        r = c.post("/api/donate/vote", json={"clip_id": clip, "val": 1}, headers={"X-CSRF": csrf})
        assert r.status_code == 200
        assert c.post("/api/donate/vote", json={"clip_id": clip, "val": 1}, headers={"X-CSRF": csrf}).status_code == 409
    assert r.json()["status"] == "valid"
    st = a.get("/api/donate/stats").json()
    assert st["kmr"]["clips"] == 1 and st["kmr"]["valid_clips"] == 1 and st["me"]["clips"] == 1
    assert st["donors"] == 1                         # people, not people per dialect
    assert st["kmr"]["seconds"] > 0                  # shown in minutes: in hours it read "0"

    # the right to be forgotten: a's recordings, profile and session go; the
    # file is gone from disk; b's vote on it went with it
    # the donor themself cannot fetch their own clip by id either, nor can a stranger
    assert a.get(f"/api/donate/audio/{clip}").status_code == 404
    files_before = list((TMP / "clips").rglob("*.flac"))
    r = a.post("/api/donate/forget", headers={"X-CSRF": csrf_a})
    assert r.status_code == 200 and r.json()["deleted_recordings"] == 1
    assert not any(f.exists() for f in files_before)
    assert a.get("/api/c/me").json()["addr"] is None
    with store.db() as db:
        (h, n), = [tuple(r) for r in db.execute("SELECT addr_hash, clips FROM deletion_log")]
        assert n == 1 and len(h) == 64 and me["address"] not in h
    st = b.get("/api/donate/stats").json()
    assert st["kmr"]["clips"] == 0 and st["kmr"]["speakers"] == 0
    # and a voter who leaves takes their votes back out of the counts
    csrf_b = b.get("/api/c/me").json()["csrf"]
    assert b.post("/api/donate/forget", headers={"X-CSRF": csrf_b}).json()["deleted_recordings"] == 0


def test_funnel_counts_steps_and_nothing_else():
    store = Store(TMP / "funnel.db")
    c = client(store)
    for step in ("visit", "visit", "start", "sent"):
        assert c.post("/api/funnel", json={"step": step}).status_code == 200
    assert c.post("/api/funnel", json={"step": "anything"}).status_code == 400
    with store.db() as db:
        rows = {r["step"]: r["n"] for r in db.execute("SELECT step, n FROM funnel")}
        cols = [r[1] for r in db.execute("PRAGMA table_info(funnel)")]
    assert rows == {"visit": 2, "start": 1, "sent": 1}
    assert cols == ["day", "step", "n"]   # no address, no IP, no session


def test_funnel_counts_by_channel_without_trusting_it():
    store = Store(TMP / "funnel-ref.db")
    c = client(store)
    for body in ({"step": "visit", "ref": "telegram"}, {"step": "visit", "ref": "telegram"},
                 {"step": "sent", "ref": "telegram"}, {"step": "visit", "ref": "BAD ref!"}, {"step": "visit"}):
        assert c.post("/api/funnel", json=body).status_code == 200
    with store.db() as db:
        total = {r["step"]: r["n"] for r in db.execute("SELECT step, n FROM funnel")}
        refs = {(r["ref"], r["step"]): r["n"] for r in db.execute("SELECT ref, step, n FROM funnel_ref")}
    assert total == {"visit": 4, "sent": 1}             # every visit counts in the total
    assert refs == {("telegram", "visit"): 2, ("telegram", "sent"): 1}   # a malformed ref is dropped


def test_campaign_goal_and_progress():
    import time as _t
    store = Store(TMP / "camp.db")
    c = client(store)
    assert "campaign" not in c.get("/api/donate/stats").json()
    today = _t.strftime("%Y-%m-%d", _t.gmtime())
    os.environ["KTTS_CAMPAIGN"] = f"{today}/{today}/kmr:10"
    try:
        now = int(_t.time())
        with store.db() as db:
            db.execute("INSERT INTO sentence (id, dialect, text, source) VALUES (1,'kmr','Roj baş.','t'), (2,'kmr','Şev baş.','t')")
            db.execute("INSERT INTO speaker (addr, created) VALUES ('5A', ?)", (now,))
            db.execute("INSERT INTO clip (addr, sentence_id, dialect, file, seconds, created) VALUES ('5A',1,'kmr','a',1800,?)", (now,))
            db.execute("INSERT INTO clip (addr, sentence_id, dialect, file, seconds, created) VALUES ('5A',2,'kmr','b',900,?)",
                       (now - 3 * 86400,))   # before the campaign: not counted
        camp = c.get("/api/donate/stats").json()["campaign"]
        assert camp["goals"] == {"kmr": 10.0} and camp["seconds"] == {"kmr": 1800.0}
        assert camp["ends_at"] > camp["now"]
        os.environ["KTTS_CAMPAIGN"] = "nonsense"
        assert "campaign" not in c.get("/api/donate/stats").json()
    finally:
        os.environ.pop("KTTS_CAMPAIGN", None)

