import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

const getAuthToken = () => localStorage.getItem("access_token");

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ["clients"],
    queryFn: async () => {
      const res = await fetch("/api/clients", {
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
      const res = await fetch("/api/clients", {
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
