import re

from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from src.models.catalog import Category, Product, ProductVariant, Review
from src.models.user import User, db
from src.routes.helpers import admin_required, is_admin_request
from flask_jwt_extended import get_jwt_identity, jwt_required

products_bp = Blueprint("products", __name__)


def slugify(text):
    text = (text or "").lower().strip()
    text = re.sub(r"[^a-z0-9؀-ۿ]+", "-", text)
    return text.strip("-") or "item"


def _unique_slug(base, model):
    slug = base
    i = 2
    while model.query.filter_by(slug=slug).first():
        slug = f"{base}-{i}"
        i += 1
    return slug


def _money(value, default=0.0):
    """Parse a non-negative monetary value, capped to a sane maximum."""
    try:
        v = float(value)
    except (TypeError, ValueError):
        return default
    if v != v or v < 0:  # NaN or negative
        return default
    return min(v, 1_000_000.0)


def _bestseller_ids(limit=6):
    """Return the set of product ids that are genuine best sellers, by total
    quantity actually ordered. Empty until there are real sales — we never
    fake it."""
    from sqlalchemy import func

    from src.models.order import OrderItem

    rows = (
        db.session.query(OrderItem.product_id, func.sum(OrderItem.quantity))
        .filter(OrderItem.product_id.isnot(None))
        .group_by(OrderItem.product_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )
    return {r[0] for r in rows if r[1] and r[1] > 0}


# ---------------- Categories ----------------
@products_bp.route("/categories", methods=["GET"])
def get_categories():
    cats = Category.query.order_by(Category.name).all()
    return jsonify([c.to_dict(with_count=True) for c in cats])


@products_bp.route("/categories", methods=["POST"])
@admin_required
def create_category():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400
    cat = Category(
        name=name,
        name_ar=data.get("name_ar"),
        name_he=data.get("name_he"),
        slug=_unique_slug(slugify(name), Category),
        description=data.get("description"),
        icon=data.get("icon"),
        parent_id=data.get("parent_id") or None,
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict(with_count=True)), 201


@products_bp.route("/categories/<int:category_id>", methods=["PUT"])
@admin_required
def update_category(category_id):
    cat = db.session.get(Category, category_id)
    if not cat:
        return jsonify({"error": "Category not found"}), 404
    data = request.get_json(silent=True) or {}
    for field in ("name", "name_ar", "name_he", "description", "icon"):
        if field in data:
            setattr(cat, field, data[field])
    if "parent_id" in data:
        # Prevent a category being its own parent (a trivial cycle).
        pid = data["parent_id"] or None
        cat.parent_id = pid if pid != cat.id else None
    db.session.commit()
    return jsonify(cat.to_dict(with_count=True))


@products_bp.route("/categories/<int:category_id>", methods=["DELETE"])
@admin_required
def delete_category(category_id):
    cat = db.session.get(Category, category_id)
    if not cat:
        return jsonify({"error": "Category not found"}), 404
    # Detach products and child categories instead of cascade-deleting them, so
    # deleting a category never destroys products or orphans FKs.
    Product.query.filter_by(category_id=category_id).update(
        {Product.category_id: None}, synchronize_session=False
    )
    Category.query.filter_by(parent_id=category_id).update(
        {Category.parent_id: None}, synchronize_session=False
    )
    db.session.delete(cat)
    db.session.commit()
    return "", 204


# ---------------- Products ----------------
@products_bp.route("/products", methods=["GET"])
def get_products():
    # Admins may opt to see inactive/archived products so they can manage and
    # reactivate them; the public storefront only ever sees active ones.
    show_inactive = (
        request.args.get("include_inactive") == "true" and is_admin_request()
    )
    query = Product.query if show_inactive else Product.query.filter_by(is_active=True)

    # explicit id list (used by the favorites/wishlist view)
    ids_param = request.args.get("ids")
    if ids_param:
        try:
            id_list = [int(x) for x in ids_param.split(",") if x.strip().isdigit()]
        except ValueError:
            id_list = []
        query = query.filter(Product.id.in_(id_list or [-1]))

    # filter by category (id or slug)
    category = request.args.get("category")
    if category:
        if category.isdigit():
            query = query.filter_by(category_id=int(category))
        else:
            cat = Category.query.filter_by(slug=category).first()
            query = query.filter_by(category_id=cat.id if cat else -1)

    # search
    search = request.args.get("search")
    if search:
        like = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(like),
                Product.name_ar.ilike(like),
                Product.name_he.ilike(like),
                Product.brand.ilike(like),
                Product.description.ilike(like),
                Product.sku.ilike(like),
                Product.barcode.ilike(like),
                Product._tags.ilike(like),
            )
        )

    # price range
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # in stock only
    if request.args.get("in_stock") == "true":
        query = query.filter(Product.stock_quantity > 0)

    # featured
    if request.args.get("featured") == "true":
        query = query.filter_by(is_featured=True)

    # on-sale only (a real discount: compare-at price above current price)
    if request.args.get("sale") == "true":
        query = query.filter(
            Product.compare_at_price.isnot(None),
            Product.compare_at_price > Product.price,
        )

    # brand
    brand = request.args.get("brand")
    if brand:
        query = query.filter_by(brand=brand)

    # sorting
    sort = request.args.get("sort", "newest")
    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    elif sort == "rating":
        query = query.order_by(Product.rating_avg.desc())
    elif sort == "name":
        query = query.order_by(Product.name.asc())
    else:
        query = query.order_by(Product.created_at.desc())

    # pagination
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 12, type=int), 60)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    bestseller_ids = _bestseller_ids()
    include_cost = is_admin_request()

    def _serialize(p):
        d = p.to_dict(include_cost=include_cost)
        d["is_bestseller"] = p.id in bestseller_ids
        return d

    return jsonify(
        {
            "products": [_serialize(p) for p in pagination.items],
            "total": pagination.total,
            "page": page,
            "per_page": per_page,
            "pages": pagination.pages,
        }
    )


@products_bp.route("/products/brands", methods=["GET"])
def list_brands():
    """Distinct, non-empty brand names for the storefront brand filter."""
    rows = (
        db.session.query(Product.brand)
        .filter(Product.brand.isnot(None), Product.brand != "", Product.is_active == True)  # noqa: E712
        .distinct()
        .order_by(Product.brand)
        .all()
    )
    return jsonify([r[0] for r in rows])


@products_bp.route("/products/<slug>", methods=["GET"])
def get_product(slug):
    if slug.isdigit():
        product = db.session.get(Product, int(slug))
    else:
        product = Product.query.filter_by(slug=slug).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    related = (
        Product.query.filter(
            Product.category_id == product.category_id,
            Product.id != product.id,
            Product.is_active == True,  # noqa: E712
        )
        .limit(4)
        .all()
    )
    data = product.to_dict(full=True, include_cost=is_admin_request())
    data["reviews"] = [r.to_dict() for r in product.reviews]
    data["related"] = [p.to_dict() for p in related]

    # "Frequently bought together": this product + up to 2 in-stock siblings.
    bundle_items = [
        p for p in related if p.in_stock
    ][:2]
    if bundle_items:
        data["bundle"] = [product.to_dict()] + [p.to_dict() for p in bundle_items]
    return jsonify(data)


@products_bp.route("/products", methods=["POST"])
@admin_required
def create_product():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "Name is required"}), 400

    product = Product(
        name=name,
        name_ar=data.get("name_ar"),
        name_he=data.get("name_he"),
        slug=_unique_slug(slugify(name), Product),
        sku=data.get("sku"),
        barcode=(data.get("barcode") or "").strip() or None,
        video_url=(data.get("video_url") or "").strip() or None,
        brand=data.get("brand"),
        description=data.get("description"),
        description_ar=data.get("description_ar"),
        description_he=data.get("description_he"),
        price=_money(data.get("price")),
        cost=_money(data["cost"]) if data.get("cost") not in (None, "") else None,
        compare_at_price=(
            _money(data["compare_at_price"])
            if data.get("compare_at_price") not in (None, "")
            else None
        ),
        currency=data.get("currency", "USD"),
        stock_quantity=max(0, int(data.get("stock_quantity") or 0)),
        category_id=data.get("category_id"),
        is_featured=bool(data.get("is_featured")),
        is_active=data.get("is_active", True),
    )
    product.image_urls = data.get("image_urls", [])
    product.image_hashes = data.get("image_hashes", [])
    product.technical_specs = data.get("technical_specs", {})
    if "tags" in data:
        product.tags = data["tags"]
    db.session.add(product)
    db.session.flush()
    if not product.product_number:
        product.product_number = f"KP-{product.id:05d}"
    db.session.commit()
    return jsonify(product.to_dict(full=True, include_cost=True)), 201


@products_bp.route("/products/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    data = request.get_json(silent=True) or {}

    for field in [
        "name", "name_ar", "name_he", "sku", "barcode", "video_url", "brand",
        "description", "description_ar", "description_he", "currency",
    ]:
        if field in data:
            setattr(product, field, data[field])
    if "tags" in data:
        product.tags = data["tags"]
    if "price" in data:
        product.price = _money(data["price"])
    if "cost" in data:
        product.cost = _money(data["cost"]) if data["cost"] not in (None, "") else None
    if "compare_at_price" in data:
        product.compare_at_price = (
            _money(data["compare_at_price"])
            if data["compare_at_price"] not in (None, "")
            else None
        )
    if "stock_quantity" in data:
        product.stock_quantity = max(0, int(data["stock_quantity"] or 0))
    if "category_id" in data:
        product.category_id = data["category_id"]
    if "is_featured" in data:
        product.is_featured = bool(data["is_featured"])
    if "is_active" in data:
        product.is_active = bool(data["is_active"])
    if "image_urls" in data:
        product.image_urls = data["image_urls"]
    if "image_hashes" in data:
        product.image_hashes = data["image_hashes"]
    if "technical_specs" in data:
        product.technical_specs = data["technical_specs"]

    db.session.commit()
    return jsonify(product.to_dict(full=True, include_cost=True))


@products_bp.route("/products/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):
    from src.models.notify import StockNotification
    from src.models.order import OrderItem
    from src.models.question import Question

    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    # If the product has sales history, hard-deleting it would break order
    # records and accounting (or hit a FK error on Postgres). Archive it
    # instead — the storefront/admin list filters is_active, so it disappears
    # like a delete while the order snapshots and COGS stay intact.
    has_sales = (
        db.session.query(OrderItem.id).filter_by(product_id=product_id).first()
        is not None
    )
    if has_sales:
        product.is_active = False
        db.session.commit()
        return jsonify({"archived": True}), 200

    # No sales: safe to hard-delete. Reviews and variants cascade; clean up the
    # non-cascading transient dependents first to avoid orphans / FK errors.
    Question.query.filter_by(product_id=product_id).delete(synchronize_session=False)
    StockNotification.query.filter_by(product_id=product_id).delete(
        synchronize_session=False
    )
    db.session.delete(product)
    db.session.commit()
    return "", 204


# ---------------- Variants ----------------
_VARIANT_FIELDS = (
    "size", "color", "color_hex", "material", "sku", "image_url",
)


def _apply_variant(variant, data):
    for f in _VARIANT_FIELDS:
        if f in data:
            setattr(variant, f, data[f] or None)
    if "additional_price" in data:
        # Never negative — a variant can't drop the unit price below base.
        variant.additional_price = max(0.0, float(data["additional_price"] or 0))
    if "stock_quantity" in data:
        variant.stock_quantity = max(0, int(data["stock_quantity"] or 0))
    if "is_available" in data:
        variant.is_available = bool(data["is_available"])
    if "sort_order" in data:
        variant.sort_order = int(data["sort_order"] or 0)


@products_bp.route("/products/<int:product_id>/variants", methods=["GET"])
def list_variants(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify([v.to_dict() for v in product.variants])


@products_bp.route("/products/<int:product_id>/variants", methods=["POST"])
@admin_required
def create_variant(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    data = request.get_json(silent=True) or {}
    variant = ProductVariant(product_id=product_id)
    _apply_variant(variant, data)
    db.session.add(variant)
    db.session.commit()
    return jsonify(variant.to_dict()), 201


@products_bp.route("/variants/<int:variant_id>", methods=["PUT"])
@admin_required
def update_variant(variant_id):
    variant = db.session.get(ProductVariant, variant_id)
    if not variant:
        return jsonify({"error": "Variant not found"}), 404
    _apply_variant(variant, request.get_json(silent=True) or {})
    db.session.commit()
    return jsonify(variant.to_dict())


@products_bp.route("/variants/<int:variant_id>", methods=["DELETE"])
@admin_required
def delete_variant(variant_id):
    variant = db.session.get(ProductVariant, variant_id)
    if not variant:
        return jsonify({"error": "Variant not found"}), 404
    db.session.delete(variant)
    db.session.commit()
    return "", 204


# ---------------- Catalog health ----------------
@products_bp.route("/admin/catalog-health", methods=["GET"])
@admin_required
def catalog_health():
    """Surface catalog data-quality gaps so the merchant can fix listings:
    products missing images, prices, descriptions, category, or stock."""
    products = Product.query.all()
    total = len(products)

    no_image, no_price, no_desc, no_category, no_stock = [], [], [], [], []
    for p in products:
        brief = {"id": p.id, "name": p.name, "slug": p.slug}
        if not p.image_urls:
            no_image.append(brief)
        if not p.price or p.price <= 0:
            no_price.append(brief)
        if not (p.description or p.description_ar or p.description_he):
            no_desc.append(brief)
        if not p.category_id:
            no_category.append(brief)
        if p.stock_quantity <= 0:
            no_stock.append(brief)

    issues = (
        len(no_image) + len(no_price) + len(no_desc)
        + len(no_category) + len(no_stock)
    )
    # Simple completeness score: share of products with no gaps.
    flagged_ids = {
        p["id"]
        for group in (no_image, no_price, no_desc, no_category, no_stock)
        for p in group
    }
    complete = total - len(flagged_ids)
    score = round(100 * complete / total) if total else 100

    return jsonify(
        {
            "total": total,
            "complete": complete,
            "score": score,
            "issue_count": issues,
            "missing_image": no_image,
            "missing_price": no_price,
            "missing_description": no_desc,
            "missing_category": no_category,
            "out_of_stock": no_stock,
        }
    )


# ---------------- Reviews ----------------
@products_bp.route("/products/<int:product_id>/reviews", methods=["POST"])
@jwt_required()
def add_review(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    rating = int(data.get("rating") or 0)
    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    existing = Review.query.filter_by(product_id=product_id, user_id=user_id).first()
    if existing:
        existing.rating = rating
        existing.comment = data.get("comment")
    else:
        db.session.add(
            Review(
                product_id=product_id,
                user_id=user_id,
                rating=rating,
                comment=data.get("comment"),
            )
        )
    db.session.flush()

    # recompute aggregates
    reviews = Review.query.filter_by(product_id=product_id).all()
    product.rating_count = len(reviews)
    product.rating_avg = (
        sum(r.rating for r in reviews) / len(reviews) if reviews else 0
    )
    db.session.commit()
    return jsonify({"message": "Review saved", "rating_avg": product.rating_avg})
