// Obtener la URL base del API desde las variables de entorno
// En desarrollo usa el proxy de Vite (/api), en producción usa la URL completa
const API_BASE_URL = import.meta.env.MODE === 'development' 
  ? '/api'  // Usar proxy de Vite en desarrollo
  : (import.meta.env.VITE_API_URL || '/api');

/**
 * Construye la URL completa para un endpoint del API
 * @param endpoint - El endpoint del API (ejemplo: "/products" o "products")
 * @returns La URL completa
 */
export function getApiUrl(endpoint: string): string {
  // Asegurar que el endpoint comience con /
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  // Si estamos en desarrollo, usar el proxy local
  if (import.meta.env.MODE === 'development') {
    return `/api${normalizedEndpoint}`;
  }
  
  // En producción, usar la URL completa
  if (API_BASE_URL.endsWith("/api")) {
    return `${API_BASE_URL}${normalizedEndpoint}`;
  }
  
  return `${API_BASE_URL}${normalizedEndpoint}`;
}

/**
 * Headers de autenticación comunes
 */
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}
