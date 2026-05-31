import re

from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from src.models.catalog import Category, Product, Review
from src.models.user import User, db
from src.routes.helpers import admin_required
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
        slug=_unique_slug(slugify(name), Category),
        description=data.get("description"),
        icon=data.get("icon"),
        parent_id=data.get("parent_id"),
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify(cat.to_dict()), 201


# ---------------- Products ----------------
@products_bp.route("/products", methods=["GET"])
def get_products():
    query = Product.query.filter_by(is_active=True)

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
                Product.brand.ilike(like),
                Product.description.ilike(like),
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

    return jsonify(
        {
            "products": [p.to_dict() for p in pagination.items],
            "total": pagination.total,
            "page": page,
            "per_page": per_page,
            "pages": pagination.pages,
        }
    )


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
    data = product.to_dict(full=True)
    data["reviews"] = [r.to_dict() for r in product.reviews]
    data["related"] = [p.to_dict() for p in related]
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
        slug=_unique_slug(slugify(name), Product),
        sku=data.get("sku"),
        brand=data.get("brand"),
        description=data.get("description"),
        description_ar=data.get("description_ar"),
        price=float(data.get("price") or 0),
        compare_at_price=data.get("compare_at_price"),
        currency=data.get("currency", "USD"),
        stock_quantity=int(data.get("stock_quantity") or 0),
        category_id=data.get("category_id"),
        is_featured=bool(data.get("is_featured")),
        is_active=data.get("is_active", True),
    )
    product.image_urls = data.get("image_urls", [])
    product.technical_specs = data.get("technical_specs", {})
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict(full=True)), 201


@products_bp.route("/products/<int:product_id>", methods=["PUT"])
@admin_required
def update_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    data = request.get_json(silent=True) or {}

    for field in [
        "name", "name_ar", "sku", "brand", "description", "description_ar",
        "currency",
    ]:
        if field in data:
            setattr(product, field, data[field])
    if "price" in data:
        product.price = float(data["price"])
    if "compare_at_price" in data:
        product.compare_at_price = data["compare_at_price"]
    if "stock_quantity" in data:
        product.stock_quantity = int(data["stock_quantity"])
    if "category_id" in data:
        product.category_id = data["category_id"]
    if "is_featured" in data:
        product.is_featured = bool(data["is_featured"])
    if "is_active" in data:
        product.is_active = bool(data["is_active"])
    if "image_urls" in data:
        product.image_urls = data["image_urls"]
    if "technical_specs" in data:
        product.technical_specs = data["technical_specs"]

    db.session.commit()
    return jsonify(product.to_dict(full=True))


@products_bp.route("/products/<int:product_id>", methods=["DELETE"])
@admin_required
def delete_product(product_id):
    product = db.session.get(Product, product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    db.session.delete(product)
    db.session.commit()
    return "", 204


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
