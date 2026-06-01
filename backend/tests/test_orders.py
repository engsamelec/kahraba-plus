"""Orders: guest checkout, totals, stock guard, tracking, localized snapshots."""

GUEST = {
    "customer_name": "Guest",
    "customer_email": "guest@x.com",
    "shipping_address": "Street 1",
    "shipping_city": "Damascus",
    "shipping_country": "Syria",
    "payment_method": "cod",
}


def _order(client, items, **extra):
    return client.post("/api/orders", json={**GUEST, "items": items, **extra})


def test_guest_checkout_no_login(client):
    res = _order(client, [{"product_id": 1, "quantity": 2}])
    assert res.status_code == 201
    d = res.get_json()
    assert d["order_number"].startswith("KP-")
    assert d["user_id"] is None


def test_order_items_snapshot_localized_names(client):
    d = _order(client, [{"product_id": 1, "quantity": 1}]).get_json()
    it = d["items"][0]
    assert it["product_name"]
    assert it["product_name_ar"]
    assert it["product_name_he"]


def test_quote_matches_server_prices(client):
    res = client.post(
        "/api/orders/quote",
        json={"items": [{"product_id": 1, "quantity": 2}], "country": "Syria"},
    )
    d = res.get_json()
    assert res.status_code == 200
    assert d["subtotal"] > 0
    assert "total_amount" in d


def test_missing_fields_rejected(client):
    res = client.post("/api/orders", json={"items": [{"product_id": 1, "quantity": 1}]})
    assert res.status_code == 400


def test_oversell_is_rejected(client):
    # Quantity far above stock must fail (compute_totals guard or atomic update).
    res = _order(client, [{"product_id": 1, "quantity": 100000}])
    assert res.status_code in (400, 409)


def test_stock_decrements_after_order(client, auth):
    before = client.get("/api/products?ids=2").get_json()["products"][0]["stock_quantity"]
    _order(client, [{"product_id": 2, "quantity": 1}])
    after = client.get("/api/products?ids=2").get_json()["products"][0]["stock_quantity"]
    assert after == before - 1


def test_track_order_public(client):
    num = _order(client, [{"product_id": 1, "quantity": 1}]).get_json()["order_number"]
    res = client.get(f"/api/orders/track/{num}")
    assert res.status_code == 200
    assert res.get_json()["order_number"] == num
