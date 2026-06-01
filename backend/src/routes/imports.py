"""Bulk product import from CSV.

The merchant uploads a CSV (or pastes CSV text) to create/update many products
at once. Rows are matched to existing products by SKU (when present) so an
import can also update prices/stock. Categories are created on demand by name.

Recognized columns (case-insensitive; Arabic header aliases accepted):
  name, name_ar, name_he, sku, brand, price, compare_at_price, stock,
  category, description, description_ar, description_he, image_url, featured

A preview endpoint validates and reports without writing, so the merchant can
confirm before committing.
"""

from __future__ import annotations

import csv
import io

from flask import Blueprint, jsonify, request

from src.models.catalog import Category, Product
from src.models.user import db
from src.routes.helpers import admin_required
from src.routes.products import _unique_slug, slugify

imports_bp = Blueprint("imports", __name__)

# Map many possible header spellings to canonical field names.
HEADER_ALIASES = {
    "name": "name", "title": "name", "الاسم": "name", "اسم": "name", "שם": "name",
    "name_ar": "name_ar", "arabic name": "name_ar", "الاسم بالعربية": "name_ar",
    "name_he": "name_he", "hebrew name": "name_he",
    "sku": "sku", "رمز": "sku", "code": "sku", 'מק"ט': "sku",
    "brand": "brand", "العلامة": "brand", "الماركة": "brand",
    "price": "price", "السعر": "price", "מחיר": "price",
    "compare_at_price": "compare_at_price", "old price": "compare_at_price",
    "compare at price": "compare_at_price", "السعر القديم": "compare_at_price",
    "stock": "stock", "quantity": "stock", "qty": "stock", "الكمية": "stock",
    "stock_quantity": "stock", "المخزون": "stock",
    "category": "category", "القسم": "category", "الفئة": "category", "קטגוריה": "category",
    "description": "description", "الوصف": "description",
    "description_ar": "description_ar", "الوصف بالعربية": "description_ar",
    "description_he": "description_he",
    "image": "image_url", "image_url": "image_url", "img": "image_url", "صورة": "image_url",
    "featured": "featured", "مميز": "featured",
}

TRUE_VALUES = {"1", "true", "yes", "y", "نعم", "صح", "כן"}


def _norm_header(h: str) -> str | None:
    return HEADER_ALIASES.get((h or "").strip().lower())


def _parse_csv(text: str):
    """Return (rows, headers) where each row is a dict of canonical->value."""
    # Sniff delimiter (comma vs semicolon vs tab).
    sample = text[:2048]
    delim = ","
    for cand in (",", ";", "\t"):
        if sample.count(cand) >= 1:
            delim = cand
            break
    reader = csv.reader(io.StringIO(text), delimiter=delim)
    raw_rows = [r for r in reader if any(c.strip() for c in r)]
    if not raw_rows:
        return [], []
    headers = [_norm_header(h) for h in raw_rows[0]]
    rows = []
    for raw in raw_rows[1:]:
        row = {}
        for i, val in enumerate(raw):
            if i < len(headers) and headers[i]:
                row[headers[i]] = val.strip()
        if row.get("name") or row.get("sku"):
            rows.append(row)
    present = [h for h in headers if h]
    return rows, present


def _to_float(v, default=None):
    try:
        return float(str(v).replace(",", "").strip())
    except (ValueError, TypeError):
        return default


def _read_text():
    if "file" in request.files:
        return request.files["file"].read().decode("utf-8-sig", errors="replace")
    body = request.get_json(silent=True) or {}
    return body.get("csv", "")


@imports_bp.route("/admin/import/preview", methods=["POST"])
@admin_required
def import_preview():
    text = _read_text()
    if not text.strip():
        return jsonify({"error": "No CSV provided"}), 400
    rows, headers = _parse_csv(text)

    valid, errors = 0, []
    for i, row in enumerate(rows):
        if not row.get("name"):
            errors.append({"row": i + 2, "error": "missing name"})
            continue
        if _to_float(row.get("price")) is None:
            errors.append({"row": i + 2, "error": "invalid/missing price"})
            continue
        valid += 1

    return jsonify(
        {
            "total_rows": len(rows),
            "valid": valid,
            "errors": errors[:50],
            "detected_columns": headers,
            "sample": rows[:5],
        }
    )


@imports_bp.route("/admin/import/commit", methods=["POST"])
@admin_required
def import_commit():
    text = _read_text()
    if not text.strip():
        return jsonify({"error": "No CSV provided"}), 400
    rows, _ = _parse_csv(text)

    cat_cache: dict[str, Category] = {}
    created, updated, skipped = 0, 0, 0

    for row in rows:
        name = (row.get("name") or "").strip()
        price = _to_float(row.get("price"))
        if not name or price is None:
            skipped += 1
            continue

        # resolve / create category by name
        category = None
        cat_name = (row.get("category") or "").strip()
        if cat_name:
            key = cat_name.lower()
            category = cat_cache.get(key)
            if not category:
                category = Category.query.filter(
                    db.func.lower(Category.name) == key
                ).first()
                if not category:
                    category = Category(
                        name=cat_name,
                        slug=_unique_slug(slugify(cat_name), Category),
                    )
                    db.session.add(category)
                    db.session.flush()
                cat_cache[key] = category

        sku = (row.get("sku") or "").strip() or None
        product = Product.query.filter_by(sku=sku).first() if sku else None

        if product is None:
            product = Product(
                name=name,
                slug=_unique_slug(slugify(name), Product),
                sku=sku,
            )
            db.session.add(product)
            created += 1
        else:
            updated += 1

        product.name = name
        if row.get("name_ar"):
            product.name_ar = row["name_ar"]
        if row.get("name_he"):
            product.name_he = row["name_he"]
        if row.get("brand"):
            product.brand = row["brand"]
        product.price = price
        cap = _to_float(row.get("compare_at_price"))
        if cap is not None:
            product.compare_at_price = cap
        stock = row.get("stock")
        if stock not in (None, ""):
            product.stock_quantity = int(_to_float(stock, 0) or 0)
        if row.get("description"):
            product.description = row["description"]
        if row.get("description_ar"):
            product.description_ar = row["description_ar"]
        if row.get("description_he"):
            product.description_he = row["description_he"]
        if category:
            product.category_id = category.id
        if row.get("image_url"):
            product.image_urls = [row["image_url"]]
        if "featured" in row:
            product.is_featured = row["featured"].strip().lower() in TRUE_VALUES

    db.session.commit()
    return jsonify(
        {"created": created, "updated": updated, "skipped": skipped}
    )
