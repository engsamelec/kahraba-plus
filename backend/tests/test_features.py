"""Accounting, Q&A, back-in-stock, geo language, visual search, config."""

GUEST = {
    "customer_name": "G",
    "customer_email": "g@x.com",
    "shipping_address": "s",
    "shipping_city": "Damascus",
    "shipping_country": "Syria",
    "payment_method": "cod",
}


# ---- store config / free shipping ----
def test_store_config(client):
    d = client.get("/api/config").get_json()
    assert d["free_shipping_threshold"] > 0


# ---- geo language ----
def test_geo_language_by_country(client):
    assert client.get("/api/geo/lang", headers={"CF-IPCountry": "IL"}).get_json()["lang"] == "he"
    assert client.get("/api/geo/lang", headers={"CF-IPCountry": "PS"}).get_json()["lang"] == "ar"
    assert client.get("/api/geo/lang", headers={"CF-IPCountry": "US"}).get_json()["lang"] == "en"


# ---- accounting ----
def test_accounting_profit(client, auth):
    client.post("/api/orders", json={**GUEST, "items": [{"product_id": 1, "quantity": 2}]})
    d = client.get("/api/admin/accounting", headers=auth).get_json()
    assert d["revenue"] > 0
    assert "gross_profit" in d
    assert "margin_percent" in d
    # demo costs are seeded, so profit should be computable
    assert d["items_with_cost"] >= 1


# ---- Q&A ----
def test_qa_flow(client, auth):
    # ask
    res = client.post("/api/products/1/questions", json={"body": "Does it run on 5V?"})
    assert res.status_code == 201
    # unanswered hidden from public
    assert client.get("/api/products/1/questions").get_json() == []
    # admin answers
    qid = client.get("/api/admin/questions", headers=auth).get_json()[0]["id"]
    client.put(f"/api/admin/questions/{qid}", json={"answer": "Yes."}, headers=auth)
    # now public
    pub = client.get("/api/products/1/questions").get_json()
    assert len(pub) == 1 and pub[0]["answer"] == "Yes."


def test_qa_too_short_rejected(client):
    assert client.post("/api/products/1/questions", json={"body": "x"}).status_code == 400


# ---- back-in-stock ----
def test_notify_stock(client, auth):
    assert client.post("/api/products/3/notify-stock", json={"email": "a@b.com"}).status_code == 201
    # duplicate dedupes
    dup = client.post("/api/products/3/notify-stock", json={"email": "a@b.com"}).get_json()
    assert dup.get("already") is True
    # invalid email
    assert client.post("/api/products/3/notify-stock", json={"email": "bad"}).status_code == 400
    # admin sees demand
    demand = client.get("/api/admin/stock-notifications", headers=auth).get_json()
    assert any(d["product_id"] == 3 for d in demand)


# ---- visual search ----
def test_store_config_editable_and_affects_quote(client, auth):
    # admin updates shipping + free-shipping threshold + tax
    res = client.put(
        "/api/admin/config",
        json={"free_shipping_threshold": 50, "domestic_shipping": 5, "tax_rate": 0.1},
        headers=auth,
    )
    assert res.status_code == 200 and res.get_json()["domestic_shipping"] == 5.0
    # public config reflects it
    assert client.get("/api/config").get_json()["free_shipping_threshold"] == 50.0
    # a small order now gets the new shipping + tax
    q = client.post(
        "/api/orders/quote",
        json={"items": [{"product_id": 1, "quantity": 1}], "country": "Syria"},
    ).get_json()
    assert q["shipping_cost"] == 5.0 and q["tax"] > 0
    # guards
    assert client.put("/api/admin/config", json={"domestic_shipping": "x"}, headers=auth).status_code == 400
    assert client.put("/api/admin/config", json={"tax_rate": 0.2}).status_code in (401, 422)


def test_newsletter_subscribe_persists(client, auth):
    assert client.post("/api/subscribe", json={"email": "bad"}).status_code == 400
    assert client.post("/api/subscribe", json={"email": "Fan@X.com"}).status_code == 201
    # idempotent re-subscribe
    assert client.post("/api/subscribe", json={"email": "fan@x.com"}).status_code == 201
    subs = client.get("/api/admin/subscribers", headers=auth).get_json()
    assert sum(1 for s in subs if s["email"] == "fan@x.com") == 1
    # admin-gated
    assert client.get("/api/admin/subscribers").status_code in (401, 422)


def test_admin_can_dismiss_stock_notifications(client, auth):
    # put product 2 out of stock and request notification
    client.put("/api/products/2", json={"stock_quantity": 0}, headers=auth)
    client.post("/api/products/2/notify-stock", json={"email": "a@b.com"})
    before = client.get("/api/admin/stock-notifications", headers=auth).get_json()
    assert any(r["product_id"] == 2 for r in before)
    # dismiss clears them
    res = client.post("/api/admin/stock-notifications/2/dismiss", headers=auth)
    assert res.status_code == 200 and res.get_json()["dismissed"] >= 1
    after = client.get("/api/admin/stock-notifications", headers=auth).get_json()
    assert all(r["product_id"] != 2 for r in after)


def test_visual_search_no_image(client):
    assert client.post("/api/visual-search", json={}).status_code == 400


def test_visual_search_rejects_oversized(client):
    # A payload that decodes to >8MB must be refused (413), not decoded.
    big = "data:image/png;base64," + ("A" * (13 * 1024 * 1024))
    assert client.post("/api/visual-search", json={"image": big}).status_code == 413


# ---- CSV import ----
def test_csv_import_preview_and_commit(client, auth):
    csv = "name,price,stock\nImported Item,4.5,10\nBad Row,,5"
    prev = client.post("/api/admin/import/preview", json={"csv": csv}, headers=auth).get_json()
    assert prev["valid"] == 1 and len(prev["errors"]) == 1

    res = client.post("/api/admin/import/commit", json={"csv": csv}, headers=auth).get_json()
    assert res["created"] == 1 and res["skipped"] == 1


def test_csv_export(client, auth):
    res = client.get("/api/admin/export", headers=auth)
    assert res.status_code == 200
    body = res.get_data(as_text=True)
    assert "product_number" in body.splitlines()[0]


# ---- promotions / offers ----
def test_promotion_requires_admin(client):
    res = client.post("/api/admin/promotions", json={"title": "x"})
    assert res.status_code in (401, 403, 422)


def test_promotion_lifecycle_and_public_live(client, auth):
    from datetime import date, timedelta

    today = date.today()
    # ends today → must still be live (end date is inclusive)
    res = client.post(
        "/api/admin/promotions",
        json={
            "title": "Eid",
            "title_ar": "عروض العيد",
            "coupon_code": "EID20",
            "starts_at": str(today - timedelta(days=2)),
            "ends_at": str(today),
        },
        headers=auth,
    )
    assert res.status_code == 201
    assert res.get_json()["live"] is True

    # an expired promo (ended yesterday) must not be live
    expired = client.post(
        "/api/admin/promotions",
        json={"title": "Old", "ends_at": str(today - timedelta(days=1))},
        headers=auth,
    ).get_json()
    assert expired["live"] is False

    # public endpoint returns only live ones
    live = client.get("/api/promotions").get_json()
    titles = {p["title"] for p in live}
    assert "Eid" in titles and "Old" not in titles
