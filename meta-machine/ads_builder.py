"""بناء الحملة الأم عبر Marketing API — الهيكل المعتمد بالدراسة §4 حرفياً.

حملة CTWA واحدة · CBO $40/يوم · مجموعتان:
  1. lal  — Lookalike 1% من داتا المشترين (الدولة: إسرائيل)
  2. broad — عريض: إسرائيل + اللغة العربية + نساء (الاستثناء الوحيد المبرر لتقييد الاستهداف)
إعلان لكل (موديل × لون) — بتسمية مفهرسة PROD_COLOR_AUD تُسجل في ads_map (الخيط الذهبي).

الاستخدام:
    python ads_builder.py --dry-run    ← يطبع الشجرة بلا إنشاء (ابدأ هيك دائماً)
    python ads_builder.py              ← ينشئ فعلياً (الحملة توقف مؤقتاً PAUSED — أنت بتفعّلها)
"""
import json
import sys

import db
from config import (
    ADS_TOKEN, AD_ACCOUNT_ID, PAGE_ID, DAILY_BUDGET_USD,
    LOOKALIKE_AUDIENCE_ID, PRODUCTS_PATH, WHATSAPP_PHONE_NUMBER_ID,
)

MAX_ADS_PER_ADSET = 50  # سقف ميتا الرسمي
ARABIC_LOCALE_ID = 28   # العربية في targeting locales

AUDIENCES = {
    "lal": {"custom_audiences": [{"id": LOOKALIKE_AUDIENCE_ID}]},
    "broad": {},
}


def base_targeting(extra: dict) -> dict:
    t = {
        "geo_locations": {"countries": ["IL"]},
        "locales": [ARABIC_LOCALE_ID],
        "genders": [1],          # نساء
        "age_min": 18,
    }
    t.update(extra)
    return t


def build_tree(products: list[dict]) -> dict:
    """يبني مواصفات الشجرة كاملة (بلا أي نداء API) — قابلة للفحص بالعين."""
    ads = []
    for p in products:
        if p.get("brand_flag") == "protected":
            continue
        for c in p["colors"]:
            if not any(c["sizes"].values()):
                continue  # لون نافد بالكامل لا يُعلَن عنه
            ads.append({
                "name": f"{p['id']}_{c['code']}",
                "product_id": p["id"],
                "color": c["name"],
                "image": c["image"],
                "message": f"{p['title']} — اللون {c['name']} 😍 متوفر توصيل لكل البلدات، الدفع عند الاستلام. اسألينا عالواتساب:",
            })
    if len(ads) > MAX_ADS_PER_ADSET:
        ads = ads[:MAX_ADS_PER_ADSET]
    return {
        "campaign": {
            "name": "[CTWA] بلايز وقمصان - الماكينة الأم",
            "objective": "OUTCOME_ENGAGEMENT",
            "daily_budget_usd": DAILY_BUDGET_USD,
        },
        "adsets": [
            {"key": "lal", "name": "LAL 1% مشترين - IL"},
            {"key": "broad", "name": "عريض - IL - عربي - نساء"},
        ],
        "ads": ads,
    }


def create_all(tree: dict) -> None:
    from facebook_business.api import FacebookAdsApi
    from facebook_business.adobjects.adaccount import AdAccount

    FacebookAdsApi.init(access_token=ADS_TOKEN)
    account = AdAccount(AD_ACCOUNT_ID)

    campaign = account.create_campaign(params={
        "name": tree["campaign"]["name"],
        "objective": tree["campaign"]["objective"],
        "status": "PAUSED",
        "special_ad_categories": [],
        "daily_budget": int(tree["campaign"]["daily_budget_usd"] * 100),
        "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
    })

    for adset_spec in tree["adsets"]:
        adset = account.create_ad_set(params={
            "name": adset_spec["name"],
            "campaign_id": campaign["id"],
            "status": "PAUSED",
            "billing_event": "IMPRESSIONS",
            "optimization_goal": "CONVERSATIONS",
            "destination_type": "WHATSAPP",
            "promoted_object": {"page_id": PAGE_ID,
                                "whatsapp_phone_number": WHATSAPP_PHONE_NUMBER_ID},
            "targeting": base_targeting(AUDIENCES[adset_spec["key"]]),
        })
        for ad_spec in tree["ads"]:
            creative = account.create_ad_creative(params={
                "name": f"cr_{ad_spec['name']}_{adset_spec['key']}",
                "object_story_spec": {
                    "page_id": PAGE_ID,
                    "link_data": {
                        "message": ad_spec["message"],
                        "picture": ad_spec["image"],
                        "link": f"https://wa.me/{WHATSAPP_PHONE_NUMBER_ID}",
                        "call_to_action": {"type": "WHATSAPP_MESSAGE"},
                    },
                },
            })
            ad = account.create_ad(params={
                "name": f"{ad_spec['name']}_{adset_spec['key'].upper()}",
                "adset_id": adset["id"],
                "creative": {"creative_id": creative["id"]},
                "status": "PAUSED",
            })
            with db.connect() as con:
                con.execute(
                    """INSERT OR REPLACE INTO ads_map
                       (ad_id, campaign_id, adset_id, product_id, color, audience)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (ad["id"], campaign["id"], adset["id"],
                     ad_spec["product_id"], ad_spec["color"], adset_spec["key"]),
                )
    print(f"campaign {campaign['id']} created (PAUSED) — راجعها بمدير الإعلانات وفعّلها بنفسك")


if __name__ == "__main__":
    db.init()
    with open(PRODUCTS_PATH, encoding="utf-8") as f:
        products = json.load(f)
    tree = build_tree(products)
    n_ads = len(tree["ads"]) * len(tree["adsets"])
    print(f"الشجرة: حملة واحدة · {len(tree['adsets'])} مجموعتان · {len(tree['ads'])} كرييتف × 2 = {n_ads} إعلاناً")
    if "--dry-run" in sys.argv:
        print(json.dumps(tree, ensure_ascii=False, indent=2))
    else:
        create_all(tree)
