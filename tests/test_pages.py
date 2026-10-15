"""The pages and their words.

Every word a visitor sees comes from T in static/kt.js, by a data-t key in a
template. A key that is missing, or missing a language, shows an empty space
on the page and nothing fails. This holds them together: every key a template
uses exists, in all six languages, and every page answers.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LANGS = {"kmr", "ckb", "tr", "en", "fa", "ar"}
# Samples are read in their own script whatever the interface language.
ONE_LANGUAGE = {"sampleKmr", "sampleCkb"}


def strings() -> dict:
    src = (ROOT / "static" / "kt.js").read_text(encoding="utf-8")
    start = src.index("var T = {")
    end = src.index("\n  };\n", start) + 4
    js = src[start:end] + "\nprocess.stdout.write(JSON.stringify(T));"
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def test_every_key_a_page_uses_exists_in_six_languages():
    T = strings()
    used: dict[str, set] = {}
    for tpl in (ROOT / "templates").glob("*.html"):
        for key in re.findall(r'data-t(?:-aria)?="([A-Za-z0-9]+)"', tpl.read_text(encoding="utf-8")):
            used.setdefault(key, set()).add(tpl.name)
    missing = {k: sorted(v) for k, v in used.items() if k not in T}
    assert not missing, f"keys used by templates but not in T: {missing}"
    partial = {k: sorted(LANGS - set(T[k])) for k in used if k not in ONE_LANGUAGE and LANGS - set(T[k])}
    assert not partial, f"keys missing a language: {partial}"
    empty = [k for k in used for lang in T[k] if not str(T[k][lang]).strip()]
    assert not empty, f"keys with an empty translation: {empty}"


def test_the_brand_is_written_with_a_small_i():
    # "KurdAI" with a capital I reads as "KurdAl" to a Turkish reader.
    hits = []
    for p in list((ROOT / "templates").glob("*.html")) + [ROOT / "static" / "kt.js"] + list((ROOT / "legal").glob("*.md")):
        for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
            if "KurdAI" in line or "KurdishTTS" in line:
                hits.append(f"{p.name}:{n}")
    assert not hits, hits


def test_every_page_answers():
    os.environ.setdefault("KTTS_DATA", tempfile.mkdtemp(prefix="ktts-pages-"))
    sys.path.insert(0, str(ROOT))
    from fastapi.testclient import TestClient

    import app as site
    c = TestClient(site.app)                     # no lifespan: pages need no engine
    for path in ("/", "/bexsh", "/kurdai", "/developers", "/about", "/faq", "/terms", "/privacy", "/terms?lang=tr"):
        r = c.get(path)
        assert r.status_code == 200, path
        assert 'style="' not in r.text, f"{path}: the CSP allows no inline style"
    legal = c.get("/terms").text + c.get("/privacy").text
    assert "(draft)" not in legal and "[date of publication]" not in legal
