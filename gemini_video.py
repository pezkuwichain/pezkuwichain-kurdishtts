"""
Gemini Veo image-to-video helper.

Wraps the Generative Language API long-running `predictLongRunning` flow:
start a generation, poll the operation, download the resulting MP4.

The API key is read from the GEMINI_API_KEY environment variable (set in the
systemd unit on the server — never committed to the repo).
"""

from __future__ import annotations

import os

import requests

API_ROOT = "https://generativelanguage.googleapis.com/v1beta"
# Veo image-to-video model. Override with GEMINI_VIDEO_MODEL if needed.
MODEL = os.environ.get("GEMINI_VIDEO_MODEL", "veo-3.0-generate-001")
TIMEOUT = 60


def _key() -> str:
    k = os.environ.get("GEMINI_API_KEY", "").strip()
    if not k:
        raise RuntimeError("GEMINI_API_KEY is not configured on the server.")
    return k


def _headers() -> dict:
    return {"x-goog-api-key": _key(), "Content-Type": "application/json"}


def start_video(image_b64: str, mime: str, prompt: str, aspect: str = "16:9") -> str:
    """Kick off a Veo generation. Returns the long-running operation name."""
    instance: dict = {"prompt": prompt}
    if image_b64:
        instance["image"] = {"bytesBase64Encoded": image_b64, "mimeType": mime}
    body = {
        "instances": [instance],
        "parameters": {"aspectRatio": aspect, "sampleCount": 1},
    }
    url = f"{API_ROOT}/models/{MODEL}:predictLongRunning"
    r = requests.post(url, headers=_headers(), json=body, timeout=TIMEOUT)
    if r.status_code >= 400:
        raise RuntimeError(_err(r))
    name = r.json().get("name")
    if not name:
        raise RuntimeError("Gemini did not return an operation name.")
    return name


def poll_video(operation: str) -> dict:
    """Check an operation. Returns {done, uri?, error?}."""
    url = f"{API_ROOT}/{operation}"
    r = requests.get(url, headers=_headers(), timeout=TIMEOUT)
    if r.status_code >= 400:
        raise RuntimeError(_err(r))
    data = r.json()
    if not data.get("done"):
        return {"done": False}
    if "error" in data:
        msg = data["error"].get("message", "Generation failed.")
        return {"done": True, "error": msg}
    # Dig out the video URI across the known response shapes.
    resp = data.get("response", {})
    samples = (
        resp.get("generateVideoResponse", {}).get("generatedSamples")
        or resp.get("generatedSamples")
        or resp.get("videos")
        or []
    )
    uri = None
    if samples:
        s = samples[0]
        uri = (s.get("video") or {}).get("uri") or s.get("uri") or s.get("gcsUri")
    if not uri:
        return {"done": True, "error": "No video URI in response."}
    return {"done": True, "uri": uri}


def download_video(uri: str, out_path: str) -> str:
    """Download a finished video to out_path. Appends the API key if needed."""
    headers = {"x-goog-api-key": _key()}
    r = requests.get(uri, headers=headers, timeout=300, stream=True)
    if r.status_code >= 400:
        raise RuntimeError(_err(r))
    with open(out_path, "wb") as f:
        for chunk in r.iter_content(1024 * 256):
            if chunk:
                f.write(chunk)
    return out_path


def _err(r: requests.Response) -> str:
    try:
        j = r.json()
        return f"Gemini API {r.status_code}: {j.get('error', {}).get('message', r.text[:200])}"
    except Exception:
        return f"Gemini API {r.status_code}: {r.text[:200]}"
