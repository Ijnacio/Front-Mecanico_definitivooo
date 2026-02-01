import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface Purchase {
  id: string;
  numero_factura: string | null;
  fecha: string;
  monto_neto: number;
  monto_iva: number;
  monto_total: number;
  // Aliases para compatibilidad con la UI
  neto: number;
  iva: number;
  total: number;
  proveedor: {
    id: string;
    nombre: string;
    rut?: string;
  };
  detalles: PurchaseDetail[];
  createdByName: string;
  createdAt: string;
}

export interface PurchaseDetail {
  id: string;
  cantidad: number;
  precio_costo_unitario: number;
  total_fila: number;
  producto: {
    id: string;
    sku: string;
    nombre: string;
    marca: string | null;
  };
}

export interface CreatePurchaseDTO {
  proveedor_nombre: string;
  numero_documento?: string;
  tipo_documento: "FACTURA" | "INFORMAL";
  items: {
    sku: string;
    nombre: string;
    marca?: string;
    calidad?: string;
    cantidad: number;
    precio_costo: number;
    categoria_id?: string;
  }[];
}

export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      try {
        const res = await fetch(getApiUrl("/purchases"), {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Error fetching purchases");
        const data = await res.json();
        
        return data.map((p: any) => {
          // Intentar obtener montos de la respuesta o calcular si vienen en 0
          const montoNeto = p.monto_neto || p.neto || 0;
          const montoIva = p.monto_iva || p.iva || 0;
          const montoTotal = p.monto_total || p.total || 0;

          return {
            ...p,
            // Asegurar que las propiedades que usa la UI (neto, iva, total) estén pobladas
            neto: montoNeto,
            iva: montoIva,
            total: montoTotal,
            monto_neto: montoNeto,
            monto_iva: montoIva,
            monto_total: montoTotal,
            proveedor: {
              id: p.proveedor?.id || "1",
              nombre: p.proveedor?.nombre || p.proveedor_nombre || "Proveedor",
              rut: p.proveedor?.rut || ""
            },
            detalles: p.items || p.detalles || [],
            createdByName: p.createdBy?.nombre || p.createdByName || "Sistema",
            createdAt: p.createdAt || new Date().toISOString(),
          };
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching purchases:", error);
        }
        return [];
      }
    },
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePurchaseDTO) => {
      const res = await fetch(getApiUrl("/purchases"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al crear compra");
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalida todas las queries relacionadas para actualizar stock y precios
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      
      // Refetch inmediato para actualizar la tabla en tiempo real
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["purchases"] });
        queryClient.refetchQueries({ queryKey: ["products"] });
      }, 100);
    },
  });
}