"""Load the CC0 sentence corpus into the donation database.

  python tools/load_corpus.py /opt/kurdishtts/data/kurdishtts.db corpus/

Sources: Common Voice's sentence collector (server/data/<locale>/
sentence-collector.txt), public domain (CC0). A sentence is taken if it is a
single line of 2–14 words with no digits (a donor should read words, not
choose how to say a number) and in the dialect's own script. Re-running adds
only what is new.
"""
from __future__ import annotations

import re
import sys
import unicodedata
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from ktts.store import Store  # noqa: E402

FILES = {"kmr": "cv-kmr.txt", "ckb": "cv-ckb.txt"}


def ok(line: str, dialect: str) -> bool:
    words = line.split()
    if not (2 <= len(words) <= 14) or len(line) > 110:
        return False
    if re.search(r"\d|[٠-٩۰-۹]|https?:|[<>{}\[\]=_*#@|\\/]", line):
        return False
    if dialect == "ckb" and re.search(r"[A-Za-z]", line):
        return False
    if dialect == "kmr" and re.search(r"[؀-ۿ]", line):
        return False
    return True


def main(db_path: str, corpus_dir: str) -> None:
    store = Store(Path(db_path))
    for dialect, name in FILES.items():
        lines = []
        for raw in (Path(corpus_dir) / name).read_text(encoding="utf-8").splitlines():
            line = unicodedata.normalize("NFC", raw.strip())
            if dialect == "ckb":
                line = line.replace("ھ", "ه")   # Common Voice's Urdu heh → the Kurdish heh
            if ok(line, dialect):
                lines.append(line)
        added = store.load_sentences(dialect, lines, "common-voice-cc0")
        print(f"{dialect}: {len(lines)} usable, {added} new")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
