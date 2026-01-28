import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface Provider {
  id: string;
  nombre: string;
  rut: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export interface CreateProviderDTO {
  nombre: string;
  rut: string;
  direccion?: string;
  telefono?: string;
  email?: string;
}

export function useProviders() {
  return useQuery<Provider[]>({
    queryKey: ["providers"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/providers"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al cargar proveedores");
      return res.json();
    },
  });
}

export function useProvider(id: string) {
  return useQuery<Provider>({
    queryKey: ["providers", id],
    queryFn: async () => {
      const res = await fetch(getApiUrl(`/providers/${id}`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al cargar proveedor");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProviderDTO) => {
      const res = await fetch(getApiUrl("/providers"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear proveedor");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateProviderDTO>) => {
      const res = await fetch(getApiUrl(`/providers/${id}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar proveedor");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/providers/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar proveedor");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    },
  });
}
