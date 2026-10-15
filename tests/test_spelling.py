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
    # Verb forms with a short i are not the adjective (the Ferheng itself writes "hiştiye").
    assert correct("hişti bû, rûnişti bû", FIXES) == "hişti bû, rûnişti bû"


def test_the_corpus_has_none_of_the_listed_misspellings():
    text = (ROOT / "corpus" / "cv-kmr.txt").read_text(encoding="utf-8")
    assert correct(text, FIXES) == text


def test_database_matches_the_corrected_file_and_keeps_recordings():
    corpus = Path(tempfile.mkdtemp())
    (corpus / "cv-kmr.txt").write_text("Pênc sêv hene.\nÊrîş dest pê kir.\nDiya me ew hişti bû.\n", encoding="utf-8")
    db_path = Path(tempfile.mkdtemp()) / "t.db"
    # Live state: the old misspellings, one of them read; a verb form wrongly "corrected" earlier.
    Store(db_path).load_sentences("kmr", ["Pênç sêv hene.", "Êriş dest pê kir.", "Diya me ew hiştî bû.", "Diya me ew hişti bû."], "common-voice-cc0")
    db = sqlite3.connect(db_path)
    db.execute("UPDATE sentence SET active=0 WHERE text='Diya me ew hişti bû.'")
    read_id = db.execute("SELECT id FROM sentence WHERE text='Êriş dest pê kir.'").fetchone()[0]
    db.execute("INSERT INTO clip (addr, sentence_id, dialect, file, seconds, created) VALUES ('a',?,'kmr','f',1,?)",
               (read_id, int(time.time())))
    db.commit()
    assert fix_db(db_path, corpus) == (1, 3, 2)
    on = {t for (t,) in db.execute("SELECT text FROM sentence WHERE active=1")}
    assert on == {"Pênc sêv hene.", "Êrîş dest pê kir.", "Diya me ew hişti bû."}
    assert db.execute("SELECT s.text FROM clip c JOIN sentence s ON s.id=c.sentence_id").fetchone()[0] == "Êriş dest pê kir."
    assert fix_db(db_path, corpus) == (0, 0, 0)
