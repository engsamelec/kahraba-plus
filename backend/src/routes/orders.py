import random
import string
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required, verify_jwt_in_request

from src.models.catalog import Product
from src.models.order import Order, OrderItem
from src.models.user import User, db
from src.routes.helpers import admin_required

orders_bp = Blueprint("orders", __name__)

# Simple shipping table by destination scope (USD)
SHIPPING_RATES = {
    "domestic": 3.0,
    "international": 25.0,
}
FREE_SHIPPING_THRESHOLD = 100.0
TAX_RATE = 0.0  # configurable VAT rate
HOME_COUNTRY = "Syria"


def _generate_order_number():
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=5))
    return f"KP-{stamp}-{suffix}"


def _optional_user_id():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except Exception:
        return None


@orders_bp.route("/orders/quote", methods=["POST"])
def quote_order():
    """Compute totals for a cart without creating an order."""
    data = request.get_json(silent=True) or {}
    items = data.get("items", [])
    country = (data.get("country") or "").strip()
    result = _compute_totals(items, country)
    if "error" in result:
        return jsonify(result), 400
    result.pop("_resolved", None)  # internal-only, not serializable
    return jsonify(result)


def _compute_totals(items, country):
    subtotal = 0.0
    resolved = []
    for item in items:
        product = db.session.get(Product, item.get("product_id"))
        if not product or not product.is_active:
            return {"error": f"Product {item.get('product_id')} unavailable"}
        qty = max(1, int(item.get("quantity") or 1))
        if qty > product.stock_quantity:
            return {
                "error": f"Insufficient stock for {product.name}",
                "product_id": product.id,
            }
        line = product.price * qty
        subtotal += line
        resolved.append((product, qty, line))

    is_domestic = (not country) or country.lower() == HOME_COUNTRY.lower()
    scope = "domestic" if is_domestic else "international"
    shipping = 0.0 if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_RATES[scope]
    tax = round(subtotal * TAX_RATE, 2)
    total = round(subtotal + shipping + tax, 2)
    return {
        "subtotal": round(subtotal, 2),
        "shipping_cost": shipping,
        "tax": tax,
        "total_amount": total,
        "currency": "USD",
        "shipping_scope": scope,
        "_resolved": resolved,
    }


@orders_bp.route("/orders", methods=["POST"])
def create_order():
    data = request.get_json(silent=True) or {}
    items = data.get("items", [])
    if not items:
        return jsonify({"error": "Cart is empty"}), 400

    required = ["customer_name", "customer_email", "shipping_address", "shipping_city", "shipping_country"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    totals = _compute_totals(items, data.get("shipping_country"))
    if "error" in totals:
        return jsonify(totals), 400

    user_id = _optional_user_id()
    order = Order(
        order_number=_generate_order_number(),
        user_id=user_id,
        status="pending",
        payment_status="unpaid",
        payment_method=data.get("payment_method", "cod"),
        subtotal=totals["subtotal"],
        shipping_cost=totals["shipping_cost"],
        tax=totals["tax"],
        total_amount=totals["total_amount"],
        currency=totals["currency"],
        customer_name=data["customer_name"],
        customer_email=data["customer_email"],
        customer_phone=data.get("customer_phone"),
        shipping_address=data["shipping_address"],
        shipping_city=data["shipping_city"],
        shipping_country=data["shipping_country"],
        notes=data.get("notes"),
    )
    db.session.add(order)
    db.session.flush()

    for product, qty, line in totals["_resolved"]:
        db.session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_image=product.image_urls[0] if product.image_urls else None,
                quantity=qty,
                unit_price=product.price,
                subtotal=round(line, 2),
            )
        )
        product.stock_quantity -= qty  # decrement inventory

    db.session.commit()
    return jsonify(order.to_dict()), 201


@orders_bp.route("/orders/track/<order_number>", methods=["GET"])
def track_order(order_number):
    order = Order.query.filter_by(order_number=order_number).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order.to_dict())


@orders_bp.route("/orders/mine", methods=["GET"])
@jwt_required()
def my_orders():
    user_id = int(get_jwt_identity())
    orders = (
        Order.query.filter_by(user_id=user_id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return jsonify([o.to_dict() for o in orders])


# ---------------- Admin ----------------
@orders_bp.route("/admin/orders", methods=["GET"])
@admin_required
def admin_list_orders():
    status = request.args.get("status")
    query = Order.query
    if status:
        query = query.filter_by(status=status)
    orders = query.order_by(Order.created_at.desc()).all()
    return jsonify([o.to_dict() for o in orders])


@orders_bp.route("/admin/orders/<int:order_id>", methods=["PUT"])
@admin_required
def admin_update_order(order_id):
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    data = request.get_json(silent=True) or {}
    if "status" in data:
        order.status = data["status"]
    if "payment_status" in data:
        order.payment_status = data["payment_status"]
    db.session.commit()
    return jsonify(order.to_dict())


@orders_bp.route("/admin/stats", methods=["GET"])
@admin_required
def admin_stats():
    from datetime import timedelta

    from sqlalchemy import func

    total_orders = db.session.query(func.count(Order.id)).scalar() or 0
    revenue = (
        db.session.query(func.sum(Order.total_amount))
        .filter(Order.payment_status == "paid")
        .scalar()
        or 0
    )
    pending = (
        db.session.query(func.count(Order.id))
        .filter(Order.status == "pending")
        .scalar()
        or 0
    )
    total_products = db.session.query(func.count(Product.id)).scalar() or 0
    total_customers = (
        db.session.query(func.count(User.id)).filter(User.role == "customer").scalar()
        or 0
    )

    # Last-14-days sales series (orders + revenue per day), zero-filled so the
    # chart always shows a continuous axis even on quiet days.
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=13)
    rows = (
        db.session.query(
            func.date(Order.created_at).label("day"),
            func.count(Order.id),
            func.sum(Order.total_amount),
        )
        .filter(func.date(Order.created_at) >= start.isoformat())
        .group_by("day")
        .all()
    )
    by_day = {str(r[0]): {"orders": r[1], "revenue": round(r[2] or 0, 2)} for r in rows}
    sales_series = []
    for i in range(14):
        d = (start + timedelta(days=i)).isoformat()
        entry = by_day.get(d, {"orders": 0, "revenue": 0})
        sales_series.append({"date": d, **entry})

    # Top 5 products by quantity sold.
    top_rows = (
        db.session.query(
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("qty"),
        )
        .group_by(OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
    top_products = [{"name": r[0], "quantity": int(r[1] or 0)} for r in top_rows]

    return jsonify(
        {
            "total_orders": total_orders,
            "revenue": round(revenue, 2),
            "pending_orders": pending,
            "total_products": total_products,
            "total_customers": total_customers,
            "sales_series": sales_series,
            "top_products": top_products,
        }
    )
