"""Make or revoke an API key for the long-text job API.

  python tools/apikey.py add dks-news      # prints the key ONCE; stores only its hash
  python tools/apikey.py revoke dks-news

Keys file: KTTS_KEYS (default /opt/kurdishtts/data/api_keys), lines "<name> <sha256>".
"""
from __future__ import annotations

import hashlib
import os
import re
import secrets
import sys
from pathlib import Path

KEYS = Path(os.environ.get("KTTS_KEYS", "/opt/kurdishtts/data/api_keys"))


def main(cmd: str, name: str) -> None:
    if not re.fullmatch(r"[a-z0-9-]{2,40}", name):
        sys.exit("name: lowercase letters, digits and dashes")
    lines = [ln for ln in (KEYS.read_text().splitlines() if KEYS.exists() else []) if ln.split()[:1] != [name]]
    if cmd == "add":
        key = "ktts_" + secrets.token_urlsafe(32)
        lines.append(f"{name} {hashlib.sha256(key.encode()).hexdigest()}")
        print(key)
    elif cmd != "revoke":
        sys.exit("add | revoke")
    KEYS.parent.mkdir(parents=True, exist_ok=True)
    tmp = KEYS.with_suffix(".tmp")
    tmp.write_text("\n".join(lines) + ("\n" if lines else ""))
    os.chmod(tmp, 0o640)
    os.replace(tmp, KEYS)


if __name__ == "__main__":
    main(*sys.argv[1:3])
