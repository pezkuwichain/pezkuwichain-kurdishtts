#!/bin/bash
# KurdishTTS deploy, run on the host as root by a forced-command SSH key:
#   command="/usr/local/sbin/kurdishtts-deploy",restrict ssh-ed25519 ... kurdishtts-ci-deploy
# The key can do exactly one thing: `deploy <40-hex sha>`. The host fetches the
# public repository itself, refuses a commit that is not on main, builds the
# new tree beside the running one, and switches only after it starts healthy;
# otherwise the old tree keeps serving. Nothing is copied in from the runner.
set -euo pipefail
REPO=https://github.com/pezkuwichain/pezkuwichain-kurdishtts.git
BASE=/opt/kurdishtts
LOG=/var/log/kurdishtts-deploy.log
exec > >(tee -a "$LOG") 2>&1

read -r verb sha extra <<<"${SSH_ORIGINAL_COMMAND:-${*:-}}"
[[ "$verb" == "deploy" && "$sha" =~ ^[0-9a-f]{40}$ && -z "${extra:-}" ]] || { echo "usage: deploy <40-hex sha>"; exit 2; }
echo "== $(date -u +%FT%TZ) deploy $sha"

exec 9>/run/kurdishtts-deploy.lock
flock -n 9 || { echo "another deploy is running"; exit 3; }

MIRROR=$BASE/mirror.git
[[ -d $MIRROR ]] || git clone -q --mirror "$REPO" "$MIRROR"
git -C "$MIRROR" fetch -q --prune origin
git -C "$MIRROR" merge-base --is-ancestor "$sha" refs/heads/main || { echo "refused: $sha is not on main"; exit 4; }

NEW=$BASE/releases/$sha
if [[ ! -d $NEW ]]; then
  install -d -m 750 -o root -g kurdishtts "$BASE/releases"
  git -C "$MIRROR" worktree prune
  rm -rf "$NEW.tmp" && mkdir -p "$NEW.tmp"
  git -C "$MIRROR" archive "$sha" | tar -x -C "$NEW.tmp"
  (cd "$NEW.tmp/sigverify" && npm ci --omit=dev --silent --no-audit --no-fund)
  mv "$NEW.tmp" "$NEW"
fi
sudo -u kurdishtts "$BASE/venv/bin/pip" install -q -r "$NEW/requirements.txt"
sudo -u kurdishtts "$BASE/venv/bin/python" "$NEW/tools/load_corpus.py" "$BASE/data/kurdishtts.db" "$NEW/corpus/"
chown -R root:kurdishtts "$NEW"; chmod -R g+rX,o-rwx "$NEW"

install -m 644 "$NEW/ops/kurdishtts.service" /etc/systemd/system/kurdishtts.service
install -m 644 "$NEW/ops/proxy.conf" /etc/nginx/kurdishtts-proxy.conf
install -m 644 "$NEW/ops/nginx.conf" /etc/nginx/sites-available/kurdishtts.conf
nginx -t -q

PREV=$(readlink -f "$BASE/app" 2>/dev/null || true)
ln -sfn "$NEW" "$BASE/app.next" && mv -T "$BASE/app.next" "$BASE/app"
systemctl daemon-reload
systemctl restart kurdishtts
ok=""
for _ in $(seq 1 60); do curl -sf http://127.0.0.1:8000/api/tts/health >/dev/null && { ok=1; break; }; sleep 3; done
if [[ -z "$ok" ]]; then
  echo "unhealthy: rolling back to ${PREV:-nothing}"
  if [[ -n "$PREV" && -d "$PREV" ]]; then ln -sfn "$PREV" "$BASE/app.next" && mv -T "$BASE/app.next" "$BASE/app"; systemctl restart kurdishtts; fi
  exit 5
fi
systemctl reload nginx
# keep the last five releases
ls -1dt "$BASE"/releases/*/ 2>/dev/null | tail -n +6 | xargs -r rm -rf
echo "KTTS-DEPLOY-RESULT ok sha=$sha"
