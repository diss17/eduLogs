"""Tests de autenticacion (/auth/login)."""
from app.config import JWT_SECRET_KEY


def test_login_inspector_ok(client):
    r = client.post("/auth/login", json={"email": "admin@edulogs.cl", "password": "123456"})
    assert r.status_code == 200
    body = r.json()
    assert body["rol"] == "inspector"
    assert body["access_token"]
    assert body["token_type"] == "bearer"


def test_login_password_incorrecta(client):
    r = client.post("/auth/login", json={"email": "admin@edulogs.cl", "password": "mala"})
    assert r.status_code == 401


def test_login_usuario_inexistente(client):
    r = client.post("/auth/login", json={"email": "noexiste@edulogs.cl", "password": "x"})
    assert r.status_code == 401


def test_login_payload_incompleto(client):
    r = client.post("/auth/login", json={"email": "admin@edulogs.cl"})
    assert r.status_code == 400


def test_root_y_health_sin_auth(client):
    assert client.get("/").status_code == 200
    assert client.get("/health").status_code == 200


def test_token_invalido_rechazado(client):
    r = client.get("/usuarios/me", headers={"Authorization": "Bearer noesunjwt"})
    assert r.status_code == 401
