"""Product image uploads.

Accepts one or more images (multipart files or base64 data URLs), stores them
under static uploads, and returns their public URLs together with the
perceptual hash of each — so callers can persist both the URL (for display)
and the hash (for visual search) in one step.

Stored locally here; a production deployment would push to object storage
(S3/R2) and keep the same response shape.
"""

from __future__ import annotations

import base64
import hashlib
import os
import time

from flask import Blueprint, current_app, jsonify, request, send_from_directory

from src.lib.imagehash import hash_from_bytes
from src.routes.helpers import admin_required

uploads_bp = Blueprint("uploads", __name__)

ALLOWED = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}
MAX_BYTES = 8 * 1024 * 1024  # 8 MB per image


def _uploads_dir() -> str:
    # frontend/dist/uploads so Flask's existing static serving can reach it,
    # and a separate backend copy isn't needed.
    base = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
    path = os.path.abspath(base)
    os.makedirs(path, exist_ok=True)
    return path


def _store(data: bytes, ext: str) -> str:
    digest = hashlib.sha1(data).hexdigest()[:16]
    fname = f"{int(time.time())}_{digest}.{ext}"
    with open(os.path.join(_uploads_dir(), fname), "wb") as f:
        f.write(data)
    return f"/api/uploads/{fname}"


def _decode_data_url(raw: str):
    """Return (bytes, ext) from a data URL, or (None, None)."""
    if not raw.startswith("data:") or "," not in raw:
        return None, None
    header, b64 = raw.split(",", 1)
    mime = header[5:].split(";", 1)[0]
    ext = ALLOWED.get(mime)
    if not ext:
        return None, None
    try:
        return base64.b64decode(b64), ext
    except Exception:
        return None, None


@uploads_bp.route("/uploads/<path:filename>", methods=["GET"])
def serve_upload(filename):
    resp = send_from_directory(_uploads_dir(), filename)
    resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    return resp


@uploads_bp.route("/uploads", methods=["POST"])
@admin_required
def upload_images():
    items = []  # list of (bytes, ext)

    # multipart files (field name "images" or "image")
    for key in ("images", "image"):
        for f in request.files.getlist(key):
            blob = f.read()
            mime = f.mimetype
            ext = ALLOWED.get(mime)
            if ext and 0 < len(blob) <= MAX_BYTES:
                items.append((blob, ext))

    # base64 data URLs in JSON {images: [dataURL, ...]}
    body = request.get_json(silent=True) or {}
    raw_list = body.get("images") or ([body["image"]] if body.get("image") else [])
    for raw in raw_list:
        if isinstance(raw, str):
            blob, ext = _decode_data_url(raw)
            if blob and len(blob) <= MAX_BYTES:
                items.append((blob, ext))

    if not items:
        return jsonify({"error": "No valid images provided"}), 400

    results = []
    for blob, ext in items:
        url = _store(blob, ext)
        h = hash_from_bytes(blob)
        results.append({"url": url, "hash": h})

    return jsonify({"uploaded": results})
