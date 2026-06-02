"""Promotions / sale events (occasions).

Public:
  GET /api/promotions          -> currently-live promotions (banner data)

Admin:
  GET    /api/admin/promotions
  POST   /api/admin/promotions
  PUT    /api/admin/promotions/:id
  DELETE /api/admin/promotions/:id
"""

from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request

from src.models.promo import Promotion
from src.models.user import db
from src.routes.helpers import admin_required

promos_bp = Blueprint("promos", __name__)

_FIELDS = (
    "title", "title_ar", "title_he", "subtitle", "subtitle_ar", "subtitle_he",
    "image_url", "coupon_code", "cta_link",
)


def _parse_dt(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "").split("T")[0])
    except (ValueError, TypeError):
        return None


def _safe_cta(value):
    """A promo CTA must be an in-app relative path — never an absolute URL or a
    javascript:/data: scheme (which would be a click-XSS / open-redirect)."""
    v = (value or "").strip()
    if not v:
        return None
    if v.startswith("/") and not v.startswith("//"):
        return v
    return "/offers"


def _apply(promo, data):
    for f in _FIELDS:
        if f in data:
            setattr(promo, f, (data[f] or None))
    if "cta_link" in data:
        promo.cta_link = _safe_cta(data["cta_link"])
    if "starts_at" in data:
        promo.starts_at = _parse_dt(data["starts_at"])
    if "ends_at" in data:
        promo.ends_at = _parse_dt(data["ends_at"])
    if "is_active" in data:
        promo.is_active = bool(data["is_active"])
    if "sort_order" in data:
        promo.sort_order = int(data["sort_order"] or 0)


@promos_bp.route("/promotions", methods=["GET"])
def list_live():
    promos = Promotion.query.order_by(
        Promotion.sort_order, Promotion.created_at.desc()
    ).all()
    return jsonify([p.to_dict() for p in promos if p.live])


@promos_bp.route("/admin/promotions", methods=["GET"])
@admin_required
def admin_list():
    promos = Promotion.query.order_by(
        Promotion.sort_order, Promotion.created_at.desc()
    ).all()
    return jsonify([p.to_dict() for p in promos])


@promos_bp.route("/admin/promotions", methods=["POST"])
@admin_required
def create():
    data = request.get_json(silent=True) or {}
    if not (data.get("title") or "").strip():
        return jsonify({"error": "Title is required"}), 400
    promo = Promotion()
    _apply(promo, data)
    db.session.add(promo)
    db.session.commit()
    return jsonify(promo.to_dict()), 201


@promos_bp.route("/admin/promotions/<int:promo_id>", methods=["PUT"])
@admin_required
def update(promo_id):
    promo = db.session.get(Promotion, promo_id)
    if not promo:
        return jsonify({"error": "Not found"}), 404
    _apply(promo, request.get_json(silent=True) or {})
    db.session.commit()
    return jsonify(promo.to_dict())


@promos_bp.route("/admin/promotions/<int:promo_id>", methods=["DELETE"])
@admin_required
def delete(promo_id):
    promo = db.session.get(Promotion, promo_id)
    if not promo:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(promo)
    db.session.commit()
    return "", 204
