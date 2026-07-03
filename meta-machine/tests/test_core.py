"""اختبارات المسار الحرج — الأشياء اللي لو انكسرت بتخسر مصاري بصمت."""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DAILY_BUDGET_USD", "40")

import config

_tmp = tempfile.mkdtemp()
config.DB_PATH = os.path.join(_tmp, "test.db")

import db  # noqa: E402
import capi  # noqa: E402
import catalog  # noqa: E402
import rules  # noqa: E402
from webhook import parse_referral, handle_incoming_message  # noqa: E402

db.DB_PATH = config.DB_PATH


def setup_module():
    db.init()


# ---------- 1. التقاط البصمة (الخيط الذهبي) ----------

def test_referral_parsing_captures_ctwa_clid():
    msg = {"from": "972500000001", "id": "wamid.1",
           "text": {"body": "بدي البلوزة الكحلي"},
           "referral": {"ctwa_clid": "CLID123", "source_id": "AD789",
                        "source_url": "https://fb.me/xyz"}}
    ref = parse_referral(msg)
    assert ref["ctwa_clid"] == "CLID123" and ref["source_ad_id"] == "AD789"

    out = handle_incoming_message(msg, {"profile": {"name": "زبونة"}})
    assert out["ctwa_clid"] == "CLID123"
    with db.connect() as con:
        row = con.execute("SELECT * FROM customers WHERE phone='972500000001'").fetchone()
    assert row["source_ad_id"] == "AD789"


def test_second_message_without_referral_keeps_first_attribution():
    msg2 = {"from": "972500000001", "id": "wamid.2", "text": {"body": "شو المقاسات؟"}}
    handle_incoming_message(msg2, {})
    with db.connect() as con:
        row = con.execute("SELECT ctwa_clid FROM customers WHERE phone='972500000001'").fetchone()
    assert row["ctwa_clid"] == "CLID123"  # البصمة الأولى لا تُمسح


# ---------- 2. حدث CAPI صحيح + منع التكرار ----------

def test_purchase_event_shape():
    ev = capi.build_purchase_event("CLID123", 149.0, "ILS", "evt1")
    assert ev["action_source"] == "business_messaging"
    assert ev["messaging_channel"] == "whatsapp"
    assert ev["user_data"]["ctwa_clid"] == "CLID123"
    assert ev["custom_data"] == {"currency": "ILS", "value": 149.0}


def test_order_without_clid_not_sent():
    result = capi.record_order_and_send("972599999999", 100.0)
    assert result["sent"] is False and result["reason"] == "no_ctwa_clid"


def test_event_id_deterministic_for_dedup():
    assert capi._event_id("972500000001", 5) == capi._event_id("972500000001", 5)
    assert capi._event_id("972500000001", 5) != capi._event_id("972500000001", 6)


# ---------- 3. حارس الكتالوج ----------

VALID = {"id": "P1", "title": "بلوزة", "price": 89, "link": "https://wa.me/1",
         "product_type": "نساء > بلايز",
         "colors": [{"code": "NVY", "name": "Navy", "image": "https://cdn/a.jpg",
                     "sizes": {"S": True}}]}


def test_valid_product_generates_rows():
    rows = catalog.product_rows(VALID)
    assert rows[0]["item_group_id"] == "P1" and rows[0]["id"] == "P1-NVY-S"


def test_duplicate_color_images_rejected():
    bad = dict(VALID, colors=[
        {"code": "NVY", "name": "Navy", "image": "https://cdn/same.jpg", "sizes": {"S": True}},
        {"code": "BLK", "name": "Black", "image": "https://cdn/same.jpg", "sizes": {"S": True}},
    ])
    try:
        catalog.product_rows(bad)
        assert False, "يجب رفض صورتين متطابقتين للونين"
    except catalog.FeedError:
        pass


def test_protected_brand_rejected():
    try:
        catalog.product_rows(dict(VALID, brand_flag="protected"))
        assert False, "المنتج المحمي يجب ألا يدخل الإعلانات"
    except catalog.FeedError:
        pass


def test_price_guard():
    try:
        catalog.product_rows(dict(VALID, price=5000))
        assert False, "سعر خارج المدى يجب أن يُرفض"
    except catalog.FeedError:
        pass


# ---------- 4. منطق القتل/التغذية ----------

def test_kill_no_messages():
    action, _ = rules.decide(spend=3 * config.TARGET_MSG_COST_USD,
                             stats={"messages": 0, "sales": 0, "revenue": 0, "delivered": 0})
    assert action == "pause"


def test_kill_no_sales():
    action, _ = rules.decide(spend=2 * config.TARGET_SALE_COST_USD,
                             stats={"messages": 20, "sales": 0, "revenue": 0, "delivered": 0})
    assert action == "pause"


def test_feed_candidate_on_true_cpa():
    action, _ = rules.decide(spend=30.0,
                             stats={"messages": 25, "sales": 4, "revenue": 500, "delivered": 3})
    assert action == "feed_candidate"


def test_keep_during_normal_operation():
    action, _ = rules.decide(spend=2.0,
                             stats={"messages": 1, "sales": 0, "revenue": 0, "delivered": 0})
    assert action == "keep"
