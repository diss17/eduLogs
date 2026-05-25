# Backend Setup & Usage

Instrucciones para configurar y ejecutar el backend de eduLogs.

## Requisitos

- Python 3.8+
- Cuenta en [NeonDB](https://neon.tech/) (PostgreSQL serverless)
- pip (gestor de paquetes de Python)

## Instalación

### 1. Instalar dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend/`:

```bash
cp .env.example .env
```

Luego edita `.env` y reemplaza con tu URL de NeonDB:

```env
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/edulogs?sslmode=require
DEBUG=True
```

**Cómo obtener tu DATABASE_URL en NeonDB:**
1. Ve a [Neon Console](https://console.neon.tech/)
2. Selecciona tu proyecto
3. En la sección "Connection string", copia la URL PostgreSQL
4. Pégala en `.env`

### 3. Crear tablas en NeonDB

```bash
# Verifica la conexión y crea las tablas
python test_connection.py
```

Deberías ver:
```
✓ Conexión exitosa a la base de datos
✓ Tablas creadas exitosamente
✓ Tabla 'usuarios' - Columnas: ...
✓ Tabla 'alumnos' - Columnas: ...
✓ Tabla 'incidentes' - Columnas: ...
✓ Tabla 'incidente_alumnos' - Columnas: ...
```

## Ejecutar el servidor

```bash
cd backend
uvicorn app.main:app --reload
```

El servidor estará disponible en: **http://localhost:8000**

### Endpoints útiles:

- **Swagger UI (Documentación Interactiva)**: http://localhost:8000/docs
- **ReDoc (Documentación Alternativa)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## Testear endpoints

Con el servidor en ejecución, en otra terminal:

```bash
cd backend
pip install requests  # Si no lo tienes
python test_endpoints.py
```

Esto hará pruebas automáticas de todos los endpoints CRUD.

## Estructura de carpetas

```
backend/
├── app/
│   ├── models.py           # Modelos SQLAlchemy
│   ├── database.py         # Conexión a BD
│   ├── config.py           # Variables de entorno
│   ├── schemas.py          # DTOs Pydantic
│   ├── routes/
│   │   ├── usuarios.py     # CRUD usuarios
│   │   ├── alumnos.py      # CRUD alumnos
│   │   └── incidentes.py   # CRUD incidentes
│   ├── main.py             # App FastAPI
│   └── __init__.py
├── alembic/                # Migraciones de BD
│   ├── versions/           # Scripts de migración
│   ├── env.py              # Config Alembic
│   └── script.py.mako      # Template migraciones
├── requirements.txt        # Dependencias
├── .env.example           # Template de variables
├── test_connection.py     # Test de BD
└── test_endpoints.py      # Test de endpoints
```

## API Endpoints

### Usuarios (Funcionarios)
- `POST /usuarios` - Crear usuario
- `GET /usuarios` - Listar usuarios
- `GET /usuarios/{id}` - Obtener usuario
- `PUT /usuarios/{id}` - Actualizar usuario
- `DELETE /usuarios/{id}` - Eliminar usuario

### Alumnos
- `POST /alumnos` - Crear alumno
- `GET /alumnos` - Listar alumnos
- `GET /alumnos/{id}` - Obtener alumno
- `GET /alumnos/{id}/incidentes` - Obtener incidentes del alumno ⭐
- `PUT /alumnos/{id}` - Actualizar alumno
- `DELETE /alumnos/{id}` - Eliminar alumno

### Incidentes
- `POST /incidentes` - Crear incidente
- `GET /incidentes` - Listar incidentes
- `GET /incidentes?categoria=bullying&estado=abierto` - Filtrar incidentes ⭐
- `GET /incidentes/{id}` - Obtener incidente
- `GET /incidentes/{id}/alumnos` - Obtener alumnos en incidente ⭐
- `PUT /incidentes/{id}` - Actualizar incidente
- `DELETE /incidentes/{id}` - Eliminar incidente

## Ejemplo de uso con curl

### Crear un usuario
```bash
curl -X POST http://localhost:8000/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "email": "prof@school.edu",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "profesor"
  }'
```

### Crear un alumno
```bash
curl -X POST http://localhost:8000/alumnos \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@school.edu",
    "nombre": "María",
    "apellido": "García",
    "grado": "9A"
  }'
```

### Crear un incidente
```bash
curl -X POST http://localhost:8000/incidentes \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Conflicto en patio",
    "descripcion": "Discusión entre alumnos en el patio",
    "categoria": "violencia",
    "estado": "abierto",
    "ubicacion": "Patio principal",
    "funcionario_id": 1,
    "alumno_ids": [1, 2]
  }'
```

## Notas importantes

⚠️ **NullPool**: La configuración usa `NullPool` porque NeonDB (serverless) cierra conexiones idle después de 5 minutos.

⚠️ **.env no debe subirse a git**: Está en `.gitignore` para proteger tus credenciales.

⚠️ **Enums**: Categorías, estados y roles están definidos como enums en la base de datos para validación automática.

## Solución de problemas

### "Error: Could not connect to database"
- Verifica que `.env` contiene la URL correcta de NeonDB
- Asegúrate de que tu IP está permitida en NeonDB (Security → IP Allowlist)

### "ModuleNotFoundError: No module named 'app'"
- Asegúrate de estar en la carpeta `backend/` cuando ejecutas comandos
- Verifica que `backend/app/__init__.py` existe

### "psycopg ImportError"
- Reinstala psycopg: `pip install --force-reinstall psycopg[binary]==3.1.18`

## Migración de BD (Alembic)

Para crear una nueva migración después de cambiar modelos:

```bash
cd backend
alembic revision --autogenerate -m "Descripción del cambio"
alembic upgrade head
```

## Próximos pasos (Sprint 2)

- [ ] Frontend React + Vite
- [ ] Autenticación JWT
- [ ] Tests unitarios
- [ ] CI/CD pipeline
