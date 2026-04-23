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
  async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        // Manejamos un fallo de red o un 400/500 de manera amigable sin crashear la UI
        return { data: null, error: `Error HTTP: ${response.status}`, status: response.status };
      }

      const data = await response.json();
      return { data, error: null, status: response.status };
    } catch (e: any) {
      // Retorno anticipado de errores fatales
      return { data: null, error: e.message || 'Error de conexión', status: 500 };
    }
  },

  // TODO: POST, PUT, DELETE se extenderían de igual modo
};
