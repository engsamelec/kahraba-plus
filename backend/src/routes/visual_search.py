"""Visual product search: match a customer-supplied photo to catalog products.

The customer can upload a photo — even blurry, cropped, or a screenshot from a
video — and we return the closest matching products using perceptual (dHash)
image hashing. Robust and fully offline (Pillow only, no ML/network).

Endpoints
  POST /api/visual-search        multipart `image` file OR JSON {image: dataURL}
  POST /api/admin/reindex-images (admin) recompute hashes for all products
"""

from __future__ import annotations

import base64

from flask import Blueprint, jsonify, request

from src.lib.imagehash import HASH_SIZE, hamming, hash_from_bytes
from src.models.catalog import Product
from src.models.user import db
from src.routes.helpers import admin_required

visual_bp = Blueprint("visual", __name__)

# Max Hamming distance (out of 64 bits) to treat as a candidate match. ~16
# tolerates heavy blur / recompression while still rejecting unrelated images.
MATCH_THRESHOLD = 16
MAX_RESULTS = 8
# This endpoint is public, so bound the input it will decode.
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB


def _read_image_bytes():
    """Pull raw image bytes from a multipart upload or a base64 data URL."""
    if "image" in request.files:
        return request.files["image"].read(MAX_UPLOAD_BYTES + 1)
    data = request.get_json(silent=True) or {}
    raw = data.get("image")
    if isinstance(raw, str) and raw:
        if "," in raw and raw.strip().startswith("data:"):
            raw = raw.split(",", 1)[1]
        try:
            return base64.b64decode(raw)
        except Exception:
            return None
    return None


@visual_bp.route("/visual-search", methods=["POST"])
def visual_search():
    img_bytes = _read_image_bytes()
    if not img_bytes:
        return jsonify({"error": "No image provided"}), 400
    if len(img_bytes) > MAX_UPLOAD_BYTES:
        return jsonify({"error": "Image too large"}), 413

    query_hash = hash_from_bytes(img_bytes)
    if query_hash is None:
        return jsonify({"error": "Could not read image"}), 400

    # Compare against every active product's stored image hashes, keeping the
    # best (smallest) distance per product.
    results = []
    products = Product.query.filter_by(is_active=True).all()
    for p in products:
        hashes = p.image_hashes
        if not hashes:
            continue
        best = min(hamming(query_hash, int(h)) for h in hashes)
        if best <= MATCH_THRESHOLD:
            results.append((best, p))

    results.sort(key=lambda r: r[0])
    top = results[:MAX_RESULTS]
    bits = HASH_SIZE * HASH_SIZE

    return jsonify(
        {
            "count": len(top),
            "results": [
                {
                    **p.to_dict(),
                    "match_distance": dist,
                    "match_score": round(1 - dist / bits, 3),
                }
                for dist, p in top
            ],
        }
    )


@visual_bp.route("/admin/reindex-images", methods=["POST"])
@admin_required
def reindex_images():
    """Recompute perceptual hashes for all product images.

    Reads each image; in this offline environment external URLs may be
    unreachable, so it gracefully skips images it cannot fetch and reports how
    many were indexed. (In production, run after bulk imports.)
    """
    import urllib.request

    updated = 0
    skipped = 0
    for p in Product.query.all():
        hashes = []
        for url in p.image_urls:
            data = _fetch(url, urllib)
            if not data:
                skipped += 1
                continue
            h = hash_from_bytes(data)
            if h is not None:
                hashes.append(h)
        if hashes:
            p.image_hashes = hashes
            updated += 1
    db.session.commit()
    return jsonify({"products_indexed": updated, "images_skipped": skipped})


def _fetch(url: str, urllib, timeout: int = 6):
    try:
        if url.startswith("data:") and "," in url:
            return base64.b64decode(url.split(",", 1)[1])
        req = urllib.request.Request(url, headers={"User-Agent": "kahraba-plus"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception:
        return None
