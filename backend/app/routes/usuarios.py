from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import RoleEnum, Usuario
from app.schemas import UsuarioCreate, UsuarioRead, UsuarioUpdate
from app.auth_utils import get_current_user, hash_password, require_roles

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# Solo ADMIN puede gestionar usuarios
_admin_only = require_roles([RoleEnum.ADMIN])


@router.post("", response_model=UsuarioRead, status_code=201)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_admin_only),
):
    """Crear un nuevo usuario. Solo ADMIN."""
    # Verificar que email no exista
    db_usuario = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_usuario:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    usuario_data = usuario.model_dump()
    password = usuario_data.pop("password")
    db_usuario = Usuario(**usuario_data, password_hash=hash_password(password))
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


@router.get("/me", response_model=UsuarioRead)
def obtener_perfil(current_user: Usuario = Depends(get_current_user)):
    """Obtener el perfil del usuario autenticado."""
    return current_user


@router.get("", response_model=list[UsuarioRead])
def listar_usuarios(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_admin_only),
):
    """Listar todos los usuarios. Solo ADMIN."""
    usuarios = db.query(Usuario).all()
    return usuarios


@router.get("/{usuario_id}", response_model=UsuarioRead)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_admin_only),
):
    """Obtener un usuario por ID. Solo ADMIN."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioRead)
def actualizar_usuario(
    usuario_id: int,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_admin_only),
):
    """Actualizar un usuario. Solo ADMIN."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Verificar email único si se intenta cambiar
    if usuario_update.email and usuario_update.email != usuario.email:
        db_usuario = db.query(Usuario).filter(Usuario.email == usuario_update.email).first()
        if db_usuario:
            raise HTTPException(status_code=400, detail="Email ya registrado")

    update_data = usuario_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}", status_code=204)
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_admin_only),
):
    """Eliminar un usuario. Solo ADMIN."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.delete(usuario)
    db.commit()
    return None
