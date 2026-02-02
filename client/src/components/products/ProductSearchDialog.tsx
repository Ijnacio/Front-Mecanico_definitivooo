import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { Search, Package, AlertCircle, Circle, XCircle } from "lucide-react";

interface ProductSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (product: any) => void;
  title?: string;
  showOutOfStock?: boolean; // Nueva prop para mostrar productos sin stock
}

export function ProductSearchDialog({ 
  open, 
  onClose, 
  onSelect,
  title = "🔍 Seleccionar Repuesto",
  showOutOfStock = false
}: ProductSearchDialogProps) {
  const { data: categories = [] } = useCategories();
  const { data: allProducts = [] } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low" | "out-stock">("all");
  
  const filteredProducts = useMemo(() => {
    let products = [...allProducts];

    // Filtro de stock
    if (!showOutOfStock) {
      // Modo orden de trabajo: solo productos con stock
      products = products.filter((p: any) => p.stock_actual > 0);
    } else {
      // Modo compras: filtrar según el filtro seleccionado
      if (stockFilter === "in-stock") {
        products = products.filter((p: any) => p.stock_actual > p.stock_minimo);
      } else if (stockFilter === "low") {
        products = products.filter((p: any) => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo);
      } else if (stockFilter === "out-stock") {
        products = products.filter((p: any) => p.stock_actual === 0);
      }
    }
    
    // Filtro de categoría
    if (selectedCategory) {
      products = products.filter((p: any) => p.categoria?.id === selectedCategory);
    }
    
    // Filtro de búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter((p: any) => 
        p.nombre.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query) ||
        (p.marca && p.marca.toLowerCase().includes(query))
      );
    }
    
    return products;
  }, [allProducts, selectedCategory, searchQuery, showOutOfStock, stockFilter]);

  // Contar productos con y sin stock
  const inStockCount = allProducts.filter((p: any) => p.stock_actual > p.stock_minimo).length;
  const lowStockCount = allProducts.filter((p: any) => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo).length;
  const outOfStockCount = allProducts.filter((p: any) => p.stock_actual === 0).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-amber-50">
        <DialogHeader>
          <DialogTitle className="text-slate-800 font-bold">{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, SKU o marca..."
              className="pl-10 bg-white border-blue-300 focus:border-blue-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filtros */}
          <div className="flex gap-3 items-center flex-wrap">
            {/* Filtro de Categoría */}
            <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}>
              <SelectTrigger className="h-10 w-full md:w-[250px] bg-blue-50 border-blue-300 border-dashed flex items-center hover:bg-blue-100 transition-colors">
                <SelectValue placeholder="Todas las Categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todas las Categorías ({allProducts.length})
                </SelectItem>
                {categories.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    No hay categorías creadas
                  </SelectItem>
                ) : (
                  categories.map((cat: any) => {
                    const count = allProducts.filter((p: any) => p.categoria?.id === cat.id).length;
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nombre} ({count})
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>

            {/* Filtro de Stock (solo si showOutOfStock es true) */}
            {showOutOfStock && (
              <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
                <SelectTrigger className={`h-10 w-full md:w-[200px] border-dashed flex items-center transition-colors ${
                  stockFilter === 'in-stock' ? 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100' :
                  stockFilter === 'low' ? 'bg-orange-50 border-orange-300 hover:bg-orange-100' :
                  stockFilter === 'out-stock' ? 'bg-red-50 border-red-300 hover:bg-red-100' :
                  'bg-slate-50 border-slate-300 hover:bg-slate-100'
                }`}>
                  <SelectValue placeholder="Estado Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Todos ({allProducts.length})
                  </SelectItem>
                  <SelectItem value="in-stock" className="text-emerald-600 font-medium">
                    <div className="flex items-center gap-2">
                      <Circle className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                      Con Stock ({inStockCount})
                    </div>
                  </SelectItem>
                  <SelectItem value="low" className="text-orange-500 font-medium">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-3 h-3" />
                      Bajo Stock ({lowStockCount})
                    </div>
                  </SelectItem>
                  <SelectItem value="out-stock" className="text-red-600 font-medium">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-3 h-3" />
                      Sin Stock ({outOfStockCount})
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Lista de productos */}
          <div className="max-h-[400px] overflow-y-auto space-y-2 p-2 bg-white rounded-lg border border-slate-200">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay productos disponibles</p>
              </div>
            ) : (
              filteredProducts.map((product: any) => {
                const outOfStock = product.stock_actual === 0;
                const lowStock = product.stock_actual > 0 && product.stock_actual <= product.stock_minimo;
                
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => {
                      onSelect(product);
                      onClose();
                    }}
                    className="w-full p-3 text-left border rounded-lg transition-all border-blue-200 bg-white hover:bg-blue-50 hover:border-blue-400"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`font-semibold ${outOfStock ? 'text-slate-500' : 'text-slate-900'}`}>
                            {product.nombre}
                          </p>
                          {outOfStock && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                              <XCircle className="w-3 h-3" />
                              SIN STOCK
                            </span>
                          )}
                          {lowStock && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              BAJO STOCK
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          SKU: {product.sku} • Stock: {product.stock_actual}
                          {product.marca && ` • ${product.marca}`}
                        </p>
                        {product.categoria && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {product.categoria.nombre}
                          </span>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className={`font-bold ${outOfStock ? 'text-slate-400' : 'text-emerald-600'}`}>
                          ${product.precio_venta.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}