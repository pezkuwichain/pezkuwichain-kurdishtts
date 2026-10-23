# Off-site backup of the voice donations

What it protects: `kurdishtts.db` (donors, consents, recordings' rows, deletions) and
`clips/` (the recordings). Everything else on the host can be rebuilt from this
repository and the models.

What the privacy policy promises (row 14, section 7): nightly, encrypted before it
leaves the server with a key that is on neither server, kept in the EU, deleted after
30 days, so a deleted donor's recordings are gone from every copy within 35 days.

## How it works

| where | what |
|---|---|
| KurdishTTS host | `kurdishtts-backup.timer` (03:20 UTC) runs `kurdishtts-backup.sh` from the live release: an online sqlite copy that must pass `integrity_check`, a tar with `clips/`, encrypted with gpg to `/etc/kurdishtts-backup/recipient.asc`, pushed with a checksum file over `rsync`. |
| receiving host | the push key is fixed to `rrsync -wo -no-del /home/kttsbackup/incoming`: it can write there and nothing else. `kurdishtts-offsite-vault.timer` (every 30 min) checks each finished run against its checksum and moves it into `/var/backups/kurdishtts-offsite` (root 700, files 600); it deletes what is older than 30 days. |
| offline | the private key, `res/secrets/kurdishtts/backup-private.asc`. Neither host can read a backup once it has been made. |

A failed run leaves `kurdishtts-backup.service` failed, which fleet-health reports.

## Install

Receiving host (any EU host of the fleet; not a CI runner):

```sh
useradd -m -s /bin/sh -c "KurdishTTS off-site backups (receive only)" kttsbackup
install -d -m 700 -o kttsbackup -g kttsbackup /home/kttsbackup/incoming /home/kttsbackup/.ssh
echo 'restrict,command="/usr/bin/rrsync -wo -no-del -munge /home/kttsbackup/incoming" <push key .pub>' \
  >> /home/kttsbackup/.ssh/authorized_keys
chown kttsbackup: /home/kttsbackup/.ssh/authorized_keys; chmod 600 /home/kttsbackup/.ssh/authorized_keys
install -m 755 kurdishtts-offsite-vault.sh /usr/local/sbin/kurdishtts-offsite-vault
install -m 644 kurdishtts-offsite-vault.{service,timer} /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now kurdishtts-offsite-vault.timer
```

KurdishTTS host:

```sh
ssh-keygen -t ed25519 -N '' -C kurdishtts-offsite -f /root/.ssh/kurdishtts_offsite
ssh-keyscan -t ed25519 <receiving host> >> /root/.ssh/known_hosts   # compare the fingerprint first
install -d -m 700 /etc/kurdishtts-backup
install -m 644 <public key> /etc/kurdishtts-backup/recipient.asc
printf 'OFFSITE_TARGET=kttsbackup@<receiving host>:\nOFFSITE_KEY=/root/.ssh/kurdishtts_offsite\n' \
  > /etc/kurdishtts-backup/offsite.env
install -m 644 kurdishtts-backup.{service,timer} /etc/systemd/system/
systemctl daemon-reload && systemctl enable --now kurdishtts-backup.timer
systemctl start kurdishtts-backup.service    # the first run, now
```

## Restore

A backup that has never been restored is not known to be a backup. After installing,
and after any change to these scripts, fetch the newest file from the vault and restore
it somewhere that is not the live host:

```sh
export GNUPGHOME=$(mktemp -d)
gpg --import res/secrets/kurdishtts/backup-private.asc
ops/offsite/restore.sh kurdishtts-<STAMP>.tar.gpg /tmp/ktts-restore
```

`restore.sh` decrypts, checks the database, removes every recording that has no row
(made after the database was copied, or deleted by its donor), and prints how many
recordings and donors came back. Compare with the live host:

```sh
sqlite3 /opt/kurdishtts/data/kurdishtts.db "select count(*), count(distinct addr) from clip"
```

To put a restore into service: stop `kurdishtts`, move `/opt/kurdishtts/data` aside,
copy the restored `kurdishtts.db` and `clips/` in, `chown -R kurdishtts:kurdishtts`,
start `kurdishtts`. Then say on the privacy page that a restore happened: a donor who
deleted their recordings after the backup was taken has to delete them again
(privacy policy, row 14).
