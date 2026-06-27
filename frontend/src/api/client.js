const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function getAuthHeaders() {
  const user = sessionStorage.getItem('user');
  if (user) {
    const { access_token } = JSON.parse(user);
    if (access_token) {
      return { Authorization: `Bearer ${access_token}` };
    }
  }
  return {};
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: 'Error de servidor' }));
    throw new ApiError(response.status, body.detail ?? 'Error desconocido');
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}
