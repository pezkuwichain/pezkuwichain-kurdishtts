"""Correct the spelling of Kurmancî corpus sentences against the Ferheng.

  python tools/fix_spelling.py corpus/                          # rewrite corpus/cv-kmr.txt
  python tools/fix_spelling.py corpus/ /opt/kurdishtts/data/kurdishtts.db  # and the live sentences

corpus/kmr-ferheng-fixes.tsv lists whole words that are misspelt against
Zeynelabidin's Ferheng (Ferheng mizan), each with the spelling it gives. A
word is replaced only as a whole word, keeping a capital first letter.

In the database the sentences on offer are made to match the corrected file:
a misspelt sentence is retired, never edited, so any recording keeps the text
that was on screen; its corrected text is offered as its own sentence. The
server's start-up loader may already have added the corrected lines; the sync
then only retires the old ones. Running it again changes nothing.
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


def fix_db(db_path: Path, corpus_dir: Path) -> tuple[int, int, int]:
    """Make the live Kurmancî sentences match the corrected corpus file.

    A sentence is on offer exactly when its text is a usable line of the file;
    every other Common Voice sentence is retired (kept, with any recording that
    belongs to it), and a usable line the database lacks is added. Running it
    again, or after the fix list changes, leaves exactly the file on offer.
    """
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from load_corpus import ok

    lines = (corpus_dir / "cv-kmr.txt").read_text(encoding="utf-8").splitlines()
    wanted = {t for t in (unicodedata.normalize("NFC", raw.strip()) for raw in lines) if ok(t, "kmr")}
    activated = retired = added = 0
    db = sqlite3.connect(db_path)
    with db:
        have = {}
        for sid, text, active in db.execute(
                "SELECT id, text, active FROM sentence WHERE dialect='kmr' AND source='common-voice-cc0'"):
            have[text] = sid
            on = text in wanted
            if on and not active:
                db.execute("UPDATE sentence SET active=1 WHERE id=?", (sid,))
                activated += 1
            elif active and not on:
                db.execute("UPDATE sentence SET active=0 WHERE id=?", (sid,))
                retired += 1
        for text in sorted(wanted - have.keys()):
            db.execute("INSERT OR IGNORE INTO sentence (dialect, text, source) VALUES ('kmr',?,'common-voice-cc0')", (text,))
            added += 1
    db.close()
    return activated, retired, added


def main(corpus_dir: str, db_path: str | None = None) -> None:
    fixes = load_fixes(Path(corpus_dir) / "kmr-ferheng-fixes.tsv")
    print(f"corpus: {fix_file(Path(corpus_dir) / 'cv-kmr.txt', fixes)} lines corrected")
    if db_path:
        activated, retired, added = fix_db(Path(db_path), Path(corpus_dir))
        print(f"database: {retired} retired, {added} added, {activated} brought back")


if __name__ == "__main__":
    main(*sys.argv[1:3])
