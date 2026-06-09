from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Alumno, Incidente, RoleEnum, Usuario
from app.schemas import AlumnoCreate, AlumnoRead, AlumnoUpdate, IncidenteRead
from app.auth_utils import get_current_user, require_roles

router = APIRouter(prefix="/alumnos", tags=["alumnos"])

# Dependencias de rol reutilizables
_any_authenticated = get_current_user
_write_access = require_roles([RoleEnum.ADMIN, RoleEnum.FUNCIONARIO])


@router.post("", response_model=AlumnoRead, status_code=201)
def crear_alumno(
    alumno: AlumnoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_write_access),
):
    """Crear un nuevo alumno. Requiere rol ADMIN o FUNCIONARIO."""
    # Verificar que email no exista
    db_alumno = db.query(Alumno).filter(Alumno.email == alumno.email).first()
    if db_alumno:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    db_alumno = Alumno(**alumno.model_dump())
    db.add(db_alumno)
    db.commit()
    db.refresh(db_alumno)
    return db_alumno


@router.get("", response_model=list[AlumnoRead])
def listar_alumnos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Listar todos los alumnos. Requiere autenticación."""
    alumnos = db.query(Alumno).all()
    return alumnos


@router.get("/{alumno_id}", response_model=AlumnoRead)
def obtener_alumno(
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Obtener un alumno por ID. Requiere autenticación."""
    alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return alumno


@router.get("/{alumno_id}/incidentes", response_model=list[IncidenteRead])
def obtener_incidentes_alumno(
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Obtener todos los incidentes de un alumno. Requiere autenticación."""
    alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    incidentes = db.query(Incidente).join(Incidente.alumnos).filter(Alumno.id == alumno_id).all()
    return incidentes


@router.put("/{alumno_id}", response_model=AlumnoRead)
def actualizar_alumno(
    alumno_id: int,
    alumno_update: AlumnoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_write_access),
):
    """Actualizar un alumno. Requiere rol ADMIN o FUNCIONARIO."""
    alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    # Verificar email único si se intenta cambiar
    if alumno_update.email and alumno_update.email != alumno.email:
        db_alumno = db.query(Alumno).filter(Alumno.email == alumno_update.email).first()
        if db_alumno:
            raise HTTPException(status_code=400, detail="Email ya registrado")

    update_data = alumno_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(alumno, field, value)

    db.commit()
    db.refresh(alumno)
    return alumno


@router.delete("/{alumno_id}", status_code=204)
def eliminar_alumno(
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_write_access),
):
    """Eliminar un alumno. Requiere rol ADMIN o FUNCIONARIO."""
    alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    db.delete(alumno)
    db.commit()
    return None
