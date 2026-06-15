# Security Policy

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue.

- Email: **security@pezkuwichain.io** (or **info@pezkuwichain.io**)
- Use GitHub's **Report a vulnerability** (Security → Advisories) if enabled.

We aim to acknowledge within 72 hours.

## Secrets handling

- **No secret ever lives in git.** API keys, SSH keys and `.env` files are
  ignored by `.gitignore` and must never be committed.
- The production `GEMINI_API_KEY` is provided only via the server's systemd
  drop-in (`/etc/systemd/system/kurdishtts.service.d/env.conf`, `chmod 600`).
- Deploy credentials are stored as GitHub Actions **secrets**
  (`VPS_HOST`, `VPS_USER`, `VPS_SSH_PORT`, `VPS_SSH_KEY`) — see
  `.github/workflows/deploy.yml`. Use a dedicated, least-privilege deploy key,
  never a personal/master key.

## User data

- Uploaded audio/video for dubbing is processed transiently under `jobs/` and is
  not part of the repository.
- Donated voice recordings under `contributions/` are stored for the sole
  purpose of training Kurdish TTS models, per the project license.

## Hardening notes

- Upload size and duration are capped (`DUB_MAX_BYTES`, `DUB_MAX_SECONDS`).
- File-type allowlists are enforced server-side for every upload endpoint.
- The service runs single-worker with a `MemoryMax` cap to avoid OOM.
