"""Tests RBAC de /incidentes: visibilidad filtrada + escritura INSPECTOR/PROFESOR_JEFE."""
import uuid

import pytest

from tests.conftest import _delete_incidente_direct


def _crear_incidente(client, headers, alumno_ids=None, titulo="T"):
    payload = {"titulo": titulo, "descripcion": "D", "categoria": "bullying", "estado": "abierto", "ubicacion": "U"}
    if alumno_ids is not None:
        payload["alumno_ids"] = alumno_ids
    r = client.post("/incidentes", json=payload, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()["id"]


# ==================== POST /incidentes ====================
def test_crear_incidente_cualquier_autenticado(client, profesor, profesor_jefe, inspector):
    for sess in (inspector, profesor, profesor_jefe):
        inc_id = _crear_incidente(client, sess["headers"], titulo=f"T-{sess['id']}")
        _delete_incidente_direct(inc_id)


def test_crear_incidente_sin_token_401(client):
    r = client.post("/incidentes", json={"titulo": "T", "descripcion": "D", "categoria": "bullying", "estado": "abierto", "ubicacion": "U"})
    assert r.status_code == 401


def test_crear_incidente_funcionario_id_default_es_current_user(client, profesor):
    r = client.post("/incidentes", json={"titulo": "T", "descripcion": "D", "categoria": "bullying", "estado": "abierto", "ubicacion": "U"}, headers=profesor["headers"])
    assert r.status_code == 201
    assert r.json()["funcionario_id"] == profesor["id"]
    _delete_incidente_direct(r.json()["id"])


# ==================== GET /incidentes (visibilidad) ====================
def test_inspector_ve_todos(client, inspector, profesor, test_alumno):
    own = _crear_incidente(client, inspector["headers"])
    prof_inc = _crear_incidente(client, profesor["headers"], [test_alumno["id"]])
    r = client.get("/incidentes", headers=inspector["headers"])
    ids = {i["id"] for i in r.json()}
    assert own in ids and prof_inc in ids
    _delete_incidente_direct(own)
    _delete_incidente_direct(prof_inc)


def test_profesor_ve_solo_sus_incidentes(client, profesor, inspector):
    own = _crear_incidente(client, profesor["headers"])
    other = _crear_incidente(client, inspector["headers"])
    r = client.get("/incidentes", headers=profesor["headers"])
    ids = {i["id"] for i in r.json()}
    assert own in ids
    assert other not in ids
    _delete_incidente_direct(own)
    _delete_incidente_direct(other)


def test_profesor_jefe_ve_suyos_y_de_sus_alumnos(client, profesor_jefe, inspector):
    # incidente propio del PJ
    own = _crear_incidente(client, profesor_jefe["headers"])
    # incidente del inspector sobre el alumno del curso del PJ
    alum_inc = _crear_incidente(client, inspector["headers"], [profesor_jefe["alumno_id"]], titulo="sobre-alumno-pj")
    # incidente del inspector sobre un alumno ajeno al PJ
    other = _crear_incidente(client, inspector["headers"], titulo="ajeno")
    r = client.get("/incidentes", headers=profesor_jefe["headers"])
    ids = {i["id"] for i in r.json()}
    assert own in ids
    assert alum_inc in ids  # ve el de su alumno
    assert other not in ids
    _delete_incidente_direct(own)
    _delete_incidente_direct(alum_inc)
    _delete_incidente_direct(other)


def test_get_incidentes_sin_token_401(client):
    assert client.get("/incidentes").status_code == 401


# ==================== GET /incidentes/{id} ====================
def test_profesor_ve_su_incidente(client, profesor):
    inc_id = _crear_incidente(client, profesor["headers"])
    assert client.get(f"/incidentes/{inc_id}", headers=profesor["headers"]).status_code == 200
    _delete_incidente_direct(inc_id)


def test_profesor_no_ve_incidente_ajeno(client, profesor, inspector):
    other = _crear_incidente(client, inspector["headers"])
    assert client.get(f"/incidentes/{other}", headers=profesor["headers"]).status_code == 403
    _delete_incidente_direct(other)


def test_profesor_jefe_ve_incidente_sobre_su_alumno(client, profesor_jefe, inspector):
    inc_id = _crear_incidente(client, inspector["headers"], [profesor_jefe["alumno_id"]])
    assert client.get(f"/incidentes/{inc_id}", headers=profesor_jefe["headers"]).status_code == 200
    _delete_incidente_direct(inc_id)


def test_profesor_jefe_no_ve_incidente_ajeno(client, profesor_jefe, inspector, test_alumno):
    inc_id = _crear_incidente(client, inspector["headers"], [test_alumno["id"]])
    assert client.get(f"/incidentes/{inc_id}", headers=profesor_jefe["headers"]).status_code == 403
    _delete_incidente_direct(inc_id)


def test_get_incidente_inexistente_404(client, inspector):
    assert client.get("/incidentes/999999", headers=inspector["headers"]).status_code == 404


# ==================== GET /incidentes/{id}/alumnos ====================
def test_alumnos_de_incidente_visibilidad(client, profesor, inspector, profesor_jefe, test_alumno):
    inc_own = _crear_incidente(client, profesor["headers"], [test_alumno["id"]])
    # profesor ve alumnos de su incidente
    r = client.get(f"/incidentes/{inc_own}/alumnos", headers=profesor["headers"])
    assert r.status_code == 200
    assert any(a["id"] == test_alumno["id"] for a in r.json())
    # PJ no ve alumnos de incidente ajeno (no lo registro, no toca su curso)
    assert client.get(f"/incidentes/{inc_own}/alumnos", headers=profesor_jefe["headers"]).status_code == 403
    _delete_incidente_direct(inc_own)


# ==================== PUT /incidentes/{id} ====================
def test_inspector_edita_cualquiera(client, inspector, profesor):
    inc_id = _crear_incidente(client, profesor["headers"])
    r = client.put(f"/incidentes/{inc_id}", json={"titulo": "Editado"}, headers=inspector["headers"])
    assert r.status_code == 200
    assert r.json()["titulo"] == "Editado"
    _delete_incidente_direct(inc_id)


def test_profesor_no_edita_incidentes(client, profesor):
    inc_id = _crear_incidente(client, profesor["headers"])
    # profesor no esta en _write_access -> 403 siempre
    r = client.put(f"/incidentes/{inc_id}", json={"titulo": "Hack"}, headers=profesor["headers"])
    assert r.status_code == 403
    _delete_incidente_direct(inc_id)


def test_profesor_jefe_edita_suyo(client, profesor_jefe):
    inc_id = _crear_incidente(client, profesor_jefe["headers"])
    r = client.put(f"/incidentes/{inc_id}", json={"titulo": "PJ edit"}, headers=profesor_jefe["headers"])
    assert r.status_code == 200
    _delete_incidente_direct(inc_id)


def test_profesor_jefe_no_edita_ajeno(client, profesor_jefe, inspector):
    inc_id = _crear_incidente(client, inspector["headers"], [profesor_jefe["alumno_id"]])
    # aunque toca su alumno, no lo registro -> 403
    r = client.put(f"/incidentes/{inc_id}", json={"titulo": "Hack"}, headers=profesor_jefe["headers"])
    assert r.status_code == 403
    _delete_incidente_direct(inc_id)


def test_put_incidente_sin_token_401(client):
    assert client.put("/incidentes/1", json={"titulo": "x"}).status_code == 401


# ==================== DELETE /incidentes/{id} ====================
def test_inspector_elimina_cualquiera(client, inspector, profesor):
    inc_id = _crear_incidente(client, profesor["headers"])
    assert client.delete(f"/incidentes/{inc_id}", headers=inspector["headers"]).status_code == 204


def test_profesor_no_elimina(client, profesor):
    inc_id = _crear_incidente(client, profesor["headers"])
    assert client.delete(f"/incidentes/{inc_id}", headers=profesor["headers"]).status_code == 403
    _delete_incidente_direct(inc_id)


def test_profesor_jefe_elimina_suyo(client, profesor_jefe):
    inc_id = _crear_incidente(client, profesor_jefe["headers"])
    assert client.delete(f"/incidentes/{inc_id}", headers=profesor_jefe["headers"]).status_code == 204


def test_profesor_jefe_no_elimina_ajeno(client, profesor_jefe, inspector):
    inc_id = _crear_incidente(client, inspector["headers"], [profesor_jefe["alumno_id"]])
    assert client.delete(f"/incidentes/{inc_id}", headers=profesor_jefe["headers"]).status_code == 403
    _delete_incidente_direct(inc_id)


def test_delete_incidente_sin_token_401(client):
    assert client.delete("/incidentes/1").status_code == 401
