from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.usuarios import router as usuarios_router
from app.routes.alumnos import router as alumnos_router
from app.routes.incidentes import router as incidentes_router


app = FastAPI(
    title="eduLogs API",
    description="API para control de incidentes en instituciones educativas",
    version="0.1.0",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(usuarios_router)
app.include_router(alumnos_router)
app.include_router(incidentes_router)


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "Welcome to eduLogs API", "docs": "/docs"}


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}
