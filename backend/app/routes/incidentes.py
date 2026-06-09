from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Alumno, Incidente, RoleEnum, Usuario
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
_write_access = require_roles([RoleEnum.ADMIN, RoleEnum.FUNCIONARIO])


@router.post("", response_model=IncidenteWithAlumnos, status_code=201)
def crear_incidente(
    incidente: IncidenteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_write_access),
):
    """Crear un nuevo incidente. Requiere rol ADMIN o FUNCIONARIO."""
    # Verificar que el funcionario existe
    funcionario = (
        db.query(Usuario).filter(Usuario.id == incidente.funcionario_id).first()
    )
    if not funcionario:
        raise HTTPException(status_code=404, detail="Funcionario no encontrado")

    # Un FUNCIONARIO solo puede crear incidentes a su nombre
    if current_user.rol == RoleEnum.FUNCIONARIO and incidente.funcionario_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puede crear incidentes a su propio nombre",
        )

    # Crear incidente
    db_incidente = Incidente(
        titulo=incidente.titulo,
        descripcion=incidente.descripcion,
        categoria=incidente.categoria,
        estado=incidente.estado,
        ubicacion=incidente.ubicacion,
        gravedad=incidente.gravedad,
        fecha_incidente=incidente.fecha_incidente,
        funcionario_id=incidente.funcionario_id,
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
    """Listar incidentes. PROFESOR solo ve incidentes; FUNCIONARIO ve solo los suyos; ADMIN ve todos."""
    query = db.query(Incidente)

    # FUNCIONARIO solo ve sus propios incidentes
    if current_user.rol == RoleEnum.FUNCIONARIO:
        query = query.filter(Incidente.funcionario_id == current_user.id)

    if categoria:
        query = query.filter(Incidente.categoria == categoria)

    if estado:
        query = query.filter(Incidente.estado == estado)

    incidentes = query.all()
    return incidentes


@router.get("/{incidente_id}", response_model=IncidenteWithAlumnos)
def obtener_incidente(
    incidente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Obtener un incidente por ID. FUNCIONARIO solo puede ver los suyos."""
    incidente = db.query(Incidente).filter(Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # FUNCIONARIO solo puede ver sus propios incidentes
    if current_user.rol == RoleEnum.FUNCIONARIO and incidente.funcionario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver este incidente")

    return incidente


@router.get("/{incidente_id}/alumnos", response_model=list[AlumnoRead])
def obtener_alumnos_incidente(
    incidente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_any_authenticated),
):
    """Obtener los alumnos de un incidente. Requiere autenticación."""
    incidente = db.query(Incidente).filter(Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # FUNCIONARIO solo puede ver alumnos de sus propios incidentes
    if current_user.rol == RoleEnum.FUNCIONARIO and incidente.funcionario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para ver este incidente")

    return incidente.alumnos


@router.put("/{incidente_id}", response_model=IncidenteWithAlumnos)
def actualizar_incidente(
    incidente_id: int,
    incidente_update: IncidenteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(_write_access),
):
    """Actualizar un incidente. FUNCIONARIO solo puede actualizar los suyos."""
    incidente = db.query(Incidente).filter(Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # FUNCIONARIO solo puede actualizar sus propios incidentes
    if current_user.rol == RoleEnum.FUNCIONARIO and incidente.funcionario_id != current_user.id:
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
    """Eliminar un incidente. FUNCIONARIO solo puede eliminar los suyos."""
    incidente = db.query(Incidente).filter(Incidente.id == incidente_id).first()
    if not incidente:
        raise HTTPException(status_code=404, detail="Incidente no encontrado")

    # FUNCIONARIO solo puede eliminar sus propios incidentes
    if current_user.rol == RoleEnum.FUNCIONARIO and incidente.funcionario_id != current_user.id:
        raise HTTPException(status_code=403, detail="No tiene permisos para eliminar este incidente")

    db.delete(incidente)
    db.commit()
    return None
