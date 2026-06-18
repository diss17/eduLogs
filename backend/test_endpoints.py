"""
Script para probar todos los endpoints de eduLogs.
Usa requests para hacer llamadas HTTP a la API.

Pre-requisitos:
- Servidor backend corriendo en http://localhost:8000
- Usuario admin sembrado con email TEST_ADMIN_EMAIL y password TEST_ADMIN_PASSWORD
"""
import requests
import json
import sys
import time
import uuid

# Configuration
BASE_URL = "http://localhost:8000"
TEST_ADMIN_EMAIL = "admin@edulogs.cl"
TEST_ADMIN_PASSWORD = "123456"

# Color codes for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"


def print_test(message, success=True):
    color = GREEN if success else RED
    symbol = "OK" if success else "FAIL"
    print(f"{color}[{symbol}]{RESET} {message}")


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def login(email, password):
    """Autentica un usuario y devuelve el access_token. None si falla."""
    resp = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": email, "password": password},
        timeout=10,
    )
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None


def test_health():
    """Test health endpoint."""
    print("\n" + "=" * 60)
    print("Testing Health Endpoint")
    print("=" * 60)
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=10)
        if resp.status_code == 200:
            print_test("Health check: OK")
            return True
        print_test(f"Health check failed: {resp.status_code}", False)
        return False
    except Exception as e:
        print_test(f"Connection error: {str(e)}", False)
        return False


def test_login_admin():
    """Login como admin y devuelve (token, user_id)."""
    print("\n" + "=" * 60)
    print("Testing Admin Login")
    print("=" * 60)
    token = login(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
    if not token:
        print_test(
            f"Login admin failed. Verifica que {TEST_ADMIN_EMAIL} exista con password {TEST_ADMIN_PASSWORD}",
            False,
        )
        return None, None

    # Obtener el perfil del usuario autenticado
    resp = requests.get(
        f"{BASE_URL}/usuarios/me",
        headers=auth_headers(token),
        timeout=10,
    )
    if resp.status_code == 200:
        admin_id = resp.json()["id"]
        print_test(f"Login admin: token obtained, id={admin_id}")
        return token, admin_id

    print_test(f"Get /usuarios/me failed: {resp.status_code} - {resp.text}", False)
    return None, None


def test_crear_funcionario(admin_token):
    """Crea un usuario funcionario para usar como funcionario_id explícito."""
    suffix = uuid.uuid4().hex[:8]
    user_data = {
        "email": f"funcionario_{suffix}@example.com",
        "nombre": "Funcionario",
        "apellido": "Test",
        "rol": "profesor",
        "password": "funcionario123",
    }
    resp = requests.post(
        f"{BASE_URL}/usuarios",
        json=user_data,
        headers=auth_headers(admin_token),
        timeout=10,
    )
    if resp.status_code == 201:
        user_id = resp.json()["id"]
        print_test(f"Create funcionario: ID {user_id}")
        return user_id
    print_test(
        f"Create funcionario failed: {resp.status_code} - {resp.text}", False
    )
    return None


def test_crear_alumno(admin_token):
    """Crea un alumno de prueba."""
    suffix = uuid.uuid4().hex[:8]
    alumno_data = {
        "email": f"alumno_{suffix}@example.com",
        "nombre": "Alumno",
        "apellido": "Test",
        "grado": "9A",
    }
    resp = requests.post(
        f"{BASE_URL}/alumnos",
        json=alumno_data,
        headers=auth_headers(admin_token),
        timeout=10,
    )
    if resp.status_code == 201:
        alumno_id = resp.json()["id"]
        print_test(f"Create alumno: ID {alumno_id}")
        return alumno_id
    print_test(f"Create alumno failed: {resp.status_code} - {resp.text}", False)
    return None


# =====================================================================
# Test 1: POST /incidentes con todos los campos -> 201, persistido,
#         funcionario_id = current_user, estado = "abierto"
# =====================================================================
def test_incidente_crear_exitoso(admin_token, admin_id, alumno_id):
    print("\n" + "=" * 60)
    print("Test 1: POST /incidentes exitoso (201)")
    print("=" * 60)

    suffix = uuid.uuid4().hex[:8]
    incidente_data = {
        "titulo": f"Incidente Test 1 {suffix}",
        "descripcion": "Incidente creado por el test automatizado",
        "categoria": "bullying",
        "estado": "abierto",
        "ubicacion": "Aula 101",
        "alumno_ids": [alumno_id],
    }

    # POST sin funcionario_id -> debe asignarse al current_user (admin)
    resp = requests.post(
        f"{BASE_URL}/incidentes",
        json=incidente_data,
        headers=auth_headers(admin_token),
        timeout=10,
    )

    if resp.status_code != 201:
        print_test(
            f"Create incidente failed: {resp.status_code} - {resp.text}", False
        )
        return None

    incidente = resp.json()
    incidente_id = incidente.get("id")
    print_test(f"POST /incidentes -> 201 (id={incidente_id})")

    # Aserciones
    assert incidente.get("titulo") == incidente_data["titulo"], "titulo no coincide"
    print_test("titulo coincide con el enviado")

    assert incidente.get("funcionario_id") == admin_id, (
        f"funcionario_id esperado {admin_id}, recibido {incidente.get('funcionario_id')}"
    )
    print_test(f"funcionario_id = admin_id ({admin_id}) por default")

    assert incidente.get("estado") == "abierto", (
        f"estado esperado 'abierto', recibido {incidente.get('estado')}"
    )
    print_test("estado = 'abierto'")

    # Verificar persistencia: GET /incidentes/{id}
    resp_get = requests.get(
        f"{BASE_URL}/incidentes/{incidente_id}",
        headers=auth_headers(admin_token),
        timeout=10,
    )
    if resp_get.status_code != 200:
        print_test(
            f"GET /incidentes/{incidente_id} fallo: {resp_get.status_code}", False
        )
        return None
    persisted = resp_get.json()
    assert persisted.get("id") == incidente_id, "id persistido no coincide"
    assert persisted.get("funcionario_id") == admin_id, (
        "funcionario_id persistido no coincide"
    )
    print_test("Incidente persistido en BD (verificado via GET /incidentes/{id})")

    return incidente_id


# =====================================================================
# Test 2: POST /incidentes con validaciones
#   Sub-test A: campos obligatorios faltantes -> 400
#   Sub-test B: sin token -> 401
# =====================================================================
def test_incidente_crear_validacion(admin_token, alumno_id):
    print("\n" + "=" * 60)
    print("Test 2: POST /incidentes con validaciones")
    print("=" * 60)

    # --- Sub-test A: campos obligatorios faltantes -> 400 ---
    print("\n  Sub-test A: campos obligatorios faltantes")
    incidente_incompleto = {
        # "titulo" omitido a proposito
        "descripcion": "Falta el titulo",
        "categoria": "violencia",
        "estado": "abierto",
        "ubicacion": "Patio",
        "alumno_ids": [alumno_id],
    }

    # Contar incidentes antes
    resp_list_before = requests.get(
        f"{BASE_URL}/incidentes",
        headers=auth_headers(admin_token),
        timeout=10,
    )
    count_before = len(resp_list_before.json()) if resp_list_before.status_code == 200 else 0

    resp = requests.post(
        f"{BASE_URL}/incidentes",
        json=incidente_incompleto,
        headers=auth_headers(admin_token),
        timeout=10,
    )
    if resp.status_code != 400:
        print_test(
            f"Esperado 400 por campos faltantes, recibido {resp.status_code} - {resp.text}",
            False,
        )
    else:
        print_test("POST /incidentes sin 'titulo' -> 400")

    # Verificar que no se persistio
    resp_list_after = requests.get(
        f"{BASE_URL}/incidentes",
        headers=auth_headers(admin_token),
        timeout=10,
    )
    count_after = len(resp_list_after.json()) if resp_list_after.status_code == 200 else 0
    if count_after == count_before:
        print_test(f"Ningun incidente persistido (count={count_after})")
    else:
        print_test(
            f"Se persistio un incidente no deseado (count {count_before} -> {count_after})",
            False,
        )

    # --- Sub-test B: sin token -> 401 ---
    print("\n  Sub-test B: sin token de autenticacion")
    incidente_data = {
        "titulo": "Sin token",
        "descripcion": "No deberia poder crearse",
        "categoria": "otro",
        "estado": "abierto",
        "ubicacion": "X",
    }
    resp = requests.post(
        f"{BASE_URL}/incidentes",
        json=incidente_data,
        timeout=10,  # sin headers de Authorization
    )
    if resp.status_code != 401:
        print_test(
            f"Esperado 401 sin token, recibido {resp.status_code} - {resp.text}",
            False,
        )
    else:
        print_test("POST /incidentes sin Authorization -> 401")


def test_listar_incidentes(admin_token):
    print("\n" + "=" * 60)
    print("Testing GET /incidentes")
    print("=" * 60)
    resp = requests.get(
        f"{BASE_URL}/incidentes",
        headers=auth_headers(admin_token),
        timeout=10,
    )
    if resp.status_code == 200:
        incidentes = resp.json()
        print_test(f"List incidentes: {len(incidentes)} encontrados")
        return True
    print_test(f"List incidentes failed: {resp.status_code} - {resp.text}", False)
    return False


def test_obtener_incidente(admin_token, incidente_id):
    print("\n" + "=" * 60)
    print("Testing GET /incidentes/{id}")
    print("=" * 60)
    resp = requests.get(
        f"{BASE_URL}/incidentes/{incidente_id}",
        headers=auth_headers(admin_token),
        timeout=10,
    )
    if resp.status_code == 200:
        print_test(f"Get incidente by ID: {incidente_id}")
        return True
    print_test(f"Get incidente failed: {resp.status_code} - {resp.text}", False)
    return False


def test_obtener_alumnos_incidente(admin_token, incidente_id):
    print("\n" + "=" * 60)
    print("Testing GET /incidentes/{id}/alumnos")
    print("=" * 60)
    resp = requests.get(
        f"{BASE_URL}/incidentes/{incidente_id}/alumnos",
        headers=auth_headers(admin_token),
        timeout=10,
    )
    if resp.status_code == 200:
        alumnos = resp.json()
        print_test(f"Get alumnos in incidente: {len(alumnos)} encontrados")
        return True
    print_test(
        f"Get alumnos in incidente failed: {resp.status_code} - {resp.text}", False
    )
    return False


def test_alumnos_incidente(admin_token, alumno_id):
    print("\n" + "=" * 60)
    print("Testing GET /alumnos/{id}/incidentes")
    print("=" * 60)
    resp = requests.get(
        f"{BASE_URL}/alumnos/{alumno_id}/incidentes",
        headers=auth_headers(admin_token),
        timeout=10,
    )
    if resp.status_code == 200:
        incidentes = resp.json()
        print_test(f"Get incidentes for alumno: {len(incidentes)} encontrados")
        return True
    print_test(
        f"Get incidentes for alumno failed: {resp.status_code} - {resp.text}", False
    )
    return False


def main():
    print("\n" + "=" * 60)
    print("eduLogs - Endpoint Testing Script")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")

    # 1) Health
    if not test_health():
        print(f"\n{RED}No se puede conectar al servidor. Asegurate que este corriendo:{RESET}")
        print("  cd backend && uvicorn app.main:app --reload")
        return False

    # 2) Login admin
    admin_token, admin_id = test_login_admin()
    if not admin_token:
        return False

    # 3) Crear recursos base
    funcionario_id = test_crear_funcionario(admin_token)
    if not funcionario_id:
        return False

    alumno_id = test_crear_alumno(admin_token)
    if not alumno_id:
        return False

    # 4) Test 1 - POST exitoso
    incidente_id = test_incidente_crear_exitoso(admin_token, admin_id, alumno_id)
    if not incidente_id:
        print(f"\n{RED}Test 1 fallo{RESET}")
        return False

    # 5) Test 2 - POST validaciones
    test_incidente_crear_validacion(admin_token, alumno_id)

    # 6) Tests complementarios
    test_listar_incidentes(admin_token)
    test_obtener_incidente(admin_token, incidente_id)
    test_obtener_alumnos_incidente(admin_token, incidente_id)
    test_alumnos_incidente(admin_token, alumno_id)

    # Resumen
    print("\n" + "=" * 60)
    print(f"{GREEN}OK Todos los tests completados{RESET}")
    print("=" * 60)
    print("\nSwagger UI: http://localhost:8000/docs")
    print("ReDoc:      http://localhost:8000/redoc")

    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except AssertionError as e:
        print(f"\n{RED}AssertionError: {e}{RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{RED}Error fatal: {str(e)}{RESET}")
        sys.exit(1)
