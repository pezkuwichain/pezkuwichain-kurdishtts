"""Retention: what the privacy policy says we keep, and for how long, enforced.

  public read-aloud audio      7 days    (privacy policy, row 4)
  article audio for API jobs   90 days   (row 5)
  finished job records         90 days   (row 5)
  recordings judged invalid    90 days   (row 8)

Runs at start and then hourly, in the app. Each rule is a plain function so
the tests can run it against a clock of their choosing.
"""
from __future__ import annotations

import threading
import time
from pathlib import Path

DAY = 86400
PUBLIC_AUDIO_DAYS = 7
JOB_AUDIO_DAYS = 90
JOB_RECORD_DAYS = 90
INVALID_CLIP_DAYS = 90


def sweep_files(root: Path, max_age_days: int, now: float | None = None) -> int:
    now = now or time.time()
    n = 0
    if not root.exists():
        return 0
    for f in root.rglob("*.mp3"):
        try:
            if now - f.stat().st_mtime > max_age_days * DAY:
                f.unlink()
                n += 1
        except FileNotFoundError:
            pass
    return n


def sweep_jobs(jobs, now: float | None = None) -> int:
    now = int(now or time.time())
    with jobs._db() as db:
        return db.execute("DELETE FROM job WHERE status IN ('done','error') AND finished < ?",
                          (now - JOB_RECORD_DAYS * DAY,)).rowcount


def sweep_invalid_clips(store, clips_dir: Path, now: float | None = None) -> int:
    now = int(now or time.time())
    with store.db() as db:
        rows = db.execute("SELECT id, file FROM clip WHERE status='invalid' AND created < ?",
                          (now - INVALID_CLIP_DAYS * DAY,)).fetchall()
        for r in rows:
            db.execute("DELETE FROM vote WHERE clip_id=?", (r["id"],))
            db.execute("DELETE FROM review_grant WHERE clip_id=?", (r["id"],))
            db.execute("DELETE FROM clip WHERE id=?", (r["id"],))
    for r in rows:
        (clips_dir / r["file"]).unlink(missing_ok=True)
    return len(rows)


def run(cache_dir: Path, jobs, store, clips_dir: Path) -> dict:
    return {
        "public_audio": sweep_files(cache_dir / "public", PUBLIC_AUDIO_DAYS),
        "job_audio": sweep_files(cache_dir / "jobs", JOB_AUDIO_DAYS),
        "job_records": sweep_jobs(jobs),
        "invalid_clips": sweep_invalid_clips(store, clips_dir),
    }


def start(cache_dir: Path, jobs, store, clips_dir: Path) -> None:
    def loop():
        while True:
            try:
                run(cache_dir, jobs, store, clips_dir)
            except Exception as e:  # a failed sweep is retried next hour, and said
                print(f"[retention] sweep failed: {e}", flush=True)
            time.sleep(3600)
    threading.Thread(target=loop, name="ktts-retention", daemon=True).start()
