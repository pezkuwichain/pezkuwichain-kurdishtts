# Sentences donors read

`cv-kmr.txt`, `cv-ckb.txt` — Common Voice's sentence collector
(`server/data/<locale>/sentence-collector.txt` in
https://github.com/common-voice/common-voice), public domain (CC0). Taken
as published; `tools/load_corpus.py` filters them (2–14 words, no digits, the
dialect's own script) and maps Common Voice's Urdu heh (ھ) to the Kurdish heh
(ه) for Soranî. Only CC0 text goes here: the recordings made from these
sentences are published under CC0 too, so a sentence with any other licence
would make the dataset unpublishable.
