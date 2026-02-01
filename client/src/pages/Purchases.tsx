import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, ShoppingCart, MoreHorizontal, Eye, Filter, RefreshCcw, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePurchases } from "@/hooks/use-purchases";
import { useProviders } from "@/hooks/use-providers";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, type ChangeEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { createColumns, PurchaseWithTotals } from "@/components/purchases/columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Purchases() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: allPurchases = [], isLoading } = usePurchases();
  const { toast } = useToast();
  const { data: providers = [] } = useProviders();

  // Estados de Tabla
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Filtros manuales
  const [searchValue, setSearchValue] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseWithTotals | null>(null);

  const purchasesWithTotals: PurchaseWithTotals[] = useMemo(() => {
    return allPurchases.map((p: any) => {
      // Usar montos del backend si existen, sino calcular desde detalles
      const netoCalculado = (p.detalles || []).reduce((acc: any, d: any) => {
        const cantidad = Number(d.cantidad) || 0;
        const unitPrice = Number(d.precio_costo_unitario ?? d.precio_unitario) || 0;
        return acc + (cantidad * unitPrice);
      }, 0);

      // Preferir valores del backend (respeta tipo_documento FACTURA/INFORMAL)
      const neto = p.monto_neto ?? netoCalculado;
      const iva = p.monto_iva ?? 0; // Backend calcula según tipo_documento
      const total = p.monto_total ?? (neto + iva);
      const totalItems = (p.detalles || []).length;
      const totalUnits = (p.detalles || []).reduce((acc: any, d: any) => acc + (Number(d.cantidad) || 0), 0);

      return {
        ...p,
        neto,
        iva,
        total,
        totalItems,
        totalUnits,
      } as PurchaseWithTotals;
    });
  }, [allPurchases]);

  const filteredPurchases = useMemo(() => {
    return purchasesWithTotals.filter((p: PurchaseWithTotals) => {
      const searchLower = searchValue.toLowerCase();
      
      const matchesSearch =
        (p.proveedor?.nombre?.toLowerCase() || "").includes(searchLower) ||
        ((p as any).numero_factura?.toLowerCase() || "").includes(searchLower) ||
        ((p as any).folio?.toLowerCase() || "").includes(searchLower);

      const matchesSupplier = supplierFilter === "all" || p.proveedor?.id === supplierFilter;

      return matchesSearch && matchesSupplier;
    });
  }, [purchasesWithTotals, searchValue, supplierFilter]);

  const columns = useMemo(() => createColumns(
    (p: PurchaseWithTotals) => setSelectedPurchase(p)
  ), []);

  const table = useReactTable({
    data: filteredPurchases,
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
    <>
      <PageHeader 
        title="Compras"
        description="Gestiona todas tus compras"
        action={
          <Button 
            onClick={() => setLocation('/purchases/create')} 
            className="gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Nueva Compra
          </Button>
        }
      />
      <p className="text-sm text-slate-600 mb-4">{filteredPurchases.length} compras registradas</p>

      {/* BARRA DE HERRAMIENTAS */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex gap-3 items-center flex-wrap">
          {/* Buscador */}
          <div className="relative flex-1 min-w-xs">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por proveedor o folio..."
              value={searchValue}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
            />
          </div>

          {/* Filtro Proveedor */}
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-48 h-10">
              <SelectValue placeholder="Todos los proveedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {providers.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* BOTÓN COLUMNAS */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2">
                <ChevronDown className="w-4 h-4" />
                Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(value: boolean | undefined) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {(searchValue || supplierFilter !== "all") && (
            <Button
              onClick={() => { 
                setSearchValue(""); 
                setSupplierFilter("all"); 
              }}
              variant="ghost"
              size="sm"
              className="h-10 w-10 text-slate-400 hover:text-rose-500"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* TABLA MANUAL */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup: any) => (
                <TableRow key={headerGroup.id} className="border-b border-slate-200 hover:bg-slate-50">
                  {headerGroup.headers.map((header: any) => {
                    return (
                      <TableHead key={header.id} className="bg-slate-50 text-slate-700 font-semibold">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={table.getAllColumns().length} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row: any) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell: any) => (
                      <TableCell key={cell.id} className="text-slate-700">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getAllColumns().length} className="text-center py-8 text-slate-500">
                    No hay resultados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINACIÓN */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            {table.getFilteredSelectedRowModel().rows.length} de{" "}
            {table.getFilteredRowModel().rows.length} fila(s) seleccionadas.
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

      {/* DIALOGO DETALLE */}
      <Dialog open={!!selectedPurchase} onOpenChange={(o: boolean) => !o && setSelectedPurchase(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Compra</DialogTitle>
          </DialogHeader>

          {selectedPurchase && (
            <>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-slate-600 mb-1">Proveedor</p>
                  <p className="font-semibold text-slate-900">{selectedPurchase.proveedor?.nombre}</p>
                  <p className="text-slate-500 text-xs mt-1">
                    {(selectedPurchase.proveedor as any)?.rut || "Sin RUT"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 mb-1">Fecha</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(selectedPurchase.fecha).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-slate-900 mb-4">Productos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-2 px-3 text-slate-700 font-semibold">Producto</th>
                        <th className="text-center py-2 px-3 text-slate-700 font-semibold">Cantidad</th>
                        <th className="text-right py-2 px-3 text-slate-700 font-semibold">Precio Unit.</th>
                        <th className="text-right py-2 px-3 text-slate-700 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPurchase.detalles.map((d: any, i: number) => {
                        const cantidad = Number(d.cantidad) || 0;
                        const unitPrice = Number(d.precio_costo_unitario ?? d.precio_unitario) || 0;
                        const totalFila = cantidad * unitPrice;
                        return (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-3 px-3">
                              <div>
                                <p className="font-medium text-slate-900">{d.producto?.nombre}</p>
                                <p className="text-slate-500 text-xs">{d.producto?.sku}</p>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3">{d.cantidad}</td>
                            <td className="text-right py-3 px-3 font-medium">
                              ${unitPrice.toLocaleString('es-CL')}
                            </td>
                            <td className="text-right py-3 px-3 font-semibold text-slate-900">
                              ${totalFila.toLocaleString('es-CL')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 bg-slate-50 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-slate-900 mb-3">Resumen</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal (Neto)</span>
                  <span className="font-semibold text-slate-900">${selectedPurchase.neto.toLocaleString('es-CL')}</span>
                </div>
                {selectedPurchase.iva > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">IVA (19%)</span>
                    <span className="font-semibold text-slate-900">${selectedPurchase.iva.toLocaleString('es-CL')}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-blue-600">${selectedPurchase.total.toLocaleString('es-CL')}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                <p>Registrado por: <span className="font-medium">{selectedPurchase.createdByName}</span></p>
                <p>Fecha creación: <span className="font-medium">{new Date(selectedPurchase.createdAt).toLocaleString('es-CL')}</span></p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}