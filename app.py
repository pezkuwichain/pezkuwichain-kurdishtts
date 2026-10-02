"""KurdishTTS — Kurdish speech for everyone, and a voice bank to make it better.

  /            read Kurdish text aloud (Kurmancî / Soranî)
  /bexsh       donate your voice: read sentences, check others' recordings
  /api/tts...  the speech API (see ktts/api.py); dks.news uses it for articles

Run:  uvicorn app:app --host 127.0.0.1 --port 8000   (behind nginx)
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from ktts import api, auth, donate, retention
from ktts import engine as engine_mod
from ktts.engine import Engine
from ktts.jobs import Jobs
from ktts.store import Store

BASE = Path(__file__).resolve().parent
DATA = Path(os.environ.get("KTTS_DATA", "/opt/kurdishtts/data"))


def _asset_version() -> str:
    """A hash of the stylesheet and script, so a deploy is seen at once despite long caching."""
    h = hashlib.sha256()
    for name in ("kt.css", "kt.js"):
        h.update((BASE / "static" / name).read_bytes())
    return h.hexdigest()[:10]


V = _asset_version()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    store = Store(DATA / "kurdishtts.db")
    engine = Engine()
    if os.environ.get("KTTS_WARM", "1") == "1":
        engine.warm()
    jobs = Jobs(DATA / "jobs.db", engine)
    jobs.start()
    retention.start(engine_mod.CACHE_DIR, jobs, store, donate.CLIPS_DIR)
    api.STATE.update(engine=engine, jobs=jobs)
    auth.STATE.update(store=store)
    donate.STATE.update(store=store)
    yield
    engine.close()


app = FastAPI(title="KurdishTTS", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(BASE / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE / "templates"))


@app.middleware("http")
async def no_stale_pages(request: Request, call_next):
    """Pages are never served from a browser's cache: a reader who kept a tab
    open across a deploy saw the old wording. Assets carry a content hash in
    their URL and may be cached; HTML may not."""
    response = await call_next(request)
    if response.headers.get("content-type", "").startswith("text/html"):
        response.headers["Cache-Control"] = "no-cache"
    return response


app.include_router(api.router)
app.include_router(auth.router)
app.include_router(donate.router)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "speak.html", {"v": V, "page": "speak"})


@app.get("/bexsh", response_class=HTMLResponse)
def bexsh(request: Request):
    return templates.TemplateResponse(request, "bexsh.html", {"v": V, "page": "donate", "consent_version": donate.CONSENT_VERSION,
                                       "consent_json": json.dumps(CONSENT, ensure_ascii=False)})


LEGAL = BASE / "legal"
_HEAD_LANG = {"English": "en", "Türkçe": "tr", "Kurmancî": "kmr", "سۆرانی": "ckb", "فارسی": "fa", "العربية": "ar"}


def consent_texts() -> dict:
    """legal/consent.md, per language: title, paragraph, the five boxes, and the
    terms label. Read from the legal text itself, so the page cannot drift
    from what the lawyer wrote."""
    out: dict = {}
    md = (LEGAL / "consent.md").read_text(encoding="utf-8")
    for block in re.split(r"^## ", md, flags=re.M)[1:]:
        head, _, body = block.partition("\n")
        lang = next((v for k, v in _HEAD_LANG.items() if head.startswith(k)), None)
        if not lang:
            continue
        lines = [ln.strip() for ln in body.splitlines() if ln.strip() and ln.strip() != "---"]
        title = next(ln.strip("*") for ln in lines if ln.startswith("**"))
        para = next(ln for ln in lines if not ln.startswith(("**", "- [ ]", "[")))
        boxes = [ln[len("- [ ] "):] for ln in lines if ln.startswith("- [ ]")]
        terms = next(ln.strip("[]") for ln in lines if ln.startswith("[") and ln.endswith("]"))
        out[lang] = {"title": title, "para": para, "boxes": boxes, "terms": terms}
    if any(len(v["boxes"]) != 5 for v in out.values()) or "en" not in out:
        raise RuntimeError("legal/consent.md: every language must have exactly five boxes")
    return out


CONSENT = consent_texts()


def _legal(name: str, lang: str) -> str:
    """The legal text as HTML: the Turkish translation for a Turkish page when
    there is one, else the English, which prevails."""
    import markdown
    src = LEGAL / f"{name}.{lang}.md"
    if not src.exists():
        src = LEGAL / f"{name}.en.md"
    return markdown.markdown(src.read_text(encoding="utf-8"), extensions=["tables"])


@app.get("/terms", response_class=HTMLResponse)
def terms(request: Request, lang: str = "en"):
    return templates.TemplateResponse(request, "legal.html", {"v": V, "page": "legal",
                                      "body": _legal("terms", "tr" if lang == "tr" else "en")})


@app.get("/privacy", response_class=HTMLResponse)
def privacy(request: Request, lang: str = "en"):
    return templates.TemplateResponse(request, "legal.html", {"v": V, "page": "legal",
                                      "body": _legal("privacy", "tr" if lang == "tr" else "en")})


@app.get("/health")
def health():
    return {"ok": True}
