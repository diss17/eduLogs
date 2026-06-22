"""Tests RBAC de /alumnos: filtrado por rol + escritura solo INSPECTOR."""
import uuid

import pytest


# ==================== ESCRITURA (POST/PUT/DELETE) ====================
@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_crear_alumno_solo_inspector(client, inspector, profesor, profesor_jefe, suffix, rol):
    payload = {"email": f"alum_{rol}_{suffix}@edulogs.cl", "nombre": "A", "apellido": "B", "grado": "7° Básico A"}
    # inspector puede
    r = client.post("/alumnos", json=payload, headers=inspector["headers"])
    assert r.status_code == 201
    from tests.conftest import _delete_alumno_direct
    _delete_alumno_direct(r.json()["id"])
    # otros no
    payload["email"] = f"alum2_{rol}_{suffix}@edulogs.cl"
    sess = profesor if rol == "profesor" else profesor_jefe
    assert client.post("/alumnos", json=payload, headers=sess["headers"]).status_code == 403


def test_crear_alumno_sin_token_401(client, suffix):
    payload = {"email": f"alum_{suffix}@edulogs.cl", "nombre": "A", "apellido": "B", "grado": "7° Básico A"}
    assert client.post("/alumnos", json=payload).status_code == 401


@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_actualizar_alumno_solo_inspector(client, inspector, profesor, profesor_jefe, test_alumno, rol):
    assert client.put(f"/alumnos/{test_alumno['id']}", json={"nombre": "Cambiado"}, headers=inspector["headers"]).status_code == 200
    sess = profesor if rol == "profesor" else profesor_jefe
    assert client.put(f"/alumnos/{test_alumno['id']}", json={"nombre": "Hack"}, headers=sess["headers"]).status_code == 403


@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_eliminar_alumno_solo_inspector(client, inspector, profesor, profesor_jefe, test_alumno, rol):
    # crear desechable como inspector, borrarlo
    r = client.post("/alumnos", json={"email": f"del_alum_{rol}_{uuid.uuid4().hex[:6]}@edulogs.cl", "nombre": "D", "apellido": "X", "grado": "7° Básico A"}, headers=inspector["headers"])
    assert r.status_code == 201
    del_id = r.json()["id"]
    assert client.delete(f"/alumnos/{del_id}", headers=inspector["headers"]).status_code == 204
    sess = profesor if rol == "profesor" else profesor_jefe
    # otro intenta borrar un alumno inexistente -> 404 (no llega al check de rol porque _write_access falla primero)
    # para forzar 403 usamos un id existente: test_alumno
    assert client.delete(f"/alumnos/{test_alumno['id']}", headers=sess["headers"]).status_code == 403


# ==================== LECTURA: FILTRADO POR ROL ====================
def test_inspector_ve_todos_los_alumnos(client, inspector, test_alumno):
    r = client.get("/alumnos", headers=inspector["headers"])
    assert r.status_code == 200
    ids = {a["id"] for a in r.json()}
    assert test_alumno["id"] in ids


def test_profesor_jefe_ve_solo_sus_cursos(client, profesor_jefe):
    r = client.get("/alumnos", headers=profesor_jefe["headers"])
    assert r.status_code == 200
    alumnos = r.json()
    assert len(alumnos) > 0
    # todos los alumnos devueltos son del grado de su jefatura
    assert all(a["grado"] == profesor_jefe["grado"] for a in alumnos)
    assert any(a["id"] == profesor_jefe["alumno_id"] for a in alumnos)


def test_profesor_jefe_sin_jefaturas_no_ve_alumnos(client, inspector, suffix):
    # profesor_jefe sin jefaturas asignadas
    email = f"pj_sin_{suffix}@edulogs.cl"
    r = client.post("/usuarios", json={"email": email, "nombre": "PJ", "apellido": "Sin", "rol": "profesor_jefe", "password": "pj123456"}, headers=inspector["headers"])
    assert r.status_code == 201
    pj_id = r.json()["id"]
    login = client.post("/auth/login", json={"email": email, "password": "pj123456"}).json()
    headers = {"Authorization": f"Bearer {login['access_token']}"}
    r = client.get("/alumnos", headers=headers)
    assert r.status_code == 200
    assert r.json() == []  # sin jefaturas -> lista vacia
    from tests.conftest import _delete_user_direct
    _delete_user_direct(pj_id)


def test_profesor_ve_solo_alumnos_de_sus_incidentes(client, profesor, test_alumno):
    # profesor no ha registrado incidentes -> no ve alumnos
    r = client.get("/alumnos", headers=profesor["headers"])
    assert r.status_code == 200
    assert r.json() == []


def test_profesor_ve_alumno_tras_registrar_incidente(client, profesor, test_alumno):
    # registrar un incidente con el alumno de prueba
    r = client.post(
        "/incidentes",
        json={"titulo": "T", "descripcion": "D", "categoria": "bullying", "estado": "abierto", "ubicacion": "U", "alumno_ids": [test_alumno["id"]]},
        headers=profesor["headers"],
    )
    assert r.status_code == 201
    inc_id = r.json()["id"]
    # ahora profesor ve ese alumno
    r = client.get("/alumnos", headers=profesor["headers"])
    ids = {a["id"] for a in r.json()}
    assert test_alumno["id"] in ids
    from tests.conftest import _delete_incidente_direct
    _delete_incidente_direct(inc_id)


# ==================== GET /alumnos/{id} ownership ====================
def test_profesor_jefe_ve_alumno_de_su_curso(client, profesor_jefe):
    r = client.get(f"/alumnos/{profesor_jefe['alumno_id']}", headers=profesor_jefe["headers"])
    assert r.status_code == 200


def test_profesor_jefe_no_ve_alumno_ajeno(client, profesor_jefe, test_alumno):
    # test_alumno tiene grado distinto a la jefatura
    r = client.get(f"/alumnos/{test_alumno['id']}", headers=profesor_jefe["headers"])
    assert r.status_code == 403


def test_profesor_no_ve_alumno_sin_incidente(client, profesor, test_alumno):
    r = client.get(f"/alumnos/{test_alumno['id']}", headers=profesor["headers"])
    assert r.status_code == 403


def test_inspector_ve_alumno_cualquiera(client, inspector, test_alumno):
    r = client.get(f"/alumnos/{test_alumno['id']}", headers=inspector["headers"])
    assert r.status_code == 200


def test_get_alumno_inexistente_404(client, inspector):
    assert client.get("/alumnos/999999", headers=inspector["headers"]).status_code == 404


def test_get_alumno_sin_token_401(client):
    assert client.get("/alumnos/1").status_code == 401


# ==================== GET /alumnos/{id}/incidentes ====================
def test_profesor_jefe_ve_incidentes_de_su_alumno(client, profesor_jefe, inspector):
    # inspector crea un incidente sobre el alumno del profesor_jefe
    r = client.post(
        "/incidentes",
        json={"titulo": "T2", "descripcion": "D", "categoria": "violencia", "estado": "abierto", "ubicacion": "U", "alumno_ids": [profesor_jefe["alumno_id"]]},
        headers=inspector["headers"],
    )
    assert r.status_code == 201
    inc_id = r.json()["id"]
    # profesor_jefe ve los incidentes de su alumno
    r = client.get(f"/alumnos/{profesor_jefe['alumno_id']}/incidentes", headers=profesor_jefe["headers"])
    assert r.status_code == 200
    assert any(i["id"] == inc_id for i in r.json())
    from tests.conftest import _delete_incidente_direct
    _delete_incidente_direct(inc_id)


def test_profesor_jefe_no_ve_incidentes_de_alumno_ajeno(client, profesor_jefe, test_alumno):
    r = client.get(f"/alumnos/{test_alumno['id']}/incidentes", headers=profesor_jefe["headers"])
    assert r.status_code == 403


def test_profesor_solo_ve_sus_incidentes_del_alumno(client, profesor, test_alumno, inspector):
    # inspector crea incidente sobre test_alumno; profesor no lo registro -> no debe verlo
    r = client.post(
        "/incidentes",
        json={"titulo": "T3", "descripcion": "D", "categoria": "violencia", "estado": "abierto", "ubicacion": "U", "alumno_ids": [test_alumno["id"]]},
        headers=inspector["headers"],
    )
    inc_id = r.json()["id"]
    # primero profesor debe poder ver el alumno: registrar incidente propio
    r2 = client.post(
        "/incidentes",
        json={"titulo": "T4", "descripcion": "D", "categoria": "otro", "estado": "abierto", "ubicacion": "U", "alumno_ids": [test_alumno["id"]]},
        headers=profesor["headers"],
    )
    prof_inc_id = r2.json()["id"]
    r = client.get(f"/alumnos/{test_alumno['id']}/incidentes", headers=profesor["headers"])
    assert r.status_code == 200
    ids = {i["id"] for i in r.json()}
    assert prof_inc_id in ids
    assert inc_id not in ids  # el del inspector no lo ve
    from tests.conftest import _delete_incidente_direct
    _delete_incidente_direct(inc_id)
    _delete_incidente_direct(prof_inc_id)
