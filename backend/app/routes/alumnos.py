from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Alumno, Incidente, ProfesorJefeCurso, RoleEnum, Usuario, incidente_alumnos
from app.schemas import AlumnoCreate, AlumnoRead, AlumnoUpdate, IncidenteRead
from app.auth_utils import get_current_user, require_roles

router = APIRouter(prefix="/alumnos", tags=["alumnos"])

# Dependencias de rol reutilizables
_any_authenticated = get_current_user
_write_access = require_roles([RoleEnum.INSPECTOR])


def _mis_cursos(db: Session, user: Usuario) -> list[str]:
    return [g for (g,) in db.query(ProfesorJefeCurso.grado).filter_by(usuario_id=user.id).all()]


def _alumnos_visibles_query(db: Session, user: Usuario, para_registro: bool = False):
    query = db.query(Alumno)
    if user.rol in (RoleEnum.INSPECTOR, RoleEnum.PROFESOR):
        return query
    if user.rol == RoleEnum.PROFESOR_JEFE:
        if para_registro:
            return query
        cursos = _mis_cursos(db, user)
        return query.filter(Alumno.grado.in_(cursos)) if cursos else query.filter(False)
    return query.filter(False)


def _puede_ver_alumno(db: Session, user: Usuario, alumno: Alumno) -> bool:
    if user.rol == RoleEnum.INSPECTOR:
        return True
    if user.rol == RoleEnum.PROFESOR:
        return (
            db.query(Alumno)
            .filter(Alumno.id == alumno.id, Alumno.incidentes.any(Incidente.funcionario_id == user.id))
            .first()
            is not None
        )
    if user.rol == RoleEnum.PROFESOR_JEFE:
        cursos = _mis_cursos(db, user)
        return alumno.grado in cursos if cursos else False
    return False


@router.post("", response_model=AlumnoRead, status_code=201)
def crear_alumno(
    alumno: AlumnoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_write_access),
):
    """Crear un nuevo alumno. Solo INSPECTOR."""
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
    para_registro: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Listar alumnos. INSPECTOR/PROFESOR ven todos; PROFESOR_JEFE ve solo su curso (o todos si para_registro=true)."""
    alumnos = _alumnos_visibles_query(db, current_user, para_registro).all()
    alumno_ids = [a.id for a in alumnos]
    counts: dict[int, int] = {}
    if alumno_ids:
        rows = (
            db.query(incidente_alumnos.c.alumno_id, func.count(incidente_alumnos.c.incidente_id))
            .filter(incidente_alumnos.c.alumno_id.in_(alumno_ids))
            .group_by(incidente_alumnos.c.alumno_id)
            .all()
        )
        counts = dict(rows)
    result = []
    for a in alumnos:
        data = AlumnoRead.model_validate(a)
        data.num_incidentes = counts.get(a.id, 0)
        result.append(data)
    return result


@router.get("/{alumno_id}", response_model=AlumnoRead)
def obtener_alumno(
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Obtener un alumno por ID. PROFESOR solo los de sus incidentes; PROFESOR_JEFE solo los de sus cursos."""
    alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    if not _puede_ver_alumno(db, current_user, alumno):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver este alumno")
    return alumno


@router.get("/{alumno_id}/incidentes", response_model=list[IncidenteRead])
def obtener_incidentes_alumno(
    alumno_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Obtener incidentes de un alumno. PROFESOR solo los que registró; PROFESOR_JEFE solo de sus cursos (todos los del alumno)."""
    alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    if not _puede_ver_alumno(db, current_user, alumno):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver este alumno")

    query = db.query(Incidente).join(Incidente.alumnos).filter(Alumno.id == alumno_id)
    if current_user.rol == RoleEnum.PROFESOR:
        query = query.filter(Incidente.funcionario_id == current_user.id)
    return query.all()


@router.put("/{alumno_id}", response_model=AlumnoRead)
def actualizar_alumno(
    alumno_id: int,
    alumno_update: AlumnoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_write_access),
):
    """Actualizar un alumno. Solo INSPECTOR."""
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
    """Eliminar un alumno. Solo INSPECTOR."""
    alumno = db.query(Alumno).filter(Alumno.id == alumno_id).first()
    if not alumno:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    db.delete(alumno)
    db.commit()
    return None
