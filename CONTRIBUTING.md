# Contributing to KurdîTV

Thanks for helping build free Kurdish AI. This repo follows the Pezkuwichain
engineering standard — please read this before opening a PR.

## Golden rules

1. **Never deploy by hand.** No manual `scp`/`ssh`/`rsync` to the server.
   Ship through: **PR → review → merge to `main` → `Deploy` workflow**.
2. **Never commit secrets.** No API keys, SSH keys, or `.env` files. Production
   secrets live only in the server's systemd drop-in. See [SECURITY.md](SECURITY.md).
3. **Never commit user content or model weights.** `jobs/`, `contributions/`,
   media files and the HF cache are git-ignored — keep it that way.

## Workflow

```bash
git checkout -b feat/your-change        # branch off main
# … make changes …
ruff check .                            # lint must pass
git commit -m "feat: short description"
git push -u origin feat/your-change
gh pr create --base main                # open a PR; CI runs automatically
```

- Keep PRs focused and small.
- All CI checks must be green before merge.
- At least one CODEOWNER review is required (see `.github/CODEOWNERS`).

## Commit convention

Conventional Commits:

```
feat:     a new feature
fix:      a bug fix
i18n:     translations / locale work
chore:    tooling, deps, config
docs:     documentation only
refactor: no behaviour change
```

## Code style

- **Python:** `ruff` (config in `pyproject.toml`). Type hints where practical;
  match the existing style in `server.py` / `dub_pipeline.py`.
- **Frontend:** plain HTML/CSS/JS, no build step. Keep the dark theme tokens
  (`--kesk`, `--pos`, `--fire`, …) and the Newroz-flame branding consistent.

## Adding translations

UI strings live in `static/i18n.js` under `I18N[<locale>]`. To add or fix a
locale, edit every key for that locale and verify RTL locales (`ku`, `fa`, `ar`)
still render correctly. Mark elements with `data-i18n="key"` (text),
`data-i18n-ph="key"` (placeholder); use `t('key')` for dynamic JS strings.

## Reporting bugs / requesting features

Use the issue templates under **Issues → New issue**.
