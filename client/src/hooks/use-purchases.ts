import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface Purchase {
  id: string;
  numero_factura: string | null;
  fecha: string;
  monto_neto: number;
  monto_iva: number;
  monto_total: number;
  proveedor: {
    id: string;
    nombre: string;
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
  tipo_documento: "FACTURA" | "BOLETA" | "NOTA";
  items: {
    sku: string;
    nombre: string;
    marca?: string;
    calidad?: string;
    cantidad: number;
    precio_costo: number;
    precio_venta_sugerido: number;
    modelos_compatibles_ids?: string[];
  }[];
}

export function usePurchases() {
  return useQuery<Purchase[]>({
    queryKey: ["purchases"],
    queryFn: async () => {
      try {
        const res = await fetch(getApiUrl("/purchases"), { 
          headers: getAuthHeaders() 
        });
        if (!res.ok) {
          // Si no existe, devolver array vacío
          return [];
        }
        const data = await res.json();
        
        console.log("📋 ============ COMPRAS RECIBIDAS DEL BACKEND ============");
        console.log("📋 Cantidad de compras:", data.length);
        console.log("📋 Primera compra (ejemplo):", JSON.stringify(data[0], null, 2));
        console.log("📋 =====================================================");
        
        // Adaptar datos del backend
        return data.map((p: any) => {
          console.log("🔍 Procesando compra:", {
            id: p.id,
            monto_neto: p.monto_neto,
            monto_iva: p.monto_iva,
            monto_total: p.monto_total,
            items: p.items,
            detalles: p.detalles,
          });
          
          // Calcular totales correctamente
          const montoNeto = p.monto_neto || 0;
          const montoIva = p.monto_iva || Math.round(montoNeto * 0.19);
          const montoTotal = p.monto_total || (montoNeto + montoIva);
          
          return {
            id: p.id?.toString() || p.id,
            numero_factura: p.numero_factura || p.numero_documento || null,
            fecha: p.fecha || p.createdAt || new Date().toISOString(),
            monto_neto: montoNeto,
            monto_iva: montoIva,
            monto_total: montoTotal,
            proveedor: {
              id: p.proveedor?.id || "1",
              nombre: p.proveedor?.nombre || p.proveedor_nombre || "Proveedor General",
            },
            detalles: p.items || p.detalles || [],
            createdByName: p.createdBy?.nombre || p.createdByName || "Sistema",
            createdAt: p.createdAt || new Date().toISOString(),
          };
        });
      } catch (error) {
        return [];
      }
    },
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreatePurchaseDTO) => {
      console.log("📦 Payload compra enviado:", JSON.stringify(data, null, 2));
      
      const res = await fetch(getApiUrl("/purchases"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      
      console.log("📥 Respuesta backend - Status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error del backend:", errorText);
        let errorMessage = "Error al crear compra";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      
      const responseData = await res.json();
      console.log("✅ Compra creada:", responseData);
      return responseData;
    },
    onSuccess: async () => {
      // Invalidar y refrescar automáticamente
      await queryClient.invalidateQueries({ queryKey: ["purchases"] });
      await queryClient.refetchQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      console.log("🗑️ Intentando eliminar compra con ID:", id);
      
      const res = await fetch(getApiUrl(`/purchases/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      
      console.log("📥 Respuesta eliminación - Status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Error al eliminar:", errorText);
        let errorMessage = "Error al eliminar compra";
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
      
      console.log("✅ Compra eliminada correctamente");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
