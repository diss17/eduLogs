from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routes.alumnos import router as alumnos_router
from app.routes.auth import router as auth_router
from app.routes.incidentes import router as incidentes_router
from app.routes.usuarios import router as usuarios_router

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


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Devuelve 400 en errores de validación de payload en lugar del 422 por defecto de FastAPI."""
    return JSONResponse(
        status_code=400,
        content={"detail": exc.errors()},
    )


# Include routers
app.include_router(auth_router)
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
