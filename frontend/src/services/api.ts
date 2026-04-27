/**
 * Agnostic API Wrapper - Separation of Concerns
 * Implementa el patrón "Early Return" y captura de errores global.
 */

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export const apiClient = {
  async get<T>(url: string, token?: string): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) return { data: null, error: `Error HTTP: ${response.status}`, status: response.status };
      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (e: any) {
      return { data: null, error: e.message || 'Error de conexión', status: 500 };
    }
  },

  async post<T>(url: string, body?: any, token?: string): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) return { data: null, error: `Error HTTP: ${response.status}`, status: response.status };
      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (e: any) {
      return { data: null, error: e.message || 'Error de conexión', status: 500 };
    }
  },
};
