import { apiFetch } from './client';

export function listarNotas(incidenteId) {
  return apiFetch(`/incidentes/${incidenteId}/notas`);
}

export function agregarNota(incidenteId, contenido) {
  return apiFetch(`/incidentes/${incidenteId}/notas`, {
    method: 'POST',
    body: JSON.stringify({ contenido }),
  });
}
