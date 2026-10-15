# Training data

Everything our own voice is trained on is gathered by one tool, on the machine
that will train it (a GPU box, not the web server). What is used and why is in
[SOURCES.md](SOURCES.md).

```sh
pip install -r requirements-train.txt          # pyarrow; ffmpeg must be installed
export KTTS_TRAIN=/data/kurdai/train           # ~70 GB when everything is in
export MDC_API_KEY=...                         # mozilladatacollective.com → profile → API keys

python tools/open_data.py list
python tools/open_data.py fetch                # all sources (or name some: fetch cv-kmr fleurs-ckb)
python tools/open_data.py prepare
python tools/open_data.py stats
python tools/open_data.py attribution          # → $KTTS_TRAIN/ATTRIBUTION.md, for the model card
```

Before the first `fetch`, open each Data Collective dataset's page once and accept
its terms (the links are in `list` and SOURCES.md): the API refuses a download
whose terms were not accepted, and allows 30 downloads a day.

The donated recordings are exported on the web server, where the database is,
and copied to the training machine:

```sh
KTTS_TRAIN=/opt/kurdishtts/train python tools/open_data.py donations
rsync -a /opt/kurdishtts/train/sets/donations/ gpu:/data/kurdai/train/sets/donations/
```

Run the export again before every training run, never reuse an old copy: a
donor who deleted their recordings must not be in the next model.

Every set ends as `sets/<id>/audio/*.flac` (mono, the source's own sample rate)
and `sets/<id>/manifest.jsonl`, one clip per line with its text, dialect,
speaker label, split, source and licence.
