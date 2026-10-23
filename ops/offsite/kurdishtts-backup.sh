#!/usr/bin/env bash
# Runs on the KurdishTTS host, nightly (kurdishtts-backup.timer). Takes the voice
# donations -- the database and the recordings -- encrypts them here to a public key
# whose private half is not on this host, and pushes the result to a host that can
# only receive. So once a backup has left, neither this host nor the receiving one can
# read it, and a compromised KurdishTTS host cannot reach back and delete it.
# Restoring, and the key, are described in ops/offsite/README.md.
set -euo pipefail
DATA=${KTTS_DATA:-/opt/kurdishtts/data}
CONF=${KTTS_BACKUP_CONF:-/etc/kurdishtts-backup}
# OFFSITE_TARGET (user@host:) and OFFSITE_KEY (the push key).
# shellcheck source=/dev/null
source "$CONF/offsite.env"
: "${OFFSITE_TARGET:?}" "${OFFSITE_KEY:?}"

WORK=$(mktemp -d /var/tmp/kurdishtts-backup.XXXXXX)
trap 'rm -rf "$WORK"' EXIT
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT="kurdishtts-$STAMP.tar.gpg"

# The service writes while this runs (WAL), so the database is copied with sqlite's
# own online backup, never cp, and the copy must pass its integrity check.
sqlite3 "$DATA/kurdishtts.db" ".backup '$WORK/kurdishtts.db'"
check=$(sqlite3 "$WORK/kurdishtts.db" 'PRAGMA integrity_check')
[[ $check == ok ]] || { echo "backup: database copy failed its integrity check: $check" >&2; exit 1; }
# Database first, recordings second: a recording made in between is a file with no row
# and a recording deleted in between a row with no file; the restore handles both.
tar -C "$WORK" -cf "$WORK/backup.tar" kurdishtts.db -C "$DATA" clips
install -d -m 700 "$WORK/gnupg"
gpg --batch --quiet --no-tty --homedir "$WORK/gnupg" --trust-model always \
  --recipient-file "$CONF/recipient.asc" --output "$WORK/$OUT" --encrypt "$WORK/backup.tar"
( cd "$WORK" && sha256sum -- "$OUT" > "sums-$STAMP.sha256" )

ssh_cmd="ssh -i $OFFSITE_KEY -o BatchMode=yes -o IdentitiesOnly=yes"
rsync -t --chmod=F600 -e "$ssh_cmd" "$WORK/$OUT" "$OFFSITE_TARGET"
# The checksum file goes last: its arrival is what tells the other side the run is whole.
rsync -t --chmod=F600 -e "$ssh_cmd" "$WORK/sums-$STAMP.sha256" "$OFFSITE_TARGET"
echo "kurdishtts backup $STAMP: $(du -h "$WORK/$OUT" | cut -f1) pushed off-site to ${OFFSITE_TARGET%%:*}"
