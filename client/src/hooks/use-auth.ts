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

        const response = await fetch(getApiUrl("/auth/me"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          localStorage.removeItem("access_token");
          return null;
        }
        
        const data = await response.json();
        return data;
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
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Error al cerrar sesión");
      }

      return response.json();
    },
    onSuccess: () => {
      localStorage.removeItem("access_token");
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
