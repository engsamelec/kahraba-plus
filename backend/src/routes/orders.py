import re
import secrets
import string
from datetime import datetime, timedelta, timezone

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

ORDER_STATUSES = {"pending", "processing", "shipped", "delivered", "cancelled"}
PAYMENT_STATUSES = {"unpaid", "paid", "refunded"}

# Pragmatic email check — rejects obvious typos without over-restricting.
_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _generate_order_number():
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    # 8 chars of crypto-strength randomness so order numbers (which act as a
    # bearer credential for guest tracking) can't be enumerated/guessed.
    alphabet = string.ascii_uppercase + string.digits
    suffix = "".join(secrets.choice(alphabet) for _ in range(8))
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
    from src.models.store_config import get_config

    return jsonify(get_config().to_dict())


@orders_bp.route("/admin/config", methods=["PUT"])
@admin_required
def update_store_config():
    """Merchant-editable shipping / free-shipping / tax settings."""
    from src.models.store_config import get_config

    cfg = get_config()
    data = request.get_json(silent=True) or {}
    for field in (
        "free_shipping_threshold",
        "domestic_shipping",
        "international_shipping",
    ):
        if field in data:
            try:
                setattr(cfg, field, max(0.0, float(data[field])))
            except (TypeError, ValueError):
                return jsonify({"error": f"Invalid {field}"}), 400
    if "tax_rate" in data:
        try:
            cfg.tax_rate = min(1.0, max(0.0, float(data["tax_rate"])))
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid tax_rate"}), 400
    if "home_country" in data and str(data["home_country"]).strip():
        cfg.home_country = str(data["home_country"]).strip()
    for field in ("store_phone", "store_email", "store_address"):
        if field in data and str(data[field]).strip():
            setattr(cfg, field, str(data[field]).strip()[:200])
    db.session.commit()
    return jsonify(cfg.to_dict())



def _compute_totals(items, country, coupon_code=None):
    from src.models.catalog import ProductVariant

    subtotal = 0.0
    resolved = []
    if not isinstance(items, list):
        return {"error": "Invalid items"}
    for item in items:
        if not isinstance(item, dict):
            return {"error": "Invalid item"}
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
        line = round(unit_price * qty, 2)  # round per line so sums reconcile
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

    # Shipping/free-shipping/tax come from the merchant-editable store config.
    from src.models.store_config import get_config

    cfg = get_config()
    is_domestic = (not country) or country.lower() == cfg.home_country.lower()
    scope = "domestic" if is_domestic else "international"
    rate = cfg.domestic_shipping if is_domestic else cfg.international_shipping
    # Free-shipping threshold applies to the discounted subtotal.
    shipping = 0.0 if discounted_subtotal >= cfg.free_shipping_threshold else rate
    tax = round(discounted_subtotal * cfg.tax_rate, 2)
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
    # Strip first so whitespace-only values don't pass as "filled".
    missing = [f for f in required if not (data.get(f) or "").strip()]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400

    # Validate the email — it's the only contact channel for a guest order.
    if not _EMAIL_RE.match((data.get("customer_email") or "").strip()):
        return jsonify({"error": "Please enter a valid email address"}), 400

    totals = _compute_totals(
        items, data.get("shipping_country"), data.get("coupon_code")
    )
    if "error" in totals:
        return jsonify(totals), 400

    user_id = _optional_user_id()

    # Idempotency: a refresh / double-submit / network retry shouldn't create a
    # second identical order (and decrement stock again). If an order with the
    # same email, total, and item count landed in the last 90s, return it.
    email = data["customer_email"].strip().lower()
    recent_cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(seconds=90)
    dup = (
        Order.query.filter(
            db.func.lower(Order.customer_email) == email,
            Order.total_amount == totals["total_amount"],
            Order.created_at >= recent_cutoff,
        )
        .order_by(Order.created_at.desc())
        .first()
    )
    if dup and len(dup.items) == len(items):
        return jsonify(dup.to_dict()), 200

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
            # Coupon got exhausted between quote and commit. Recompute the order
            # WITHOUT the coupon so shipping/tax are correct (don't just add the
            # discount back, which would mis-handle tax on the new subtotal).
            fresh = _compute_totals(items, data.get("shipping_country"), None)
            order.discount = 0.0
            order.coupon_code = None
            order.subtotal = fresh["subtotal"]
            order.shipping_cost = fresh["shipping_cost"]
            order.tax = fresh["tax"]
            order.total_amount = fresh["total_amount"]

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
    return jsonify([o.to_dict(include_cost=True) for o in orders])


@orders_bp.route("/admin/orders/export", methods=["GET"])
@admin_required
def admin_export_orders():
    """Export orders as CSV for accounting / fulfilment / records."""
    import csv
    import io

    from flask import Response

    def safe(v):
        # Neutralize spreadsheet formula injection.
        s = "" if v is None else str(v)
        return "'" + s if s and s[0] in ("=", "+", "-", "@", "\t", "\r") else s

    status = request.args.get("status")
    query = Order.query
    if status:
        query = query.filter_by(status=status)
    orders = query.order_by(Order.created_at.desc()).all()

    out = io.StringIO()
    w = csv.writer(out)
    w.writerow(
        [
            "order_number", "date", "status", "payment_status", "payment_method",
            "customer_name", "customer_email", "customer_phone",
            "shipping_address", "shipping_city", "shipping_country",
            "items", "subtotal", "discount", "coupon", "shipping", "tax",
            "total", "currency",
        ]
    )
    for o in orders:
        items = "; ".join(
            f"{it.product_name}"
            + (f" ({it.variant_label})" if it.variant_label else "")
            + f" x{it.quantity}"
            for it in o.items
        )
        w.writerow(
            [
                safe(o.order_number),
                o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
                o.status, o.payment_status, safe(o.payment_method),
                safe(o.customer_name), safe(o.customer_email),
                safe(o.customer_phone),
                safe(o.shipping_address), safe(o.shipping_city),
                safe(o.shipping_country),
                safe(items),
                o.subtotal, o.discount, safe(o.coupon_code or ""),
                o.shipping_cost, o.tax, o.total_amount, o.currency,
            ]
        )
    return Response(
        out.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=kahraba-orders.csv"},
    )


@orders_bp.route("/admin/orders/<int:order_id>", methods=["PUT"])
@admin_required
def admin_update_order(order_id):
    from src.models.catalog import ProductVariant

    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    data = request.get_json(silent=True) or {}

    if "status" in data:
        new_status = data["status"]
        if new_status not in ORDER_STATUSES:
            return jsonify({"error": "Invalid status"}), 400
        # Cancelling a live order returns its items to stock (once). Guard on
        # the transition so re-saving "cancelled" doesn't restock twice.
        if new_status == "cancelled" and order.status != "cancelled":
            for it in order.items:
                if it.variant_id:
                    ProductVariant.query.filter_by(id=it.variant_id).update(
                        {
                            ProductVariant.stock_quantity: (
                                ProductVariant.stock_quantity + it.quantity
                            )
                        },
                        synchronize_session=False,
                    )
                elif it.product_id:
                    Product.query.filter_by(id=it.product_id).update(
                        {Product.stock_quantity: Product.stock_quantity + it.quantity},
                        synchronize_session=False,
                    )
        order.status = new_status

    if "payment_status" in data:
        if data["payment_status"] not in PAYMENT_STATUSES:
            return jsonify({"error": "Invalid payment status"}), 400
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
        .filter(Order.status != "cancelled")
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
