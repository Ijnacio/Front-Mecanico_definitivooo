import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { useProducts, useDeleteProduct, useUpdateProduct } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/hooks/use-auth";
import { AddProductDialog } from "@/components/products/AddProductDialog";
import { createColumns } from "@/components/inventory/columns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { VehicleModelMultiSelect } from "@/components/VehicleModelMultiSelect";
import { Loader2, DollarSign, Filter, RefreshCcw, Search, Plus, ChevronDown } from "lucide-react";
import type { VehicleModel } from "@/hooks/use-vehicle-models";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";

export default function Inventory() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "administrador";

  // Filter State
  const [searchValue, setSearchValue] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Estado para controlar modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setIsCreateOpen(true);
      window.history.replaceState({}, '', '/inventory');
    }
  }, []);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      if (stockFilter === "low" && product.stock_actual > product.stock_minimo) return false;
      if (stockFilter === "out" && product.stock_actual > 0) return false;
      if (categoryFilter !== "all" && product.categoria?.nombre !== categoryFilter) return false;

      if (searchValue) {
        const searchLower = searchValue.toLowerCase();
        const compat = product.modelosCompatibles || product.compatibilidades || [];
        const compatString = compat.map((c: any) => `${c.marca} ${c.modelo} ${c.anio}`).join(" ");

        const searchString = (
          (product.sku || "") + " " +
          (product.nombre || "") + " " +
          (product.marca || "") + " " +
          compatString
        ).toLowerCase();

        if (!searchString.includes(searchLower)) return false;
      }
      return true;
    });

    // Ordenar por fecha de creación (más recientes primero)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // Descendente
    });
  }, [products, stockFilter, categoryFilter, searchValue]);

  const deleteMutation = useDeleteProduct();
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  const handleEdit = (product: any) => {
    setEditProduct(product);
    setEditOpen(true);
  };

  const handleDelete = (product: any) => {
    const confirmMessage = `¿Estás seguro de eliminar el producto ${product.sku}?\n\nNota: Si este producto está siendo usado en órdenes de trabajo, compras o ventas, no podrá ser eliminado.`;
    if (confirm(confirmMessage)) {
      deleteMutation.mutate(product.id, {
        onSuccess: () => toast({
          title: "Producto eliminado",
          description: "El producto ha sido eliminado exitosamente.",
          className: "bg-emerald-50 text-emerald-900 border-emerald-200"
        }),
        onError: (err: any) => toast({
          title: "Error al eliminar",
          description: err.message,
          variant: "destructive"
        })
      });
    }
  };

  const columns = useMemo(() => createColumns(isAdmin, handleEdit, handleDelete), [isAdmin]);

  const table = useReactTable({
    data: filteredProducts,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center flex-col gap-4 text-slate-400 animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Cargando inventario...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title="Inventario de Repuestos"
        description="Gestión avanzada de productos, stock y precios."
        // Solo ADMIN puede crear productos
        action={isAdmin ? (
          <>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Nuevo Repuesto
            </Button>
            <AddProductDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
          </>
        ) : undefined}
      />

      {/* Resto de la UI (Filtros, Tabla, etc.) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, SKU, marca..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-1 flex-col md:flex-row gap-3 w-full lg:w-auto items-center flex-wrap lg:justify-end">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-10 w-full md:w-[200px] bg-slate-50 border-dashed flex items-center">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las Categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.nombre}>{cat.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-10 w-full md:w-[200px] bg-slate-50 border-dashed flex items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <SelectValue placeholder="Estado Stock" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="low" className="text-orange-600 font-medium">Bajo Stock</SelectItem>
                <SelectItem value="out" className="text-red-600 font-medium">Agotado</SelectItem>
              </SelectContent>
            </Select>

            {/* Botón Columnas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 gap-2 border-dashed">
                  <ChevronDown className="w-4 h-4" />
                  Columnas
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>

            {(stockFilter !== "all" || categoryFilter !== "all" || searchValue !== "") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setStockFilter("all"); setCategoryFilter("all"); setSearchValue(""); }}
                className="h-10 w-10 text-slate-400 hover:text-rose-500"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay productos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            {table.getFilteredRowModel().rows.length} producto(s) encontrado(s)
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              variant="outline"
              size="sm"
            >
              Anterior
            </Button>
            <Button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              variant="outline"
              size="sm"
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {editOpen && editProduct && (
        <EditProductDialog
          product={editProduct}
          open={editOpen}
          onOpenChange={setEditOpen}
          categories={categories}
        />
      )}
    </div>
  );
}

// ... EditProductDialog (Se mantiene igual que antes) ...
function EditProductDialog({ product, open, onOpenChange, categories }: { product: any; open: boolean; onOpenChange: (open: boolean) => void; categories: any[] }) {
  const { toast } = useToast();
  const updateMutation = useUpdateProduct();
  const [selectedModels, setSelectedModels] = useState<VehicleModel[]>(product.modelosCompatibles || product.compatibilidades || []);

  const form = useForm({
    defaultValues: {
      sku: product.sku,
      nombre: product.nombre,
      marca: product.marca || "",
      calidad: product.calidad || "",
      precio_venta: product.precio_venta,
      stock_actual: product.stock_actual,
      stock_minimo: product.stock_minimo,
      categoriaId: product.categoria?.id || "",
    },
  });

  const onSubmit = (data: any) => {
    const payload = {
      sku: data.sku,
      nombre: data.nombre,
      marca: data.marca,
      calidad: data.calidad,
      precio_venta: data.precio_venta,
      stock_actual: data.stock_actual,
      stock_minimo: data.stock_minimo,
      categoriaId: data.categoriaId,
      modelosCompatiblesIds: selectedModels.map(m => m.id),
    };

    updateMutation.mutate({ id: product.id, ...payload }, {
      onSuccess: () => {
        onOpenChange(false);
        toast({
          title: "Producto actualizado",
          description: "Los cambios han sido guardados exitosamente.",
          className: "bg-emerald-50 text-emerald-900 border-emerald-200"
        });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
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
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>Modifique los detalles de {product.sku}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* CAMPOS (Misma estructura que AddProductDialog pero sin la lógica doble vía que añadimos antes, solo básica) */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
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
                    <FormControl><Input {...field} /></FormControl>
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
                  <FormLabel>Nombre</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* ... Resto de campos de precio y stock ... */}
            <div className="grid grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="precio_venta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Venta</FormLabel>
                    <FormControl><Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
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
                    <FormControl><Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="stock_minimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Mínimo (Alerta)</FormLabel>
                    <FormControl><Input {...field} type="number" min="1" onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Guardar</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}