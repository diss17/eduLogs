// ==================== ENUMS ====================
export type RoleEnum = 'admin' | 'profesor' | 'funcionario';
export type CategoriaEnum = 'bullying' | 'violencia' | 'inasistencia' | 'otro';
export type EstadoEnum = 'abierto' | 'en_progreso' | 'cerrado';

// ==================== USUARIO ====================
export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: RoleEnum;
  created_at: string;
}

// ==================== AUTH ====================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: RoleEnum;
}

// ==================== ALUMNO ====================
export interface Alumno {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  grado: string;
  created_at: string;
}

// ==================== INCIDENTE ====================
export interface Incidente {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: CategoriaEnum;
  estado: EstadoEnum;
  ubicacion: string;
  funcionario_id: number;
  alumnos: Alumno[];
  created_at: string;
  updated_at: string;
}

// ==================== API ERROR ====================
export interface ApiError {
  detail: string;
}
