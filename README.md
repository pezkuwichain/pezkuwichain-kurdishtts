<div align="center">

# KurdishTTS — Kurdish speech, and the voice bank to make it ours

**Read Kurmancî and Soranî aloud · Donate your voice (CC0) · Speech API for dks.news**

[![CI](https://github.com/pezkuwichain/pezkuwichain-kurdishtts/actions/workflows/ci.yml/badge.svg)](https://github.com/pezkuwichain/pezkuwichain-kurdishtts/actions/workflows/ci.yml)
&nbsp;·&nbsp; **Live:** [kurdishtts.dks.news](https://kurdishtts.dks.news)

</div>

---

## What it is (2026-10)

| Page / API | What it does |
|---|---|
| **`/`** | Type Kurmancî or Soranî, hear it read. |
| **`/bexsh`** | Donate your voice: sign in with a Pezkuwi wallet, accept the CC0 dedication once, read short sentences; check other donors' recordings. Two agreeing checks make a clip valid. |
| `POST /api/tts` | Short text → MP3. Public, rate-limited. |
| `POST /api/tts/jobs` | Up to an article → queued job → MP3. API key (`tools/apikey.py`). dks.news uses this. |

**The voice today is a stop-gap.** Meta's MMS-TTS models (CC-BY-NC 4.0) read
until a voice trained on the donated recordings replaces them — a change of two
values, `KTTS_MODEL_KMR` / `KTTS_MODEL_CKB` (`ktts/engine.py`).

**Data.** Donated recordings are CC0, kept as 48 kHz mono FLAC, trimmed and
machine-checked (length, silence, clipping, a pace that fits the sentence).
Sentences are CC0 too (`corpus/README.md`). Donors' wallet addresses never
appear in published data.

### Layout

```
app.py             FastAPI app: pages + routers
ktts/normalize.py  Kurdish text → speakable text (numbers in words, per dialect)
ktts/engine.py     MMS/VITS synthesis in worker processes, MP3, cache
ktts/jobs.py       long-text jobs in SQLite (survive restarts)
ktts/api.py        /api/tts...
ktts/auth.py       wallet sign-in (same contract as dks.news)
ktts/donate.py     voice donation + review
sigverify/         sr25519 signature check (Node: Pezkuwi signs in `bizinikiwi`)
web/chain/         wallet adapter source → static/kt-chain.js, kt-wc.js (npm run build)
ops/               systemd unit, nginx, host-side deploy script
tools/             corpus loader, API keys
```

### Performance (measured on the host: 6 vCPU EPYC, no GPU)

MMS VITS runs fastest sentence by sentence at 2 torch threads per process
(0.6× real time); more threads make it slower. Hence one interactive worker
and two batch workers, 2 threads each.

### Deploy

Merge to `main`, then `gh workflow run deploy.yml`. The runner's key can only
run `deploy <sha>` on the host (`ops/deploy.sh`), which fetches that commit
itself, refuses it unless it is on `main`, and switches only once the new tree
starts healthy.

The earlier dubbing service (`server.py`, `dub_pipeline.py`, `/create`) is
not deployed by this app; it stays in the tree until it is ported.

------|--------------|
| **`/`** Dubbing | Any-language audio/video → Kurdish dub. Whisper → NLLB → MMS-TTS pipeline. |
| **`/contribute`** | Voice donation (read Kurdish, record/upload) + HEZ development fund + Pezkuwi Wallet. |
| **`/create`** | Image + prompt → short AI video via Google Veo. |

## Architecture

```
                         ┌──────────────  FastAPI (server.py)  ──────────────┐
  upload (audio/video) → │  /api/dub  → single-worker queue → dub_pipeline    │
                         │  /api/contribute/voice → contributions/            │
  image + prompt       → │  /api/create/video → video worker → gemini_video   │
                         └────────────────────────────────────────────────────┘

  Dubbing pipeline (CPU-only):
    ffmpeg (extract) → faster-whisper (STT + lang) → NLLB-200 (translate→ku)
      → Meta MMS-TTS (synthesize) → pydub (time-fit) → ffmpeg (mux)

  Video pipeline:
    Gemini Veo predictLongRunning → poll operation → download MP4
```

Jobs run **one at a time** on a background worker to avoid OOM on the CPU-only
host. Video generation runs on its own worker (remote API, no local compute).

## Tech stack

- **Backend:** FastAPI + Uvicorn (single worker), Jinja2 templates
- **STT:** [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (CTranslate2)
- **Translation:** [NLLB-200-distilled-600M](https://huggingface.co/facebook/nllb-200-distilled-600M)
- **TTS:** Meta MMS — `facebook/mms-tts-kmr-script_latin`, `razhan/mms-tts-ckb`
- **Video:** Google Veo via the Gemini API
- **i18n:** dependency-free `static/i18n.js` (6 locales, 3 RTL)

## Local development

> Requires Python 3.10+, `ffmpeg`, and ~3 GB of disk for model cache.

```bash
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in GEMINI_API_KEY for /create
uvicorn server:app --reload --port 8000
```

Open <http://localhost:8000>. Models download to `HF_HOME` on first use.

### Lint

```bash
pip install -r requirements-dev.txt
ruff check .
```

## Configuration

All runtime config is via environment variables — see [`.env.example`](.env.example).
In production they are injected by a systemd drop-in and **never committed**.

## Deployment

Production runs as a `systemd` service behind nginx on the KURDITV host.
**Do not deploy by hand** — open a PR, get it merged to `main`, then the
[`Deploy`](.github/workflows/deploy.yml) workflow ships it (rsync + `systemctl
restart kurdishtts`). See [CONTRIBUTING.md](CONTRIBUTING.md).

## Contributing

PRs welcome from authorized contributors — read [CONTRIBUTING.md](CONTRIBUTING.md)
and [SECURITY.md](SECURITY.md) first. Never commit secrets, model weights, or
user-uploaded content.

## License

Proprietary — © 2026 Kurdistan Tech Ministry. See [LICENSE](LICENSE).
Third-party models retain their own licenses.
