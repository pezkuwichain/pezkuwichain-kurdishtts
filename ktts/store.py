"""SQLite store for sign-in and voice donation.

One file, WAL mode. Kept apart from the job queue's database so that a long
synthesis transaction and a donor's upload never wait on each other.

Donors are identified by their wallet address. Recordings are used only to
train and test our own models (legal/consent.md); they are never published,
and an address never leaves this database. A deletion leaves only a hash of
the address, as proof that it was carried out.
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
CREATE TABLE IF NOT EXISTS consent_log (
  id        INTEGER PRIMARY KEY,
  addr      TEXT NOT NULL,
  version   TEXT NOT NULL,
  lang      TEXT NOT NULL,
  boxes     TEXT NOT NULL,          -- the five answers, as given, e.g. "11111"
  at        INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS deletion_log (
  addr_hash TEXT NOT NULL,          -- sha256 of the address: proves a deletion happened, names no one
  clips     INTEGER NOT NULL,
  at        INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS review_grant (
  clip_id INTEGER NOT NULL,
  addr    TEXT NOT NULL,
  exp     INTEGER NOT NULL,
  PRIMARY KEY (clip_id, addr)
);
CREATE TABLE IF NOT EXISTS vote (
  clip_id INTEGER NOT NULL REFERENCES clip(id),
  addr    TEXT NOT NULL,
  val     INTEGER NOT NULL,        -- 1 the reading matches the sentence, -1 it does not
  created INTEGER NOT NULL,
  PRIMARY KEY (clip_id, addr)
);
-- How far visitors get on the way to a donation, counted per day and step.
-- Nothing else: no address, no IP, no session; only how many.
CREATE TABLE IF NOT EXISTS funnel (
  day  TEXT NOT NULL,               -- UTC, YYYY-MM-DD
  step TEXT NOT NULL,
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, step)
);
-- The same counts by where people came from: the ?k= of the link they followed
-- (a channel name the campaign chose, such as "telegram"), never anything more.
CREATE TABLE IF NOT EXISTS funnel_ref (
  day  TEXT NOT NULL,
  step TEXT NOT NULL,
  ref  TEXT NOT NULL,
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, step, ref)
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
            db.execute("DELETE FROM review_grant WHERE exp < ?", (now,))

    def load_sentences(self, dialect: str, lines: list[str], source: str) -> int:
        with self.db() as db:
            before = db.total_changes
            db.executemany("INSERT OR IGNORE INTO sentence (dialect, text, source) VALUES (?,?,?)",
                           [(dialect, t, source) for t in lines])
            return db.total_changes - before
