from functools import wraps

from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from src.models.user import User, db


def is_admin_request():
    """True if the current request carries a valid token for an admin user.

    Never raises — used to conditionally enrich otherwise-public responses
    (e.g. include confidential `cost`) without forcing authentication.
    """
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        if not identity:
            return False
        user = db.session.get(User, int(identity))
        return bool(user and user.is_admin)
    except Exception:
        return False


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = db.session.get(User, int(get_jwt_identity()))
        if not user or not user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)

    return wrapper
