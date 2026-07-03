"""مولّد feed الكتالوج من products.json — بمواصفات ميتا الإلزامية المؤكدة.

القواعد المفروضة هنا (الدراسة §3):
- كل variants الموديل بنفس item_group_id، وكل variant بـ id فريد.
- صورة فريدة لكل لون (تتكرر عبر المقاسات، تختلف بين الألوان) — إلزامي.
- كل حقول الـ variant (color, size) معبأة لكل سطور المجموعة.
- المنتجات الموسومة brand_flag=protected لا تدخل الـ feed أبداً (فلتر العلامات §6).
- حارس أسعار: سعر خارج المدى المسموح ← يرفض الـ feed كله (درس price_validation).
"""
import csv
import json
import sys

from config import PRODUCTS_PATH, CURRENCY

FEED_PATH = "feed.csv"
PRICE_MIN, PRICE_MAX = 20, 1000  # بالشيكل — عدّلها حسب تشكيلتك

COLUMNS = [
    "id", "item_group_id", "title", "description", "availability", "condition",
    "price", "link", "image_link", "brand", "product_type",
    "google_product_category", "color", "size", "gender",
]
GPC_TOPS = "Apparel & Accessories > Clothing > Shirts & Tops"


class FeedError(ValueError):
    pass


def validate_product(p: dict) -> None:
    if p.get("brand_flag") == "protected":
        raise FeedError(f"{p['id']}: منتج بعلامة محمية — ممنوع بالإعلانات (وجّهه للقنوات المباشرة)")
    if not (PRICE_MIN <= p["price"] <= PRICE_MAX):
        raise FeedError(f"{p['id']}: سعر {p['price']} خارج المدى [{PRICE_MIN},{PRICE_MAX}]")
    images = [c["image"] for c in p["colors"]]
    if len(set(images)) != len(images):
        raise FeedError(f"{p['id']}: كل لون يجب أن يملك صورة مختلفة (قاعدة ميتا الإلزامية)")
    for c in p["colors"]:
        if not c.get("name") or not c.get("sizes"):
            raise FeedError(f"{p['id']}: كل variant يجب أن يعبي اللون والمقاسات")


def product_rows(p: dict) -> list[dict]:
    validate_product(p)
    rows = []
    for c in p["colors"]:
        for size, in_stock in c["sizes"].items():
            rows.append({
                "id": f"{p['id']}-{c['code']}-{size}",
                "item_group_id": p["id"],
                "title": f"{p['title']} - {c['name']} - {size}",
                "description": p.get("description", p["title"]),
                "availability": "in stock" if in_stock else "out of stock",
                "condition": "new",
                "price": f"{p['price']} {CURRENCY}",
                "link": p["link"],
                "image_link": c["image"],
                "brand": p.get("brand", ""),
                "product_type": p["product_type"],
                "google_product_category": p.get("google_product_category", GPC_TOPS),
                "color": c["name"],
                "size": size,
                "gender": p.get("gender", "female"),
            })
    return rows


def build_feed(products: list[dict], out_path: str = FEED_PATH) -> int:
    rows = []
    skipped = []
    for p in products:
        try:
            rows.extend(product_rows(p))
        except FeedError as e:
            skipped.append(str(e))
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)
    for s in skipped:
        print(f"SKIPPED: {s}", file=sys.stderr)
    return len(rows)


if __name__ == "__main__":
    with open(PRODUCTS_PATH, encoding="utf-8") as f:
        products = json.load(f)
    n = build_feed(products)
    print(f"feed.csv: {n} variant rows — ارفعه للكتالوج من Commerce Manager أو اربطه كـ scheduled feed")
