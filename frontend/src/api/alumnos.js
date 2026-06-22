import { apiFetch } from './client';

export async function listarAlumnos() {
  return apiFetch('/alumnos');
}
