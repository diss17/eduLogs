import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class RoleEnum(str, enum.Enum):
    ADMIN = "admin"
    PROFESOR = "profesor"
    FUNCIONARIO = "funcionario"


class CategoriaEnum(str, enum.Enum):
    BULLYING = "bullying"
    VIOLENCIA = "violencia"
    INASISTENCIA = "inasistencia"
    OTRO = "otro"


class EstadoEnum(str, enum.Enum):
    ABIERTO = "abierto"
    EN_PROGRESO = "en_progreso"
    CERRADO = "cerrado"


# Association table for many-to-many relationship between Incidentes and Alumnos
incidente_alumnos = Table(
    "incidente_alumnos",
    Base.metadata,
    Column(
        "incidente_id",
        Integer,
        ForeignKey("incidentes.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "alumno_id",
        Integer,
        ForeignKey("alumnos.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    apellido = Column(String(255), nullable=False)
    rol = Column(Enum(RoleEnum), default=RoleEnum.FUNCIONARIO, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    incidentes = relationship(
        "Incidente", back_populates="funcionario", cascade="all, delete-orphan"
    )


class Alumno(Base):
    __tablename__ = "alumnos"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    nombre = Column(String(255), nullable=False)
    apellido = Column(String(255), nullable=False)
    grado = Column(String(50), nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    incidentes = relationship(
        "Incidente",
        secondary=incidente_alumnos,
        back_populates="alumnos",
        passive_deletes=True,  # ← let DB cascade handle it
    )


class Incidente(Base):
    __tablename__ = "incidentes"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(255), nullable=False)
    descripcion = Column(String(2000), nullable=False)
    categoria = Column(Enum(CategoriaEnum), nullable=False)
    estado = Column(Enum(EstadoEnum), default=EstadoEnum.ABIERTO, nullable=False)
    ubicacion = Column(String(255), nullable=False)
    funcionario_id = Column(
        Integer, ForeignKey("usuarios.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    funcionario = relationship("Usuario", back_populates="incidentes")
    alumnos = relationship(
        "Alumno",
        secondary=incidente_alumnos,
        back_populates="incidentes",
        passive_deletes=True,  # ← let DB cascade handle it
    )
