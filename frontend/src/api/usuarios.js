import { apiFetch } from './client';

export function listarJefaturas(usuarioId) {
  return apiFetch(`/usuarios/${usuarioId}/jefaturas`);
}
