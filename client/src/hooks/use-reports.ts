import { useQuery } from "@tanstack/react-query";
import { getApiUrl, getAuthHeaders } from "@/lib/api";

export interface LowStockProduct {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  stock_actual: number;
  stock_minimo: number;
  diferencia: number;
  categoria: string;
  precio_venta: number;
}

export interface LowStockReport {
  total_alertas: number;
  fecha_consulta: string;
  productos: LowStockProduct[];
}

export interface DailyCashReport {
  fecha: string;
  total_taller: number;
  cantidad_ordenes: number;
  total_meson: number;
  cantidad_ventas_meson: number;
  total_final: number;
}

export interface SearchResult {
  busqueda: string;
  total_resultados: number;
  clientes: {
    id: string;
    nombre: string;
    rut: string;
    telefono?: string;
    email?: string;
    cantidad_ordenes?: number;
  }[];
  vehiculos: {
    id: string;
    patente: string;
    marca: string;
    modelo: string;
    anio?: number;
  }[];
  ordenes_recientes: {
    id: string;
    numero_orden?: number;
    numero_orden_papel?: number;
    patente: string;
    cliente_nombre: string;
    fecha: string;
    total?: number;
    total_cobrado?: number;
    estado?: string;
  }[];
}

export function useLowStockReport() {
  return useQuery<LowStockReport>({
    queryKey: ["reports", "low-stock"],
    queryFn: async () => {
      try {
        const response = await fetch(getApiUrl("/reports/low-stock"), {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          // Si el endpoint no existe, devolver datos vacíos
          return {
            total_alertas: 0,
            fecha_consulta: new Date().toISOString(),
            productos: [],
          };
        }

        return response.json();
      } catch (error) {
        // Si hay error, devolver estructura vacía
        return {
          total_alertas: 0,
          fecha_consulta: new Date().toISOString(),
          productos: [],
        };
      }
    },
  });
}

export function useDailyCashReport(fecha?: string) {
  return useQuery<DailyCashReport>({
    queryKey: ["reports", "daily-cash", fecha],
    queryFn: async () => {
      try {
        const url = fecha 
          ? getApiUrl(`/reports/daily-cash?fecha=${fecha}`)
          : getApiUrl("/reports/daily-cash");
        
        const response = await fetch(url, {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          // Si no existe, devolver datos vacíos
          return {
            fecha: new Date().toISOString().split('T')[0],
            total_taller: 0,
            cantidad_ordenes: 0,
            total_meson: 0,
            cantidad_ventas_meson: 0,
            total_final: 0,
          };
        }

        return response.json();
      } catch (error) {
        return {
          fecha: new Date().toISOString().split('T')[0],
          total_taller: 0,
          cantidad_ordenes: 0,
          total_meson: 0,
          cantidad_ventas_meson: 0,
          total_final: 0,
        };
      }
    },
  });
}

export function useGlobalSearch(query: string) {
  return useQuery<SearchResult>({
    queryKey: ["reports", "search", query],
    queryFn: async () => {
      if (!query || query.length < 2) {
        return {
          busqueda: query,
          total_resultados: 0,
          clientes: [],
          vehiculos: [],
          ordenes_recientes: [],
        };
      }

      try {
        const response = await fetch(getApiUrl(`/reports/search?q=${encodeURIComponent(query)}`), {
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          // Si no existe endpoint, devolver vacío
          return {
            busqueda: query,
            total_resultados: 0,
            clientes: [],
            vehiculos: [],
            ordenes_recientes: [],
          };
        }

        return response.json();
      } catch (error) {
        return {
          busqueda: query,
          total_resultados: 0,
          clientes: [],
          vehiculos: [],
          ordenes_recientes: [],
        };
      }
    },
    enabled: query.length >= 2,
  });
}
