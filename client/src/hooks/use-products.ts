import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface Product {
  id: string;
  sku: string;
  nombre: string;
  marca: string | null;
  calidad: string | null;
  precio_venta: number;
  stock_actual: number;
  stock_minimo: number;
  created_at?: string;
  categoria: {
    id: string;
    nombre: string;
  } | null;
  modelosCompatibles?: Array<{
    id: string;
    marca: string;
    modelo: string;
    anio: number;
  }>;
  compatibilidades?: Array<{
    id: string;
    marca: string;
    modelo: string;
    anio: number;
  }>;
}

export interface CreateProductDTO {
  sku: string;
  nombre: string;
  marca?: string;
  calidad?: string;
  precio_venta: number;
  stock_actual?: number;
  stock_minimo?: number;
  categoriaId?: string;
  modelosCompatiblesIds?: string[];
}

export function useProducts(search?: string) {
  return useQuery<Product[]>({
    queryKey: ["products", search],
    queryFn: async () => {
      const url = search
        ? getApiUrl(`/products?search=${encodeURIComponent(search)}`)
        : getApiUrl("/products");

      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();



      return data;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProductDTO) => {

      const res = await fetch(getApiUrl("/products"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        let errorMessage = error.message || "Error al crear producto";

        // Mejorar mensajes de error específicos
        if (res.status === 409) {
          errorMessage = "Ya existe un producto con ese SKU o un modelo de vehículo duplicado. Por favor, verifica los datos.";
        } else if (res.status === 400) {
          if (Array.isArray(error.message)) {
            errorMessage = error.message.join(", ");
          }
        }

        throw new Error(errorMessage);
      }
      const createdProduct = await res.json();

      return createdProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<CreateProductDTO>) => {
      const res = await fetch(getApiUrl(`/products/${id}`), {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Error al actualizar producto");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(getApiUrl(`/products/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        // Intentar parsear el error solo si hay contenido
        let errorMessage = "Error al eliminar producto";

        try {
          const error = await res.json();
          errorMessage = error.message || errorMessage;
        } catch {
          // Si no hay JSON, usar mensaje por defecto
        }

        // Mejorar mensajes para errores de restricción de integridad
        if (res.status === 500 || res.status === 409) {
          errorMessage = "No se puede eliminar este producto porque está siendo usado en órdenes de trabajo, compras o ventas. Considera reducir el stock a 0 en su lugar.";
        }

        throw new Error(errorMessage);
      }

      // El DELETE puede devolver 204 No Content (sin body)
      // Solo intentar parsear JSON si hay contenido
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return res.json();
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
