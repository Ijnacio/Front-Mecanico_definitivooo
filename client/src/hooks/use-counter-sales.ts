import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface CounterSale {
  id: string;
  tipo_movimiento: "VENTA" | "PERDIDA" | "USO_INTERNO";
  fecha: string;
  total_venta: number;
  costo_perdida: number;
  comentario: string | null;
  vendedor: string | null;
  createdByName: string;
  createdAt: string;
  detalles: CounterSaleDetail[];
}

export interface CounterSaleDetail {
  id: string;
  cantidad: number;
  precio_venta_unitario: number;
  costo_producto: number;
  total_fila: number;
  producto: {
    id: string;
    sku: string;
    nombre: string;
    marca: string | null;
  };
}

export interface CreateCounterSaleDTO {
  tipo_movimiento: "VENTA" | "PERDIDA" | "USO_INTERNO";
  vendedor?: string;
  comentario?: string;
  items: {
    sku: string;
    cantidad: number;
    precio_venta?: number;
  }[];
}

export function useCounterSales(tipo?: "VENTA" | "PERDIDA" | "USO_INTERNO") {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery<CounterSale[]>({
    queryKey: ["counter-sales", tipo],
    queryFn: async () => {
      try {
        const url = tipo
          ? getApiUrl(`/counter-sales?tipo=${tipo}`)
          : getApiUrl("/counter-sales");

        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          // Si no existe, devolver array vacío
          return [];
        }

        return response.json();
      } catch (error) {
        return [];
      }
    },
  });

  const createSaleMutation = useMutation({
    mutationFn: async (sale: CreateCounterSaleDTO) => {
      const response = await fetch(getApiUrl("/counter-sales"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(sale),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al registrar el movimiento");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["counter-sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return {
    sales,
    isLoading,
    createSale: createSaleMutation.mutate,
    createSaleAsync: createSaleMutation.mutateAsync,
    isCreating: createSaleMutation.isPending,
    createError: createSaleMutation.error?.message,
  };
}
