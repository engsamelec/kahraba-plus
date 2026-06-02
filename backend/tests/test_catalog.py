"""Catalog: products, categories, search, filters, localization, variants."""


def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "ok"


def test_robots_and_sitemap(client):
    robots = client.get("/robots.txt")
    assert robots.status_code == 200
    assert "Sitemap:" in robots.get_data(as_text=True)
    assert "Disallow: /admin" in robots.get_data(as_text=True)

    sm = client.get("/sitemap.xml")
    assert sm.status_code == 200
    body = sm.get_data(as_text=True)
    assert "<urlset" in body and "/product/" in body


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


def test_category_crud_admin_only(client, auth):
    # create
    res = client.post(
        "/api/categories",
        json={"name": "Cables", "name_ar": "كابلات", "name_he": "כבלים", "icon": "Cable"},
        headers=auth,
    )
    assert res.status_code == 201
    cid = res.get_json()["id"]
    assert res.get_json()["name_he"] == "כבלים"
    # update
    res = client.put(f"/api/categories/{cid}", json={"name_ar": "أسلاك"}, headers=auth)
    assert res.status_code == 200 and res.get_json()["name_ar"] == "أسلاك"
    # non-admin cannot create/delete
    assert client.post("/api/categories", json={"name": "x"}).status_code in (401, 403, 422)
    assert client.delete(f"/api/categories/{cid}").status_code in (401, 403, 422)
    # delete
    assert client.delete(f"/api/categories/{cid}", headers=auth).status_code == 204


def test_deleting_category_detaches_products_not_deletes_them(client, auth):
    cid = client.post(
        "/api/categories", json={"name": "Temp"}, headers=auth
    ).get_json()["id"]
    pid = client.post(
        "/api/products",
        json={"name": "InTemp", "price": 3, "category_id": cid},
        headers=auth,
    ).get_json()["id"]
    assert client.delete(f"/api/categories/{cid}", headers=auth).status_code == 204
    # product survives, just unlinked
    p = client.get(f"/api/products/{pid}").get_json()
    assert p["category_id"] is None


def test_inactive_products_hidden_publicly_visible_to_admin(client, auth):
    pid = client.post(
        "/api/products",
        json={"name": "Hidden One", "price": 9, "is_active": False},
        headers=auth,
    ).get_json()["id"]
    public = client.get("/api/products?per_page=100").get_json()["products"]
    assert all(p["id"] != pid for p in public)
    admin = client.get(
        "/api/products?per_page=100&include_inactive=true", headers=auth
    ).get_json()["products"]
    assert any(p["id"] == pid for p in admin)


def test_inactive_product_detail_hidden_from_public(client, auth):
    pid = client.post(
        "/api/products",
        json={"name": "SecretDraft", "price": 9, "is_active": False},
        headers=auth,
    ).get_json()["id"]
    # public detail + variants must 404
    assert client.get(f"/api/products/{pid}").status_code == 404
    assert client.get(f"/api/products/{pid}/variants").status_code == 404
    # admin can still see it
    assert client.get(f"/api/products/{pid}", headers=auth).status_code == 200


def test_invalid_category_id_dropped(client, auth):
    res = client.post(
        "/api/products",
        json={"name": "Orphan", "price": 5, "category_id": 99999},
        headers=auth,
    )
    assert res.status_code == 201 and res.get_json()["category_id"] is None


def test_category_parent_must_exist_and_no_cycle(client, auth):
    a = client.post("/api/categories", json={"name": "A"}, headers=auth).get_json()["id"]
    b = client.post("/api/categories", json={"name": "B"}, headers=auth).get_json()["id"]
    # non-existent parent rejected
    assert client.post("/api/categories", json={"name": "C", "parent_id": 99999}, headers=auth).status_code == 400
    # B under A is fine
    assert client.put(f"/api/categories/{b}", json={"parent_id": a}, headers=auth).status_code == 200
    # A under B would cycle -> rejected
    assert client.put(f"/api/categories/{a}", json={"parent_id": b}, headers=auth).status_code == 400
    # self-parent rejected
    assert client.put(f"/api/categories/{a}", json={"parent_id": a}, headers=auth).status_code == 400


def test_import_rejects_negative_price_and_clamps_stock(client, auth):
    bad = "name,price,stock\nNeg,-5,10"
    prev = client.post("/api/admin/import/preview", json={"csv": bad}, headers=auth).get_json()
    assert prev["valid"] == 0 and len(prev["errors"]) == 1
    # a negative stock is clamped to 0 on commit
    csv = "name,price,stock\nClampMe,7,-3"
    client.post("/api/admin/import/commit", json={"csv": csv}, headers=auth)
    p = [x for x in client.get("/api/products?per_page=100&include_inactive=true", headers=auth).get_json()["products"] if x["name"] == "ClampMe"][0]
    assert p["stock_quantity"] == 0


def test_bulk_price_and_visibility(client, auth):
    before = {
        p["id"]: p["price"]
        for p in client.get("/api/products?ids=1,2").get_json()["products"]
    }
    # +10% on two products
    res = client.post(
        "/api/products/bulk",
        json={"product_ids": [1, 2], "action": "price_percent", "value": 10},
        headers=auth,
    )
    assert res.status_code == 200 and res.get_json()["updated"] == 2
    after = {
        p["id"]: p["price"]
        for p in client.get("/api/products?ids=1,2").get_json()["products"]
    }
    assert after[1] == round(before[1] * 1.1, 2)

    # bulk hide → gone from public, still visible to admin
    client.post(
        "/api/products/bulk",
        json={"product_ids": [1], "action": "deactivate"},
        headers=auth,
    )
    pub = client.get("/api/products?ids=1,2").get_json()["products"]
    assert all(p["id"] != 1 for p in pub)

    # guards
    assert client.post("/api/products/bulk", json={"product_ids": [], "action": "activate"}, headers=auth).status_code == 400
    assert client.post("/api/products/bulk", json={"product_ids": [1], "action": "x"}, headers=auth).status_code == 400
    assert client.post("/api/products/bulk", json={"product_ids": [1], "action": "activate"}).status_code in (401, 422)


def test_admin_can_edit_product_number_and_slug(client, auth):
    pid = client.post(
        "/api/products", json={"name": "Editable", "price": 4}, headers=auth
    ).get_json()["id"]
    res = client.put(
        f"/api/products/{pid}",
        json={"product_number": "KP-CUSTOM-9", "slug": "totally-custom"},
        headers=auth,
    )
    assert res.status_code == 200
    assert res.get_json()["product_number"] == "KP-CUSTOM-9"
    assert res.get_json()["slug"] == "totally-custom"


def test_admin_can_delete_review_and_rating_recomputes(client, auth):
    # a customer leaves a review
    client.post("/api/auth/register", json={"email": "rev@x.com", "password": "secret123"})
    tok = client.post(
        "/api/auth/login", json={"email": "rev@x.com", "password": "secret123"}
    ).get_json()["token"]
    ch = {"Authorization": f"Bearer {tok}"}
    client.post("/api/products/1/reviews", json={"rating": 1, "comment": "spam"}, headers=ch)
    detail = client.get("/api/products/1").get_json()
    assert detail["rating_count"] >= 1
    rid = detail["reviews"][0]["id"]
    # admin removes it
    assert client.delete(f"/api/admin/reviews/{rid}", headers=auth).status_code == 204
    # non-admin cannot
    assert client.delete(f"/api/admin/reviews/{rid}", headers=ch).status_code in (401, 403, 404)
    after = client.get("/api/products/1").get_json()
    assert all(r["id"] != rid for r in after["reviews"])


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
