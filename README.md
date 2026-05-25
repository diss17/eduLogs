# eduLogs
Software integral para manejar el control de incidentes a nivel institucional de los centros educativos.

## Stack Tecnológico

- **Frontend**: React + Vite
- **Backend**: FastAPI + SQLAlchemy
- **Base de Datos**: NeonDB (PostgreSQL serverless)

## Estructura del Proyecto

```
eduLogs/
├── backend/          # API FastAPI
│   ├── app/
│   │   ├── models.py        # Modelos SQLAlchemy
│   │   ├── schemas.py       # DTOs Pydantic
│   │   ├── database.py      # Conexión a BD
│   │   ├── config.py        # Variables de entorno
│   │   ├── main.py          # App principal
│   │   └── routes/
│   │       ├── usuarios.py
│   │       ├── alumnos.py
│   │       └── incidentes.py
│   ├── alembic/             # Migraciones
│   ├── test_connection.py   # Test de BD
│   ├── test_endpoints.py    # Test de endpoints
│   ├── SETUP.md             # Guía de instalación
│   └── requirements.txt
│
├── frontend/         # App React + Vite
│
└── README.md
```

## Sprint 1: Backend + Base de Datos ✅

### Endpoints (18 total):

| Recurso | Endpoints |
|---------|-----------|
| **Usuarios** | POST, GET, GET/{id}, PUT/{id}, DELETE/{id} |
| **Alumnos** | CRUD + GET/{id}/incidentes ⭐ |
| **Incidentes** | CRUD + GET/{id}/alumnos ⭐ + filtros |

## Inicio Rápido

### 1. Instalar dependencias
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar NeonDB
```bash
cp .env.example .env
# Edita .env con tu DATABASE_URL de NeonDB
```

### 3. Validar conexión
```bash
python test_connection.py
```

### 4. Ejecutar servidor
```bash
uvicorn app.main:app --reload
```

### 5. Acceder a Swagger
**http://localhost:8000/docs**

### 6. Testear endpoints
```bash
python test_endpoints.py
```

## Documentación Detallada

Ver [backend/SETUP.md](backend/SETUP.md) para guía completa de instalación, configuración y uso.

## Sprint 2: Frontend (Próximo)

- React + Vite setup
- Componentes de UI
- Autenticación (JWT)
- Integración con API
- Tests unitarios

---
