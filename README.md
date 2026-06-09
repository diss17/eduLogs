# eduLogs
Software integral para manejar el control de incidentes a nivel institucional de los centros educativos.

## Stack Tecnológico

- **Frontend**: React + Vite + TypeScript
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
│   │   ├── auth_utils.py    # Hashing de contraseñas
│   │   ├── main.py          # App principal
│   │   └── routes/
│   │       ├── auth.py      # Login
│   │       ├── usuarios.py
│   │       ├── alumnos.py
│   │       └── incidentes.py
│   ├── alembic/             # Migraciones
│   ├── SETUP.md             # Guía de instalación
│   └── requirements.txt
│
├── frontend/         # App React + Vite
│   ├── src/
│   │   ├── api/             # Capa de conexión al backend
│   │   │   ├── client.ts    # Cliente fetch base
│   │   │   ├── auth.ts      # Llamadas de autenticación
│   │   │   └── types.ts     # Tipos TypeScript
│   │   ├── App.tsx          # Componente principal
│   │   └── styles.css
│   └── .env                 # VITE_API_URL (no commiteado)
│
└── README.md
```

## Sprint 1: Backend + Base de Datos ✅

### Endpoints (19 total):

| Recurso | Endpoints |
|---------|-----------|
| **Auth** | POST /auth/login |
| **Usuarios** | POST, GET, GET/{id}, PUT/{id}, DELETE/{id} |
| **Alumnos** | CRUD + GET/{id}/incidentes ⭐ |
| **Incidentes** | CRUD + GET/{id}/alumnos ⭐ + filtros |

## Sprint 1: Frontend + Conexión ✅

- Login funcional conectado al backend
- Autenticación con bcrypt
- Capa API tipada con TypeScript
- Dashboard de bienvenida post-login

## Inicio Rápido

### Ejecución unificada (recomendado)

```bash
npm install              # Instala concurrently (solo la primera vez)
npm run install:frontend # Instala dependencias del frontend
npm run dev              # Arranca backend y frontend simultáneamente
```

Esto levanta:
- **Backend** en http://localhost:8000
- **Frontend** en http://localhost:5173

### Setup individual

#### Backend

```bash
cd backend
py -3.12 -m venv venv
source venv/Scripts/activate   # Git Bash
pip install -r requirements.txt
# Crear .env con DATABASE_URL de NeonDB
alembic stamp 001_initial_schema
alembic upgrade head
npm run dev:backend            # Desde la raíz del proyecto
```

#### Frontend

```bash
npm run install:frontend
# Crear frontend/.env con VITE_API_URL=http://localhost:8000
npm run dev:frontend           # Desde la raíz del proyecto
```

### Acceder a Swagger
**http://localhost:8000/docs**

## Documentación Detallada

Ver [backend/SETUP.md](backend/SETUP.md) para guía completa de instalación, configuración y uso.
