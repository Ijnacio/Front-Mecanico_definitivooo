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
  cliente_email?: string;
  vehiculo_patente: string;
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_anio?: number;
  vehiculo_km?: number;
  realizado_por?: string;
  revisado_por?: string;
  items: {
    servicio_nombre: string;
    descripcion?: string;
    precio: number;
    product_sku?: string;
    cantidad_producto?: number;
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
      
      console.log("📋 Órdenes recibidas del backend:", data);
      
      // Adaptar datos del backend al formato esperado
      return data.map((wo: any) => {
        console.log("🔍 Procesando orden:", {
          id: wo.id,
          vehiculo_raw: wo.vehiculo,
          patente_vehiculo: wo.patente_vehiculo,
        });
        
        return {
          id: wo.id?.toString() || wo.id,
          numero_orden_papel: wo.numero_orden_papel || 0,
          estado: wo.estado || "EN_PROCESO",
          fecha_ingreso: wo.fecha_creacion || wo.createdAt || new Date().toISOString(),
          total_cobrado: wo.total_cobrado || 0,
          realizado_por: wo.realizado_por || "Sin asignar",
          revisado_por: wo.revisado_por || null,
          patente_vehiculo: wo.vehiculo?.patente || wo.patente_vehiculo || "N/A",
          kilometraje: wo.vehiculo?.kilometraje || null,
          vehiculo: wo.vehiculo ? {
            marca: wo.vehiculo.marca,
            modelo: wo.vehiculo.modelo,
            patente: wo.vehiculo.patente
          } : null,
          cliente: wo.cliente ? {
            id: wo.cliente.id || "1",
            nombre: wo.cliente.nombre,
            rut: wo.cliente.rut || null,
            telefono: wo.cliente.telefono || null,
          } : {
            id: "1",
            nombre: "Sin cliente",
            rut: null,
            telefono: null,
          },
          mecanico_asignado: wo.realizado_por ? { nombre: wo.realizado_por } : null,
          detalles: wo.items || [],
          createdByName: wo.realizado_por || "",
          createdAt: wo.fecha_creacion || wo.createdAt || new Date().toISOString(),
        };
      });
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
      console.log("📤 Enviando al backend:", JSON.stringify(data, null, 2));
      
      const res = await fetch(getApiUrl("/work-orders"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      console.log("📥 Respuesta del backend - Status:", res.status, res.statusText);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error del backend:", errorText);
        
        let errorMessage = "Error al crear orden de trabajo";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
          console.error("❌ Error parseado:", errorJson);
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await res.json();
      console.log("✅ Orden creada exitosamente:", responseData);
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
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
