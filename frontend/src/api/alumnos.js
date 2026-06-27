import { apiFetch } from './client';

export async function listarAlumnos() {
  return apiFetch('/alumnos');
}

export async function listarAlumnosParaRegistro() {
  return apiFetch('/alumnos?para_registro=true');
}

export async function obtenerIncidentesAlumno(alumnoId) {
  return apiFetch(`/alumnos/${alumnoId}/incidentes`);
}
