from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Usuario
from app.schemas import LoginRequest, LoginResponse
from app.auth_utils import create_access_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Autenticar un usuario con email y contraseña."""
    usuario = db.query(Usuario).filter(Usuario.email == credentials.email).first()

    # Verificar que el usuario existe y tiene contraseña configurada
    if not usuario or not usuario.password_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Verificar contraseña
    if not verify_password(credentials.password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Generar token JWT
    access_token = create_access_token(usuario.id, usuario.rol.value)

    return LoginResponse(
        access_token=access_token,
        id=usuario.id,
        email=usuario.email,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        rol=usuario.rol,
    )
