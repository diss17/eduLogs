"""Tests RBAC de /usuarios/{id}/jefaturas."""
import uuid

import pytest

from tests.conftest import _delete_alumno_direct, _delete_jefatura_direct, _delete_user_direct


def test_inspector_asigna_jefatura_a_profesor_jefe(client, inspector, profesor_jefe):
    # jefatura ya asignada en el fixture sobre profesor_jefe["grado"]; asignar otra
    grado = profesor_jefe["grado"]
    # re-asignar la misma -> 400 (duplicada)
    r = client.post(f"/usuarios/{profesor_jefe['id']}/jefaturas", json={"grado": grado}, headers=inspector["headers"])
    assert r.status_code == 400


def test_inspector_no_asigna_jefatura_a_no_profesor_jefe(client, inspector, profesor):
    r = client.post(f"/usuarios/{profesor['id']}/jefaturas", json={"grado": "1° Básico A"}, headers=inspector["headers"])
    assert r.status_code == 400


def test_asignar_jefatura_grado_inexistente_400(client, inspector, profesor_jefe):
    r = client.post(f"/usuarios/{profesor_jefe['id']}/jefaturas", json={"grado": "NO-EXISTE-99"}, headers=inspector["headers"])
    assert r.status_code == 400


def test_asignar_jefatura_usuario_inexistente_404(client, inspector):
    r = client.post("/usuarios/999999/jefaturas", json={"grado": "1° Básico A"}, headers=inspector["headers"])
    assert r.status_code == 404


@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_asignar_jefatura_solo_inspector(client, inspector, profesor, profesor_jefe, rol):
    sess = profesor if rol == "profesor" else profesor_jefe
    r = client.post(f"/usuarios/{profesor_jefe['id']}/jefaturas", json={"grado": "1° Básico A"}, headers=sess["headers"])
    assert r.status_code == 403


def test_asignar_jefatura_sin_token_401(client, profesor_jefe):
    r = client.post(f"/usuarios/{profesor_jefe['id']}/jefaturas", json={"grado": "1° Básico A"})
    assert r.status_code == 401


def test_listar_jefaturas_inspector_ok(client, inspector, profesor_jefe):
    r = client.get(f"/usuarios/{profesor_jefe['id']}/jefaturas", headers=inspector["headers"])
    assert r.status_code == 200
    grados = [j["grado"] for j in r.json()]
    assert profesor_jefe["grado"] in grados


def test_listar_jefertas_propio_usuario_ok(client, profesor_jefe):
    r = client.get(f"/usuarios/{profesor_jefe['id']}/jefaturas", headers=profesor_jefe["headers"])
    assert r.status_code == 200
    assert profesor_jefe["grado"] in [j["grado"] for j in r.json()]


def test_listar_jefaturas_otro_usuario_403(client, profesor, profesor_jefe):
    # profesor quiere ver jefaturas del profesor_jefe
    r = client.get(f"/usuarios/{profesor_jefe['id']}/jefaturas", headers=profesor["headers"])
    assert r.status_code == 403


def test_listar_jefertas_usuario_inexistente_404(client, inspector):
    r = client.get("/usuarios/999999/jefaturas", headers=inspector["headers"])
    assert r.status_code == 404


@pytest.mark.parametrize("rol", ["profesor", "profesor_jefe"])
def test_eliminar_jefatura_solo_inspector(client, profesor, profesor_jefe, rol):
    sess = profesor if rol == "profesor" else profesor_jefe
    r = client.delete(f"/usuarios/{profesor_jefe['id']}/jefaturas?grado={profesor_jefe['grado']}", headers=sess["headers"])
    assert r.status_code == 403


def test_eliminar_jefatura_inexistente_404(client, inspector, profesor_jefe):
    r = client.delete(f"/usuarios/{profesor_jefe['id']}/jefaturas?grado=NO-EXISTE", headers=inspector["headers"])
    assert r.status_code == 404


def test_eliminar_jefatura_inspector_ok(client, inspector, profesor_jefe, suffix):
    # crear una jefatura extra para borrarla
    grado_extra = f"EXTRA-{suffix}"
    # necesita un alumno con ese grado para que la asignacion sea valida
    r = client.post(
        "/alumnos",
        json={"email": f"alum_extra_{suffix}@edulogs.cl", "nombre": "E", "apellido": "X", "grado": grado_extra},
        headers=inspector["headers"],
    )
    assert r.status_code == 201
    alumno_extra_id = r.json()["id"]
    r = client.post(f"/usuarios/{profesor_jefe['id']}/jefaturas", json={"grado": grado_extra}, headers=inspector["headers"])
    assert r.status_code == 201
    # borrar la jefatura extra
    r = client.delete(f"/usuarios/{profesor_jefe['id']}/jefaturas?grado={grado_extra}", headers=inspector["headers"])
    assert r.status_code == 204
    # limpiar alumno
    from tests.conftest import _delete_alumno_direct
    _delete_alumno_direct(alumno_extra_id)
