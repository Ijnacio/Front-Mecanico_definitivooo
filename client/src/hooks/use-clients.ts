import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface Client {
  id: string;
  rut: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export interface CreateClientDTO {
  rut: string;
  nombre: string;
  telefono?: string;
  email?: string;
  direccion?: string;
}

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/clients"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al cargar clientes");
      return res.json();
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClientDTO) => {
      const res = await fetch(getApiUrl("/clients"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
