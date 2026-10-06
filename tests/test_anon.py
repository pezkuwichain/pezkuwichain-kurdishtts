"""Anonymous donation: a code instead of a wallet.

What it holds: a code is made once and only its hash is kept; the code signs
back in on a fresh client, typed loosely; an anonymous donor records but
cannot check anyone's recordings; the code deletes everything they gave,
after which it opens nothing; starting and guessing codes are rate-limited.
"""
from __future__ import annotations

from test_donate import TMP, client, login, wav  # noqa: F401  (sets KTTS_CLIPS first)

from ktts import auth
from ktts.store import Store

BOXES = {"dialect": "kmr", "boxes": [True] * 5}


def up(c, csrf, sentence):
    return c.post("/api/donate/clip", data={"sentence_id": str(sentence)}, files={"audio": ("c.wav", wav(2.4))},
                  headers={"X-CSRF": csrf})


def test_anonymous_donor():
    auth._hits.clear()
    store = Store(TMP / "anon.db")
    store.load_sentences("kmr", ["Ziman nasnameya me ye.", "Roj hiltê û cîhan ronî dibe."], "test")
    a = client(store)

    r = a.post("/api/c/anon/start")
    assert r.status_code == 200, r.text
    code, csrf = r.json()["code"], r.json()["csrf"]
    assert code.startswith("KV-") and len(auth.normalize_code(code)) == 20
    me = a.get("/api/c/me").json()
    assert me["anon"] is True and me["addr"].startswith("anon:")
    # the code itself is nowhere in the database: only its hash
    with store.db() as db:
        dump = "\n".join(db.iterdump())
    assert code not in dump and auth.normalize_code(code) not in dump

    # the same consent as anyone, then recording works
    assert a.post("/api/donate/profile", json=BOXES, headers={"X-CSRF": csrf}).status_code == 200
    sid = a.get("/api/donate/next").json()["sentences"][0]["id"]
    r = up(a, csrf, sid)
    assert r.status_code == 200, r.text
    clip = r.json()["id"]

    # but not checking: a code cannot vote, list a clip to check, or open one
    assert a.get("/api/donate/review").status_code == 403
    assert a.post("/api/donate/vote", json={"clip_id": clip, "val": 1}, headers={"X-CSRF": csrf}).json()["detail"] == "WALLET_NEEDED"

    # a wallet donor can check the anonymous recording
    v = client(store)
    vc = login(v, "//ktts-test-anon-voter")
    v.post("/api/donate/profile", json=BOXES, headers={"X-CSRF": vc})
    assert v.get("/api/donate/review").json()["clip"]["id"] == clip

    # back in on a fresh client, with the code typed loosely
    b = client(store)
    loose = code.lower().replace("-", " ").replace("0", "o")
    r = b.post("/api/c/anon/login", json={"code": loose})
    assert r.status_code == 200, r.text
    assert b.get("/api/c/me").json()["addr"] == me["addr"]
    assert b.get("/api/donate/stats").json()["me"]["clips"] == 1
    # a wrong or malformed code opens nothing
    assert b.post("/api/c/anon/login", json={"code": "KV-AAAAA-AAAAA-AAAAA-AAAAA"}).status_code == 404
    assert b.post("/api/c/anon/login", json={"code": "hello"}).status_code == 400

    # the code deletes everything; afterwards it opens nothing
    files = list((TMP / "clips").rglob("*.flac"))
    r = b.post("/api/donate/forget", headers={"X-CSRF": r.json()["csrf"]})
    assert r.status_code == 200 and r.json()["deleted_recordings"] == 1
    assert not any(f.exists() for f in files)
    assert client(store).post("/api/c/anon/login", json={"code": code}).status_code == 404


def test_codes_are_rate_limited():
    auth._hits.clear()
    store = Store(TMP / "anon-rate.db")
    c = client(store)
    codes = [c.post("/api/c/anon/start").status_code for _ in range(auth.ANON_STARTS_PER_HOUR + 1)]
    assert codes[-1] == 429 and codes.count(200) == auth.ANON_STARTS_PER_HOUR
    tries = [c.post("/api/c/anon/login", json={"code": "KV-AAAAA-AAAAA-AAAAA-AAAAB"}).status_code
             for _ in range(auth.CODE_TRIES_PER_HOUR + 1)]
    assert tries[-1] == 429
    auth._hits.clear()
