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
  proveedor_id: string;
  numero_factura?: string;
  items: {
    sku: string;
    nombre: string;
    cantidad: number;
    precio_unitario: number;
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
        
        // Adaptar datos del backend antiguo
        return data.map((p: any) => ({
          id: p.id?.toString() || p.id,
          numero_factura: p.invoiceNumber || p.numero_factura || null,
          fecha: p.date || p.fecha || new Date().toISOString(),
          monto_neto: p.totalCost ? p.totalCost * 0.81 : (p.monto_neto || 0),
          monto_iva: p.totalCost ? p.totalCost * 0.19 : (p.monto_iva || 0),
          monto_total: p.totalCost || p.monto_total || 0,
          proveedor: {
            id: "1",
            nombre: p.supplier || p.proveedor?.nombre || "Proveedor General",
          },
          detalles: [],
          createdByName: "Sistema",
          createdAt: p.date || p.createdAt || new Date().toISOString(),
        }));
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
      const res = await fetch(getApiUrl("/purchases"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al crear compra");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useDeletePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/purchases/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al eliminar compra");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
