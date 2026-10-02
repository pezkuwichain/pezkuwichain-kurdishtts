"""Long-text synthesis jobs: an article in, an MP3 out, surviving restarts.

Jobs live in SQLite, not in memory: a deploy or a crash mid-article must not
lose the queue, and a client (dks.news) must be able to ask about a job it
submitted before the restart. One dispatcher thread takes the oldest queued
job and hands its sentences to the batch pool, which runs them in parallel.
"""
from __future__ import annotations

import sqlite3
import threading
import time
import uuid
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS job (
  id        TEXT PRIMARY KEY,
  client    TEXT NOT NULL,
  dialect   TEXT NOT NULL,
  text      TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'queued',   -- queued | running | done | error
  error     TEXT,
  audio_key TEXT,
  seconds   REAL,
  created   INTEGER NOT NULL,
  started   INTEGER,
  finished  INTEGER
);
CREATE INDEX IF NOT EXISTS job_queue ON job(status, created);
"""
MAX_TRIES_S = 3 * 3600   # a job still failing three hours on is reported, not retried


class Jobs:
    def __init__(self, db_path: Path, engine) -> None:
        self.db_path = db_path
        self.engine = engine
        self._wake = threading.Event()
        with self._db() as db:
            db.executescript(SCHEMA)
            # A job that was running when the process stopped runs again.
            db.execute("UPDATE job SET status='queued', started=NULL WHERE status='running'")

    def _db(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.db_path, timeout=30)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA journal_mode=WAL")
        return db

    def submit(self, client: str, dialect: str, text: str) -> dict:
        jid = uuid.uuid4().hex
        with self._db() as db:
            db.execute("INSERT INTO job (id, client, dialect, text, created) VALUES (?,?,?,?,?)",
                       (jid, client, dialect, text, int(time.time())))
        self._wake.set()
        return self.get(jid, client)

    def get(self, jid: str, client: str) -> dict | None:
        with self._db() as db:
            r = db.execute("SELECT id, dialect, status, error, audio_key, seconds, created, started, finished "
                           "FROM job WHERE id=? AND client=?", (jid, client)).fetchone()
            if not r:
                return None
            d = dict(r)
            if d["status"] == "queued":
                d["ahead"] = db.execute("SELECT COUNT(*) FROM job WHERE status IN ('queued','running') "
                                        "AND created < ?", (d["created"],)).fetchone()[0]
            return d

    def depth(self) -> int:
        with self._db() as db:
            return db.execute("SELECT COUNT(*) FROM job WHERE status IN ('queued','running')").fetchone()[0]

    def _next(self) -> sqlite3.Row | None:
        with self._db() as db:
            r = db.execute("SELECT * FROM job WHERE status='queued' ORDER BY created LIMIT 1").fetchone()
            if r:
                db.execute("UPDATE job SET status='running', started=? WHERE id=?", (int(time.time()), r["id"]))
            return r

    def run_forever(self) -> None:
        while True:
            job = self._next()
            if not job:
                self._wake.wait(5)
                self._wake.clear()
                continue
            try:
                path, secs = self.engine.synthesize(job["text"], job["dialect"], lane="batch")
                with self._db() as db:
                    db.execute("UPDATE job SET status='done', audio_key=?, seconds=?, finished=?, text='' "
                               "WHERE id=?", (path.stem, round(secs, 2), int(time.time()), job["id"]))
            except ValueError as e:      # the text itself is the problem: no retry
                self._fail(job["id"], str(e))
            except Exception as e:       # the engine is: try again, later, for a while
                if time.time() - job["created"] > MAX_TRIES_S:
                    self._fail(job["id"], f"gave up: {e}")
                else:
                    with self._db() as db:
                        db.execute("UPDATE job SET status='queued', started=NULL, error=? WHERE id=?",
                                   (str(e)[:300], job["id"]))
                    time.sleep(10)

    def _fail(self, jid: str, msg: str) -> None:
        with self._db() as db:
            db.execute("UPDATE job SET status='error', error=?, finished=?, text='' WHERE id=?",
                       (msg[:300], int(time.time()), jid))

    def start(self) -> None:
        threading.Thread(target=self.run_forever, name="ktts-jobs", daemon=True).start()
