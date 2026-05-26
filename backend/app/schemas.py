from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RoleEnum(str, Enum):
    ADMIN = "admin"
    PROFESOR = "profesor"
    FUNCIONARIO = "funcionario"


class CategoriaEnum(str, Enum):
    BULLYING = "bullying"
    VIOLENCIA = "violencia"
    INASISTENCIA = "inasistencia"
    OTRO = "otro"


class EstadoEnum(str, Enum):
    ABIERTO = "abierto"
    EN_PROGRESO = "en_progreso"
    CERRADO = "cerrado"


# ==================== USUARIO SCHEMAS ====================
class UsuarioBase(BaseModel):
    email: EmailStr
    nombre: str = Field(..., min_length=1, max_length=255)
    apellido: str = Field(..., min_length=1, max_length=255)
    rol: RoleEnum = RoleEnum.FUNCIONARIO


class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6, description="Contraseña en texto plano (se guardará hasheada)")


class UsuarioRead(UsuarioBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)  # ← this is required


class UsuarioUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    apellido: Optional[str] = Field(None, min_length=1, max_length=255)
    rol: Optional[RoleEnum] = None


# ==================== ALUMNO SCHEMAS ====================
class AlumnoBase(BaseModel):
    email: EmailStr
    nombre: str = Field(..., min_length=1, max_length=255)
    apellido: str = Field(..., min_length=1, max_length=255)
    grado: str = Field(..., min_length=1, max_length=50)


class AlumnoCreate(AlumnoBase):
    pass


class AlumnoRead(AlumnoBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)  # ← this is required


class AlumnoUpdate(BaseModel):
    email: Optional[EmailStr] = None
    nombre: Optional[str] = Field(None, min_length=1, max_length=255)
    apellido: Optional[str] = Field(None, min_length=1, max_length=255)
    grado: Optional[str] = Field(None, min_length=1, max_length=50)


# ==================== INCIDENTE SCHEMAS ====================
class IncidenteBase(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=255)
    descripcion: str = Field(..., min_length=1, max_length=2000)
    categoria: CategoriaEnum
    estado: EstadoEnum = EstadoEnum.ABIERTO
    ubicacion: str = Field(..., min_length=1, max_length=255)
    funcionario_id: int


class IncidenteCreate(IncidenteBase):
    alumno_ids: Optional[List[int]] = []


class IncidenteRead(IncidenteBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)  # ← this is required


class IncidenteWithAlumnos(IncidenteRead):
    alumnos: List[AlumnoRead] = []
    model_config = ConfigDict(from_attributes=True)  # ← this is required


class IncidenteUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=255)
    descripcion: Optional[str] = Field(None, min_length=1, max_length=2000)
    categoria: Optional[CategoriaEnum] = None
    estado: Optional[EstadoEnum] = None
    ubicacion: Optional[str] = Field(None, min_length=1, max_length=255)
    alumno_ids: Optional[List[int]] = None


# ==================== AUTH SCHEMAS ====================
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id: int
    email: str
    nombre: str
    apellido: str
    rol: RoleEnum
