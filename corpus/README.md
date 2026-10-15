# Sentences donors read

`cv-kmr.txt`, `cv-ckb.txt` — Common Voice's sentence collector
(`server/data/<locale>/sentence-collector.txt` in
https://github.com/common-voice/common-voice), public domain (CC0). Taken
as published, except Kurmancî spelling: words misspelt against Zeynelabidin's
Ferheng (Ferheng mizan) are corrected as listed in `kmr-ferheng-fixes.tsv`
(`tools/fix_spelling.py`, which also corrects the live sentences); `tools/load_corpus.py` filters them (2–14 words, no digits, the
dialect's own script) and maps Common Voice's Urdu heh (ھ) to the Kurdish heh
(ه) for Soranî. Only CC0 text goes here, so that what a donor reads carries no one's rights
but their own voice.
