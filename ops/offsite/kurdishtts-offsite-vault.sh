#!/usr/bin/env bash
# Runs on the host that receives the KurdishTTS backups. The KurdishTTS host may only
# write into /home/kttsbackup/incoming -- its key is fixed to `rrsync -wo -no-del`, so it
# can neither read nor delete there. This moves each finished run into a vault only root
# can reach, never over an existing file, checks it against the checksum sent with it,
# and keeps 30 days: the privacy policy promises that a deleted donor's recordings leave
# every backup within 35 days.
set -euo pipefail
IN=${KTTS_VAULT_IN:-/home/kttsbackup/incoming}
VAULT=${KTTS_VAULT:-/var/backups/kurdishtts-offsite}
OWNER=${KTTS_VAULT_OWNER:-root}
KEEP_DAYS=30
install -d -m 700 -o "$OWNER" -g "$OWNER" "$VAULT"

# A run is complete once its checksum file has arrived and has not changed for two
# minutes. Everything in incoming was written by the other host, so nothing it says is
# trusted: the stamp must have the backup script's shape, the checksum file must name
# exactly the one file of that run, and both must be plain files in incoming itself.
find "$IN" -maxdepth 1 -type f -name 'sums-*.sha256' -mmin +2 | sort | while read -r sums; do
  stamp=$(basename "$sums" .sha256); stamp=${stamp#sums-}
  if [[ ! $stamp =~ ^[0-9]{8}T[0-9]{6}Z$ ]]; then
    echo "vault: unexpected checksum file $(basename "$sums" | tr -cd '[:alnum:]._-'); left in incoming" >&2; continue
  fi
  arc="kurdishtts-$stamp.tar.gpg"; sf="sums-$stamp.sha256"
  if [[ $(awk '{print $2}' "$IN/$sf") != "$arc" ]]; then
    echo "vault: $stamp checksum file does not name exactly its archive; left in incoming" >&2; continue
  fi
  if [[ ! -f "$IN/$arc" || -L "$IN/$arc" || -L "$IN/$sf" ]]; then
    echo "vault: $stamp is missing its archive or holds a link; left in incoming" >&2; continue
  fi
  ( cd "$IN" && sha256sum -c --quiet -- "$sf" ) || { echo "vault: $stamp does not match its checksum; left in incoming" >&2; continue; }
  for f in "$arc" "$sf"; do
    if [[ -e "$VAULT/$f" ]]; then echo "vault: $f already vaulted; incoming copy discarded" >&2; rm -f -- "$IN/$f"; continue; fi
    mv -n -T -- "$IN/$f" "$VAULT/$f"
    chown -h "$OWNER:$OWNER" -- "$VAULT/$f"; chmod 600 -- "$VAULT/$f"
  done
  echo "vault: $stamp stored ($(du -h -- "$VAULT/$arc" | cut -f1))"
done

find "$VAULT" -maxdepth 1 -type f -mtime +$KEEP_DAYS -delete
