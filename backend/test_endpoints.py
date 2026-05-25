"""
Script para probar todos los endpoints de eduLogs.
Usa requests para hacer llamadas HTTP a la API.
"""
import requests
import json
import sys
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"

# Color codes for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'


def print_test(message, success=True):
    color = GREEN if success else RED
    symbol = "✓" if success else "✗"
    print(f"{color}{symbol}{RESET} {message}")


def test_health():
    """Test health endpoint."""
    print("\n" + "=" * 60)
    print("Testing Health Endpoint")
    print("=" * 60)
    try:
        resp = requests.get(f"{BASE_URL}/health")
        if resp.status_code == 200:
            print_test("Health check: OK")
            return True
        else:
            print_test(f"Health check failed: {resp.status_code}", False)
            return False
    except Exception as e:
        print_test(f"Connection error: {str(e)}", False)
        return False


def test_usuarios():
    """Test usuarios endpoints."""
    print("\n" + "=" * 60)
    print("Testing Usuarios Endpoints")
    print("=" * 60)
    
    usuario_data = {
        "email": f"test_{json.dumps({})}@example.com".replace("{", "").replace("}", ""),
        "nombre": "Test",
        "apellido": "Usuario",
        "rol": "funcionario"
    }
    
    # Create
    resp = requests.post(f"{BASE_URL}/usuarios", json=usuario_data)
    if resp.status_code == 201:
        usuario = resp.json()
        usuario_id = usuario['id']
        print_test(f"Create usuario: ID {usuario_id}")
    else:
        print_test(f"Create usuario failed: {resp.status_code} - {resp.text}", False)
        return False

    # List
    resp = requests.get(f"{BASE_URL}/usuarios")
    if resp.status_code == 200:
        usuarios = resp.json()
        print_test(f"List usuarios: {len(usuarios)} found")
    else:
        print_test(f"List usuarios failed: {resp.status_code}", False)
        return False

    # Get by ID
    resp = requests.get(f"{BASE_URL}/usuarios/{usuario_id}")
    if resp.status_code == 200:
        print_test(f"Get usuario by ID: {usuario_id}")
    else:
        print_test(f"Get usuario by ID failed: {resp.status_code}", False)
        return False

    # Update
    update_data = {"nombre": "UpdatedTest"}
    resp = requests.put(f"{BASE_URL}/usuarios/{usuario_id}", json=update_data)
    if resp.status_code == 200:
        print_test(f"Update usuario: ID {usuario_id}")
    else:
        print_test(f"Update usuario failed: {resp.status_code}", False)
        return False

    return usuario_id


def test_alumnos():
    """Test alumnos endpoints."""
    print("\n" + "=" * 60)
    print("Testing Alumnos Endpoints")
    print("=" * 60)
    
    alumno_data = {
        "email": f"alumno_test_{json.dumps({})}@example.com".replace("{", "").replace("}", ""),
        "nombre": "TestAlumno",
        "apellido": "Estudiante",
        "grado": "9A"
    }
    
    # Create
    resp = requests.post(f"{BASE_URL}/alumnos", json=alumno_data)
    if resp.status_code == 201:
        alumno = resp.json()
        alumno_id = alumno['id']
        print_test(f"Create alumno: ID {alumno_id}")
    else:
        print_test(f"Create alumno failed: {resp.status_code} - {resp.text}", False)
        return None

    # List
    resp = requests.get(f"{BASE_URL}/alumnos")
    if resp.status_code == 200:
        alumnos = resp.json()
        print_test(f"List alumnos: {len(alumnos)} found")
    else:
        print_test(f"List alumnos failed: {resp.status_code}", False)

    # Get by ID
    resp = requests.get(f"{BASE_URL}/alumnos/{alumno_id}")
    if resp.status_code == 200:
        print_test(f"Get alumno by ID: {alumno_id}")
    else:
        print_test(f"Get alumno by ID failed: {resp.status_code}", False)

    return alumno_id


def test_incidentes(usuario_id, alumno_id):
    """Test incidentes endpoints."""
    print("\n" + "=" * 60)
    print("Testing Incidentes Endpoints")
    print("=" * 60)
    
    incidente_data = {
        "titulo": "Test Incident",
        "descripcion": "This is a test incident",
        "categoria": "bullying",
        "estado": "abierto",
        "ubicacion": "Classroom A",
        "funcionario_id": usuario_id,
        "alumno_ids": [alumno_id]
    }
    
    # Create
    resp = requests.post(f"{BASE_URL}/incidentes", json=incidente_data)
    if resp.status_code == 201:
        incidente = resp.json()
        incidente_id = incidente['id']
        print_test(f"Create incidente: ID {incidente_id}")
    else:
        print_test(f"Create incidente failed: {resp.status_code} - {resp.text}", False)
        return None

    # List
    resp = requests.get(f"{BASE_URL}/incidentes")
    if resp.status_code == 200:
        incidentes = resp.json()
        print_test(f"List incidentes: {len(incidentes)} found")
    else:
        print_test(f"List incidentes failed: {resp.status_code}", False)

    # List with filter
    resp = requests.get(f"{BASE_URL}/incidentes?categoria=bullying")
    if resp.status_code == 200:
        incidentes = resp.json()
        print_test(f"Filter incidentes by categoria: {len(incidentes)} found")
    else:
        print_test(f"Filter incidentes failed: {resp.status_code}", False)

    # Get by ID
    resp = requests.get(f"{BASE_URL}/incidentes/{incidente_id}")
    if resp.status_code == 200:
        print_test(f"Get incidente by ID: {incidente_id}")
    else:
        print_test(f"Get incidente by ID failed: {resp.status_code}", False)

    # Get alumnos in incidente
    resp = requests.get(f"{BASE_URL}/incidentes/{incidente_id}/alumnos")
    if resp.status_code == 200:
        alumnos = resp.json()
        print_test(f"Get alumnos in incidente: {len(alumnos)} found")
    else:
        print_test(f"Get alumnos in incidente failed: {resp.status_code}", False)

    # Get incidentes for alumno
    resp = requests.get(f"{BASE_URL}/alumnos/{alumno_id}/incidentes")
    if resp.status_code == 200:
        incidentes = resp.json()
        print_test(f"Get incidentes for alumno: {len(incidentes)} found")
    else:
        print_test(f"Get incidentes for alumno failed: {resp.status_code}", False)

    return incidente_id


def main():
    print("\n" + "=" * 60)
    print("eduLogs - Endpoint Testing Script")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    
    # Test health
    if not test_health():
        print(f"\n{RED}Cannot connect to server. Make sure it's running:{RESET}")
        print("  cd backend && uvicorn app.main:app --reload")
        return False

    # Test CRUD operations
    usuario_id = test_usuarios()
    if not usuario_id:
        return False

    alumno_id = test_alumnos()
    if not alumno_id:
        return False

    incidente_id = test_incidentes(usuario_id, alumno_id)
    if not incidente_id:
        return False

    # Summary
    print("\n" + "=" * 60)
    print(f"{GREEN}✓ All tests completed!{RESET}")
    print("=" * 60)
    print("\nAccess Swagger UI at: http://localhost:8000/docs")
    print("Access ReDoc at: http://localhost:8000/redoc")
    
    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n{RED}Fatal error: {str(e)}{RESET}")
        sys.exit(1)
