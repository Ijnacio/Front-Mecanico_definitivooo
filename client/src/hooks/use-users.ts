import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

interface User {
  id: string;
  rut: string;
  nombre: string;
  role: "ADMIN" | "WORKER";
  createdAt?: string;
}

interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

/**
 * Hook para listar todos los usuarios (solo ADMIN)
 */
export function useUsers() {
  return useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch(getApiUrl("/users"), {
        headers: getAuthHeaders(),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al obtener usuarios");
      }
      
      return response.json() as Promise<User[]>;
    },
  });
}

/**
 * Hook para cambiar la contraseña del usuario actual
 */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ChangePasswordDTO) => {
      const response = await fetch(getApiUrl("/users/change-password"), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al cambiar contraseña");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

/**
 * Hook para desactivar un usuario (solo ADMIN)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(getApiUrl(`/users/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al desactivar usuario");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}
