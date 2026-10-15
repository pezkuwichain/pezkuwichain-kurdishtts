"""Correct the spelling of Kurmancî corpus sentences against the Ferheng.

  python tools/fix_spelling.py corpus/                          # rewrite corpus/cv-kmr.txt
  python tools/fix_spelling.py corpus/ /opt/kurdishtts/data/kurdishtts.db  # and the live sentences

corpus/kmr-ferheng-fixes.tsv lists whole words that are misspelt against
Zeynelabidin's Ferheng (Ferheng mizan), each with the spelling it gives. A
word is replaced only as a whole word, keeping a capital first letter.

In the database a sentence nobody has read yet is corrected in place. A
sentence someone has read keeps its row, so the recording stays tied to the
text that was on screen, and is retired; its corrected text is added as a new
sentence. Running it again changes nothing.
"""
from __future__ import annotations

import re
import sqlite3
import sys
import unicodedata
from pathlib import Path

WORD = re.compile(r"[A-Za-zçêîşûÇÊÎŞÛ]+")


def load_fixes(path: Path) -> dict[str, str]:
    fixes = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line or line.startswith("#"):
            continue
        wrong, right = line.split("\t")[:2]
        fixes[wrong] = right
    return fixes


def correct(text: str, fixes: dict[str, str]) -> str:
    def one(m: re.Match) -> str:
        w = m.group(0)
        right = fixes.get(w.lower())
        if right is None:
            return w
        return right[0].upper() + right[1:] if w[0].isupper() else right
    return WORD.sub(one, text)


def fix_file(path: Path, fixes: dict[str, str]) -> int:
    lines = path.read_text(encoding="utf-8").split("\n")
    out = [correct(line, fixes) for line in lines]
    path.write_text("\n".join(out), encoding="utf-8")
    return sum(a != b for a, b in zip(lines, out, strict=True))


def fix_db(db_path: Path, fixes: dict[str, str]) -> tuple[int, int]:
    in_place = retired = 0
    db = sqlite3.connect(db_path)
    with db:
        rows = db.execute("SELECT id, text, source FROM sentence WHERE dialect='kmr' AND active=1").fetchall()
        for sid, text, source in rows:
            new = unicodedata.normalize("NFC", correct(text, fixes))
            if new == text:
                continue
            read = db.execute("SELECT 1 FROM clip WHERE sentence_id=? LIMIT 1", (sid,)).fetchone()
            taken = db.execute("SELECT 1 FROM sentence WHERE dialect='kmr' AND text=?", (new,)).fetchone()
            if read or taken:
                db.execute("UPDATE sentence SET active=0 WHERE id=?", (sid,))
                db.execute("INSERT OR IGNORE INTO sentence (dialect, text, source) VALUES ('kmr',?,?)", (new, source))
                db.execute("UPDATE sentence SET active=1 WHERE dialect='kmr' AND text=?", (new,))
                retired += 1
            else:
                db.execute("UPDATE sentence SET text=? WHERE id=?", (new, sid))
                in_place += 1
    db.close()
    return in_place, retired


def main(corpus_dir: str, db_path: str | None = None) -> None:
    fixes = load_fixes(Path(corpus_dir) / "kmr-ferheng-fixes.tsv")
    print(f"corpus: {fix_file(Path(corpus_dir) / 'cv-kmr.txt', fixes)} lines corrected")
    if db_path:
        in_place, retired = fix_db(Path(db_path), fixes)
        print(f"database: {in_place} corrected in place, {retired} read sentences retired and re-added corrected")


if __name__ == "__main__":
    main(*sys.argv[1:3])
