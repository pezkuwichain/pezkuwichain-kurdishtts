"""The off-site backup, end to end, with the real scripts, gpg and sqlite3.

Backup on the KurdishTTS side, vault on the receiving side, restore with the
private key: what goes out is unreadable without that key, a tampered or
incomplete run never reaches the vault, the vault keeps 30 days, and a restore
does not bring back a recording whose row is gone.
"""
from __future__ import annotations

import getpass
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import pytest

from ktts.store import Store

ROOT = Path(__file__).resolve().parent.parent
OPS = ROOT / "ops" / "offsite"
# Not skipped when a tool is missing: a backup test that quietly does not run is a
# green that measured nothing. CI installs them.
MISSING = [t for t in ("gpg", "sqlite3", "rsync") if not shutil.which(t)]
assert not MISSING, f"the off-site backup test needs {MISSING} on PATH"


def run(cmd: list[str], env: dict[str, str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, env={**os.environ, **env}, capture_output=True, text=True)


@pytest.fixture()
def world():
    tmp = Path(tempfile.mkdtemp(prefix="ktts-offsite-"))
    keys = tmp / "keys"
    keys.mkdir(mode=0o700)
    subprocess.run(["gpg", "--batch", "--pinentry-mode", "loopback", "--homedir", str(keys), "--passphrase", "",
                    "--quick-gen-key", "test-backup@kurdishtts", "default", "default", "never"],
                   check=True, capture_output=True)
    conf = tmp / "conf"
    conf.mkdir()
    with open(conf / "recipient.asc", "wb") as f:
        subprocess.run(["gpg", "--batch", "--homedir", str(keys), "--armor", "--export"],
                       check=True, stdout=f)
    incoming = tmp / "incoming"
    incoming.mkdir()
    (conf / "offsite.env").write_text(f"OFFSITE_TARGET={incoming}/\nOFFSITE_KEY=/dev/null\n")

    data = tmp / "data"
    store = Store(data / "kurdishtts.db")
    (data / "clips" / "kmr").mkdir(parents=True)
    with store.db() as db:
        db.execute("INSERT INTO sentence (id, dialect, text, source) VALUES (1, 'kmr', 'Roj baş', 't')")
        db.execute("INSERT INTO clip (addr, sentence_id, dialect, file, seconds, status, created) "
                   "VALUES ('5Donor', 1, 'kmr', 'kmr/kept.flac', 1.0, 'pending', 1)")
    (data / "clips" / "kmr" / "kept.flac").write_bytes(b"SECRET-VOICE-kept")
    # a recording whose row is gone: its donor deleted it while the backup ran
    (data / "clips" / "kmr" / "orphan.flac").write_bytes(b"SECRET-VOICE-orphan")
    env = {"KTTS_DATA": str(data), "KTTS_BACKUP_CONF": str(conf),
           "KTTS_VAULT_IN": str(incoming), "KTTS_VAULT": str(tmp / "vault"),
           "KTTS_VAULT_OWNER": getpass.getuser()}
    yield tmp, env, keys
    shutil.rmtree(tmp, ignore_errors=True)


def age(path: Path, seconds: float) -> None:
    t = time.time() - seconds
    os.utime(path, (t, t))


def test_backup_vault_and_restore(world):
    tmp, env, keys = world
    incoming, vault = tmp / "incoming", tmp / "vault"

    r = run([str(OPS / "kurdishtts-backup.sh")], env)
    assert r.returncode == 0, r.stderr
    sent = sorted(p.name for p in incoming.iterdir())
    assert len(sent) == 2 and sent[0].startswith("kurdishtts-") and sent[1].startswith("sums-"), sent
    archive = incoming / sent[0]
    assert b"SECRET-VOICE" not in archive.read_bytes() and b"5Donor" not in archive.read_bytes()

    # a run whose checksum file is younger than two minutes may still be arriving
    assert run([str(OPS / "kurdishtts-offsite-vault.sh")], env).returncode == 0
    assert not vault.exists() or not any(vault.iterdir())
    for p in incoming.iterdir():
        age(p, 300)
    r = run([str(OPS / "kurdishtts-offsite-vault.sh")], env)
    assert r.returncode == 0 and "stored" in r.stdout, r.stderr
    assert not any(incoming.iterdir())
    vaulted = vault / sent[0]
    assert vaulted.exists() and oct(vaulted.stat().st_mode & 0o777) == "0o600"

    # the restore: the database and the recording come back, the orphan does not
    out = tmp / "restored"
    r = run([str(OPS / "restore.sh"), str(vaulted), str(out)], {"GNUPGHOME": str(keys)})
    assert r.returncode == 0, r.stderr
    assert "1 recordings from 1 donors; 1 file(s) without a row removed; 0 row(s) without a file" in r.stdout
    assert (out / "clips" / "kmr" / "kept.flac").read_bytes() == b"SECRET-VOICE-kept"
    assert not (out / "clips" / "kmr" / "orphan.flac").exists()
    # and it never overwrites
    assert run([str(OPS / "restore.sh"), str(vaulted), str(out)], {"GNUPGHOME": str(keys)}).returncode != 0

    # the vault keeps 30 days
    age(vaulted, 31 * 86400)
    run([str(OPS / "kurdishtts-offsite-vault.sh")], env)
    assert not vaulted.exists()


def test_vault_refuses_what_it_cannot_trust(world):
    tmp, env, _ = world
    incoming, vault = tmp / "incoming", tmp / "vault"
    stamp = "20261023T032000Z"
    arc = incoming / f"kurdishtts-{stamp}.tar.gpg"
    arc.write_bytes(b"x")
    # a checksum that does not match the archive
    (incoming / f"sums-{stamp}.sha256").write_text("0" * 64 + f"  {arc.name}\n")
    # a checksum file naming something else
    (incoming / "sums-20261023T040000Z.sha256").write_text("0" * 64 + "  ../../etc/passwd\n")
    # a stamp of the wrong shape
    (incoming / "sums-evil.sha256").write_text("")
    for p in incoming.iterdir():
        age(p, 300)
    r = run([str(OPS / "kurdishtts-offsite-vault.sh")], env)
    assert r.returncode == 0
    assert not any(vault.iterdir())
    assert len(list(incoming.iterdir())) == 4
    assert "does not match its checksum" in r.stderr
    assert "does not name exactly its archive" in r.stderr
    assert "unexpected checksum file" in r.stderr
