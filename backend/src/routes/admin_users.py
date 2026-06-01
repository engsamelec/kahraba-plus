"""Admin user/customer management.

  GET /api/admin/users               list accounts (search by name/email)
  PUT /api/admin/users/<id>/role     promote/demote (customer | admin)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity

from src.models.user import User, db
from src.routes.helpers import admin_required

admin_users_bp = Blueprint("admin_users", __name__)


@admin_users_bp.route("/admin/users", methods=["GET"])
@admin_required
def list_users():
    """List accounts (newest first), optionally filtered by name/email."""
    q = (request.args.get("search") or "").strip().lower()
    query = User.query
    if q:
        like = f"%{q}%"
        query = query.filter(
            db.or_(
                db.func.lower(User.email).like(like),
                db.func.lower(User.first_name).like(like),
                db.func.lower(User.last_name).like(like),
            )
        )
    users = query.order_by(User.created_at.desc()).limit(200).all()
    return jsonify([u.to_dict() for u in users])


@admin_users_bp.route("/admin/users/<int:user_id>/role", methods=["PUT"])
@admin_required
def set_user_role(user_id):
    """Promote/demote a user. An admin cannot demote themselves, so the store
    can never be left without an admin by accident."""
    data = request.get_json(silent=True) or {}
    role = data.get("role")
    if role not in ("customer", "admin"):
        return jsonify({"error": "Invalid role"}), 400
    if int(get_jwt_identity()) == user_id and role != "admin":
        return jsonify({"error": "You cannot remove your own admin access"}), 400
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    user.role = role
    db.session.commit()
    return jsonify(user.to_dict())
