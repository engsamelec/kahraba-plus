"""عقل الماكينة — قواعد القتل والتغذية (تعمل كل ساعة عبر cron).

الذكاء الحقيقي: القرار على الأرقام اللي ميتا ما بتشوفها — الرسائل والمبيعات
المستلمة من قاعدة بياناتنا، مقاطعةً مع الصرف من Insights API.

حماية مرحلة التعلم: أول LEARNING_GRACE_DAYS يوماً = وضع تقرير-فقط تلقائياً.
زيادة الميزانية لا تتم آلياً أبداً — الماكينة ترشّح، القرار قرارك (الدراسة §4).

cron: 0 * * * * cd /path/to/meta-machine && ./venv/bin/python rules.py >> rules.log 2>&1
"""
import datetime as dt

import requests

import db
from config import (
    ADS_TOKEN, GRAPH, TARGET_MSG_COST_USD, TARGET_SALE_COST_USD,
    LEARNING_GRACE_DAYS,
)

KILL_MSG_MULTIPLIER = 3   # صرف ≥ 3× كلفة الرسالة المستهدفة بلا أي رسالة ← إيقاف
KILL_SALE_MULTIPLIER = 2  # صرف ≥ 2× كلفة البيعة المستهدفة بلا أي بيعة ← إيقاف


def fetch_spend(ad_id: str) -> float:
    resp = requests.get(
        f"{GRAPH}/{ad_id}/insights",
        params={"fields": "spend", "date_preset": "last_7d", "access_token": ADS_TOKEN},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json().get("data", [])
    return float(data[0]["spend"]) if data else 0.0


def ad_stats(con, ad_id: str) -> dict:
    msgs = con.execute(
        "SELECT COUNT(*) FROM messages WHERE source_ad_id=? AND direction='in'", (ad_id,)
    ).fetchone()[0]
    sales = con.execute(
        "SELECT COUNT(*), COALESCE(SUM(value),0) FROM orders "
        "WHERE source_ad_id=? AND status IN ('confirmed','shipped','delivered')", (ad_id,)
    ).fetchone()
    delivered = con.execute(
        "SELECT COUNT(*) FROM orders WHERE source_ad_id=? AND status='delivered'", (ad_id,)
    ).fetchone()[0]
    return {"messages": msgs, "sales": sales[0], "revenue": sales[1], "delivered": delivered}


def decide(spend: float, stats: dict) -> tuple[str, str]:
    if stats["messages"] == 0 and spend >= KILL_MSG_MULTIPLIER * TARGET_MSG_COST_USD:
        return "pause", f"spend ${spend:.2f} ≥ {KILL_MSG_MULTIPLIER}x target msg cost, 0 messages"
    if stats["sales"] == 0 and spend >= KILL_SALE_MULTIPLIER * TARGET_SALE_COST_USD:
        return "pause", f"spend ${spend:.2f} ≥ {KILL_SALE_MULTIPLIER}x target sale cost, 0 sales"
    if stats["delivered"] > 0 and spend / stats["delivered"] <= TARGET_SALE_COST_USD:
        return "feed_candidate", (
            f"true CPA ${spend / stats['delivered']:.2f} ≤ target — مرشّح زيادة ميزانية (قرار يدوي)"
        )
    return "keep", "within thresholds"


def pause_ad(ad_id: str) -> None:
    requests.post(
        f"{GRAPH}/{ad_id}", data={"status": "PAUSED", "access_token": ADS_TOKEN}, timeout=30
    ).raise_for_status()


def campaign_age_days(con) -> int:
    row = con.execute("SELECT MIN(created) FROM ads_map").fetchone()
    if not row or not row[0]:
        return 0
    created = dt.datetime.fromisoformat(row[0])
    return (dt.datetime.utcnow() - created).days


def run() -> list[dict]:
    actions = []
    with db.connect() as con:
        dry_run = campaign_age_days(con) < LEARNING_GRACE_DAYS
        ads = con.execute("SELECT ad_id FROM ads_map WHERE status='active'").fetchall()
        for row in ads:
            ad_id = row["ad_id"]
            spend = fetch_spend(ad_id)
            stats = ad_stats(con, ad_id)
            action, reason = decide(spend, stats)
            if action == "pause" and not dry_run:
                pause_ad(ad_id)
                con.execute("UPDATE ads_map SET status='paused' WHERE ad_id=?", (ad_id,))
            con.execute(
                "INSERT INTO rule_actions(ad_id, action, reason, dry_run) VALUES (?,?,?,?)",
                (ad_id, action, reason, int(dry_run)),
            )
            actions.append({"ad_id": ad_id, "action": action, "reason": reason,
                            "dry_run": dry_run, "spend": spend, **stats})
    return actions


if __name__ == "__main__":
    for a in run():
        flag = " [DRY-RUN فترة تعلم]" if a["dry_run"] else ""
        print(f"{a['ad_id']}: {a['action']}{flag} — {a['reason']} "
              f"(msgs={a['messages']} sales={a['sales']} delivered={a['delivered']})")
