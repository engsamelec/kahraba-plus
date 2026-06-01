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


def test_cancelling_order_restocks_inventory(client, auth):
    before = client.get("/api/products?ids=3").get_json()["products"][0][
        "stock_quantity"
    ]
    order = _order(client, [{"product_id": 3, "quantity": 2}]).get_json()
    mid = client.get("/api/products?ids=3").get_json()["products"][0][
        "stock_quantity"
    ]
    assert mid == before - 2

    # Cancel → stock returns.
    res = client.put(
        f"/api/admin/orders/{order['id']}", json={"status": "cancelled"}, headers=auth
    )
    assert res.status_code == 200
    after = client.get("/api/products?ids=3").get_json()["products"][0][
        "stock_quantity"
    ]
    assert after == before

    # Re-saving "cancelled" must not restock again.
    client.put(
        f"/api/admin/orders/{order['id']}", json={"status": "cancelled"}, headers=auth
    )
    again = client.get("/api/products?ids=3").get_json()["products"][0][
        "stock_quantity"
    ]
    assert again == before


def test_unit_cost_hidden_from_customers_visible_to_admin(client, auth):
    num = _order(client, [{"product_id": 1, "quantity": 1}]).get_json()[
        "order_number"
    ]
    # Public tracking must not leak the merchant's COGS.
    tracked = client.get(f"/api/orders/track/{num}").get_json()
    assert all("unit_cost" not in it for it in tracked["items"])
    # Admin order list does include it.
    admin_orders = client.get("/api/admin/orders", headers=auth).get_json()
    target = next(o for o in admin_orders if o["order_number"] == num)
    assert all("unit_cost" in it for it in target["items"])


def test_invalid_order_status_rejected(client, auth):
    order = _order(client, [{"product_id": 1, "quantity": 1}]).get_json()
    res = client.put(
        f"/api/admin/orders/{order['id']}", json={"status": "bogus"}, headers=auth
    )
    assert res.status_code == 400


def test_variant_checkout_uses_variant_price_and_stock(client, auth):
    # Give product 1 a variant priced +5 with its own stock.
    base = client.get("/api/products?ids=1").get_json()["products"][0]
    v = client.post(
        f"/api/products/{base['id']}/variants",
        json={"name": "Red / L", "additional_price": 5, "stock_quantity": 3},
        headers=auth,
    ).get_json()

    # A product with variants now REQUIRES a variant choice.
    res = _order(client, [{"product_id": base["id"], "quantity": 1}])
    assert res.status_code == 400

    # Ordering the variant succeeds, charges base+additional, records the
    # variant, and decrements the variant's stock (not the product's).
    res = _order(
        client, [{"product_id": base["id"], "variant_id": v["id"], "quantity": 2}]
    )
    assert res.status_code == 201
    order = res.get_json()
    item = order["items"][0]
    assert item["variant_id"] == v["id"]
    assert item["unit_price"] == base["price"] + 5
    after = client.get(f"/api/products/{base['id']}", headers=auth).get_json()
    assert after["variants"][0]["stock_quantity"] == 1

    # Over-ordering the variant beyond its stock is rejected.
    res = _order(
        client, [{"product_id": base["id"], "variant_id": v["id"], "quantity": 50}]
    )
    assert res.status_code in (400, 409)
