import { useState, useEffect, useMemo } from "react";
import { es } from "date-fns/locale";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, Search, Loader2, ShoppingCart, Check, ChevronsUpDown, Eye, Trash2, Box, Calendar as CalendarIcon, ChevronDown, Filter, Circle, AlertCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCounterSales } from "@/hooks/use-counter-sales";
import { useProducts } from "@/hooks/use-products";
import { Badge } from "@/components/ui/badge";
import { ProductSearchDialog } from "@/components/products/ProductSearchDialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
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
  createColumnHelper,
} from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function CounterSales() {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"VENTA" | "PERDIDA" | "USO_INTERNO" | "all">("all");
  const { sales: allSales = [], isLoading } = useCounterSales();

  // Estado elevado para controlar el modal desde la URL
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setIsCreateOpen(true);
      window.history.replaceState({}, '', '/counter-sales');
    }
  }, []);

  // Filtrado
  const sales = useMemo(() => {
    let filtered = allSales.filter(s => {
      const matchesSearch = search === "" ||
        (s.vendedor?.toLowerCase() || "").includes(search.toLowerCase());

      const matchesType = typeFilter === "all" || s.tipo_movimiento === typeFilter;

      // Filtro de fecha simple (YYYY-MM-DD)
      const saleDate = new Date(s.fecha).toLocaleDateString('en-CA');
      const matchesDate = dateFilter === "" || saleDate === dateFilter;

      return matchesSearch && matchesType && matchesDate;
    });

    // Ordenar por fecha descendente
    return [...filtered].sort((a, b) =>
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
  }, [allSales, search, typeFilter, dateFilter]);

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('tipo_movimiento', {
        header: 'Tipo',
        cell: (info) => {
          const tipo = info.getValue();
          switch (tipo) {
            case "VENTA":
              return <Badge className="bg-green-100 text-green-700 border-green-200 shadow-none font-medium hover:bg-green-100">Venta</Badge>;
            case "PERDIDA":
              return <Badge className="bg-red-50 text-red-700 border-red-200 shadow-none font-medium hover:bg-red-50">Pérdida</Badge>;
            case "USO_INTERNO":
              return <Badge className="bg-blue-50 text-blue-700 border-blue-200 shadow-none font-medium hover:bg-blue-50">Interno</Badge>;
            default:
              return <Badge variant="outline">{tipo}</Badge>;
          }
        },
      }),
      columnHelper.accessor('fecha', {
        header: 'Fecha',
        cell: (info) => {
          const fecha = new Date(info.getValue());
          return (
            <div>
              {fecha.toLocaleDateString('es-CL')}
              <span className="text-slate-400 text-sm ml-2">
                {fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('vendedor', {
        header: 'Vendedor',
        cell: (info) => <span className="font-medium text-slate-800">{info.getValue() || "---"}</span>,
      }),
      columnHelper.accessor('comentario', {
        header: 'Nota',
        cell: (info) => <span className="text-sm text-slate-500 italic truncate block max-w-[250px]">{info.getValue() || "-"}</span>,
      }),
      columnHelper.accessor('detalles', {
        header: 'Items',
        cell: (info) => <span className="text-slate-600">{info.getValue()?.length || 0}</span>,
      }),
      columnHelper.display({
        id: 'monto',
        header: () => <div className="text-right">Monto</div>,
        cell: (info) => {
          const sale = info.row.original;
          const monto = sale.tipo_movimiento === "VENTA" ? sale.total_venta : sale.costo_perdida;
          return (
            <div className="text-right font-bold text-emerald-600">
              ${monto?.toLocaleString('es-CL') || 0}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <SaleDetailsDialog sale={info.row.original} />
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: sales,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ventas Mostrador"
        description="Registra ventas directas, pérdidas y uso interno de inventario"
        action={<CreateCounterSaleDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />}
      />

      {/* Buscador y Filtros */}
      <div className="card-industrial p-4 bg-white space-y-4">
        <div className="flex flex-col md:flex-row gap-4">

          {/* Buscador - Sin Lupa */}
          <div className="relative flex-1">
            <Input
              placeholder="Buscar por vendedor..."
              className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

            {/* Filtro Fecha (Estilo Reportes) */}
            <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal h-11 border-slate-200 bg-slate-50",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? (
                    new Date(dateFilter + 'T12:00:00').toLocaleDateString('es-CL', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })
                  ) : (
                    <span>Filtrar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={dateFilter ? new Date(dateFilter + 'T12:00:00') : undefined}
                  locale={es}
                  onSelect={(date) => {
                    if (date) {
                      const formatted = date.toISOString().split('T')[0];
                      setDateFilter(formatted);
                      setDatePopoverOpen(false);
                    } else {
                      setDateFilter("");
                    }
                  }}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Filtro Tipo */}
            <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
              <SelectTrigger className="w-[180px] h-11 bg-slate-50 border-slate-200">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="VENTA">Ventas</SelectItem>
                <SelectItem value="PERDIDA">Pérdidas</SelectItem>
                <SelectItem value="USO_INTERNO">Uso Interno</SelectItem>
              </SelectContent>
            </Select>

            {(search || dateFilter || typeFilter !== "all") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSearch(""); setDateFilter(""); setTypeFilter("all"); }}
                className="h-11 w-11 text-slate-500 hover:bg-slate-100"
                title="Limpiar filtros"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}

            {/* Botón Columnas */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-11 gap-2 border-dashed">
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
          </div>
        </div>
      </div>

      <div className="card-industrial bg-white overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-slate-200 bg-slate-50/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-bold text-slate-700 h-14 text-base">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p>Cargando movimientos...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-slate-50/60 border-b border-slate-100 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ShoppingCart className="w-12 h-12 text-slate-300" />
                    <p>No se encontraron movimientos{dateFilter && " en esta fecha"}.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* PAGINACIÓN */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            {table.getFilteredRowModel().rows.length} movimiento(s) encontrado(s)
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
    </div>
  );
}

function SaleRow({ sale }: { sale: any }) {
  const getTypeBadge = (tipo: string) => {
    switch (tipo) {
      case "VENTA":
        return <Badge className="bg-green-100 text-green-700 border-green-200 shadow-none font-medium hover:bg-green-100">Venta</Badge>;
      case "PERDIDA":
        return <Badge className="bg-red-50 text-red-700 border-red-200 shadow-none font-medium hover:bg-red-50">Pérdida</Badge>;
      case "USO_INTERNO":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200 shadow-none font-medium hover:bg-blue-50">Interno</Badge>;
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  return (
    <TableRow className="hover:bg-slate-50/60 border-b border-slate-100 transition-colors">
      <TableCell className="py-4">{getTypeBadge(sale.tipo_movimiento)}</TableCell>
      <TableCell className="py-4 text-slate-600 text-base">
        {new Date(sale.fecha).toLocaleDateString('es-CL')}
        <span className="text-slate-400 text-sm ml-2">
          {new Date(sale.fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </TableCell>

      {/* Columna Vendedor */}
      <TableCell className="py-4">
        <span className="font-medium text-slate-800 text-base">{sale.vendedor || "---"}</span>
      </TableCell>

      {/* Columna Nota */}
      <TableCell className="py-4">
        <span className="text-sm text-slate-500 italic truncate block max-w-[250px]">
          {sale.comentario || "-"}
        </span>
      </TableCell>

      <TableCell className="py-4 text-center text-slate-600 text-base">
        <span className="bg-slate-100 px-3 py-1 rounded-full text-sm font-mono">{sale.detalles.length}</span>
      </TableCell>
      <TableCell className="py-4 text-right font-mono text-base">
        {sale.tipo_movimiento === "VENTA" ? (
          <span className="font-bold text-green-700">${sale.total_venta.toLocaleString('es-CL')}</span>
        ) : sale.tipo_movimiento === "PERDIDA" ? (
          <span className="font-medium text-red-600">-${sale.costo_perdida.toLocaleString('es-CL')}</span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </TableCell>
      <TableCell className="py-4 text-right">
        <SaleDetailsDialog sale={sale} />
      </TableCell>
    </TableRow>
  );
}

function ProductSelector({
  value,
  onChange,
  error
}: {
  value: string;
  onChange: (sku: string, precio: number) => void;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low" | "out">("all");
  const { data: allProducts = [] } = useProducts();

  // Filtrar productos por stock
  const products = allProducts.filter(product => {
    if (stockFilter === "in-stock") return product.stock_actual > product.stock_minimo;
    if (stockFilter === "low") return product.stock_actual > 0 && product.stock_actual <= product.stock_minimo;
    if (stockFilter === "out") return product.stock_actual === 0;
    return true; // "all"
  });

  const selectedProduct = allProducts.find(p => p.sku === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-9 px-3 font-normal text-left border-slate-200 bg-white hover:bg-slate-50 transition-all focus:ring-0",
            !value && "text-muted-foreground",
            error && "border-slate-300 ring-1 ring-red-100"
          )}
        >
          {selectedProduct ? (
            <span className="truncate flex items-center gap-2 text-slate-900">
              <Box className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">{selectedProduct.nombre}</span>
              <span className="text-slate-400 text-xs hidden sm:inline-block">| {selectedProduct.sku}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-slate-400">
              <Search className="w-3.5 h-3.5" />
              Buscar producto...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-40" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0 shadow-xl border-slate-100" align="start">
        <Command>
          <CommandInput placeholder="Teclea para buscar..." className="h-11" />
          
          {/* Filtro de Stock */}
          <div className="px-2 py-2 border-b border-slate-100">
            <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
              <SelectTrigger className="h-9 w-full bg-slate-50 border-slate-200">
                <div className="flex items-center gap-2 w-full">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <SelectValue placeholder="Filtrar por stock" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                <SelectItem value="in-stock" className="text-emerald-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Circle className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                    Con Stock Normal
                  </div>
                </SelectItem>
                <SelectItem value="low" className="text-orange-600 font-medium">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Bajo Stock
                  </div>
                </SelectItem>
                <SelectItem value="out" className="text-red-600 font-medium">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3 h-3" />
                    Agotado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <CommandList className="max-h-[300px]">
            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
              No se encontraron productos.
            </CommandEmpty>
            <CommandGroup heading="Resultados">
              {products.map((product) => {
                // 1. Verificar si hay stock
                const hasStock = product.stock_actual > 0;

                return (
                  <CommandItem
                    key={product.id}
                    value={`${product.sku} ${product.nombre} ${product.marca}`}
                    disabled={!hasStock} // 2. Deshabilitar si no hay stock
                    onSelect={() => {
                      if (hasStock) {
                        onChange(product.sku, product.precio_venta);
                        setOpen(false);
                      }
                    }}
                    className={cn(
                      "cursor-pointer py-3 px-4 transition-all",
                      // Estilos normales si hay stock
                      hasStock 
                        ? "data-[selected='true']:!bg-blue-50 data-[selected='true']:!text-slate-900 aria-selected:!bg-blue-50 aria-selected:!text-slate-900" 
                        // Estilos de deshabilitado si NO hay stock
                        : "opacity-50 cursor-not-allowed bg-slate-50/50 grayscale"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {/* Icono cambia si está agotado */}
                      {hasStock ? (
                        <Check
                          className={cn(
                            "h-4 w-4 text-blue-600 transition-opacity",
                            value === product.sku ? "opacity-100" : "opacity-0"
                          )}
                        />
                      ) : (
                        <Box className="h-4 w-4 text-slate-300" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className={cn("font-medium truncate pr-2", hasStock ? "text-slate-900" : "text-slate-500")}>
                            {product.nombre}
                          </span>
                          <span className="font-mono text-xs font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {product.sku}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-slate-500">
                          <span className="truncate">{product.marca}</span>
                          <div className="flex items-center gap-3">
                            {/* 3. Indicador visual de Stock */}
                            {hasStock ? (
                              <span className="text-emerald-600 font-medium">Stock: {product.stock_actual}</span>
                            ) : (
                              <span className="text-red-500 font-bold flex items-center gap-1 bg-red-50 px-1.5 rounded">
                                AGOTADO
                              </span>
                            )}
                            <span className="font-semibold text-slate-700">${product.precio_venta.toLocaleString('es-CL')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Dialog ahora recibe props para el estado
function CreateCounterSaleDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [tipoMovimiento, setTipoMovimiento] = useState<"VENTA" | "PERDIDA" | "USO_INTERNO">("VENTA");
  const [vendedor, setVendedor] = useState("");
  const [comentario, setComentario] = useState("");
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(null);
  const [items, setItems] = useState<Array<{ sku: string; cantidad: number; precio_venta?: number }>>([
    { sku: "", cantidad: 1, precio_venta: 0 }
  ]);
  const { toast } = useToast();
  const { createSale, isCreating } = useCounterSales();
  const { data: allProducts = [] } = useProducts(); // Para validación de stock

  const addItem = () => {
    setItems([...items, { sku: "", cantidad: 1, precio_venta: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const updateItemSku = (index: number, sku: string, precio: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      sku,
      // SIEMPRE actualizamos el precio al cambiar de producto
      precio_venta: precio
    };
    setItems(newItems);
  };

  const handleProductSelect = (product: any) => {
    if (currentEditingIndex !== null) {
      // Verificar si el producto ya existe en otra fila (evitar duplicados)
      const existingIndex = items.findIndex((item, idx) => 
        item.sku === product.sku && idx !== currentEditingIndex
      );

      if (existingIndex !== -1) {
        // El producto ya existe, mostrar alerta y no permitir selección
        toast({
          title: "⚠️ Producto duplicado",
          description: `"${product.nombre}" ya está en la fila ${existingIndex + 1}. Modifica la cantidad en esa fila en lugar de agregarlo nuevamente.`,
          variant: "destructive",
          duration: 5000,
          className: "bg-orange-600 border-orange-700 text-white [&>div]:text-white"
        });
        setCurrentEditingIndex(null);
        return; // No hacer nada
      }

      // Si no existe, actualizar normalmente
      updateItemSku(currentEditingIndex, product.sku, product.precio_venta);
      setCurrentEditingIndex(null);
    }
  };

  const calcularTotal = () => {
    if (tipoMovimiento !== "VENTA") return 0;
    return items.reduce((sum, item) => sum + (item.cantidad * (item.precio_venta || 0)), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validar Vendedor en Ventas
    if (tipoMovimiento === "VENTA" && !vendedor.trim()) {
      toast({
        title: "⚠️ Falta información",
        description: "Debes ingresar el nombre del vendedor.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white [&>div]:text-white"
      });
      return;
    }

    // 2. Validar Items
    const itemsInvalidos = items.some(item => !item.sku || item.sku.trim() === "");
    if (itemsInvalidos) {
      toast({
        title: "⚠️ Items incompletos",
        description: "Selecciona un producto para cada línea.",
        variant: "destructive",
        className: "bg-red-600 border-red-700 text-white [&>div]:text-white"
      });
      return;
    }

    // 3. VALIDACIÓN DE STOCK PRE-SUBMIT (CRITICAL)
    const stockErrors: string[] = [];

    for (const item of items) {
      const product = allProducts.find(p => p.sku === item.sku);
      if (!product) {
        stockErrors.push(`❌ Producto ${item.sku} no encontrado en el inventario.`);
        continue;
      }

      if (product.stock_actual < item.cantidad) {
        stockErrors.push(
          `❌ ${product.nombre} (${product.sku}): solicitado ${item.cantidad}, disponible ${product.stock_actual}`
        );
      }
    }

    // Si hay errores de stock, abortar y mostrar alerta crítica
    if (stockErrors.length > 0) {
      toast({
        title: "⚠️ STOCK INSUFICIENTE",
        description: (
          <div className="space-y-2 mt-2 text-white">
            <p className="font-bold text-white">No se puede procesar el movimiento:</p>
            <ul className="list-none space-y-1 text-sm">
              {stockErrors.map((error, idx) => (
                <li key={idx} className="text-white font-medium">{error}</li>
              ))}
            </ul>
            <p className="text-xs text-white/90 mt-3 pt-2 border-t border-white/30">
              Por favor, ajusta las cantidades antes de continuar.
            </p>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
        className: "bg-red-600 border-red-700 text-white [&>div]:text-white"
      });
      return; // ABORTAR - Estado del formulario NO se limpia
    }

    // 4. Intentar Crear (Solo si pasó todas las validaciones)
    try {
      await createSale({
        tipo_movimiento: tipoMovimiento,
        vendedor: tipoMovimiento === "VENTA" ? vendedor : undefined,
        comentario,
        items: items.map(item => ({
          sku: item.sku,
          cantidad: item.cantidad,
          precio_venta: tipoMovimiento === "VENTA" ? item.precio_venta : undefined
        }))
      });

      toast({
        title: "✅ Movimiento registrado",
        description: `${tipoMovimiento === "VENTA" ? "Venta" : tipoMovimiento === "PERDIDA" ? "Pérdida" : "Uso Interno"} procesado exitosamente.`,
        className: "bg-emerald-50 text-emerald-900 border-emerald-200"
      });

      // Reset form SOLO después del éxito
      setTipoMovimiento("VENTA");
      setVendedor("");
      setComentario("");
      setItems([{ sku: "", cantidad: 1, precio_venta: 0 }]);
      onOpenChange(false);
    } catch (error: any) {
      // Error del Backend (400/500) - Preservar estado
      toast({
        title: "❌ Error al procesar",
        description: error.message || "Ocurrió un problema al registrar el movimiento. Por favor, verifica los datos e intenta nuevamente.",
        variant: "destructive",
        duration: 8000,
        className: "bg-red-600 border-red-700 text-white [&>div]:text-white"
      });
      // NO cerrar modal, NO limpiar formulario
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Limpiar todo al cerrar el modal (ya sea por cancelar o por X)
          setTipoMovimiento("VENTA");
          setVendedor("");
          setComentario("");
          setItems([{ sku: "", cantidad: 1, precio_venta: 0 }]);
        }
        onOpenChange(isOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="btn-pill gap-2">
          <Plus className="w-4 h-4" />
          Nueva Venta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[85vw] w-full h-[80vh] p-0 gap-0 overflow-hidden flex flex-col bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 pr-16 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div>
              <DialogTitle className="text-xl font-bold text-slate-900">Nueva Venta / Movimiento</DialogTitle>
              <DialogDescription className="text-sm">Registra transacciones de inventario en tiempo real</DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-lg">
              <Button
                size="sm"
                variant={tipoMovimiento === "VENTA" ? "outline" : "ghost"}
                className={cn("h-8 px-4 text-xs font-semibold border-transparent", tipoMovimiento === "VENTA" ? "bg-green-100 text-green-700 hover:bg-green-200 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                onClick={() => setTipoMovimiento("VENTA")}
              >
                Venta
              </Button>
              <Button
                size="sm"
                variant={tipoMovimiento === "USO_INTERNO" ? "outline" : "ghost"}
                className={cn("h-8 px-4 text-xs font-semibold border-transparent", tipoMovimiento === "USO_INTERNO" ? "bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                onClick={() => setTipoMovimiento("USO_INTERNO")}
              >
                Uso Interno
              </Button>
              <Button
                size="sm"
                variant={tipoMovimiento === "PERDIDA" ? "outline" : "ghost"}
                className={cn("h-8 px-4 text-xs font-semibold border-transparent", tipoMovimiento === "PERDIDA" ? "bg-red-100 text-red-700 hover:bg-red-200 shadow-sm" : "text-slate-500 hover:text-slate-900")}
                onClick={() => setTipoMovimiento("PERDIDA")}
              >
                Pérdida
              </Button>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 h-full overflow-hidden">

          {/* Main Area: Items Table */}
          <div className="lg:col-span-3 flex flex-col h-full bg-white border-r border-slate-200 overflow-hidden">

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50 backdrop-blur shrink-0">
              <h3 className="font-semibold text-sm text-slate-700">Detalle de Productos</h3>
              <Button size="sm" variant="outline" onClick={addItem} className="gap-2 h-8">
                <Plus className="w-3.5 h-3.5" />
                Agregar Item
              </Button>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto p-0">
              <Table>
                <TableHeader className="bg-slate-50/80 sticky top-0 z-10 shadow-sm border-b">
                  <TableRow className="hover:bg-transparent border-slate-200">
                    <TableHead className="w-[40%] text-xs font-bold uppercase tracking-wider text-slate-500 h-10 pl-6">Producto</TableHead>
                    <TableHead className="w-[10%] text-xs font-bold uppercase tracking-wider text-slate-500 h-10 text-center">Cant.</TableHead>
                    {tipoMovimiento === "VENTA" && (
                      <>
                        <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-slate-500 h-10 text-right">Precio Unit.</TableHead>
                        <TableHead className="w-[20%] text-xs font-bold uppercase tracking-wider text-slate-500 h-10 text-right pr-6">Total</TableHead>
                      </>
                    )}
                    <TableHead className="w-[5%] h-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} className="hover:bg-slate-50/50 group border-slate-100">
                      <TableCell className="pl-6 py-3 align-top">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCurrentEditingIndex(index);
                            setProductSearchOpen(true);
                          }}
                          className={cn(
                            "w-full justify-between h-9 px-3 font-normal text-left border-slate-200 bg-white hover:bg-slate-50 transition-all",
                            !item.sku && "text-muted-foreground"
                          )}
                        >
                          {item.sku ? (
                            <span className="truncate flex items-center gap-2 text-slate-900">
                              <Box className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-medium">
                                {allProducts.find(p => p.sku === item.sku)?.nombre || item.sku}
                              </span>
                              <span className="text-slate-400 text-xs hidden sm:inline-block">| {item.sku}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-slate-400">
                              <Search className="w-3.5 h-3.5" />
                              Buscar producto...
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-40" />
                        </Button>
                      </TableCell>
                      <TableCell className="py-3 align-top">
                        <Input
                          type="number"
                          min="1"
                          className="h-9 text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={item.cantidad}
                          onChange={(e) => updateItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                          onFocus={(e) => e.target.select()}
                        />
                      </TableCell>
                      {tipoMovimiento === "VENTA" && (
                        <>
                          <TableCell className="py-3 align-top">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                              <Input
                                type="number"
                                min="0"
                                className="h-9 pl-6 text-right font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={item.precio_venta}
                                onChange={(e) => updateItem(index, 'precio_venta', parseInt(e.target.value) || 0)}
                                onFocus={(e) => e.target.select()}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="py-3 align-top text-right pt-4 pr-6">
                            <span className="font-mono font-bold text-slate-700">
                              ${((item.cantidad || 0) * (item.precio_venta || 0)).toLocaleString('es-CL')}
                            </span>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="py-3 align-top text-right pr-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Sidebar: Summary & Inputs */}
          <div className="col-span-1 flex flex-col h-full bg-slate-50 overflow-hidden border-l border-slate-200">
            <div className="p-6 flex-1 overflow-auto space-y-8">

              {/* Summary Card */}
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-slate-800 text-lg mb-4">Detalles</h4>
                  <div className="space-y-4">
                    {tipoMovimiento === "VENTA" && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendedor *</label>
                        <Input
                          placeholder="Nombre vendedor..."
                          value={vendedor}
                          onChange={(e) => setVendedor(e.target.value.toUpperCase())}
                          className="bg-white border-slate-200 h-10 uppercase placeholder:normal-case"
                        />
                        <p className="text-[10px] text-slate-400 italic">Se guardará en mayúsculas automáticamente</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                        <span>Comentarios</span>
                        <span className="text-[10px] text-slate-400 normal-case font-normal">{comentario.length}/100</span>
                      </label>
                      <Input
                        placeholder="Opcional..."
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        maxLength={100}
                        className="bg-white border-slate-200 h-10"
                      />
                    </div>
                  </div>
                </div>

                {tipoMovimiento === "VENTA" && (
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total a Pagar</span>
                      <span className="text-4xl font-bold text-slate-900 tracking-tight">
                        ${calcularTotal().toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-white border-t border-slate-200 shrink-0 flex flex-col gap-3">
              <Button
                size="lg"
                className="w-full btn-pill shadow-lg shadow-primary/20 h-12 text-base"
                onClick={handleSubmit}
                disabled={isCreating}
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                Confirmar Operación
              </Button>
            </div>
          </div>

        </div>
      </DialogContent>

      {/* ProductSearchDialog para seleccionar productos */}
      <ProductSearchDialog
        open={productSearchOpen}
        onClose={() => {
          setProductSearchOpen(false);
          setCurrentEditingIndex(null);
        }}
        onSelect={handleProductSelect}
        title="🔍 Seleccionar Producto"
        showOutOfStock={false}
      />
    </Dialog>
  );
}

function SaleDetailsDialog({ sale }: { sale: any }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver detalle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-6 pb-2 text-center border-b border-dashed border-slate-200">
          <DialogTitle className="font-mono text-lg tracking-wider uppercase text-slate-900">
            {sale.tipo_movimiento}
          </DialogTitle>
          <div className="flex flex-col gap-1 text-center font-mono text-xs text-slate-500 mt-2">
            <span>{new Date(sale.fecha).toLocaleDateString("es-CL", { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            <span>{new Date(sale.fecha).toLocaleTimeString("es-CL", { hour: '2-digit', minute: '2-digit' })}</span>
            <span className="mt-1 text-[10px] tracking-widest text-slate-400">ID: {sale.id.slice(0, 8)}</span>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Info Principal */}
          <div className="space-y-4 font-mono text-sm">
            {sale.tipo_movimiento === "VENTA" && (
              <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                <span className="text-slate-500">Vendedor:</span>
                <span className="font-bold text-slate-900 uppercase">{sale.vendedor || "---"}</span>
              </div>
            )}

            {sale.comentario && (
              <div className="flex flex-col gap-1 border-b border-dashed border-slate-200 pb-2">
                <span className="text-slate-500 text-xs">Nota:</span>
                <span className="text-slate-900 italic text-xs">{sale.comentario}</span>
              </div>
            )}
          </div>

          {/* Lista de Items */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detalle</div>
            {sale.detalles.map((detalle: any) => (
              <div key={detalle.id} className="font-mono text-sm group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-slate-900 font-medium">
                    {detalle.producto?.nombre || "Producto sin nombre"}
                  </span>
                  {sale.tipo_movimiento === "VENTA" && (
                    <span className="text-slate-900 font-bold whitespace-nowrap">
                      ${detalle.total_fila.toLocaleString('es-CL')}
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{detalle.cantidad} x ${detalle.precio_venta_unitario.toLocaleString('es-CL')}</span>
                  {detalle.producto?.sku && (
                    <span className="tracking-tighter opacity-50">{detalle.producto.sku}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Total */}
        {sale.tipo_movimiento === "VENTA" && (
          <div className="bg-slate-50 p-6 border-t border-dashed border-slate-200">
            <div className="flex justify-between items-end font-mono">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest pb-1">Total</span>
              <span className="text-3xl font-bold text-slate-900 tracking-tighter">
                ${sale.total_venta.toLocaleString('es-CL')}
              </span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}