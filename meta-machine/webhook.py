"""مستقبِل واتساب Cloud API — باب البيت.

المهمة الحرجة: التقاط ctwa_clid + source_ad_id من كائن referral بأول رسالة
(البصمة اللي بتربط المحادثة بالإعلان — بدونها CAPI ما بينسب البيعة).
"""
from flask import Flask, request, jsonify

import db
from config import WEBHOOK_VERIFY_TOKEN

app = Flask(__name__)


def parse_referral(msg: dict) -> dict:
    """يستخرج بصمة الإعلان من رسالة واتساب واردة (إن وُجدت)."""
    ref = msg.get("referral") or {}
    return {
        "ctwa_clid": ref.get("ctwa_clid"),
        "source_ad_id": ref.get("source_id"),
        "source_url": ref.get("source_url"),
    }


def handle_incoming_message(msg: dict, contact: dict) -> dict:
    phone = msg.get("from", "")
    name = (contact.get("profile") or {}).get("name")
    ref = parse_referral(msg)
    body = (msg.get("text") or {}).get("body", "")

    with db.connect() as con:
        con.execute(
            """INSERT INTO customers(phone, name, ctwa_clid, source_ad_id, last_seen)
               VALUES (?, ?, ?, ?, datetime('now'))
               ON CONFLICT(phone) DO UPDATE SET
                 name=COALESCE(excluded.name, customers.name),
                 ctwa_clid=COALESCE(excluded.ctwa_clid, customers.ctwa_clid),
                 source_ad_id=COALESCE(excluded.source_ad_id, customers.source_ad_id),
                 last_seen=datetime('now')""",
            (phone, name, ref["ctwa_clid"], ref["source_ad_id"]),
        )
        con.execute(
            """INSERT OR IGNORE INTO messages(phone, wamid, direction, body, source_ad_id)
               VALUES (?, ?, 'in', ?, ?)""",
            (phone, msg.get("id"), body, ref["source_ad_id"]),
        )
    return {"phone": phone, **ref}


@app.get("/webhook")
def verify():
    if (
        request.args.get("hub.mode") == "subscribe"
        and request.args.get("hub.verify_token") == WEBHOOK_VERIFY_TOKEN
    ):
        return request.args.get("hub.challenge", ""), 200
    return "forbidden", 403


@app.post("/webhook")
def receive():
    payload = request.get_json(silent=True) or {}
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            contacts = {c.get("wa_id"): c for c in value.get("contacts", [])}
            for msg in value.get("messages", []):
                handle_incoming_message(msg, contacts.get(msg.get("from"), {}))
    return jsonify(status="ok"), 200


if __name__ == "__main__":
    db.init()
    app.run(host="0.0.0.0", port=8080)
