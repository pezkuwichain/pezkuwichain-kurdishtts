"""Corpus spelling follows the Ferheng; a recording stays tied to what was on screen."""
import sqlite3
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "tools"))
from fix_spelling import correct, fix_db, load_fixes  # noqa: E402
from ktts.store import Store  # noqa: E402

FIXES = load_fixes(ROOT / "corpus" / "kmr-ferheng-fixes.tsv")


def test_whole_words_only_and_capitals_kept():
    assert correct("Êriş li ser êrişa wan.", FIXES) == "Êrîş li ser êrîşa wan."
    assert correct("bêrîkan û bêrîkanî", FIXES) == "berîkan û bêrîkanî"


def test_the_corpus_has_none_of_the_listed_misspellings():
    text = (ROOT / "corpus" / "cv-kmr.txt").read_text(encoding="utf-8")
    assert correct(text, FIXES) == text


def test_database_unread_in_place_read_retired():
    db_path = Path(tempfile.mkdtemp()) / "t.db"
    Store(db_path).load_sentences("kmr", ["Pênç sêv.", "Êriş dest pê kir.", "Baş e."], "common-voice-cc0")
    db = sqlite3.connect(db_path)
    read_id = db.execute("SELECT id FROM sentence WHERE text='Êriş dest pê kir.'").fetchone()[0]
    db.execute("INSERT INTO clip (addr, sentence_id, dialect, file, seconds, created) VALUES ('a',?,'kmr','f',1,?)",
               (read_id, int(time.time())))
    db.commit()
    assert fix_db(db_path, FIXES) == (1, 1)
    rows = dict(db.execute("SELECT text, active FROM sentence").fetchall())
    assert rows == {"Pênc sêv.": 1, "Êriş dest pê kir.": 0, "Êrîş dest pê kir.": 1, "Baş e.": 1}
    assert db.execute("SELECT s.text FROM clip c JOIN sentence s ON s.id=c.sentence_id").fetchone()[0] == "Êriş dest pê kir."
    assert fix_db(db_path, FIXES) == (0, 0)
