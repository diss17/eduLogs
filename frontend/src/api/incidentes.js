import { apiFetch } from './client';

export async function listarIncidentes() {
  return apiFetch('/incidentes');
}

export async function crearIncidente(data) {
  return apiFetch('/incidentes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function actualizarIncidente(id, data) {
  return apiFetch(`/incidentes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}