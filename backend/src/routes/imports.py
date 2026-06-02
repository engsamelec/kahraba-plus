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
    "product_number": "product_number", "product number": "product_number",
    "رقم المنتج": "product_number", "رقم": "product_number", "id": "product_number",
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
    import math

    try:
        f = float(str(v).replace(",", "").strip())
    except (ValueError, TypeError):
        return default
    # Reject inf/nan so they never reach int()/_clamp_money and corrupt data.
    return f if math.isfinite(f) else default


def _clamp_money(v):
    """Same guard the JSON product routes use: non-negative, capped at 1M.
    Returns None only when v is None (so optional fields stay unset)."""
    if v is None:
        return None
    if v != v or v < 0:  # NaN or negative
        return 0.0
    return min(v, 1_000_000.0)


def _read_text():
    if "file" in request.files:
        return request.files["file"].read().decode("utf-8-sig", errors="replace")
    body = request.get_json(silent=True) or {}
    return body.get("csv", "")


@imports_bp.route("/admin/export", methods=["GET"])
@admin_required
def export_csv():
    """Export the whole catalog as CSV so the merchant can edit in Excel and
    re-import (matched back by product_number)."""
    from flask import Response

    def safe(v):
        # Neutralize spreadsheet formula injection: a cell starting with one of
        # these is treated as a formula by Excel/Sheets, so prefix an apostrophe.
        s = "" if v is None else str(v)
        if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
            return "'" + s
        return s

    out = io.StringIO()
    writer = csv.writer(out)
    writer.writerow(
        [
            "product_number", "name", "name_ar", "name_he", "sku", "brand",
            "price", "compare_at_price", "stock", "category", "image_url",
            "featured",
        ]
    )
    for p in Product.query.order_by(Product.id).all():
        writer.writerow(
            [
                safe(p.product_number or f"KP-{p.id:05d}"),
                safe(p.name), safe(p.name_ar or ""), safe(p.name_he or ""),
                safe(p.sku or ""), safe(p.brand or ""),
                p.price, p.compare_at_price or "",
                p.stock_quantity,
                safe(p.category.name if p.category else ""),
                safe(p.image_urls[0] if p.image_urls else ""),
                "yes" if p.is_featured else "no",
            ]
        )
    return Response(
        out.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=kahraba-catalog.csv"},
    )


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
        price = _to_float(row.get("price"))
        if price is None or price < 0:
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

        # Match an existing product by product_number first, then SKU.
        pnum = (row.get("product_number") or "").strip() or None
        sku = (row.get("sku") or "").strip() or None
        product = None
        if pnum:
            product = Product.query.filter_by(product_number=pnum).first()
        if product is None and sku:
            product = Product.query.filter_by(sku=sku).first()

        if product is None:
            product = Product(
                name=name,
                slug=_unique_slug(slugify(name), Product),
                sku=sku,
                product_number=pnum,
            )
            db.session.add(product)
            db.session.flush()
            if not product.product_number:
                product.product_number = f"KP-{product.id:05d}"
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
        product.price = _clamp_money(price) or 0.0
        cap = _clamp_money(_to_float(row.get("compare_at_price")))
        if cap is not None:
            product.compare_at_price = cap
        # Keep the sale invariant: a compare-at price must be above the price,
        # otherwise it's not a discount — clear it so no bogus strikethrough.
        if product.compare_at_price and product.compare_at_price <= product.price:
            product.compare_at_price = None
        stock = row.get("stock")
        if stock not in (None, ""):
            product.stock_quantity = max(0, int(_to_float(stock, 0) or 0))
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
