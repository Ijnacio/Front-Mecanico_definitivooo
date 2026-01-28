import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Vehicle {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  cliente_id: string;
}

export interface CreateVehicleDTO {
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  cliente_id: string;
}

const getAuthToken = () => localStorage.getItem("access_token");

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

export function useVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al cargar vehículos");
      return res.json();
    },
  });
}

export function useVehicle(id: string) {
  return useQuery<Vehicle>({
    queryKey: ["vehicles", id],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${id}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al cargar vehículo");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVehicleDTO) => {
      const res = await fetch("/api/vehicles", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear vehículo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateVehicleDTO>) => {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar vehículo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar vehículo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
