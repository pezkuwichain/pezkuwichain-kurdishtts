"""SQLite store for sign-in and voice donation.

One file, WAL mode. Kept apart from the job queue's database so that a long
synthesis transaction and a donor's upload never wait on each other.

Donors are identified by their wallet address. In anything published (the CC0
dataset) an address appears only as a salted hash: the recordings are public,
the link between a voice and an account is not.
"""
from __future__ import annotations

import sqlite3
import time
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS nonce (
  nonce TEXT PRIMARY KEY,
  dem   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS session (
  id    TEXT PRIMARY KEY,
  addr  TEXT NOT NULL,
  csrf  TEXT NOT NULL,
  exp   INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS speaker (
  addr            TEXT PRIMARY KEY,
  dialect         TEXT,
  gender          TEXT,
  age_band        TEXT,
  region          TEXT,
  consent_version TEXT,
  consent_at      INTEGER,
  created         INTEGER NOT NULL,
  blocked         INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sentence (
  id      INTEGER PRIMARY KEY,
  dialect TEXT NOT NULL,
  text    TEXT NOT NULL,
  source  TEXT NOT NULL,
  active  INTEGER NOT NULL DEFAULT 1,
  UNIQUE (dialect, text)
);
CREATE TABLE IF NOT EXISTS clip (
  id          INTEGER PRIMARY KEY,
  addr        TEXT NOT NULL,
  sentence_id INTEGER NOT NULL REFERENCES sentence(id),
  dialect     TEXT NOT NULL,
  file        TEXT NOT NULL,
  seconds     REAL NOT NULL,
  rms_db      REAL,
  peak_db     REAL,
  status      TEXT NOT NULL DEFAULT 'pending',   -- pending | valid | invalid
  up          INTEGER NOT NULL DEFAULT 0,
  down        INTEGER NOT NULL DEFAULT 0,
  created     INTEGER NOT NULL,
  UNIQUE (addr, sentence_id)
);
CREATE INDEX IF NOT EXISTS clip_status ON clip(dialect, status, created);
CREATE TABLE IF NOT EXISTS vote (
  clip_id INTEGER NOT NULL REFERENCES clip(id),
  addr    TEXT NOT NULL,
  val     INTEGER NOT NULL,        -- 1 the reading matches the sentence, -1 it does not
  created INTEGER NOT NULL,
  PRIMARY KEY (clip_id, addr)
);
"""


class Store:
    def __init__(self, path: Path) -> None:
        self.path = path
        path.parent.mkdir(parents=True, exist_ok=True)
        with self.db() as db:
            db.executescript(SCHEMA)

    def db(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.path, timeout=30)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("PRAGMA foreign_keys=ON")
        return db

    def sweep(self) -> None:
        now = int(time.time())
        with self.db() as db:
            db.execute("DELETE FROM nonce WHERE dem < ?", (now - 600,))
            db.execute("DELETE FROM session WHERE exp < ?", (now,))

    def load_sentences(self, dialect: str, lines: list[str], source: str) -> int:
        with self.db() as db:
            before = db.total_changes
            db.executemany("INSERT OR IGNORE INTO sentence (dialect, text, source) VALUES (?,?,?)",
                           [(dialect, t, source) for t in lines])
            return db.total_changes - before
