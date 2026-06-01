from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
)

from src.models.user import Address, User, db

auth_bp = Blueprint("auth", __name__)


def _validate_email(email):
    return isinstance(email, str) and "@" in email and "." in email.split("@")[-1]


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not _validate_email(email):
        return jsonify({"error": "Invalid email address"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        email=email,
        first_name=(data.get("first_name") or "").strip(),
        last_name=(data.get("last_name") or "").strip(),
        phone=(data.get("phone") or "").strip() or None,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict()}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.get_json(silent=True) or {}
    user.first_name = data.get("first_name", user.first_name)
    user.last_name = data.get("last_name", user.last_name)
    user.phone = data.get("phone", user.phone)
    db.session.commit()
    return jsonify({"user": user.to_dict()})


@auth_bp.route("/me/addresses", methods=["GET"])
@jwt_required()
def list_addresses():
    user = db.session.get(User, int(get_jwt_identity()))
    return jsonify([a.to_dict() for a in user.addresses])


@auth_bp.route("/me/addresses", methods=["POST"])
@jwt_required()
def add_address():
    user = db.session.get(User, int(get_jwt_identity()))
    data = request.get_json(silent=True) or {}
    required = ["full_name", "address_line1", "city", "country"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    make_default = bool(data.get("is_default"))
    # First address is default automatically.
    if not user.addresses:
        make_default = True
    if make_default:
        Address.query.filter_by(user_id=user.id).update(
            {Address.is_default: False}, synchronize_session=False
        )

    address = Address(
        user_id=user.id,
        full_name=data["full_name"],
        phone=data.get("phone"),
        address_line1=data["address_line1"],
        address_line2=data.get("address_line2"),
        city=data["city"],
        state=data.get("state"),
        postal_code=data.get("postal_code"),
        country=data["country"],
        is_default=make_default,
    )
    db.session.add(address)
    db.session.commit()
    return jsonify(address.to_dict()), 201


@auth_bp.route("/me/addresses/<int:address_id>", methods=["DELETE"])
@jwt_required()
def delete_address(address_id):
    user_id = int(get_jwt_identity())
    # IDOR-safe: an address is only deletable by its owner.
    address = Address.query.filter_by(id=address_id, user_id=user_id).first()
    if not address:
        return jsonify({"error": "Address not found"}), 404
    was_default = address.is_default
    db.session.delete(address)
    db.session.flush()
    # If we removed the default, promote the most recent remaining address.
    if was_default:
        nxt = (
            Address.query.filter_by(user_id=user_id)
            .order_by(Address.created_at.desc())
            .first()
        )
        if nxt:
            nxt.is_default = True
    db.session.commit()
    return "", 204
