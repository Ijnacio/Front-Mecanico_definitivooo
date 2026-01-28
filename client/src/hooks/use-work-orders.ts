import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface WorkOrder {
  id: string;
  numero_orden_papel: number;
  estado: "FINALIZADA" | "EN_PROCESO" | "CANCELADA";
  fecha_ingreso: string;
  total_cobrado: number;
  realizado_por: string;
  revisado_por: string | null;
  patente_vehiculo: string;
  kilometraje: number | null;
  cliente: {
    id: string;
    nombre: string;
    rut: string | null;
    telefono: string | null;
  };
  detalles: WorkOrderDetail[];
  createdByName: string;
  createdAt: string;
}

export interface WorkOrderDetail {
  id: string;
  servicio_nombre: string;
  descripcion: string | null;
  precio: number;
  producto: {
    id: string;
    sku: string;
    nombre: string;
  } | null;
}

export interface CreateWorkOrderDTO {
  numero_orden_papel: number;
  cliente_rut: string;
  cliente_nombre: string;
  cliente_telefono?: string;
  vehiculo_patente: string;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_anio?: number;
  vehiculo_km?: number;
  items: {
    servicio_nombre: string;
    descripcion?: string;
    precio: number;
    product_sku?: string;
    product_cantidad?: number;
  }[];
}

export function useWorkOrders(search?: string) {
  return useQuery<WorkOrder[]>({
    queryKey: ["work-orders", search],
    queryFn: async () => {
      const url = search 
        ? getApiUrl(`/work-orders?search=${encodeURIComponent(search)}`)
        : getApiUrl("/work-orders");
      
      const res = await fetch(url, { 
        headers: getAuthHeaders() 
      });
      if (!res.ok) throw new Error("Error al cargar órdenes de trabajo");
      const data = await res.json();
      
      // Adaptar datos del backend antiguo al formato esperado
      return data.map((wo: any) => ({
        id: wo.id?.toString() || wo.id,
        numero_orden_papel: wo.otNumber || wo.numero_orden_papel || 0,
        estado: wo.status === "completed" ? "FINALIZADA" : 
                wo.status === "pending" ? "EN_PROCESO" : 
                wo.status === "working" ? "EN_PROCESO" :
                wo.status === "cancelled" ? "CANCELADA" :
                wo.estado || "EN_PROCESO",
        fecha_ingreso: wo.entryDate || wo.fecha_ingreso || new Date().toISOString(),
        total_cobrado: wo.total || wo.total_cobrado || 0,
        realizado_por: wo.mechanic || wo.realizado_por || "Sin asignar",
        revisado_por: wo.supervisor || wo.revisado_por || null,
        patente_vehiculo: wo.patent || wo.patente_vehiculo || "N/A",
        kilometraje: wo.km || wo.kilometraje || null,
        cliente: {
          id: "1",
          nombre: wo.clientName || "Sin cliente",
          rut: wo.clientRut || null,
          telefono: null,
        },
        detalles: [],
        createdByName: wo.mechanic || wo.realizado_por || "",
        createdAt: wo.entryDate || wo.createdAt || new Date().toISOString(),
      }));
    },
  });
}

export function useServicesCatalog() {
  return useQuery<string[]>({
    queryKey: ["services-catalog"],
    queryFn: async () => {
      const res = await fetch(getApiUrl("/work-orders/services-catalog"), { 
        headers: getAuthHeaders() 
      });
      if (!res.ok) throw new Error("Error al cargar catálogo de servicios");
      return res.json();
    },
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWorkOrderDTO) => {
      const res = await fetch(getApiUrl("/work-orders"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear orden de trabajo");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateWorkOrderDTO>) => {
      const res = await fetch(getApiUrl(`/work-orders/${id}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar orden");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/work-orders/${id}`), { 
        method: "DELETE", 
        headers: getAuthHeaders() 
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar orden");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });
}
