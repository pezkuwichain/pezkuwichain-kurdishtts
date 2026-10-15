"""The training-data gatherer (tools/open_data.py), without the network.

What it holds: only licences that allow a model offered commercially are
listed, and every one is written up in training/SOURCES.md; Common Voice is
read from validated.tsv with its splits, and its speakers come out as labels,
not ids; a one-speaker set pairs audio with text from its metadata file; the
donated set holds only reviewed clips and loses a donor who deleted theirs.
"""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TMP = Path(tempfile.mkdtemp(prefix="ktts-open-"))
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tools"))

import open_data as od  # noqa: E402

from ktts.store import Store  # noqa: E402


def tone(path: Path, seconds: float = 0.6) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"sine=frequency=220:duration={seconds}",
                    "-ar", "48000", str(path)], check=True)
    return path


def rows(set_id: str) -> list[dict]:
    p = od.TRAIN / "sets" / set_id / "manifest.jsonl"
    return [json.loads(x) for x in p.read_text(encoding="utf-8").splitlines()]


def test_only_licences_that_allow_it_and_all_written_up():
    allowed = {"CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0"}
    doc = (ROOT / "training" / "SOURCES.md").read_text(encoding="utf-8")
    for s in od.SOURCES:
        assert s.license in allowed, s.id
        assert f"`{s.id}`" in doc, f"{s.id} is not in training/SOURCES.md"
        assert s.credit and s.url, s.id
        assert od.READERS[s.id]
    assert len({s.id for s in od.SOURCES}) == len(od.SOURCES)


def test_common_voice_validated_with_splits_and_no_ids():
    od.TRAIN = TMP / "cv"
    d = od.TRAIN / "raw" / "cv-kmr" / "x" / "cv-corpus-27.0" / "kmr"
    head = "client_id\tpath\tsentence_id\tsentence\tup_votes\tdown_votes\n"
    (d / "clips").mkdir(parents=True)
    for name in ("a.mp3", "b.mp3", "c.mp3"):
        tone(d / "clips" / name)
    (d / "validated.tsv").write_text(head + "secret-one\ta.mp3\t1\tZiman nasnameya me ye.\t2\t0\n"
                                     "secret-two\tb.mp3\t2\tEm ê biparêzin.\t3\t0\n"
                                     "secret-two\tmissing.mp3\t3\tTune.\t2\t0\n", encoding="utf-8")
    (d / "train.tsv").write_text(head + "secret-one\ta.mp3\t1\tZiman nasnameya me ye.\t2\t0\n", encoding="utf-8")
    (d / "test.tsv").write_text(head + "secret-two\tb.mp3\t2\tEm ê biparêzin.\t3\t0\n", encoding="utf-8")
    assert od.prepare(od.BY_ID["cv-kmr"]) == 2          # c.mp3 is not validated; missing.mp3 has no audio
    r = rows("cv-kmr")
    assert [x["split"] for x in r] == ["train", "test"]
    assert r[0]["text"] == "Ziman nasnameya me ye." and r[0]["dialect"] == "kmr" and r[0]["license"] == "CC0-1.0"
    assert r[0]["speaker"] != r[1]["speaker"] and "secret" not in json.dumps(r)
    assert 0.5 < r[0]["seconds"] < 0.7
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=channels,codec_name", "-of", "csv=p=0",
                          str(od.TRAIN / "sets" / "cv-kmr" / r[0]["audio"])], capture_output=True, text=True).stdout
    assert out.strip() == "flac,1"


def test_one_speaker_set_reads_the_chosen_spelling():
    # The layout of the downloaded Hawrami archive: wavs/ and three spellings.
    od.TRAIN = TMP / "pairs"
    d = od.TRAIN / "raw" / "unimelb-hac" / "x"
    tone(d / "wavs" / "A0001.wav")
    tone(d / "wavs" / "A0002.wav")
    (d / "card.md").write_text("# Hawrami Kurdish TTS Dataset\n", encoding="utf-8")
    (d / "metadata_var1.csv").write_text("A0001.wav|ۋەڵام یەک\nA0002.wav|ۋەڵام دوو\nA0003.wav|بێ دەنگ\n", encoding="utf-8")
    (d / "metadata_var2.csv").write_text("A0001.wav|var2\nA0002.wav|var2\nA0003.wav|var2\n", encoding="utf-8")
    (d / "metadata_var3.csv").write_text("A0001.wav|وەڵام یەک\nA0002.wav|وەڵام دوو\nA0003.wav|بێ دەنگ\n", encoding="utf-8")
    assert od.prepare(od.BY_ID["unimelb-hac"]) == 2          # A0003 has no audio
    r = rows("unimelb-hac")
    assert [x["text"] for x in r] == ["ۋەڵام یەک", "ۋەڵام دوو"]
    assert [x["text_alt"] for x in r] == ["وەڵام یەک", "وەڵام دوو"]
    assert len({x["speaker"] for x in r}) == 1 and r[0]["license"] == "CC-BY-4.0"


def test_donations_hold_reviewed_clips_and_forget_the_deleted():
    od.TRAIN = TMP / "don"
    store = Store(TMP / "don.db")
    clips = TMP / "clips"
    now = int(time.time())
    with store.db() as db:
        db.execute("INSERT INTO sentence (id, dialect, text, source) VALUES (1,'kmr','Roj baş.','cv'), (2,'kmr','Şev baş.','cv')")
        for addr in ("5Alice", "5Bob"):
            db.execute("INSERT INTO speaker (addr, dialect, consent_version, created) VALUES (?,?,?,?)",
                       (addr, "kmr", "train-only-2026-10-03-dialect", now))
        for cid, addr, sid, status in ((1, "5Alice", 1, "valid"), (2, "5Bob", 1, "valid"), (3, "5Bob", 2, "pending")):
            tone(clips / f"{cid}.flac")
            db.execute("INSERT INTO clip (id, addr, sentence_id, dialect, file, seconds, status, created) "
                       "VALUES (?,?,?,?,?,?,?,?)", (cid, addr, sid, "kmr", f"{cid}.flac", 0.6, status, now))
    assert od.donations(TMP / "don.db", clips) == 2       # the pending one waits for its votes
    r = rows("donations")
    assert all(x["license"].startswith("KurdAi Voice donation") for x in r)
    assert "5Alice" not in json.dumps(r) and "5Bob" not in json.dumps(r)
    # Bob deletes his recordings (as /api/donate/forget does): the next export has none of them.
    with store.db() as db:
        db.execute("DELETE FROM clip WHERE addr='5Bob'")
    assert od.donations(TMP / "don.db", clips) == 1
    assert len(list((od.TRAIN / "sets" / "donations" / "audio").iterdir())) == 1


def test_attribution_names_what_was_used():
    od.TRAIN = TMP / "cv"
    text = od.attribution()
    assert "Mozilla Common Voice 27.0, Kurmanji" in text and "FLEURS" not in text
