"""What the privacy policy says we keep, and for how long, is what we keep."""
import os
import tempfile
import time
from pathlib import Path

from ktts import retention
from ktts.store import Store

DAY = 86400


def test_audio_lifetimes():
    root = Path(tempfile.mkdtemp())
    old_public = root / "public" / "ab" / "x.mp3"
    new_public = root / "public" / "ab" / "y.mp3"
    old_job = root / "jobs" / "cd" / "z.mp3"
    for f in (old_public, new_public, old_job):
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_bytes(b"x")
    os.utime(old_public, (time.time() - 8 * DAY,) * 2)
    os.utime(old_job, (time.time() - 30 * DAY,) * 2)
    assert retention.sweep_files(root / "public", 7) == 1
    assert retention.sweep_files(root / "jobs", 90) == 0
    assert not old_public.exists() and new_public.exists() and old_job.exists()


def test_invalid_clips_go_after_90_days():
    tmp = Path(tempfile.mkdtemp())
    store = Store(tmp / "t.db")
    store.load_sentences("kmr", ["Yek du sê."], "test")
    (tmp / "a.flac").write_bytes(b"x")
    (tmp / "b.flac").write_bytes(b"x")
    now = int(time.time())
    with store.db() as db:
        db.execute("INSERT INTO clip (addr, sentence_id, dialect, file, seconds, status, created) VALUES "
                   "('A', 1, 'kmr', 'a.flac', 2, 'invalid', ?)", (now - 91 * DAY,))
        db.execute("INSERT INTO clip (addr, sentence_id, dialect, file, seconds, status, created) VALUES "
                   "('B', 1, 'kmr', 'b.flac', 2, 'valid', ?)", (now - 400 * DAY,))
    assert retention.sweep_invalid_clips(store, tmp) == 1
    assert not (tmp / "a.flac").exists() and (tmp / "b.flac").exists()   # a valid clip is kept
