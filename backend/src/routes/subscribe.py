"""Newsletter subscriptions.

  POST /api/subscribe            {email}     public
  GET  /api/admin/subscribers               admin: list signups
"""

import re

from flask import Blueprint, jsonify, request

from src.models.subscriber import Subscriber
from src.models.user import db
from src.routes.helpers import admin_required

subscribe_bp = Blueprint("subscribe", __name__)

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@subscribe_bp.route("/subscribe", methods=["POST"])
def subscribe():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    if not _EMAIL_RE.match(email):
        return jsonify({"error": "invalid_email"}), 400
    # Idempotent: re-subscribing the same email is a no-op success.
    if not Subscriber.query.filter_by(email=email).first():
        db.session.add(Subscriber(email=email))
        db.session.commit()
    return jsonify({"ok": True}), 201


@subscribe_bp.route("/admin/subscribers", methods=["GET"])
@admin_required
def list_subscribers():
    subs = Subscriber.query.order_by(Subscriber.created_at.desc()).all()
    return jsonify([s.to_dict() for s in subs])
