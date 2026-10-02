"""KurdishTTS — Kurdish speech for everyone, and a voice bank to make it better.

  /            read Kurdish text aloud (Kurmancî / Soranî)
  /bexsh       donate your voice: read sentences, check others' recordings
  /api/tts...  the speech API (see ktts/api.py); dks.news uses it for articles

Run:  uvicorn app:app --host 127.0.0.1 --port 8000   (behind nginx)
"""
from __future__ import annotations

import hashlib
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from ktts import api, auth, donate
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
    api.STATE.update(engine=engine, jobs=jobs)
    auth.STATE.update(store=store)
    donate.STATE.update(store=store)
    yield
    engine.close()


app = FastAPI(title="KurdishTTS", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
app.mount("/static", StaticFiles(directory=str(BASE / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE / "templates"))
app.include_router(api.router)
app.include_router(auth.router)
app.include_router(donate.router)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(request, "speak.html", {"v": V, "page": "speak"})


@app.get("/bexsh", response_class=HTMLResponse)
def bexsh(request: Request):
    return templates.TemplateResponse(request, "bexsh.html", {"v": V, "page": "donate", "consent_version": donate.CONSENT_VERSION})


@app.get("/health")
def health():
    return {"ok": True}
