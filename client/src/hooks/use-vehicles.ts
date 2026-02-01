import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface Vehicle {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  cliente_id: string;
  kilometraje?: number;
}

export interface CreateVehicleDTO {
  patente: string;
  marca: string;
  modelo: string;
  anio?: number;
  color?: string;
  cliente_id: string;
}

export function useVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/vehicles"), {
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
      const res = await fetch(getApiUrl(`/vehicles/${id}`), {
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
      // Normalizar Patente: convertir a mayúsculas y trim
      const normalizedData = {
        ...data,
        patente: data.patente.toUpperCase().trim(),
      };

      const res = await fetch(getApiUrl("/vehicles"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(normalizedData),
      });
      if (!res.ok) {
        const error = await res.json();
        let errorMessage = error.message || "Error al crear vehículo";
        
        if (res.status === 409) {
          errorMessage = "Ya existe un vehículo con esa patente.";
        }
        
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateVehicleDTO>) => {
      // Normalizar Patente si está presente
      const normalizedData = {
        ...data,
        ...(data.patente && { patente: data.patente.toUpperCase().trim() }),
      };

      const res = await fetch(getApiUrl(`/vehicles/${id}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(normalizedData),
      });
      if (!res.ok) {
        const error = await res.json();
        let errorMessage = error.message || "Error al actualizar vehículo";
        
        if (res.status === 409) {
          errorMessage = "Ya existe un vehículo con esa patente.";
        }
        
        throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/vehicles/${id}`), {
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
