import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface VehicleModel {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
}

export interface CreateVehicleModelDTO {
  marca: string;
  modelo: string;
  anio: number;
}

export function useVehicleModels() {
  return useQuery<VehicleModel[]>({
    queryKey: ["vehicle-models"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/vehicle-models"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al cargar modelos de vehículos");
      return res.json();
    },
  });
}

export function useSearchVehicleModels(query: string) {
  return useQuery<VehicleModel[]>({
    queryKey: ["vehicle-models", "search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const res = await fetch(getApiUrl(`/vehicle-models/search?q=${encodeURIComponent(query)}`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al buscar modelos");
      return res.json();
    },
    enabled: !!query && query.length >= 2,
  });
}

export function useVehicleModelBrands() {
  return useQuery<string[]>({
    queryKey: ["vehicle-models", "brands"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/vehicle-models/marcas"), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al cargar marcas");
      return res.json();
    },
  });
}

export function useVehicleModelsByBrand(marca: string) {
  return useQuery<VehicleModel[]>({
    queryKey: ["vehicle-models", "brand", marca],
    queryFn: async () => {
      if (!marca) return [];
      const res = await fetch(getApiUrl(`/vehicle-models/marcas/${encodeURIComponent(marca)}/modelos`), {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Error al cargar modelos");
      return res.json();
    },
    enabled: !!marca,
  });
}

export function useCreateVehicleModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateVehicleModelDTO) => {
      const res = await fetch(getApiUrl("/vehicle-models"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear modelo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-models"] });
    },
  });
}

export function useUpdateVehicleModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateVehicleModelDTO>) => {
      const res = await fetch(getApiUrl(`/vehicle-models/${id}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar modelo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-models"] });
    },
  });
}

export function useDeleteVehicleModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/vehicle-models/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar modelo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-models"] });
    },
  });
}
