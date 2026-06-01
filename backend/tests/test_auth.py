"""Authentication: register, login, profile, guards."""


def test_register_and_login(client):
    res = client.post(
        "/api/auth/register",
        json={"email": "new@user.com", "password": "secret123", "first_name": "New"},
    )
    assert res.status_code == 201
    assert res.get_json()["token"]

    res = client.post(
        "/api/auth/login", json={"email": "new@user.com", "password": "secret123"}
    )
    assert res.status_code == 200
    assert res.get_json()["user"]["email"] == "new@user.com"


def test_register_rejects_bad_email_and_short_password(client):
    assert client.post("/api/auth/register", json={"email": "bad", "password": "x" * 8}).status_code == 400
    assert client.post("/api/auth/register", json={"email": "a@b.com", "password": "123"}).status_code == 400


def test_duplicate_email_rejected(client):
    client.post("/api/auth/register", json={"email": "dup@x.com", "password": "secret123"})
    res = client.post("/api/auth/register", json={"email": "dup@x.com", "password": "secret123"})
    assert res.status_code == 409


def test_login_wrong_password(client):
    res = client.post(
        "/api/auth/login",
        json={"email": "admin@kahrabaplus.com", "password": "wrong"},
    )
    assert res.status_code == 401


def test_me_requires_auth(client, auth):
    assert client.get("/api/auth/me").status_code in (401, 422)
    res = client.get("/api/auth/me", headers=auth)
    assert res.status_code == 200
    assert res.get_json()["user"]["role"] == "admin"


def test_non_admin_cannot_reach_admin_endpoints(client):
    client.post("/api/auth/register", json={"email": "cust@x.com", "password": "secret123"})
    tok = client.post(
        "/api/auth/login", json={"email": "cust@x.com", "password": "secret123"}
    ).get_json()["token"]
    headers = {"Authorization": f"Bearer {tok}"}
    assert client.get("/api/admin/stats", headers=headers).status_code == 403
    assert client.get("/api/admin/accounting", headers=headers).status_code == 403
