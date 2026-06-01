"""Coupons: validation, discount math, guards, and the usage-cap fix."""

GUEST = {
    "customer_name": "G",
    "customer_email": "g@x.com",
    "shipping_address": "s",
    "shipping_city": "Damascus",
    "shipping_country": "Syria",
    "payment_method": "cod",
}


def _make(client, auth, **kw):
    body = {"code": "C", "discount_type": "percent", "value": 10}
    body.update(kw)
    return client.post("/api/admin/coupons", json=body, headers=auth)


def test_percent_coupon_validation(client, auth):
    _make(client, auth, code="SAVE10", value=10, min_subtotal=20)
    res = client.post("/api/coupons/validate", json={"code": "SAVE10", "subtotal": 50})
    d = res.get_json()
    assert d["valid"] is True
    assert d["discount"] == 5.0


def test_percent_value_capped_at_100(client, auth):
    _make(client, auth, code="HUGE", value=500)
    coupons = client.get("/api/admin/coupons", headers=auth).get_json()
    assert next(c for c in coupons if c["code"] == "HUGE")["value"] == 100.0


def test_below_minimum_rejected(client, auth):
    _make(client, auth, code="MIN50", value=10, min_subtotal=50)
    res = client.post("/api/coupons/validate", json={"code": "MIN50", "subtotal": 10})
    assert res.get_json()["valid"] is False
    assert res.get_json()["reason"] == "min_subtotal"


def test_invalid_code(client):
    res = client.post("/api/coupons/validate", json={"code": "NOPE", "subtotal": 50})
    assert res.get_json()["valid"] is False


def test_usage_cap_cannot_be_exceeded(client, auth):
    # max_uses = 1: first order discounts, second gets none and count stays 1.
    _make(client, auth, code="ONCE", value=10, max_uses=1)

    def order():
        return client.post(
            "/api/orders",
            json={**GUEST, "items": [{"product_id": 1, "quantity": 1}], "coupon_code": "ONCE"},
        ).get_json()

    first = order()
    assert first["discount"] > 0
    assert first["coupon_code"] == "ONCE"

    second = order()
    assert second["discount"] == 0
    assert second["coupon_code"] is None

    used = next(
        c for c in client.get("/api/admin/coupons", headers=auth).get_json()
        if c["code"] == "ONCE"
    )["used_count"]
    assert used == 1
