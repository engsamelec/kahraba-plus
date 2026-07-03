"""إرسال أحداث الشراء لميتا (Conversions API) — فتح عيون الخوارزمية على مبيعات COD.

القواعد الحرجة (من الدراسة §5):
- action_source = "business_messaging" و messaging_channel = "whatsapp" — أي قيمة أخرى = الحدث لا يُنسب للإعلان.
- ميتا لا تعمل deduplication لأحداث المراسلة ← event_id فريد لكل طلبية ومخزّن عندنا.
"""
import hashlib
import time

import requests

import db
from config import CAPI_TOKEN, DATASET_ID, GRAPH, WABA_ID, CURRENCY


def _event_id(phone: str, order_id: int) -> str:
    return hashlib.sha256(f"{phone}:{order_id}".encode()).hexdigest()[:32]


def build_purchase_event(ctwa_clid: str, value: float, currency: str, event_id: str) -> dict:
    return {
        "event_name": "Purchase",
        "event_time": int(time.time()),
        "event_id": event_id,
        "action_source": "business_messaging",
        "messaging_channel": "whatsapp",
        "user_data": {
            "whatsapp_business_account_id": WABA_ID,
            "ctwa_clid": ctwa_clid,
        },
        "custom_data": {"currency": currency, "value": value},
    }


def record_order_and_send(phone: str, value: float, currency: str = CURRENCY) -> dict:
    """يسجّل طلبية مؤكدة ويرسل حدث Purchase — مرة واحدة فقط لكل طلبية."""
    with db.connect() as con:
        cust = con.execute(
            "SELECT ctwa_clid, source_ad_id FROM customers WHERE phone=?", (phone,)
        ).fetchone()
        ctwa_clid = cust["ctwa_clid"] if cust else None
        source_ad_id = cust["source_ad_id"] if cust else None

        cur = con.execute(
            """INSERT INTO orders(phone, value, currency, source_ad_id, ctwa_clid)
               VALUES (?, ?, ?, ?, ?)""",
            (phone, value, currency, source_ad_id, ctwa_clid),
        )
        order_id = cur.lastrowid
        event_id = _event_id(phone, order_id)

        dup = con.execute(
            "SELECT 1 FROM orders WHERE capi_event_id=?", (event_id,)
        ).fetchone()
        if dup:
            return {"sent": False, "reason": "duplicate", "order_id": order_id}
        con.execute("UPDATE orders SET capi_event_id=? WHERE id=?", (event_id, order_id))

    if not ctwa_clid:
        # طلبية بلا بصمة (زبون جاء من برا الإعلانات) — تُسجل محلياً ولا تُرسل
        return {"sent": False, "reason": "no_ctwa_clid", "order_id": order_id}

    event = build_purchase_event(ctwa_clid, value, currency, event_id)
    resp = requests.post(
        f"{GRAPH}/{DATASET_ID}/events",
        json={"data": [event], "access_token": CAPI_TOKEN},
        timeout=30,
    )
    resp.raise_for_status()
    return {"sent": True, "order_id": order_id, "event_id": event_id,
            "source_ad_id": source_ad_id, "response": resp.json()}


def mark_delivery(order_id: int, delivered: bool) -> None:
    """تحديث حالة الاستلام — الكلفة الحقيقية تُحسب على المستلم فعلياً."""
    status = "delivered" if delivered else "rejected"
    with db.connect() as con:
        con.execute(
            "UPDATE orders SET status=?, updated=datetime('now') WHERE id=?",
            (status, order_id),
        )
