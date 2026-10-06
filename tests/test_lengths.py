"""How short a reading may be, and which sentences are offered.

2026-10-06: a donor read "Ez ê nebiriqînim." at a normal pace and was told
the recording was too short. The floor was a fixed second; three words take
less. It now follows the sentence (the fastest human pace sets the least a
true reading can last), and very short sentences are no longer offered.
"""
from __future__ import annotations

import pytest
from test_donate import TMP, client, wav  # noqa: F401  (sets KTTS_CLIPS first)

from ktts import auth, donate
from ktts.store import Store


def test_a_short_sentence_read_at_a_normal_pace_is_accepted():
    _, m = donate.analyse(wav(0.8), "Ez ê nebiriqînim.")
    assert m["seconds"] == pytest.approx(0.8, abs=0.05)


def test_a_clip_too_short_for_its_sentence_is_still_refused():
    with pytest.raises(donate.Rejected, match="TOO_SHORT"):
        donate.analyse(wav(0.55), "Ez ê nebiriqînim.")
    # a long sentence cannot be read in a second: the floor rises with it
    with pytest.raises(donate.Rejected, match="TOO_SHORT"):
        donate.analyse(wav(1.0), "Ziman nasnameya me ye, em ê wê biparêzin û bi hev re geş bikin.")


def test_very_short_sentences_are_not_offered():
    auth._hits.clear()
    store = Store(TMP / "lengths.db")
    store.load_sentences("kmr", ["Em nebiriqîn.", "Ziman nasnameya me ye û em ê wê biparêzin."], "test")
    c = client(store)
    csrf = c.post("/api/c/anon/start").json()["csrf"]
    c.post("/api/donate/profile", json={"dialect": "kmr", "boxes": [True] * 5}, headers={"X-CSRF": csrf})
    offered = [s["text"] for s in c.get("/api/donate/next").json()["sentences"]]
    assert offered == ["Ziman nasnameya me ye û em ê wê biparêzin."]
    assert c.get("/api/donate/stats").json()["kmr"]["sentences"] == 1
