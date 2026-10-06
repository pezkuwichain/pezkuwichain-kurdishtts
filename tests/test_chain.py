"""The wallet bundle names Asset Hub by a genesis hash written into the source.

It used to read it from the node -- an RPC connection and 479 kB of metadata
before the sign-in QR code could appear. A genesis hash never changes, so it
is a constant now; this checks the constant against the live node, and that
the committed bundle carries it (the bundle is built from web/chain/src).
"""
from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
SRC = (ROOT / "web" / "chain" / "src" / "web.js").read_text(encoding="utf-8")
GENESIS = re.search(r"const AH_GENESIS = '(0x[0-9a-f]{64})'", SRC).group(1)


def test_the_bundle_carries_the_constant():
    assert GENESIS in (ROOT / "static" / "kt-chain.js").read_text(encoding="utf-8")


def test_the_constant_is_asset_hubs_genesis():
    body = json.dumps({"id": 1, "jsonrpc": "2.0", "method": "chain_getBlockHash", "params": [0]}).encode()
    req = urllib.request.Request("https://asset-hub-rpc.pezkuwichain.io", data=body,
                                 headers={"Content-Type": "application/json"})
    try:
        live = json.loads(urllib.request.urlopen(req, timeout=15).read())["result"]
    except OSError as e:                      # no network here: the check belongs to CI
        pytest.skip(f"node unreachable: {e}")
    assert live == GENESIS
