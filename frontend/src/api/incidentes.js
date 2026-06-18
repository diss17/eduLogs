import { apiFetch } from './client';

export async function listarIncidentes({ categoria } = {}) {
  const params = new URLSearchParams();
  if (categoria) params.set('categoria', categoria);
  const query = params.toString() ? `?${params}` : '';
  return apiFetch(`/incidentes${query}`);
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