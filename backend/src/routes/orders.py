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
    coupon_code = data.get("coupon_code")
    result = _compute_totals(items, country, coupon_code)
    if "error" in result:
        return jsonify(result), 400
    # If a coupon code was sent but didn't apply, tell the client why.
    if coupon_code and not result.get("coupon_code"):
        from src.models.coupon import Coupon

        c = Coupon.query.filter(
            db.func.lower(Coupon.code) == coupon_code.strip().lower()
        ).first()
        if not c:
            result["coupon_error"] = "invalid"
        elif c.status():
            result["coupon_error"] = c.status()
        else:
            result["coupon_error"] = "min_subtotal"
    result.pop("_resolved", None)  # internal-only, not serializable
    result.pop("_coupon", None)
    return jsonify(result)


@orders_bp.route("/config", methods=["GET"])
def store_config():
    """Public store config used by the storefront (free-shipping bar etc.).
    Amounts are the canonical USD values; the client converts for display."""
    return jsonify(
        {
            "free_shipping_threshold": FREE_SHIPPING_THRESHOLD,
            "domestic_shipping": SHIPPING_RATES["domestic"],
            "international_shipping": SHIPPING_RATES["international"],
            "home_country": HOME_COUNTRY,
        }
    )



def _compute_totals(items, country, coupon_code=None):
    from src.models.catalog import ProductVariant

    subtotal = 0.0
    resolved = []
    for item in items:
        product = db.session.get(Product, item.get("product_id"))
        if not product or not product.is_active:
            return {"error": f"Product {item.get('product_id')} unavailable"}
        qty = max(1, int(item.get("quantity") or 1))

        # Resolve the optional variant — price and stock are taken from the
        # variant (server-authoritative), never trusted from the client.
        variant = None
        variant_id = item.get("variant_id")
        if variant_id:
            variant = db.session.get(ProductVariant, variant_id)
            if (
                not variant
                or variant.product_id != product.id
                or not variant.is_available
            ):
                return {
                    "error": f"Selected option unavailable for {product.name}",
                    "product_id": product.id,
                }
            unit_price = product.price + variant.additional_price
            available = variant.stock_quantity
        elif product.variants:
            # A product with variants requires a variant choice.
            return {
                "error": f"Please choose an option for {product.name}",
                "product_id": product.id,
            }
        else:
            unit_price = product.price
            available = product.stock_quantity

        if qty > available:
            return {
                "error": f"Insufficient stock for {product.name}",
                "product_id": product.id,
            }
        line = unit_price * qty
        subtotal += line
        resolved.append((product, variant, qty, unit_price, line))

    # Optional coupon discount on the subtotal.
    discount = 0.0
    applied_code = None
    coupon_obj = None
    if coupon_code:
        from src.models.coupon import Coupon

        coupon_obj = Coupon.query.filter(
            db.func.lower(Coupon.code) == coupon_code.strip().lower()
        ).first()
        if coupon_obj:
            discount = coupon_obj.discount_for(subtotal)
            if discount > 0:
                applied_code = coupon_obj.code

    discounted_subtotal = max(0.0, subtotal - discount)

    is_domestic = (not country) or country.lower() == HOME_COUNTRY.lower()
    scope = "domestic" if is_domestic else "international"
    # Free-shipping threshold applies to the discounted subtotal.
    shipping = (
        0.0 if discounted_subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_RATES[scope]
    )
    tax = round(discounted_subtotal * TAX_RATE, 2)
    total = round(discounted_subtotal + shipping + tax, 2)
    return {
        "subtotal": round(subtotal, 2),
        "discount": round(discount, 2),
        "coupon_code": applied_code,
        "shipping_cost": shipping,
        "tax": tax,
        "total_amount": total,
        "currency": "USD",
        "shipping_scope": scope,
        "_resolved": resolved,
        "_coupon": coupon_obj if applied_code else None,
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

    totals = _compute_totals(
        items, data.get("shipping_country"), data.get("coupon_code")
    )
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
        discount=totals.get("discount", 0.0),
        coupon_code=totals.get("coupon_code"),
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

    from src.models.catalog import ProductVariant

    for product, variant, qty, unit_price, line in totals["_resolved"]:
        db.session.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_name_ar=product.name_ar,
                product_name_he=product.name_he,
                product_image=product.image_urls[0] if product.image_urls else None,
                variant_id=variant.id if variant else None,
                variant_label=variant.label if variant else None,
                quantity=qty,
                unit_price=unit_price,
                unit_cost=product.cost,
                subtotal=round(line, 2),
            )
        )
        # Atomic, guarded stock decrement: only succeeds if enough remains.
        # Prevents overselling under concurrent checkout. Stock is tracked on
        # the variant when one is chosen, otherwise on the product.
        if variant is not None:
            updated = ProductVariant.query.filter(
                ProductVariant.id == variant.id,
                ProductVariant.stock_quantity >= qty,
            ).update(
                {ProductVariant.stock_quantity: ProductVariant.stock_quantity - qty},
                synchronize_session=False,
            )
        else:
            updated = Product.query.filter(
                Product.id == product.id,
                Product.stock_quantity >= qty,
            ).update(
                {Product.stock_quantity: Product.stock_quantity - qty},
                synchronize_session=False,
            )
        if not updated:
            db.session.rollback()
            return (
                jsonify(
                    {
                        "error": f"Insufficient stock for {product.name}",
                        "product_id": product.id,
                    }
                ),
                409,
            )

    # Count a coupon redemption atomically, honoring the usage cap so it can't
    # be exceeded by concurrent checkouts.
    coupon = totals.get("_coupon")
    if coupon is not None:
        from src.models.coupon import Coupon

        cond = [Coupon.id == coupon.id]
        if coupon.max_uses is not None:
            cond.append(Coupon.used_count < coupon.max_uses)
        bumped = Coupon.query.filter(*cond).update(
            {Coupon.used_count: Coupon.used_count + 1},
            synchronize_session=False,
        )
        if not bumped and coupon.max_uses is not None:
            # Coupon got exhausted between quote and commit — drop the discount.
            order.discount = 0.0
            order.coupon_code = None
            order.total_amount = round(
                order.total_amount + (totals.get("discount") or 0), 2
            )

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


@orders_bp.route("/admin/notifications", methods=["GET"])
@admin_required
def admin_notifications():
    """Aggregate the things the merchant needs to act on: pending orders,
    unanswered questions, and out-of-stock products with waiting customers."""
    from sqlalchemy import func

    from src.models.catalog import Product
    from src.models.notify import StockNotification
    from src.models.question import Question

    pending_orders = (
        db.session.query(func.count(Order.id))
        .filter(Order.status == "pending")
        .scalar()
        or 0
    )
    unanswered_questions = (
        db.session.query(func.count(Question.id))
        .filter(Question.answer.is_(None))
        .scalar()
        or 0
    )
    # distinct out-of-stock products that have waiting notify requests
    restock_requests = (
        db.session.query(func.count(func.distinct(StockNotification.product_id)))
        .filter(StockNotification.notified.is_(False))
        .scalar()
        or 0
    )
    low_stock = (
        db.session.query(func.count(Product.id))
        .filter(Product.stock_quantity > 0, Product.stock_quantity <= 5)
        .scalar()
        or 0
    )

    return jsonify(
        {
            "pending_orders": int(pending_orders),
            "unanswered_questions": int(unanswered_questions),
            "restock_requests": int(restock_requests),
            "low_stock": int(low_stock),
            "total": int(
                pending_orders + unanswered_questions + restock_requests
            ),
        }
    )


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


@orders_bp.route("/admin/accounting", methods=["GET"])
@admin_required
def admin_accounting():
    """Smart accountant: revenue, cost of goods sold (COGS), gross profit,
    margin, discounts, AOV — plus the most and least profitable products.

    Excludes cancelled orders. Profit uses the unit_cost snapshot captured at
    sale time; line items without a recorded cost are flagged so the merchant
    knows the profit figure is partial until costs are filled in."""
    from src.models.catalog import Product

    orders = Order.query.filter(Order.status != "cancelled").all()

    revenue = 0.0          # sum of item subtotals actually sold
    cogs = 0.0             # sum of unit_cost * qty (where cost known)
    discounts = 0.0
    shipping_collected = 0.0
    items_with_cost = 0
    items_without_cost = 0

    # per-product aggregation
    prod_agg: dict[int, dict] = {}

    for o in orders:
        discounts += o.discount or 0
        shipping_collected += o.shipping_cost or 0
        for it in o.items:
            line_rev = it.subtotal or 0
            revenue += line_rev
            agg = prod_agg.setdefault(
                it.product_id or 0,
                {"name": it.product_name, "revenue": 0.0, "profit": 0.0, "qty": 0},
            )
            agg["revenue"] += line_rev
            agg["qty"] += it.quantity or 0
            if it.unit_cost is not None:
                line_cost = (it.unit_cost or 0) * (it.quantity or 0)
                cogs += line_cost
                agg["profit"] += line_rev - line_cost
                items_with_cost += 1
            else:
                items_without_cost += 1

    gross_profit = revenue - cogs
    margin = (gross_profit / revenue * 100) if revenue else 0
    order_count = len(orders)
    aov = (revenue / order_count) if order_count else 0

    ranked = sorted(prod_agg.values(), key=lambda p: p["profit"], reverse=True)
    top_profit = [
        {"name": p["name"], "profit": round(p["profit"], 2), "revenue": round(p["revenue"], 2), "qty": p["qty"]}
        for p in ranked[:5]
    ]
    low_profit = [
        {"name": p["name"], "profit": round(p["profit"], 2), "revenue": round(p["revenue"], 2), "qty": p["qty"]}
        for p in ranked[-5:][::-1]
        if p["profit"] <= 0 or len(ranked) > 5
    ]

    # how many catalog products are missing a cost (so margins are blind there)
    from sqlalchemy import func as _func

    missing_cost = (
        db.session.query(_func.count(Product.id))
        .filter((Product.cost.is_(None)) | (Product.cost == 0))
        .scalar()
        or 0
    )

    return jsonify(
        {
            "revenue": round(revenue, 2),
            "cogs": round(cogs, 2),
            "gross_profit": round(gross_profit, 2),
            "margin_percent": round(margin, 1),
            "discounts": round(discounts, 2),
            "shipping_collected": round(shipping_collected, 2),
            "order_count": order_count,
            "aov": round(aov, 2),
            "items_with_cost": items_with_cost,
            "items_without_cost": items_without_cost,
            "products_missing_cost": int(missing_cost),
            "top_profit": top_profit,
            "low_profit": low_profit,
        }
    )
