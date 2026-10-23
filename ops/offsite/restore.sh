#!/usr/bin/env bash
# Restore one KurdishTTS backup into a new directory:
#
#   GNUPGHOME=<keyring holding the backup key> ops/offsite/restore.sh <kurdishtts-STAMP.tar.gpg> <new dir>
#
# The result is a data directory (kurdishtts.db + clips/) ready to stand in for
# /opt/kurdishtts/data. A recording whose row is not in the database -- made after the
# database was copied, or deleted by its donor -- is removed here, so a restore never
# brings back what a donor took away. See README.md for the rest of the procedure.
set -euo pipefail
arc=${1:?usage: restore.sh <archive.tar.gpg> <new dir>}
dest=${2:?usage: restore.sh <archive.tar.gpg> <new dir>}
[[ ! -e $dest ]] || { echo "restore: $dest already exists; restore into a new directory" >&2; exit 1; }
install -d -m 700 "$dest"
gpg --batch --quiet --decrypt -- "$arc" | tar -C "$dest" -xf -

db="$dest/kurdishtts.db"
check=$(sqlite3 "$db" 'PRAGMA integrity_check')
[[ $check == ok ]] || { echo "restore: database failed its integrity check: $check" >&2; exit 1; }

sqlite3 "$db" 'SELECT file FROM clip' | sort > "$dest/.rows"
( cd "$dest/clips" && find . -type f -printf '%P\n' | sort ) > "$dest/.files"
orphans=0
while IFS= read -r f; do
  rm -f -- "$dest/clips/$f"; orphans=$((orphans + 1))
done < <(comm -13 "$dest/.rows" "$dest/.files")
missing=$(comm -23 "$dest/.rows" "$dest/.files" | wc -l)
rm -f -- "$dest/.rows" "$dest/.files"

echo "restore: $(sqlite3 "$db" 'SELECT count(*) FROM clip') recordings from" \
     "$(sqlite3 "$db" 'SELECT count(DISTINCT addr) FROM clip') donors;" \
     "$orphans file(s) without a row removed; $missing row(s) without a file"
