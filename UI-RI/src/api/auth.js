import { apiFetch } from './client';

export async function login(credentials) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}