"""Back-in-stock notification requests.

Public:
  POST /api/products/:id/notify-stock   {email}

Admin:
  GET  /api/admin/stock-notifications    -> grouped counts + recent requests
"""

from __future__ import annotations

import re

from flask import Blueprint, jsonify, request

from src.models.catalog import Product
from src.models.notify import StockNotification
from src.models.user import db
from src.routes.helpers import admin_required

notify_bp = Blueprint("notify", __name__)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@notify_bp.route("/products/<int:product_id>/notify-stock", methods=["POST"])
def request_notify(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if not EMAIL_RE.match(email):
        return jsonify({"error": "invalid_email"}), 400

    existing = StockNotification.query.filter_by(
        product_id=product_id, email=email
    ).first()
    if existing:
        return jsonify({"ok": True, "already": True})

    db.session.add(StockNotification(product_id=product_id, email=email))
    db.session.commit()
    return jsonify({"ok": True}), 201


@notify_bp.route("/admin/stock-notifications", methods=["GET"])
@admin_required
def list_notifications():
    from sqlalchemy import func

    # Pending demand grouped by product (only unnotified).
    rows = (
        db.session.query(
            StockNotification.product_id, func.count(StockNotification.id)
        )
        .filter(StockNotification.notified.is_(False))
        .group_by(StockNotification.product_id)
        .all()
    )
    out = []
    for product_id, cnt in rows:
        product = db.session.get(Product, product_id)
        if not product:
            continue
        out.append(
            {
                "product_id": product_id,
                "product_name": product.name,
                "slug": product.slug,
                "in_stock": product.in_stock,
                "requests": int(cnt),
            }
        )
    out.sort(key=lambda r: r["requests"], reverse=True)
    return jsonify(out)


@notify_bp.route(
    "/admin/stock-notifications/<int:product_id>/dismiss", methods=["POST"]
)
@admin_required
def dismiss_notifications(product_id):
    """Mark all pending restock requests for a product as handled, so the
    admin can clear them once customers have been notified (otherwise the
    pending-restock badge would never decrease)."""
    updated = (
        StockNotification.query.filter_by(product_id=product_id, notified=False)
        .update({StockNotification.notified: True}, synchronize_session=False)
    )
    db.session.commit()
    return jsonify({"dismissed": int(updated)})
