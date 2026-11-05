export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

const API_BASE = '/api';

export async function apiFetch(path: string, options: RequestInit & { token?: string } = {}): Promise<Response> {
  const token = options.token || localStorage.getItem('inmofollow_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Error ${response.status}`);
  }

  if (response.status === 204) return response;
  return response;
}

export async function get<T>(path: string): Promise<T> {
  const response = await apiFetch(path);
  return response.json();
}

export async function post<T>(path: string, body?: any): Promise<T> {
  const response = await apiFetch(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  return response.json();
}

export async function patch<T>(path: string, body?: any): Promise<T> {
  const response = await apiFetch(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  return response.json();
}

export async function del<T>(path: string): Promise<void> {
  await apiFetch(path, { method: 'DELETE' });
}