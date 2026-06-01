"""Catalog: products, categories, search, filters, localization, variants."""


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_products_list_and_pagination(client):
    res = client.get("/api/products", query_string={"per_page": 5})
    data = res.get_json()
    assert res.status_code == 200
    assert len(data["products"]) == 5
    assert data["total"] >= 21


def test_product_has_trilingual_names_and_number(client, product):
    assert product["name"]
    assert product["name_ar"]
    assert product["name_he"]
    assert product["product_number"].startswith("KP-")


def test_product_detail_full_fields(client, product):
    res = client.get(f"/api/products/{product['slug']}")
    d = res.get_json()
    assert res.status_code == 200
    assert "technical_specs" in d
    assert "reviews" in d
    assert "bundle" in d  # frequently-bought-together


def test_duplicate_sku_returns_friendly_error_not_500(client, auth):
    client.post(
        "/api/products",
        json={"name": "A", "price": 1, "sku": "DUP-SKU-1"},
        headers=auth,
    )
    res = client.post(
        "/api/products",
        json={"name": "B", "price": 2, "sku": "DUP-SKU-1"},
        headers=auth,
    )
    assert res.status_code == 409  # not a raw 500


def test_negative_stock_is_clamped(client, auth):
    res = client.post(
        "/api/products",
        json={"name": "NegStock", "price": 5, "stock_quantity": -10},
        headers=auth,
    )
    assert res.status_code == 201
    assert res.get_json()["stock_quantity"] == 0


def test_delete_product_with_sales_archives_it(client, auth):
    pid = client.post(
        "/api/products",
        json={"name": "Sellable", "price": 5, "stock_quantity": 5},
        headers=auth,
    ).get_json()["id"]
    # place an order for it
    client.post(
        "/api/orders",
        json={
            "customer_name": "G", "customer_email": "g@x.com",
            "shipping_address": "s", "shipping_city": "Damascus",
            "shipping_country": "Syria", "payment_method": "cod",
            "items": [{"product_id": pid, "quantity": 1}],
        },
    )
    # deleting must archive (preserve history), not 500 / not hard-delete
    res = client.delete(f"/api/products/{pid}", headers=auth)
    assert res.status_code == 200
    assert res.get_json().get("archived") is True
    # it disappears from the active catalog
    listed = client.get("/api/products?per_page=100").get_json()["products"]
    assert all(p["id"] != pid for p in listed)


def test_cost_is_hidden_from_public_but_visible_to_admin(client, product, auth):
    # Public callers must never see the confidential unit cost (COGS),
    # neither in the list nor the detail response.
    detail = client.get(f"/api/products/{product['slug']}").get_json()
    assert "cost" not in detail
    listing = client.get("/api/products").get_json()
    assert all("cost" not in p for p in listing["products"])

    # Admins do see cost (needed to display/edit it without wiping it).
    admin_detail = client.get(
        f"/api/products/{product['slug']}", headers=auth
    ).get_json()
    assert "cost" in admin_detail
    admin_list = client.get("/api/products", headers=auth).get_json()
    assert all("cost" in p for p in admin_list["products"])


def test_search_and_category_filter(client):
    res = client.get("/api/products", query_string={"search": "arduino"})
    assert res.status_code == 200
    assert res.get_json()["total"] >= 1

    cats = client.get("/api/categories").get_json()
    assert len(cats) >= 1
    slug = cats[0]["slug"]
    res = client.get("/api/products", query_string={"category": slug})
    assert res.status_code == 200


def test_ids_filter_returns_only_requested(client):
    res = client.get("/api/products", query_string={"ids": "1,2,3"})
    ids = sorted(p["id"] for p in res.get_json()["products"])
    assert ids == [1, 2, 3]


def test_ids_filter_rejects_garbage(client):
    # Unknown ids must return nothing, never the whole catalog.
    res = client.get("/api/products", query_string={"ids": "abc,xyz"})
    assert res.get_json()["total"] == 0


def test_create_requires_admin(client):
    res = client.post("/api/products", json={"name": "x", "price": 1})
    assert res.status_code in (401, 422)


def test_admin_create_update_delete_product(client, auth):
    # create
    res = client.post(
        "/api/products",
        json={"name": "Test Widget", "price": 9.5, "stock_quantity": 7},
        headers=auth,
    )
    assert res.status_code == 201
    pid = res.get_json()["id"]
    assert res.get_json()["product_number"].startswith("KP-")

    # update
    res = client.put(f"/api/products/{pid}", json={"price": 12.0}, headers=auth)
    assert res.status_code == 200
    assert res.get_json()["price"] == 12.0

    # delete
    res = client.delete(f"/api/products/{pid}", headers=auth)
    assert res.status_code == 204


def test_negative_price_is_clamped(client, auth):
    res = client.post(
        "/api/products",
        json={"name": "Neg", "price": -50, "stock_quantity": 1},
        headers=auth,
    )
    assert res.get_json()["price"] == 0.0


def test_variant_crud_and_detail(client, auth):
    res = client.post(
        "/api/products/1/variants",
        json={"size": "L", "color": "Black", "additional_price": 2, "stock_quantity": 4},
        headers=auth,
    )
    assert res.status_code == 201
    vid = res.get_json()["id"]

    detail = client.get("/api/products/1/variants").get_json()
    assert any(v["id"] == vid for v in detail)

    res = client.put(f"/api/variants/{vid}", json={"stock_quantity": 9}, headers=auth)
    assert res.get_json()["stock_quantity"] == 9

    assert client.delete(f"/api/variants/{vid}", headers=auth).status_code == 204
