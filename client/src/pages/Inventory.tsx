import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Search, Trash2, PackageOpen, AlertTriangle, Pencil, Filter, DollarSign, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useProducts, useCreateProduct, useDeleteProduct, useUpdateProduct } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const { data: allProducts = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { toast } = useToast();

  // Filtrar productos
  let products = allProducts.filter(p => {
    // Filtro de búsqueda
    const matchesSearch = 
      (p.sku?.toLowerCase() || "").includes(search.toLowerCase()) || 
      (p.nombre?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (p.marca?.toLowerCase() || "").includes(search.toLowerCase());
    
    // Filtro de categoría
    const matchesCategory = categoryFilter === "all" || 
      (p.categoria?.nombre || "") === categoryFilter;
    
    // Filtro de marca
    const matchesBrand = brandFilter === "all" || 
      (p.marca?.toLowerCase() || "") === brandFilter.toLowerCase();
    
    // Filtro de stock
    let matchesStock = true;
    if (stockFilter === "low") {
      matchesStock = p.stock_actual < p.stock_minimo;
    } else if (stockFilter === "good") {
      matchesStock = p.stock_actual >= p.stock_minimo;
    }
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventario de Repuestos" 
        description=""
        action={<AddProductDialog />}
      />

      {/* Buscador y Filtros */}
      <div className="card-industrial p-4 bg-white space-y-4">
        {/* Barra de Búsqueda Principal */}
        <div className="relative">
          {!searchFocused && !search && (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
          <Input 
            placeholder=""
            className="h-12 pl-14 text-base bg-slate-50 border-slate-200 focus:bg-white transition-colors rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <span className="text-sm text-slate-600 font-medium">Filtrar por:</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px] bg-slate-50 border-slate-200">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="w-3 h-3" />
                <SelectValue placeholder="Categoría" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Marcas</SelectItem>
              <SelectItem value="bosch">Bosch</SelectItem>
              <SelectItem value="vier">Vier</SelectItem>
              <SelectItem value="brembo">Brembo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-[160px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el Stock</SelectItem>
              <SelectItem value="low"><span className="text-red-600 font-semibold">Stock Bajo</span></SelectItem>
              <SelectItem value="good"><span className="text-green-600 font-semibold">Stock Normal</span></SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="card-industrial bg-white">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b-2 border-slate-200">
              <TableHead className="font-display font-bold text-slate-900 h-14">SKU</TableHead>
              <TableHead className="font-display font-bold text-slate-900 h-14">Nombre</TableHead>
              <TableHead className="font-display font-bold text-slate-900 h-14">Categoría</TableHead>
              <TableHead className="font-display font-bold text-slate-900 h-14">Calidad</TableHead>
              <TableHead className="font-display font-bold text-slate-900 h-14">Marca</TableHead>
              <TableHead className="font-display font-bold text-slate-900 h-14">Stock</TableHead>
              <TableHead className="font-display font-bold text-slate-900 h-14">Precio Venta</TableHead>
              <TableHead className="w-[100px] h-14"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p>Cargando inventario...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : products?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <PackageOpen className="w-12 h-12 text-slate-300" />
                    <p>No se encontraron productos.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products?.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProductRow({ product }: { product: any }) {
  const [editOpen, setEditOpen] = useState(false);
  const { toast } = useToast();
  const deleteMutation = useDeleteProduct();

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar el producto ${product.sku}?`)) {
      deleteMutation.mutate(product.id, {
        onSuccess: () => {
          toast({ 
            title: "Producto eliminado", 
            description: `${product.sku} ha sido eliminado del inventario`,
            className: "bg-red-600 text-white border-none"
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "No se pudo eliminar el producto",
            variant: "destructive"
          });
        }
      });
    }
  };

  const isLowStock = product.stock_actual < product.stock_minimo;

  return (
    <>
      <TableRow className="table-row-hover group border-b border-slate-100">
        <TableCell className="font-mono text-slate-600 font-medium">{product.sku}</TableCell>
        <TableCell className="font-semibold text-slate-900">{product.nombre}</TableCell>
        <TableCell>
          {product.categoria ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
              {product.categoria.nombre}
            </span>
          ) : (
            <span className="text-slate-400 text-xs">Sin categoría</span>
          )}
        </TableCell>
        <TableCell>
          {product.calidad ? (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              product.calidad.includes('Alta') || product.calidad.includes('Cerámica') ? 'bg-green-100 text-green-700' :
              product.calidad.includes('Media') || product.calidad.includes('Semimetálica') ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {product.calidad}
            </span>
          ) : (
            <span className="text-slate-400 text-xs">N/A</span>
          )}
        </TableCell>
        <TableCell className="font-medium text-slate-900">
          {product.marca || <span className="text-slate-400">Sin marca</span>}
        </TableCell>
        
        {/* COLUMNA DE STOCK */}
        <TableCell>
          <div className="flex items-center gap-2">
            <span className={isLowStock ? "text-red-600 font-bold" : "text-slate-900 font-medium"}>
              {product.stock_actual} u.
            </span>
            {isLowStock && (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
          </div>
          <div className="text-[10px] text-muted-foreground">
            Mín: {product.stock_minimo}
          </div>
        </TableCell>

        {/* COLUMNA DE PRECIO */}
        <TableCell>
          <span className="font-bold text-slate-900 text-sm">
            ${(product.precio_venta || 0).toLocaleString('es-CL')}
          </span>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setEditOpen(true)}
              className="h-8 w-8 text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="h-8 w-8 text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700"
              title="Eliminar"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>
      
      <EditProductDialog 
        product={product}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

function EditProductDialog({ product, open, onOpenChange }: { product: any; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const updateMutation = useUpdateProduct();

  const form = useForm({
    defaultValues: {
      sku: product.sku,
      nombre: product.nombre,
      marca: product.marca || "",
      calidad: product.calidad || "",
      precio_venta: product.precio_venta,
      stock_actual: product.stock_actual,
      stock_minimo: product.stock_minimo,
      categoria_id: product.categoria?.id || "",
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate({ id: product.id, ...data }, {
      onSuccess: () => {
        onOpenChange(false);
        toast({ 
          title: "Producto actualizado", 
          description: `${data.sku} ha sido actualizado correctamente`,
          className: "bg-green-600 text-white border-none"
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar el producto",
          variant: "destructive"
        });
      }
    });
  };

  const handleNetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const netPrice = parseInt(e.target.value) || 0;
    const grossPrice = Math.round(netPrice * 1.19);
    form.setValue("precio_venta", grossPrice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Editar Producto</DialogTitle>
          <DialogDescription>
            Modifique los detalles del producto {product.sku}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: FRN-001" className="uppercase font-mono" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Bosch" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl><Input {...field} placeholder="Ej: Pastillas de freno delanteras" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calidad</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Alta, Media" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="calidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calidad</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Alta, Media" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SECCIÓN PRECIOS Y STOCK */}
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-sm text-blue-900">Precios y Stock</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel className="text-xs text-muted-foreground">Precio Neto (Sin IVA)</FormLabel>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    defaultValue={Math.round(product.precio_venta / 1.19)}
                    onChange={handleNetPriceChange}
                    className="bg-white"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="precio_venta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700">Precio Venta (Con IVA)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                          className="bg-white font-bold text-slate-900 border-blue-200 focus:border-blue-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_actual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Actual</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_minimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-pill" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddProductDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateProduct();

  const form = useForm({
    defaultValues: {
      sku: "",
      nombre: "",
      marca: "",
      calidad: "",
      precio_venta: 0,
      stock_actual: 0,
      stock_minimo: 0,
      categoria_id: "",
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        toast({ 
          title: "Producto creado exitosamente", 
          description: `${data.sku} ha sido agregado al inventario`,
          className: "bg-green-600 text-white border-none" 
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear el producto",
          variant: "destructive"
        });
      }
    });
  };

  // Función para calcular IVA automáticamente
  const handleNetPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const netPrice = parseInt(e.target.value) || 0;
    const grossPrice = Math.round(netPrice * 1.19); // Calcula IVA 19%
    form.setValue("precio_venta", grossPrice);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="btn-pill bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Agregar Producto</DialogTitle>
          <DialogDescription>
            Ingrese los detalles del repuesto. Los precios se calcularán automáticamente.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: FRN-001" className="uppercase font-mono" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Bosch" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Producto</FormLabel>
                  <FormControl><Input {...field} placeholder="Ej: Pastillas de freno delanteras" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="calidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calidad</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Alta, Media" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* SECCIÓN PRECIOS ACTUALIZADA */}
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <h4 className="font-medium text-sm text-blue-900">Precios y Stock</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Campo Simulado para Neto */}
                <div className="space-y-2">
                  <FormLabel className="text-xs text-muted-foreground">Precio Neto (Sin IVA)</FormLabel>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    onChange={handleNetPriceChange}
                    className="bg-white"
                  />
                </div>

                <FormField
                  control={form.control}
                  name="precio_venta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-700">Precio Venta (Con IVA)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                          className="bg-white font-bold text-slate-900 border-blue-200 focus:border-blue-400"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_actual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Inicial</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stock_minimo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Mínimo</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="w-full btn-pill" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Guardar Producto"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}