"""Discount coupon endpoints.

Public:
  POST /api/coupons/validate   {code, subtotal}  -> discount preview

Admin:
  GET    /api/admin/coupons
  POST   /api/admin/coupons
  PUT    /api/admin/coupons/:id
  DELETE /api/admin/coupons/:id
"""

from __future__ import annotations

from datetime import datetime

from flask import Blueprint, jsonify, request

from src.models.coupon import Coupon
from src.models.user import db
from src.routes.helpers import admin_required

coupons_bp = Blueprint("coupons", __name__)


def _parse_expiry(value):
    if not value:
        return None
    try:
        # Accept "YYYY-MM-DD" or full ISO.
        return datetime.fromisoformat(str(value).replace("Z", "").split("T")[0])
    except (ValueError, TypeError):
        return None


@coupons_bp.route("/coupons/validate", methods=["POST"])
def validate_coupon():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip()
    subtotal = float(data.get("subtotal") or 0)
    if not code:
        return jsonify({"valid": False, "reason": "empty"}), 400

    coupon = Coupon.query.filter(
        db.func.lower(Coupon.code) == code.lower()
    ).first()
    if not coupon:
        return jsonify({"valid": False, "reason": "invalid"})

    reason = coupon.status()
    if reason:
        return jsonify({"valid": False, "reason": reason})

    if subtotal < (coupon.min_subtotal or 0):
        return jsonify(
            {
                "valid": False,
                "reason": "min_subtotal",
                "min_subtotal": coupon.min_subtotal,
            }
        )

    discount = coupon.discount_for(subtotal)
    return jsonify(
        {
            "valid": True,
            "code": coupon.code,
            "discount": discount,
            "discount_type": coupon.discount_type,
            "value": coupon.value,
        }
    )


# ---------------- Admin ----------------
@coupons_bp.route("/admin/coupons", methods=["GET"])
@admin_required
def list_coupons():
    coupons = Coupon.query.order_by(Coupon.created_at.desc()).all()
    return jsonify([c.to_dict() for c in coupons])


@coupons_bp.route("/admin/coupons", methods=["POST"])
@admin_required
def create_coupon():
    data = request.get_json(silent=True) or {}
    code = (data.get("code") or "").strip().upper()
    if not code:
        return jsonify({"error": "Code is required"}), 400
    if Coupon.query.filter(db.func.lower(Coupon.code) == code.lower()).first():
        return jsonify({"error": "Code already exists"}), 400

    dtype = data.get("discount_type", "percent")
    if dtype not in ("percent", "fixed"):
        dtype = "percent"

    value = max(0.0, float(data.get("value") or 0))
    # A percentage discount can't exceed 100%.
    if dtype == "percent":
        value = min(value, 100.0)
    coupon = Coupon(
        code=code,
        discount_type=dtype,
        value=value,
        min_subtotal=max(0.0, float(data.get("min_subtotal") or 0)),
        max_uses=max(1, int(data["max_uses"])) if data.get("max_uses") else None,
        expires_at=_parse_expiry(data.get("expires_at")),
        is_active=bool(data.get("is_active", True)),
    )
    db.session.add(coupon)
    db.session.commit()
    return jsonify(coupon.to_dict()), 201


@coupons_bp.route("/admin/coupons/<int:coupon_id>", methods=["PUT"])
@admin_required
def update_coupon(coupon_id):
    coupon = db.session.get(Coupon, coupon_id)
    if not coupon:
        return jsonify({"error": "Coupon not found"}), 404
    data = request.get_json(silent=True) or {}
    if "discount_type" in data and data["discount_type"] in ("percent", "fixed"):
        coupon.discount_type = data["discount_type"]
    if "value" in data:
        coupon.value = max(0.0, float(data["value"] or 0))
    if "min_subtotal" in data:
        coupon.min_subtotal = max(0.0, float(data["min_subtotal"] or 0))
    if "max_uses" in data:
        coupon.max_uses = max(1, int(data["max_uses"])) if data["max_uses"] else None
    # Re-clamp unconditionally so flipping the type (without resending value)
    # can never leave a percent coupon above 100%.
    if coupon.discount_type == "percent":
        coupon.value = min(max(0.0, coupon.value), 100.0)
    if "expires_at" in data:
        coupon.expires_at = _parse_expiry(data["expires_at"])
    if "is_active" in data:
        coupon.is_active = bool(data["is_active"])
    db.session.commit()
    return jsonify(coupon.to_dict())


@coupons_bp.route("/admin/coupons/<int:coupon_id>", methods=["DELETE"])
@admin_required
def delete_coupon(coupon_id):
    coupon = db.session.get(Coupon, coupon_id)
    if not coupon:
        return jsonify({"error": "Coupon not found"}), 404
    db.session.delete(coupon)
    db.session.commit()
    return "", 204
