import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { getApiUrl, getAuthHeaders as getApiAuthHeaders } from "@/lib/api";

export interface User {
  id: string;
  rut: string;
  nombre: string;
  role: "ADMIN" | "WORKER" | "administrador" | "mecanico";
}

// Helper para obtener el token del localStorage
const getAuthToken = () => localStorage.getItem("access_token");

// Helper para setear headers con autenticación
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper para decodificar el payload del JWT (sin verificar firma)
const decodeJwtPayload = (token: string): User | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    // El payload del JWT contiene los datos del usuario
    return {
      id: payload.sub || payload.id,
      rut: payload.rut,
      nombre: payload.nombre,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          return null;
        }

        // En lugar de llamar a /auth/me (que no existe), decodificamos el token localmente
        // Esto es seguro porque las llamadas subsiguientes al API fallarán si el token es inválido/expirado
        const userFromToken = decodeJwtPayload(token);

        if (userFromToken) {
          // Opcional: Podríamos verificar la expiración aquí si el token tiene 'exp'
          return userFromToken;
        }

        // Si el token no tiene formato válido, lo eliminamos
        localStorage.removeItem("access_token");
        return null;
      } catch (error) {
        localStorage.removeItem("access_token");
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { rut: string; password: string }) => {
      const response = await fetch(getApiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al iniciar sesión");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Guardar token en localStorage
      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }

      // Manejar diferentes formatos de respuesta
      // Nuevo backend: { access_token, user: { id, rut, nombre, role } }
      // Viejo backend: { id, rut, nombre, role } directamente
      const user = data.user || data;

      // Guardar usuario en cache
      queryClient.setQueryData(["user"], user);

      // Redirigir según el rol (compatible con ADMIN/administrador y WORKER/mecanico)
      const isAdmin = user.role === "ADMIN" || user.role === "administrador";
      if (isAdmin) {
        setLocation("/reportes");
      } else {
        setLocation("/work-orders"); // Workers van directo a órdenes de trabajo
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await fetch(getApiUrl("/auth/logout"), {
          method: "POST",
          headers: getAuthHeaders(),
        });

        // Incluso si falla el logout en el backend, limpiar localmente
        if (!response.ok) {
          console.warn("Error en logout del servidor, limpiando sesión local");
        }

        return { success: true };
      } catch (error) {
        // Si hay error de red, igual limpiar sesión local
        console.warn("Error de red en logout, limpiando sesión local");
        return { success: true };
      }
    },
    onSuccess: () => {
      localStorage.removeItem("access_token");
      queryClient.clear(); // Limpiar toda la cache
      queryClient.setQueryData(["user"], null);
      setLocation("/login");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "ADMIN" || user?.role === "administrador",
    isWorker: user?.role === "WORKER" || user?.role === "mecanico" || user?.role === "ADMIN" || user?.role === "administrador",
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    loginError: loginMutation.error?.message,
    isLoggingIn: loginMutation.isPending,
    getAuthHeaders, // Exportar para usar en otros hooks
  };
}
