from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alumno, Incidente, ProfesorJefeCurso, RoleEnum, Usuario
from app.schemas import (
    AlumnoRead,
    CategoriaEnum,
    EstadoEnum,
    IncidenteCreate,
    IncidenteRead,
    IncidenteUpdate,
    IncidenteWithAlumnos,
)
from app.auth_utils import get_current_user, require_roles

router = APIRouter(prefix="/incidentes", tags=["incidentes"])

# Dependencias de rol
_any_authenticated = get_current_user
_write_access = require_roles([RoleEnum.INSPECTOR, RoleEnum.PROFESOR_JEFE])


def _mis_cursos(db: Session, user: Usuario) -> list[str]:
    return [g for (g,) in db.query(ProfesorJefeCurso.grado).filter_by(usuario_id=user.id).all()]


def _incidentes_visibles_query(db: Session, user: Usuario):
    query = db.query(Incidente)
    if user.rol == RoleEnum.INSPECTOR:
        return query
    if user.rol in (RoleEnum.PROFESOR,):
        return query.filter(Incidente.funcionario_id == user.id)
    if user.rol == RoleEnum.PROFESOR_JEFE:
        cursos = _mis_cursos(db, user)
        if cursos:
            return query.filter(
                or_(
                    Incidente.funcionario_id == user.id,
                    Incidente.alumnos.any(Alumno.grado.in_(cursos)),
                )
            )
        return query.filter(Incidente.funcionario_id == user.id)
    return query.filter(False)


def _puede_ver_incidente(db: Session, user: Usuario, incidente: Incidente) -> bool:
    if user.rol == RoleEnum.INSPECTOR:
        return True
    if incidente.funcionario_id == user.id:
        return True
    if user.rol == RoleEnum.PROFESOR_JEFE:
        cursos = _mis_cursos(db, user)
        if not cursos:
            return False
        return any(a.grado in cursos for a in incidente.alumnos)
    return False


@router.post("", response_model=IncidenteWithAlumnos, status_code=201)
def crear_incidente(
    incidente: IncidenteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Crear un nuevo incidente. Requiere autenticación. Si no se envía `funcionario_id`, se asigna el usuario actual."""
    # Determinar el funcionario responsable
    funcionario_id = incidente.funcionario_id if incidente.funcionario_id is not None else current_user.id

    # Verificar que el funcionario existe
    funcionario = db.query(Usuario).filter(Usuario.id == funcionario_id).first()
    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")

    # Crear incidente
    db_incidente = Incidente(
        titulo=incidente.titulo,
        descripcion=incidente.descripcion,
        categoria=incidente.categoria,
        estado=incidente.estado,
        ubicacion=incidente.ubicacion,
        gravedad=incidente.gravedad,
        fecha_incidente=incidente.fecha_incidente,
        funcionario_id=funcionario_id,
    )

    # Asociar alumnos si se proporcionan IDs
    if incidente.alumno_ids:
        alumnos = db.query(Alumno).filter(Alumno.id.in_(incidente.alumno_ids)).all()
        if len(alumnos) != len(incidente.alumno_ids):
            raise HTTPException(
                status_code=404, detail="Uno o más alumnos no encontrados"
            )
        db_incidente.alumnos = alumnos

    db.add(db_incidente)
    db.commit()
    db.refresh(db_incidente)
    return db_incidente


@router.get("", response_model=list[IncidenteWithAlumnos])
def listar_incidentes(
    categoria: CategoriaEnum = Query(None),
    estado: EstadoEnum = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Listar incidentes. INSPECTOR ve todos; PROFESOR solo los suyos; PROFESOR_JEFE los suyos + los de sus alumnos."""
    query = _incidentes_visibles_query(db, current_user)

    if categoria:
        query = query.filter(Incidente.categoria == categoria)

    if estado:
        query = query.filter(Incidente.estado == estado)

    return query.all()


@router.get("/{incidente_id}", response_model=IncidenteWithAlumnos)
def obtener_incidente(
    incidente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Obtener un incidente por ID. Restringido por rol según _puede_ver_incidente."""
    incidente = db.query(Incidente).filter(Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    if not _puede_ver_incidente(db, current_user, incidente):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver este incidente")

    return incidente


@router.get("/{incidente_id}/alumnos", response_model=list[AlumnoRead])
def obtener_alumnos_incidente(
    incidente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Obtener los alumnos de un incidente. Restringido por rol según _puede_ver_incidente."""
    incidente = db.query(Incidente).filter(Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    if not _puede_ver_incidente(db, current_user, incidente):
        raise HTTPException(status_code=403, detail="No tiene permisos para ver este incidente")

    return incidente.alumnos


@router.put("/{incidente_id}", response_model=IncidenteWithAlumnos)
def actualizar_incidente(
    incidente_id: int,
    incidente_update: IncidenteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_write_access),
):
    """Actualizar un incidente. PROFESOR_JEFE solo puede actualizar los suyos."""
    incidente = db.query(Incidente).filter(Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # PROFESOR_JEFE solo puede actualizar sus propios incidentes
    if current_user.rol == RoleEnum.PROFESOR_JEFE and incidente.funcionario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar este incidente")

    update_data = incidente_update.model_dump(exclude_unset=True)

    # Manejar actualización de alumnos
    if "alumno_ids" in update_data:
        alumno_ids = update_data.pop("alumno_ids")
        if alumno_ids is not None:
            alumnos = db.query(Alumno).filter(Alumno.id.in_(alumno_ids)).all()
            if len(alumnos) != len(alumno_ids):
                raise HTTPException(
                    status_code=404, detail="Uno o más alumnos no encontrados"
                )
            incidente.alumnos = alumnos

    # Actualizar otros campos
    for field, value in update_data.items():
        setattr(incidente, field, value)

    db.commit()
    db.refresh(incidente)
    return incidente


@router.delete("/{incidente_id}", status_code=204)
def eliminar_incidente(
    incidente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_write_access),
):
    """Eliminar un incidente. PROFESOR_JEFE solo puede eliminar los suyos."""
    incidente = db.query(Incidente).filter(Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # PROFESOR_JEFE solo puede eliminar sus propios incidentes
    if current_user.rol == RoleEnum.PROFESOR_JEFE and incidente.funcionario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para eliminar este incidente")

    db.delete(incidente)
    db.commit()
    return None
