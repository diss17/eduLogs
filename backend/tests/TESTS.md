# Suite de Tests RBAC — eduLogs Backend

Suite de tests de autorización por rol para todos los endpoints del backend.
**79 tests** organizados por recurso, cubriendo los 3 roles (`inspector`, `profesor`, `profesor_jefe`) y los 4 verbos HTTP.

## Stack

- **pytest 8.3.4** + **httpx 0.28.1** + **pytest-timeout 2.3.1**
- `fastapi.testclient.TestClient` (no requiere server separado)
- `app.dependency_overrides[get_db]` → `QueuePool` compartido (evita throttle de NeonDB)
- Pre-clean autouse que borra residuos de runs cancelados

## Cobertura general

| Recurso | Tests | Qué cubre |
|---|---|---|
| **Auth** | 6 | Login válido/inválido, payload incompleto, token inválido, endpoints públicos |
| **Usuarios** | 14 | CRUD solo INSPECTOR; `/me` cualquier autenticado; sin token 401 |
| **Jefaturas** | 15 | Asignar/listar/eliminar jefaturas por curso; validación de grado existente; 403 para no-INSPECTOR |
| **Alumnos** | 21 | Escritura solo INSPECTOR; **filtrado por rol** en lectura (PJ por curso, profesor por incidentes); ownership 403 |
| **Incidentes** | 23 | POST cualquier auth; **visibilidad filtrada** (INSPECTOR todos, profesor suyos, PJ suyos + los de sus alumnos); PUT/DELETE restringido |
| **Total** | **79** | |

## Matriz de permisos verificada

### Escritura (POST/PUT/DELETE)
| Recurso | INSPECTOR | PROFESOR | PROFESOR_JEFE |
|---|---|---|---|
| Usuarios | ✅ | ❌ 403 | ❌ 403 |
| Jefaturas | ✅ | ❌ 403 | ❌ 403 |
| Alumnos | ✅ | ❌ 403 | ❌ 403 |
| Incidentes POST | ✅ | ✅ | ✅ |
| Incidentes PUT/DELETE | ✅ cualquiera | ❌ 403 | ✅ solo los suyos |

### Lectura (GET) — filtrado por rol
| Recurso | INSPECTOR | PROFESOR | PROFESOR_JEFE |
|---|---|---|---|
| Usuarios (list) | todos | ❌ 403 | ❌ 403 |
| `/usuarios/me` | ✅ | ✅ | ✅ |
| Alumnos (list) | todos | solo de sus incidentes | solo de sus cursos |
| Alumnos `/{id}` | cualquier | solo si está en sus incidentes | solo si es de su curso |
| Incidentes (list) | todos | los suyos | suyos + los de sus alumnos |
| Incidentes `/{id}` | cualquier | suyo | suyo o toca sus alumnos |
| Incidentes `/{id}/alumnos` | cualquier | suyo | suyo o toca sus alumnos |

## Casos borde cubiertos

- **Sin token** → 401 en todos los endpoints protegidos
- **Token inválido/malformado** → 401
- **Payload incompleto** → 400 (no 422, por handler custom)
- **Recurso inexistente** → 404
- **Validaciones de negocio**:
  - Asignar jefatura a no-`profesor_jefe` → 400
  - Asignar jefatura con grado inexistente en `alumnos` → 400
  - Jefatura duplicada → 400
  - PJ sin jefaturas asignadas → ve lista vacía de alumnos
  - Profesor ve alumno solo después de registrar incidente con él
  - PJ no edita incidente ajeno aunque toque a su alumno (ownership estricto)
  - `funcionario_id` por defecto = usuario actual al crear incidente

## Ejecución

```bash
cd backend
pip install -r requirements-dev.txt
pytest                                  # suite completo (~3:16 min)
pytest tests/test_alumnos_rbac.py -v    # un archivo
pytest -k "profesor_jefe"               # filtrar por nombre
```

## Estructura de archivos

```
backend/
├── pytest.ini
├── requirements-dev.txt
└── tests/
    ├── __init__.py
    ├── conftest.py                 # fixtures (inspector/profesor/profesor_jefe), QueuePool override, pre-clean
    ├── test_auth.py                # 6 tests
    ├── test_usuarios_rbac.py       # 14 tests
    ├── test_jefaturas_rbac.py      # 15 tests
    ├── test_alumnos_rbac.py        # 21 tests
    └── test_incidentes_rbac.py     # 23 tests
```

## Notas

- Los tests corren contra **NeonDB real** (no mock). Cada run crea datos únicos con sufijo `uuid` y los limpia en teardown vía DB directa.
- El `QueuePool` override es necesario porque `NullPool` (config de producción para NeonDB) abre conexión nueva por request y satureba el server remoto colgando los tests.
- El pre-clean autouse borra residuos de runs cancelados (patrones `test_prof_*`, `test_pj_*`, `JEF-*`, `OTRO-*`, etc.) sin tocar datos reales (50 seed alumnos intactos tras cada run).
