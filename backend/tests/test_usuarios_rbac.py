"""Tests RBAC de /usuarios: solo INSPECTOR gestiona usuarios; /me cualquier autenticado."""
import uuid

import pytest

from tests.conftest import _delete_user_direct


def test_get_me_cualquier_autenticado(client, profesor):
    r = client.get("/usuarios/me", headers=profesor["headers"])
    assert r.status_code == 200
    assert r.json()["id"] == profesor["id"]


def test_get_me_sin_token_401(client):
    assert client.get("/usuarios/me").status_code == 401


@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_listar_usuarios_solo_inspector(client, inspector, profesor, profesor_jefe, rol):
    assert client.get("/usuarios", headers=inspector["headers"]).status_code == 200
    sess = profesor if rol == "profesor" else profesor_jefe
    assert client.get("/usuarios", headers=sess["headers"]).status_code == 403


def test_listar_usuarios_sin_token_401(client):
    assert client.get("/usuarios").status_code == 401


@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_crear_usuario_solo_inspector(client, inspector, profesor, profesor_jefe, suffix, rol):
    payload = {"email": f"new_{rol}_{suffix}@edulogs.cl", "nombre": "N", "apellido": "X", "rol": "profesor", "password": "x123456"}
    r = client.post("/usuarios", json=payload, headers=inspector["headers"])
    assert r.status_code == 201
    _delete_user_direct(r.json()["id"])
    payload["email"] = f"new2_{rol}_{suffix}@edulogs.cl"
    sess = profesor if rol == "profesor" else profesor_jefe
    assert client.post("/usuarios", json=payload, headers=sess["headers"]).status_code == 403


def test_crear_usuario_sin_token_401(client, suffix):
    payload = {"email": f"notok_{suffix}@edulogs.cl", "nombre": "N", "apellido": "X", "rol": "profesor", "password": "x123456"}
    assert client.post("/usuarios", json=payload).status_code == 401


@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_obtener_usuario_por_id_solo_inspector(client, inspector, profesor, profesor_jefe, rol):
    target = profesor["id"]
    assert client.get(f"/usuarios/{target}", headers=inspector["headers"]).status_code == 200
    sess = profesor if rol == "profesor" else profesor_jefe
    assert client.get(f"/usuarios/{target}", headers=sess["headers"]).status_code == 403


@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_actualizar_usuario_solo_inspector(client, inspector, profesor, profesor_jefe, rol):
    target = profesor["id"]
    assert client.put(f"/usuarios/{target}", json={"nombre": "Cambiado"}, headers=inspector["headers"]).status_code == 200
    sess = profesor if rol == "profesor" else profesor_jefe
    assert client.put(f"/usuarios/{target}", json={"nombre": "Hack"}, headers=sess["headers"]).status_code == 403


@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_eliminar_usuario_solo_inspector(client, inspector, profesor, profesor_jefe, rol):
    r = client.post(
        "/usuarios",
        json={"email": f"del_{rol}_{uuid.uuid4().hex[:6]}@edulogs.cl", "nombre": "D", "apellido": "X", "rol": "profesor", "password": "x123456"},
        headers=inspector["headers"],
    )
    assert r.status_code == 201
    del_id = r.json()["id"]
    assert client.delete(f"/usuarios/{del_id}", headers=inspector["headers"]).status_code == 204
    sess = profesor if rol == "profesor" else profesor_jefe
    assert client.delete(f"/usuarios/{profesor['id']}", headers=sess["headers"]).status_code == 403
