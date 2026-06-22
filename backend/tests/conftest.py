"""Fixtures compartidas para los tests RBAC de eduLogs.

Usa TestClient de FastAPI (no requiere server separado) contra la BD NeonDB real.
Para evitar throttle/colgado de NeonDB por apertura de conexion nueva por request
(NullPool), se sobreescribe get_db con un QueuePool compartido que reutiliza
conexiones. Crea datos unicos por sesion (sufijo uuid) y limpia en teardown.
"""
import sys
from pathlib import Path
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.main import app
from app.config import DATABASE_URL
from app.database import get_db
from app.models import Alumno, Incidente, ProfesorJefeCurso, Usuario

# Credenciales del inspector preexistente (sembrado manualmente)
INSPECTOR_EMAIL = "admin@edulogs.cl"
INSPECTOR_PASSWORD = "123456"

# Engine de test con QueuePool (reutiliza conexiones; evita throttle de NeonDB)
_test_url = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://")
if "channel_binding=require" in _test_url:
    _test_url = _test_url.replace("channel_binding=require", "channel_binding=prefer")
test_engine = create_engine(
    _test_url,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=5,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 10},
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


# Prefijos de datos que crea este suite (para limpieza pre/post sesion)
_TEST_USER_EMAIL_PATTERNS = ("test_prof_%", "test_pj_%", "pj_sin_%", "new_%", "new2_%", "del_%", "notok_%")
_TEST_ALUMNO_EMAIL_PATTERNS = ("alum_test_%", "alum_pj_%", "alum_extra_%")
_TEST_GRADO_PREFIXES = ("JEF-", "OTRO-", "EXTRA-")


def _cleanup_test_data():
    """Borra datos residuales de runs anteriores cancelados (prefijos especificos del suite)."""
    import sqlalchemy as sa
    db = TestSessionLocal()
    try:
        user_pat = _TEST_USER_EMAIL_PATTERNS
        where = " OR ".join(f"email LIKE :p{i}" for i in range(len(user_pat)))
        params = {f"p{i}": user_pat[i] for i in range(len(user_pat))}
        rows = db.execute(sa.text(f"SELECT id FROM usuarios WHERE {where}"), params).fetchall()
        test_user_ids = [r[0] for r in rows]
        if test_user_ids:
            ids_param = {"ids": test_user_ids}
            bp = sa.bindparam("ids", expanding=True)
            db.execute(sa.text("DELETE FROM profesor_jefe_cursos WHERE usuario_id IN :ids").bindparams(bp), ids_param)
            db.execute(sa.text("DELETE FROM incidentes WHERE funcionario_id IN :ids").bindparams(bp), ids_param)
            db.execute(sa.text("DELETE FROM usuarios WHERE id IN :ids").bindparams(bp), ids_param)
        # alumnos test (por grado o email)
        grado_pat = _TEST_GRADO_PREFIXES
        email_pat = _TEST_ALUMNO_EMAIL_PATTERNS
        gconds = " OR ".join(f"grado LIKE :g{i}" for i in range(len(grado_pat)))
        econds = " OR ".join(f"email LIKE :e{i}" for i in range(len(email_pat)))
        alum_params = {}
        for i, p in enumerate(grado_pat):
            alum_params[f"g{i}"] = p + "%"
        for i, p in enumerate(email_pat):
            alum_params[f"e{i}"] = p
        db.execute(sa.text(f"DELETE FROM alumnos WHERE {gconds} OR {econds}"), alum_params)
        db.commit()
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def _pre_clean():
    """Limpia residuos de runs cancelados antes de empezar; corre tambien al final via teardown de fixtures."""
    _cleanup_test_data()
    yield


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def suffix() -> str:
    return uuid.uuid4().hex[:8]


def _login(client, email, password):
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"login {email} -> {r.status_code} {r.text}"
    return r.json()


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def inspector(client):
    """Sesion del inspector preexistente."""
    data = _login(client, INSPECTOR_EMAIL, INSPECTOR_PASSWORD)
    assert data["rol"] == "inspector"
    return {"token": data["access_token"], "id": data["id"], "headers": _headers(data["access_token"])}


@pytest.fixture(scope="session")
def profesor(client, inspector, suffix):
    """Crea un usuario profesor, loguea, y lo limpia al final de la sesion."""
    email = f"test_prof_{suffix}@edulogs.cl"
    password = "prof123456"
    r = client.post(
        "/usuarios",
        json={"email": email, "nombre": "Prof", "apellido": "Test", "rol": "profesor", "password": password},
        headers=inspector["headers"],
    )
    assert r.status_code == 201, r.text
    user_id = r.json()["id"]
    data = _login(client, email, password)
    assert data["rol"] == "profesor"
    yield {"token": data["access_token"], "id": user_id, "headers": _headers(data["access_token"])}
    _delete_user_direct(user_id)


@pytest.fixture(scope="session")
def profesor_jefe(client, inspector, suffix):
    """Crea un profesor_jefe con una jefatura sobre un grado propio (con un alumno de prueba).

    Retorna token, id, grado de la jefatura y id del alumno de su curso.
    """
    email = f"test_pj_{suffix}@edulogs.cl"
    password = "pj123456"
    r = client.post(
        "/usuarios",
        json={"email": email, "nombre": "PJ", "apellido": "Test", "rol": "profesor_jefe", "password": password},
        headers=inspector["headers"],
    )
    assert r.status_code == 201, r.text
    user_id = r.json()["id"]

    grado = f"JEF-{suffix}"
    r = client.post(
        "/alumnos",
        json={"email": f"alum_pj_{suffix}@edulogs.cl", "nombre": "Alumno", "apellido": "Jefe", "grado": grado},
        headers=inspector["headers"],
    )
    assert r.status_code == 201, r.text
    alumno_id = r.json()["id"]

    r = client.post(
        f"/usuarios/{user_id}/jefaturas",
        json={"grado": grado},
        headers=inspector["headers"],
    )
    assert r.status_code == 201, r.text

    data = _login(client, email, password)
    assert data["rol"] == "profesor_jefe"
    yield {
        "token": data["access_token"],
        "id": user_id,
        "headers": _headers(data["access_token"]),
        "grado": grado,
        "alumno_id": alumno_id,
    }
    _delete_jefatura_direct(user_id, grado)
    _delete_alumno_direct(alumno_id)
    _delete_user_direct(user_id)


@pytest.fixture(scope="session")
def test_alumno(client, inspector, suffix):
    """Alumno de prueba creado por el inspector (grado fuera de la jefatura del profesor_jefe)."""
    grado = f"OTRO-{suffix}"
    r = client.post(
        "/alumnos",
        json={"email": f"alum_test_{suffix}@edulogs.cl", "nombre": "Alumno", "apellido": "Test", "grado": grado},
        headers=inspector["headers"],
    )
    assert r.status_code == 201, r.text
    alumno = r.json()
    alumno["grado"] = grado
    yield alumno
    _delete_alumno_direct(alumno["id"])


# ===== Helpers de limpieza directos a BD (robustos, sin depender de API) =====
def _delete_user_direct(user_id):
    db = TestSessionLocal()
    try:
        db.query(ProfesorJefeCurso).filter_by(usuario_id=user_id).delete()
        db.query(Usuario).filter_by(id=user_id).delete()
        db.commit()
    finally:
        db.close()


def _delete_alumno_direct(alumno_id):
    db = TestSessionLocal()
    try:
        db.query(Alumno).filter_by(id=alumno_id).delete()
        db.commit()
    finally:
        db.close()


def _delete_jefatura_direct(user_id, grado):
    db = TestSessionLocal()
    try:
        db.query(ProfesorJefeCurso).filter_by(usuario_id=user_id, grado=grado).delete()
        db.commit()
    finally:
        db.close()


def _delete_incidente_direct(incidente_id):
    db = TestSessionLocal()
    try:
        db.query(Incidente).filter_by(id=incidente_id).delete()
        db.commit()
    finally:
        db.close()
