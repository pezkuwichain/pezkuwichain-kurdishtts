<div align="center">

# KurdîTV — Kurdish Auto-Dubbing & AI Studio

**Dub any audio/video into Kurdish · Donate your voice · Create AI videos**

[![CI](https://github.com/pezkuwichain/pezkuwichain-kurdishtts/actions/workflows/ci.yml/badge.svg)](https://github.com/pezkuwichain/pezkuwichain-kurdishtts/actions/workflows/ci.yml)
&nbsp;·&nbsp; **Live:** [kurdishtts.pezkiwi.app](https://kurdishtts.pezkiwi.app)

</div>

---

KurdîTV is a non-profit, community service for the Kurdish language. Upload audio
or video in **any language** and get a Kurdish (Kurmancî / Soranî) voice-over,
contribute your voice to train better Kurdish speech models, or generate short
AI videos from an image and a prompt.

The web UI is available in **6 languages** — English, Soranî (کوردیی سۆرانی),
Kurmancî, Türkçe, فارسی and العربية — with full RTL support.

## Features

| Page | What it does |
|------|--------------|
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
