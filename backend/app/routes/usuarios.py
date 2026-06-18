from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Alumno, ProfesorJefeCurso, RoleEnum, Usuario
from app.schemas import JefaturaCreate, JefaturaRead, UsuarioCreate, UsuarioRead, UsuarioUpdate
from app.auth_utils import get_current_user, hash_password, require_roles

router = APIRouter(prefix="/usuarios", tags=["usuarios"])

# Solo INSPECTOR puede gestionar usuarios
_inspector_only = require_roles([RoleEnum.INSPECTOR])


@router.post("", response_model=UsuarioRead, status_code=201)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_inspector_only),
):
    """Crear un nuevo usuario. Solo INSPECTOR."""
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
    current_user: Usuario = Depends(_inspector_only),
):
    """Listar todos los usuarios. Solo INSPECTOR."""
    usuarios = db.query(Usuario).all()
    return usuarios


@router.get("/{usuario_id}", response_model=UsuarioRead)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_inspector_only),
):
    """Obtener un usuario por ID. Solo INSPECTOR."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.put("/{usuario_id}", response_model=UsuarioRead)
def actualizar_usuario(
    usuario_id: int,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_inspector_only),
):
    """Actualizar un usuario. Solo INSPECTOR."""
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
    current_user: Usuario = Depends(_inspector_only),
):
    """Eliminar un usuario. Solo INSPECTOR."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.delete(usuario)
    db.commit()
    return None


# ==================== JEFATURAS (profesor_jefe) ====================
@router.get("/{usuario_id}/jefaturas", response_model=list[JefaturaRead])
def listar_jefaturas(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Listar los cursos de los que el usuario es profesor jefe. INSPECTOR o el propio usuario."""
    if current_user.rol == RoleEnum.INSPECTOR or current_user.id == usuario_id:
        pass
    else:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver estas jefaturas")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario.jefaturas


@router.post("/{usuario_id}/jefaturas", response_model=JefaturaRead, status_code=201)
def asignar_jefatura(
    usuario_id: int,
    jefatura: JefaturaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_inspector_only),
):
    """Asignar un curso a un profesor jefe. Solo INSPECTOR. Valida que el grado exista en alumnos."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if usuario.rol != RoleEnum.PROFESOR_JEFE:
        raise HTTPException(status_code=400, detail="El usuario no tiene rol profesor_jefe")

    existe_grado = db.query(Alumno).filter(Alumno.grado == jefatura.grado).first()
    if not existe_grado:
        raise HTTPException(status_code=400, detail=f"Grado '{jefatura.grado}' no existe en alumnos")

    existing = (
        db.query(ProfesorJefeCurso)
        .filter(ProfesorJefeCurso.usuario_id == usuario_id, ProfesorJefeCurso.grado == jefatura.grado)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Jefatura ya asignada")

    jef = ProfesorJefeCurso(usuario_id=usuario_id, grado=jefatura.grado)
    db.add(jef)
    db.commit()
    db.refresh(jef)
    return jef


@router.delete("/{usuario_id}/jefaturas", status_code=204)
def quitar_jefatura(
    usuario_id: int,
    grado: str = Query(..., min_length=1, max_length=50),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_inspector_only),
):
    """Quitar una jefatura de un profesor jefe. Solo INSPECTOR."""
    jef = (
        db.query(ProfesorJefeCurso)
        .filter(ProfesorJefeCurso.usuario_id == usuario_id, ProfesorJefeCurso.grado == grado)
        .first()
    )
    if not jef:
        raise HTTPException(status_code=404, detail="Jefatura no encontrada")
    db.delete(jef)
    db.commit()
    return None
