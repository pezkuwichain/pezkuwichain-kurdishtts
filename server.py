"""
KurdîTV — Kurdish auto-dubbing web service.

Upload audio/video (any language) -> Kurdish-dubbed video (Kurmancî / Soranî).
Jobs run one-at-a-time on a background worker (CPU-only box, avoids OOM).
"""

from __future__ import annotations

import base64
import os
import queue
import shutil
import threading
import time
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

import dub_pipeline
import gemini_video

BASE = Path(__file__).resolve().parent
JOBS_DIR = BASE / "jobs"
JOBS_DIR.mkdir(exist_ok=True)

MAX_BYTES = int(os.environ.get("DUB_MAX_BYTES", 120 * 1024 * 1024))   # 120 MB
MAX_SECONDS = int(os.environ.get("DUB_MAX_SECONDS", 180))             # 3 minutes
ALLOWED_EXT = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v",
               ".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"}

app = FastAPI(title="KurdîTV Dubbing", docs_url=None, redoc_url=None)
app.mount("/static", StaticFiles(directory=str(BASE / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE / "templates"))

# ── Contribution config ────────────────────────────────────────────────────
CONTRIB_DIR = BASE / "contributions"
CONTRIB_DIR.mkdir(exist_ok=True)
HEZ_ADDRESS = "5HTU5xskxgx9HM2X8ssBCNkuQ4XECQXpfn85VkQEY6AE9YbT"
APPS_URL = "https://app.pezkuwichain.io"

# Short Kurmancî sentences for voice contributors to read aloud.
KURDISH_SENTENCES = [
    "Silav, ez bi kêfxweşî beşdarî vê projeyê dibim.",
    "Ziman nasnameya me ye, em ê wê biparêzin û geş bikin.",
    "Newroz tê, agir vêdikeve, hêvî ji nû ve şîn dibe.",
    "Em hemû bi hev re ne, dengê me dengê azadiyê ye.",
    "Av jiyan e, ax welat e, û ziman dilê me ye.",
    "Roj hiltê û cîhan ronî dibe, em jî bi hev re hêzdar in.",
]

# ── In-memory job registry + single worker ────────────────────────────────
_jobs: dict[str, dict] = {}
_lock = threading.Lock()
_q: "queue.Queue[str]" = queue.Queue()


def _set(job_id: str, **kw):
    with _lock:
        _jobs.setdefault(job_id, {}).update(kw)


def _get(job_id: str) -> dict | None:
    with _lock:
        j = _jobs.get(job_id)
        return dict(j) if j else None


def _worker():
    while True:
        job_id = _q.get()
        job = _get(job_id)
        if not job:
            _q.task_done()
            continue
        try:
            _set(job_id, status="processing", progress=2, message="Starting…")

            def progress(msg: str, pct: int):
                _set(job_id, message=msg, progress=pct)

            result = dub_pipeline.dub(
                job["input"], job["dialect"], str(JOBS_DIR / job_id), progress
            )
            _set(
                job_id,
                status="done",
                progress=100,
                message="Done.",
                output=result["output"],
                language=result["language"],
                segments=result["segments"],
                is_video=result["is_video"],
            )
        except Exception as e:  # surface a readable error to the UI
            _set(job_id, status="error", message=str(e)[:300])
        finally:
            _q.task_done()


threading.Thread(target=_worker, daemon=True).start()


# ── Video generation (Gemini Veo) worker ───────────────────────────────────
_vjobs: dict[str, dict] = {}
_vlock = threading.Lock()
_vq: "queue.Queue[str]" = queue.Queue()


def _vset(jid: str, **kw):
    with _vlock:
        _vjobs.setdefault(jid, {}).update(kw)


def _vget(jid: str) -> dict | None:
    with _vlock:
        j = _vjobs.get(jid)
        return dict(j) if j else None


def _video_worker():
    while True:
        jid = _vq.get()
        job = _vget(jid)
        if not job:
            _vq.task_done()
            continue
        try:
            _vset(jid, status="processing", progress=8, message="Sending to Veo…")
            op = gemini_video.start_video(
                job["image_b64"], job["mime"], job["prompt"], job["aspect"]
            )
            _vset(jid, status="processing", progress=20, message="Generating video…")
            uri, waited = None, 0
            while True:
                time.sleep(10)
                waited += 10
                res = gemini_video.poll_video(op)
                if res.get("done"):
                    if res.get("error"):
                        raise RuntimeError(res["error"])
                    uri = res["uri"]
                    break
                pct = min(85, 20 + waited // 4)
                _vset(jid, progress=pct, message="Generating video…")
                if waited > 600:  # 10 min safety cap
                    raise RuntimeError("Generation timed out.")
            _vset(jid, progress=90, message="Downloading…")
            out = JOBS_DIR / f"vid_{jid}.mp4"
            gemini_video.download_video(uri, str(out))
            _vset(jid, status="done", progress=100, message="Done.", output=str(out))
        except Exception as e:
            _vset(jid, status="error", message=str(e)[:300])
        finally:
            # free the base64 image from memory
            _vset(jid, image_b64="")
            _vq.task_done()


threading.Thread(target=_video_worker, daemon=True).start()


# ── Routes ─────────────────────────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html",
        {"max_mb": MAX_BYTES // (1024 * 1024), "max_sec": MAX_SECONDS},
    )


@app.get("/health")
async def health():
    return {"ok": True, "queued": _q.qsize()}


@app.get("/contribute", response_class=HTMLResponse)
async def contribute_page(request: Request):
    return templates.TemplateResponse(
        request, "contribute.html",
        {"sentences": KURDISH_SENTENCES, "hez": HEZ_ADDRESS, "apps_url": APPS_URL},
    )


@app.get("/create", response_class=HTMLResponse)
async def create_page(request: Request):
    return templates.TemplateResponse(
        request, "create.html", {"apps_url": APPS_URL},
    )


@app.post("/api/contribute/voice")
async def contribute_voice(
    file: UploadFile = File(...),
    sentence: str = Form(""),
    name: str = Form(""),
):
    ext = Path(file.filename or "").suffix.lower() or ".webm"
    if ext not in {".webm", ".wav", ".mp3", ".m4a", ".ogg", ".aac"}:
        raise HTTPException(400, "Unsupported audio type.")
    vid = uuid.uuid4().hex[:12]
    out = CONTRIB_DIR / f"{vid}{ext}"
    size = 0
    with open(out, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > 25 * 1024 * 1024:
                f.close()
                out.unlink(missing_ok=True)
                raise HTTPException(413, "Recording too large (max 25 MB).")
            f.write(chunk)
    def safe(s: str) -> str:
        return (s or "").replace("\n", " ").replace(",", " ")[:200]

    with open(CONTRIB_DIR / "voices.csv", "a", encoding="utf-8") as meta:
        meta.write(f"{vid}{ext},{time.time():.0f},{safe(name)},{safe(sentence)}\n")
    return {"ok": True, "id": vid}


@app.post("/api/create/video")
async def create_video(
    prompt: str = Form(...),
    aspect: str = Form("16:9"),
    file: UploadFile | None = File(None),
):
    prompt = (prompt or "").strip()
    if len(prompt) < 3:
        raise HTTPException(400, "Please write a prompt describing the video.")
    if aspect not in {"16:9", "9:16"}:
        aspect = "16:9"
    image_b64, mime = "", "image/png"
    if file is not None and file.filename:
        ext = Path(file.filename).suffix.lower()
        if ext not in {".png", ".jpg", ".jpeg", ".webp"}:
            raise HTTPException(400, "Image must be PNG, JPG or WEBP.")
        data = await file.read()
        if len(data) > 12 * 1024 * 1024:
            raise HTTPException(413, "Image too large (max 12 MB).")
        image_b64 = base64.b64encode(data).decode()
        mime = "image/jpeg" if ext in {".jpg", ".jpeg"} else f"image/{ext.lstrip('.')}"

    jid = uuid.uuid4().hex[:12]
    _vset(
        jid, status="queued", progress=0, message="Queued…",
        prompt=prompt[:1000], aspect=aspect, image_b64=image_b64, mime=mime,
        created=time.time(),
    )
    _vq.put(jid)
    return {"job_id": jid, "position": _vq.qsize()}


@app.get("/api/create/job/{jid}")
async def create_status(jid: str):
    j = _vget(jid)
    if not j:
        raise HTTPException(404, "Job not found.")
    return JSONResponse({
        "status": j.get("status"),
        "progress": j.get("progress", 0),
        "message": j.get("message", ""),
    })


@app.get("/api/create/result/{jid}")
async def create_result(jid: str):
    j = _vget(jid)
    if not j or j.get("status") != "done" or not j.get("output"):
        raise HTTPException(404, "Result not ready.")
    return FileResponse(j["output"], media_type="video/mp4", filename="kurditv-video.mp4")


@app.post("/api/dub")
async def create_job(
    file: UploadFile = File(...),
    dialect: str = Form("kmr"),
):
    if dialect not in dub_pipeline.MMS_MODELS:
        raise HTTPException(400, "Invalid dialect (use 'kmr' or 'ckb').")
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Unsupported file type: {ext or '?'}")

    job_id = uuid.uuid4().hex[:12]
    jdir = JOBS_DIR / job_id
    jdir.mkdir(parents=True, exist_ok=True)
    in_path = jdir / f"input{ext}"

    size = 0
    with open(in_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_BYTES:
                f.close()
                shutil.rmtree(jdir, ignore_errors=True)
                raise HTTPException(413, f"File too large (max {MAX_BYTES // (1024*1024)} MB).")
            f.write(chunk)

    dur = dub_pipeline._probe_duration(str(in_path))
    if dur > MAX_SECONDS + 1:
        shutil.rmtree(jdir, ignore_errors=True)
        raise HTTPException(
            400, f"Too long ({int(dur)}s). Max {MAX_SECONDS}s for now."
        )

    _set(
        job_id,
        status="queued",
        progress=0,
        message="Queued…",
        input=str(in_path),
        dialect=dialect,
        created=time.time(),
        duration=dur,
    )
    _q.put(job_id)
    return {"job_id": job_id, "position": _q.qsize()}


@app.get("/api/job/{job_id}")
async def job_status(job_id: str):
    j = _get(job_id)
    if not j:
        raise HTTPException(404, "Job not found.")
    return JSONResponse({
        "status": j.get("status"),
        "progress": j.get("progress", 0),
        "message": j.get("message", ""),
        "language": j.get("language"),
        "is_video": j.get("is_video"),
        "segments": j.get("segments") if j.get("status") == "done" else None,
    })


@app.get("/api/result/{job_id}")
async def result(job_id: str):
    j = _get(job_id)
    if not j or j.get("status") != "done" or not j.get("output"):
        raise HTTPException(404, "Result not ready.")
    out = j["output"]
    fname = "kurdish-dub" + Path(out).suffix
    media = "video/mp4" if j.get("is_video") else "audio/mp4"
    return FileResponse(out, media_type=media, filename=fname)
