import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  useWorkOrders,
  useDeleteWorkOrder,
  useCreateWorkOrder,
  useUpdateWorkOrder,
  useServicesCatalog,
  type CreateWorkOrderDTO,
  type WorkOrder
} from "@/hooks/use-work-orders";
import { useVehicles } from "@/hooks/use-vehicles";
import { useProducts } from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useAuth } from "@/hooks/use-auth";
import { ProductSearchDialog } from "@/components/products/ProductSearchDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createColumns } from "@/components/work-orders/columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Car, User, Calendar as CalendarIcon, Filter, RefreshCcw, ChevronDown,
  Wrench, Plus, Search, Loader2, ChevronUp, ChevronDown as ChevronDownIcon, Mail, Package, Trash2, Phone
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { cn, formatRutCL, formatPhoneCL } from "@/lib/utils";
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

export default function WorkOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  const { data: workOrders = [], isLoading } = useWorkOrders();
  const { mutate: deleteWorkOrder } = useDeleteWorkOrder();
  const { data: vehicles = [] } = useVehicles();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setIsCreateOpen(true);
      window.history.replaceState({}, '', '/work-orders');
    }
  }, []);

  const ordersWithVehicleRef = useMemo(() => {
    return workOrders.map((wo: any) => {
      const patente = wo.patente_vehiculo || wo.vehicle?.patente || wo.vehiculo?.patente;
      const vehicleFromCatalog = vehicles.find((v: any) => v.patente === patente);
      return {
        ...wo,
        vehiculo: {
          marca: vehicleFromCatalog?.marca || wo.vehiculo?.marca || "Sin Marca",
          modelo: vehicleFromCatalog?.modelo || wo.vehiculo?.modelo || "Sin Modelo",
          patente: patente || "S/P",
          kilometraje: vehicleFromCatalog?.kilometraje || wo.vehiculo?.kilometraje || wo.kilometraje || 0
        }
      };
    });
  }, [workOrders, vehicles]);

  const filteredOrders = useMemo(() => {
    return ordersWithVehicleRef.filter((wo: any) => {
      const searchLower = search.toLowerCase();
      const matchesSearch = (
        wo.numero_orden_papel?.toString().toLowerCase().includes(searchLower) ||
        wo.cliente?.nombre?.toLowerCase().includes(searchLower) ||
        wo.vehiculo?.patente?.toLowerCase().includes(searchLower)
      );
      const matchesStatus = statusFilter === "all" || wo.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ordersWithVehicleRef, search, statusFilter]);

  const columns = useMemo(() => createColumns(
    (wo) => setSelectedOrder(wo),
    (wo) => setEditingOrder(wo)
  ), []);

  const table = useReactTable({
    data: filteredOrders,
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
        title="Órdenes de Trabajo"
        description="Gestione las órdenes de trabajo, seguimiento y facturación."
        action={<CreateWorkOrderDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />}
      />

      {/* Dialog de Edición */}
      <CreateWorkOrderDialog
        open={!!editingOrder}
        onOpenChange={(open) => !open && setEditingOrder(null)}
        initialData={editingOrder}
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por cliente, patente o Nº..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>
          <div className="flex flex-1 flex-col md:flex-row gap-3 w-full lg:w-auto items-center flex-wrap lg:justify-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-full md:w-[200px] bg-slate-50 border-dashed">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <SelectValue placeholder="Estado" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Estados</SelectItem>
                <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
                <SelectItem value="FINALIZADA">Finalizada</SelectItem>
                <SelectItem value="ENTREGADA">Entregada</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => { setSearch(""); setStatusFilter("all"); }} className="h-10 w-10 text-slate-400 hover:text-rose-500">
              <RefreshCcw className="w-3.5 h-3.5" />
            </Button>

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
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No hay órdenes.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>

        {/* PAGINACIÓN */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="text-sm text-slate-600">
            {table.getFilteredRowModel().rows.length} orden(es) encontrada(s)
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

      {/* Sheet de Detalles de Orden */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedOrder && (
            <>
              <SheetHeader className="pb-4 border-b">
                <div className="flex flex-col gap-2">
                  <SheetTitle className="text-lg font-bold text-slate-900">
                    Orden de Trabajo #{selectedOrder.numero_orden_papel}
                  </SheetTitle>
                  <Badge className={cn(
                    "w-fit",
                    selectedOrder.estado === "FINALIZADA" && "bg-emerald-500",
                    selectedOrder.estado === "EN_PROCESO" && "bg-amber-500",
                    selectedOrder.estado === "CANCELADA" && "bg-red-500"
                  )}>
                    {selectedOrder.estado}
                  </Badge>
                </div>
              </SheetHeader>

              <div className="space-y-6 pt-6">
                {/* Información General */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    <div className="flex gap-2">
                      <span className="text-slate-600 min-w-[130px]">Fecha de Ingreso:</span>
                      <span className="font-medium text-slate-900">{new Date(selectedOrder.fecha_ingreso).toLocaleDateString('es-CL')}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-600 min-w-[130px]">Realizado por:</span>
                      <span className="font-medium text-slate-900">{selectedOrder.realizado_por}</span>
                    </div>
                    {selectedOrder.revisado_por && (
                      <div className="flex gap-2">
                        <span className="text-slate-600 min-w-[130px]">Revisado por:</span>
                        <span className="font-medium text-slate-900">{selectedOrder.revisado_por}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cliente */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <User className="w-4 h-4" /> Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    <div className="flex gap-2">
                      <span className="text-slate-600 min-w-[80px]">Nombre:</span>
                      <span className="font-medium text-slate-900">{selectedOrder.cliente.nombre}</span>
                    </div>
                    {selectedOrder.cliente.rut && (
                      <div className="flex gap-2">
                        <span className="text-slate-600 min-w-[80px]">RUT:</span>
                        <span className="font-medium font-mono text-slate-900">{formatRutCL(selectedOrder.cliente.rut)}</span>
                      </div>
                    )}
                    {selectedOrder.cliente.telefono && (
                      <div className="flex gap-2">
                        <span className="text-slate-600 min-w-[80px]">Teléfono:</span>
                        <span className="font-medium font-mono text-slate-900">{formatPhoneCL(selectedOrder.cliente.telefono)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Vehículo */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Car className="w-4 h-4" /> Vehículo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    <div className="flex gap-2">
                      <span className="text-slate-600 min-w-[90px]">Patente:</span>
                      <span className="font-bold font-mono text-slate-900">{selectedOrder.vehiculo?.patente || selectedOrder.patente_vehiculo}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-600 min-w-[90px]">Marca:</span>
                      <span className={`font-medium uppercase ${selectedOrder.vehiculo?.marca === "SIN MARCA" ? "text-slate-400 italic" : "text-slate-900"}`}>
                        {selectedOrder.vehiculo?.marca || "Sin Marca"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-600 min-w-[90px]">Modelo:</span>
                      <span className={`font-medium uppercase ${selectedOrder.vehiculo?.modelo === "SIN MODELO" ? "text-slate-400 italic" : "text-slate-900"}`}>
                        {selectedOrder.vehiculo?.modelo || "Sin Modelo"}
                      </span>
                    </div>
                    {selectedOrder.vehiculo?.kilometraje && (
                      <div className="flex gap-2">
                        <span className="text-slate-600 min-w-[90px]">Kilometraje:</span>
                        <span className="font-medium text-slate-900">{selectedOrder.vehiculo.kilometraje.toLocaleString('es-CL')} km</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Servicios y Repuestos */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Wrench className="w-4 h-4" /> Servicios y Repuestos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.detalles.map((detalle) => (
                        <div key={detalle.id} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{detalle.servicio_nombre}</p>
                            {detalle.descripcion && (
                              <p className="text-xs text-slate-600 mt-0.5">{detalle.descripcion}</p>
                            )}
                            {detalle.producto && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[10px] bg-blue-50 border-blue-200">
                                  <Package className="w-3 h-3 mr-1" />
                                  SKU: {detalle.producto.sku}
                                </Badge>
                                <span className="text-xs text-slate-500">{detalle.producto.nombre}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-4">
                            <span className="font-bold text-emerald-600">
                              ${((detalle.precio || 0) * (detalle.cantidad || 1)).toLocaleString('es-CL')}
                            </span>
                            {detalle.producto && detalle.cantidad && (
                              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                                x{detalle.cantidad}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Total */}
                <Card className="border-2 border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-slate-700">Total Cobrado:</span>
                      <span className="text-2xl font-bold text-primary">
                        ${selectedOrder.total_cobrado.toLocaleString('es-CL')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function CreateWorkOrderDialog({ open, onOpenChange, initialData }: { open: boolean; onOpenChange: (open: boolean) => void; initialData?: WorkOrder | null }) {
  const { mutate: createWorkOrder, isPending: isCreating } = useCreateWorkOrder();
  const { mutate: updateWorkOrder, isPending: isUpdating } = useUpdateWorkOrder();
  const { data: servicesCatalog = [] } = useServicesCatalog();
  const { data: allProducts = [] } = useProducts();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Array<{ sku: string; nombre: string; cantidad: number; precio: number; stock: number }>>([]);

  const todayStr = format(new Date(), "yyyy-MM-dd");

  const form = useForm({
    defaultValues: {
      numero_orden_papel: 0, realizado_por: "", revisado_por: "",
      fecha_ingreso: todayStr,
      cliente_rut: "", cliente_nombre: "", cliente_email: "", cliente_telefono: "",
      vehiculo_patente: "", vehiculo_marca: "", vehiculo_modelo: "", vehiculo_km: 0,
    },
  });

  const isPending = isCreating || isUpdating;

  // Helpers de Formateo
  const formatRut = (value: string) => {
    // Eliminar todo excepto números y K
    const clean = value.replace(/[^0-9kK]/g, "").toUpperCase();
    if (!clean) return "";

    // Separar cuerpo y dígito verificador
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    if (!body) return clean;

    // Formatear cuerpo con puntos (de derecha a izquierda)
    const reversedBody = body.split("").reverse().join("");
    const formatted = reversedBody.match(/.{1,3}/g)?.join(".") || "";
    const finalBody = formatted.split("").reverse().join("");

    return `${finalBody}-${dv}`;
  };

  const formatPhone = (value: string) => {
    // Eliminar todo excepto números y el símbolo +
    let clean = value.replace(/[^0-9+]/g, "");

    // Si empieza con +56, mantenerlo
    if (clean.startsWith("+56")) {
      return clean;
    }

    // Si empieza con 56, agregar +
    if (clean.startsWith("56")) {
      return `+${clean}`;
    }

    // Si empieza con +, quitarlo y agregar +56
    if (clean.startsWith("+")) {
      clean = clean.slice(1);
    }

    // Si no empieza con nada o solo tiene números, agregar +56
    return clean ? `+56${clean}` : "+56";
  };

  const formatPatente = (value: string) => {
    const clean = value.replace(/[^A-Z0-9]/g, "").toUpperCase();
    if (clean.length <= 6) {
      // Formato: AA-BB-11
      return clean.match(/.{1,2}/g)?.join("-") || clean;
    } else {
      // Formato: AAAAAA-1
      return clean.slice(0, 6) + "-" + clean.slice(6, 7);
    }
  };

  const formatKilometraje = (value: string) => {
    // Elimina cualquier caracter que no sea número
    const clean = value.replace(/\D/g, "");
    if (!clean || clean === "0") return "";

    // Aplica el formato de puntos según el estándar es-CL
    return Number(clean).toLocaleString("es-CL");
  };

  const capitalize = (text: string) => {
    return text.replace(/\b\w/g, char => char.toUpperCase());
  };

  const [services, setServices] = useState<Record<string, {
    checked: boolean;
    precio: number;
    descripcion: string;
  }>>({});

  useEffect(() => {
    if (servicesCatalog.length > 0) {
      const initial: any = {};
      servicesCatalog.forEach(s => { initial[s] = { checked: false, precio: 0, descripcion: "" }; });
      setServices(initial);
    }
  }, [servicesCatalog]);

  // ✅ Cargar datos cuando estamos en modo edición
  useEffect(() => {
    if (initialData && servicesCatalog.length > 0) {
      // Formatear teléfono (remover +56 9 para mostrar solo los 8 dígitos)
      let telefonoFormateado = "";
      if (initialData.cliente.telefono) {
        const cleanPhone = initialData.cliente.telefono.replace(/\s/g, "");
        if (cleanPhone.startsWith("+569")) {
          telefonoFormateado = cleanPhone.substring(4); // Quitar +569
        } else if (cleanPhone.startsWith("+56")) {
          telefonoFormateado = cleanPhone.substring(3); // Quitar +56
        } else {
          telefonoFormateado = cleanPhone;
        }
      }

      // Resetear formulario con los datos de la orden
      form.reset({
        numero_orden_papel: initialData.numero_orden_papel,
        realizado_por: initialData.realizado_por || "",
        revisado_por: initialData.revisado_por || "",
        fecha_ingreso: initialData.fecha_ingreso
          ? new Date(initialData.fecha_ingreso).toISOString().split('T')[0]
          : todayStr,
        cliente_rut: initialData.cliente.rut || "",
        cliente_nombre: initialData.cliente.nombre || "",
        cliente_email: initialData.cliente.email || "",
        cliente_telefono: telefonoFormateado,
        vehiculo_patente: initialData.vehiculo?.patente || initialData.patente_vehiculo || "",
        vehiculo_marca: initialData.vehiculo?.marca || "",
        vehiculo_modelo: initialData.vehiculo?.modelo || "",
        vehiculo_km: initialData.vehiculo?.kilometraje || initialData.kilometraje || 0,
      });

      // Procesar detalles para separar servicios y productos
      const servicesState: any = {};
      const productsArray: Array<{ sku: string; nombre: string; cantidad: number; precio: number; stock: number }> = [];

      // Inicializar todos los servicios como no marcados
      servicesCatalog.forEach(s => {
        servicesState[s] = { checked: false, precio: 0, descripcion: "" };
      });

      // Procesar cada detalle
      initialData.detalles.forEach((detalle) => {
        if (detalle.producto) {
          // Es un producto/repuesto
          productsArray.push({
            sku: detalle.producto.sku,
            nombre: detalle.producto.nombre,
            cantidad: detalle.cantidad || 1,
            precio: detalle.precio,
            stock: detalle.producto.stock_actual || 0
          });
        } else {
          // Es un servicio (mano de obra)
          const serviceName = detalle.servicio_nombre;
          if (servicesCatalog.includes(serviceName)) {
            servicesState[serviceName] = {
              checked: true,
              precio: detalle.precio,
              descripcion: detalle.descripcion || ""
            };
          }
        }
      });

      setServices(servicesState);
      setSelectedProducts(productsArray);
    }
  }, [initialData, servicesCatalog, form]);

  const calcularTotal = () => {
    const totalServicios = Object.values(services).reduce((t, s) => s.checked ? t + s.precio : t, 0);
    const totalProductos = selectedProducts.reduce((t, p) => t + (p.cantidad * p.precio), 0);
    return totalServicios + totalProductos;
  };

  const onSubmit = (data: any) => {
    // ✅ VALIDACIÓN 1: Datos del Cliente
    if (!data.cliente_nombre || !data.cliente_nombre.trim()) {
      toast({
        title: "⚠️ Falta Información",
        description: "El nombre del cliente es obligatorio.",
        className: "bg-amber-50 text-amber-900 border-amber-200",
        duration: 5000
      });
      return;
    }

    // ✅ VALIDACIÓN 2: Datos del Vehículo
    if (!data.vehiculo_patente || !data.vehiculo_patente.trim()) {
      toast({
        title: "⚠️ Falta Información",
        description: "La patente del vehículo es obligatoria.",
        className: "bg-amber-50 text-amber-900 border-amber-200",
        duration: 5000
      });
      return;
    }

    if (!data.vehiculo_marca || !data.vehiculo_marca.trim()) {
      toast({
        title: "⚠️ Falta Información",
        description: "La marca del vehículo es obligatoria.",
        className: "bg-amber-50 text-amber-900 border-amber-200",
        duration: 5000
      });
      return;
    }

    if (!data.vehiculo_modelo || !data.vehiculo_modelo.trim()) {
      toast({
        title: "⚠️ Falta Información",
        description: "El modelo del vehículo es obligatorio.",
        className: "bg-amber-50 text-amber-900 border-amber-200",
        duration: 5000
      });
      return;
    }

    const serviciosItems = Object.entries(services)
      .filter(([_, s]) => s.checked)
      .map(([name, s]) => ({
        servicio_nombre: name,
        descripcion: s.descripcion || "",
        precio: s.precio
      }));

    const productosItems = selectedProducts.map(p => ({
      servicio_nombre: p.nombre,
      descripcion: `Repuesto: ${p.nombre}`,
      precio: p.precio,
      product_sku: p.sku,
      cantidad: p.cantidad
    }));

    const items = [...serviciosItems, ...productosItems];

    // ✅ VALIDACIÓN 3: Al menos un servicio o repuesto
    if (items.length === 0) {
      toast({
        title: "⚠️ Sin Servicios",
        description: "Debe agregar al menos un servicio o repuesto a la orden.",
        className: "bg-amber-50 text-amber-900 border-amber-200",
        duration: 5000
      });
      return;
    }

    // ✅ VALIDACIÓN 4: Todos los servicios marcados deben tener precio > 0
    const serviciosConPrecioCero = serviciosItems.filter(s => !s.precio || s.precio <= 0);
    if (serviciosConPrecioCero.length > 0) {
      toast({
        title: "⚠️ Precios Incompletos",
        description: `Hay ${serviciosConPrecioCero.length} servicio(s) sin precio. Complete todos los precios antes de continuar.`,
        className: "bg-amber-50 text-amber-900 border-amber-200",
        duration: 6000
      });
      return;
    }

    // ✅ VALIDACIÓN 5: Stock suficiente para productos seleccionados (CRÍTICO)
    const stockErrors: string[] = [];
    for (const prod of selectedProducts) {
      if (prod.cantidad > prod.stock) {
        stockErrors.push(`❌ ${prod.nombre}: solicitado ${prod.cantidad}, disponible ${prod.stock}`);
      }
    }

    if (stockErrors.length > 0) {
      toast({
        title: "⚠️ STOCK INSUFICIENTE",
        description: (
          <div className="space-y-2 mt-2 text-white">
            <p className="font-bold text-white">No se puede procesar la orden:</p>
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
        duration: 8000,
        className: "bg-red-600 border-red-700 text-white [&>div]:text-white"
      });
      return;
    }

    const payload = {
      numero_orden_papel: data.numero_orden_papel,
      realizado_por: data.realizado_por,
      // Solo enviar revisado_por si tiene contenido
      ...(data.revisado_por?.trim() && { revisado_por: data.revisado_por.trim() }),
      // Siempre enviar fecha_ingreso con hora del mediodía para evitar problemas de zona horaria
      fecha_ingreso: `${data.fecha_ingreso}T12:00:00`,
      cliente: {
        nombre: data.cliente_nombre.trim(),
        rut: data.cliente_rut.replace(/\./g, "").replace(/-/g, "").toUpperCase().trim(),
        // Solo enviar email si tiene contenido válido
        ...(data.cliente_email.trim() && { email: data.cliente_email.trim() }),
        // Solo enviar teléfono si tiene contenido válido (concatenar +56 9 con los 8 dígitos)
        ...(data.cliente_telefono.trim() && { telefono: `+56 9${data.cliente_telefono.trim()}` })
      },
      vehiculo: {
        patente: data.vehiculo_patente.replace(/-/g, "").toUpperCase().trim(),
        marca: data.vehiculo_marca.trim(),
        modelo: data.vehiculo_modelo.trim(),
        kilometraje: data.vehiculo_km
      },
      items
    };

    // ✅ Diferenciar entre crear y actualizar
    if (initialData) {
      // Modo edición
      updateWorkOrder({
        id: initialData.id,
        data: payload
      }, {
        onSuccess: () => {
          toast({
            title: "✅ Orden actualizada exitosamente",
            className: "bg-emerald-50 text-emerald-900 border-emerald-200"
          });
          onOpenChange(false);
          form.reset();

          // Limpiar servicios marcados
          const cleanServices: any = {};
          servicesCatalog.forEach(s => {
            cleanServices[s] = { checked: false, precio: 0, descripcion: "" };
          });
          setServices(cleanServices);

          // Limpiar productos seleccionados
          setSelectedProducts([]);

          queryClient.invalidateQueries({ queryKey: ["work-orders"] });
        },
        onError: (err: any) => {
          // Detectar error de número de orden duplicado
          let errorTitle = "❌ Error al actualizar orden";
          let errorDescription = err.message || "Ocurrió un problema al actualizar la orden de trabajo. Verifica los datos.";

          // Detectar violación de unicidad en número de orden
          if (err.message && (
            err.message.includes("duplicate key") ||
            err.message.includes("unique constraint") ||
            err.message.includes("UQ_") ||
            err.message.includes("numero_orden_papel")
          )) {
            errorTitle = "⚠️ Número de Orden Duplicado";
            errorDescription = `El número de orden física ${form.getValues("numero_orden_papel")} ya está en uso. Por favor, elige un número diferente.`;
          }

          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "destructive",
            duration: 8000,
            className: "bg-red-600 border-red-700 text-white [&>div]:text-white"
          });
        }
      });
    } else {
      // Modo creación
      createWorkOrder(payload, {
        onSuccess: () => {
          toast({
            title: "✅ Orden creada exitosamente",
            className: "bg-emerald-50 text-emerald-900 border-emerald-200"
          });
          onOpenChange(false);
          form.reset();

          // Limpiar servicios marcados
          const cleanServices: any = {};
          servicesCatalog.forEach(s => {
            cleanServices[s] = { checked: false, precio: 0, descripcion: "" };
          });
          setServices(cleanServices);

          // Limpiar productos seleccionados
          setSelectedProducts([]);

          queryClient.invalidateQueries({ queryKey: ["/work-orders"] });
        },
        onError: (err: any) => {
          // Detectar error de número de orden duplicado
          let errorTitle = "❌ Error al crear orden";
          let errorDescription = err.message || "Ocurrió un problema al crear la orden de trabajo. Verifica los datos.";

          // Detectar violación de unicidad en número de orden
          if (err.message && (
            err.message.includes("duplicate key") ||
            err.message.includes("unique constraint") ||
            err.message.includes("UQ_") ||
            err.message.includes("numero_orden_papel")
          )) {
            errorTitle = "⚠️ Número de Orden Duplicado";
            errorDescription = `El número de orden física ${form.getValues("numero_orden_papel")} ya está en uso. Por favor, elige un número diferente.`;
          }

          toast({
            title: errorTitle,
            description: errorDescription,
            variant: "destructive",
            duration: 8000,
            className: "bg-red-600 border-red-700 text-white [&>div]:text-white"
          });
          // NO cerrar modal, NO limpiar formulario - permitir corrección
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Nueva Orden
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-amber-50 border-slate-300 shadow-xl">
        <DialogHeader><DialogTitle>{initialData ? "Editar Orden de Trabajo" : "Crear Orden de Trabajo"}</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border">
              <FormField control={form.control} name="numero_orden_papel" render={({ field }) => (
                <FormItem><FormLabel>N° Orden Papel</FormLabel><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormItem>
              )} />
              <FormField control={form.control} name="realizado_por" render={({ field }) => (
                <FormItem>
                  <FormLabel>Realizado Por</FormLabel>
                  <Input
                    placeholder="Nombre Mecánico"
                    {...field}
                    onChange={e => field.onChange(e.target.value.replace(/[0-9]/g, ""))}
                    onBlur={e => field.onChange(capitalize(e.target.value))}
                  />
                </FormItem>
              )} />
              <FormField control={form.control} name="revisado_por" render={({ field }) => (
                <FormItem>
                  <FormLabel>Revisado Por</FormLabel>
                  <Input
                    placeholder="Opcional"
                    {...field}
                    onChange={e => field.onChange(e.target.value.replace(/[0-9]/g, ""))}
                    onBlur={e => field.onChange(capitalize(e.target.value))}
                  />
                </FormItem>
              )} />
              <FormField control={form.control} name="fecha_ingreso" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1 mb-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    Fecha Orden
                  </FormLabel>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-10"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value
                          ? new Date(field.value + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
                          : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                        locale={es}
                        onSelect={(date) => {
                          if (date) {
                            field.onChange(date.toISOString().split('T')[0]);
                            setDatePickerOpen(false);
                          }
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                      {field.value !== todayStr && (
                        <div className="p-3 pt-0 border-t">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-slate-500 text-xs"
                            onClick={() => { field.onChange(todayStr); setDatePickerOpen(false); }}
                          >
                            Volver a hoy
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </FormItem>
              )} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 p-6 border-2 border-blue-200 rounded-xl bg-blue-50 shadow-sm">
                <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> DATOS DEL CLIENTE</h3>
                <div className="grid grid-cols-1 gap-3">
                  <FormField control={form.control} name="cliente_nombre" render={({ field }) => (
                    <Input
                      placeholder="Nombre Completo"
                      {...field}
                      disabled={!!initialData}
                      onChange={e => field.onChange(e.target.value.replace(/[0-9]/g, ""))}
                      onBlur={e => field.onChange(capitalize(e.target.value))}
                    />
                  )} />
                  <div className="flex gap-2">
                    <FormField control={form.control} name="cliente_rut" render={({ field }) => (
                      <Input
                        placeholder="12.345.678-9"
                        className="flex-1"
                        {...field}
                        maxLength={12}
                        disabled={!!initialData}
                        onChange={e => field.onChange(formatRut(e.target.value))}
                      />
                    )} />
                    <FormField control={form.control} name="cliente_telefono" render={({ field }) => (
                      <div className="relative flex-1">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium pointer-events-none select-none">
                          +56 9
                        </div>
                        <Input
                          placeholder="12345678"
                          className="pl-16 font-mono"
                          {...field}
                          maxLength={8}
                          disabled={!!initialData}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, "");
                            field.onChange(value);
                          }}
                        />
                      </div>
                    )} />
                  </div>
                  <FormField control={form.control} name="cliente_email" render={({ field }) => (
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="Correo Electrónico (Opcional)" className="pl-10" {...field} disabled={!!initialData} />
                    </div>
                  )} />
                </div>
              </div>

              <div className="space-y-3 p-6 border-2 border-blue-200 rounded-xl bg-blue-50 shadow-sm">
                <h3 className="font-bold text-sm text-slate-700 flex items-center gap-2"><Car className="w-4 h-4 text-blue-500" /> DATOS DEL VEHÍCULO</h3>
                <div className="grid grid-cols-1 gap-3">
                  <FormField control={form.control} name="vehiculo_patente" render={({ field }) => (
                    <Input
                      placeholder="PTCL23 o PT-CL-23"
                      className="uppercase font-mono"
                      {...field}
                      maxLength={9}
                      disabled={!!initialData}
                      onChange={e => field.onChange(formatPatente(e.target.value.toUpperCase()))}
                    />
                  )} />
                  <div className="flex gap-2">
                    <FormField control={form.control} name="vehiculo_marca" render={({ field }) => (
                      <Input
                        placeholder="Marca"
                        className="flex-1 uppercase"
                        {...field}
                        disabled={!!initialData}
                        onChange={e => field.onChange(e.target.value.replace(/[0-9]/g, "").toUpperCase())}
                      />
                    )} />
                    <FormField control={form.control} name="vehiculo_modelo" render={({ field }) => (
                      <Input
                        placeholder="Modelo"
                        className="flex-1 uppercase"
                        {...field}
                        disabled={!!initialData}
                        onChange={e => field.onChange(e.target.value.toUpperCase())}
                      />
                    )} />
                  </div>
                  <FormField
                    control={form.control}
                    name="vehiculo_km"
                    render={({ field }) => (
                      <div className="relative">
                        <RefreshCcw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="text" // Cambiamos a text para permitir los puntos visuales
                          placeholder="Kilometraje Actual"
                          className="pl-10"
                          {...field}
                          disabled={!!initialData}
                          // Si el valor es 0, enviamos string vacío para que se vea el placeholder
                          value={field.value === 0 ? "" : field.value.toLocaleString("es-CL")}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, "");
                            const numValue = parseInt(rawValue) || 0;
                            field.onChange(numValue); // Guardamos el número puro en el estado
                          }}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-blue-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><Wrench className="w-5 h-5 text-blue-500" /> SERVICIOS Y REPUESTOS</h3>
              <div className="grid gap-3">
                {servicesCatalog.map((serviceName) => {
                  const keyword = serviceName.split(' ').pop() || "";
                  const isChecked = services[serviceName]?.checked;

                  return (
                    <div key={serviceName} className={cn("transition-all border rounded-xl p-4", isChecked ? "bg-blue-50/50 border-primary/30 shadow-sm" : "bg-white")}>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox checked={isChecked} onCheckedChange={v => setServices(p => ({ ...p, [serviceName]: { ...p[serviceName], checked: !!v } }))} />
                          <span className="font-semibold text-slate-800">{serviceName}</span>
                        </div>
                        {isChecked && (
                          <div className="relative w-36">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                            <Input
                              type="text"
                              placeholder="Precio"
                              className="pl-7 text-right font-bold text-primary"
                              value={services[serviceName].precio ? services[serviceName].precio.toLocaleString('es-CL') : ""}
                              onChange={e => {
                                const rawValue = e.target.value.replace(/\D/g, "");
                                const numValue = parseInt(rawValue) || 0;
                                setServices(p => ({ ...p, [serviceName]: { ...p[serviceName], precio: numValue } }));
                              }}
                            />
                          </div>
                        )}
                      </div>
                      {isChecked && (
                        <Input
                          placeholder="Descripción del servicio..."
                          className="mt-3 bg-white/50 text-sm italic"
                          value={services[serviceName].descripcion}
                          onChange={e => setServices(p => ({ ...p, [serviceName]: { ...p[serviceName], descripcion: e.target.value } }))}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PANEL GLOBAL DE PRODUCTOS */}
            <div className="space-y-4 bg-green-50 p-6 rounded-xl border-2 border-green-200 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  REPUESTOS UTILIZADOS
                </h3>
                <Button
                  type="button"
                  size="sm"
                  className="bg-emerald-400 hover:bg-emerald-500 text-white gap-2"
                  onClick={() => setProductModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Agregar Repuesto
                </Button>
              </div>

              {selectedProducts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 bg-white rounded-lg border-2 border-dashed border-slate-200">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin repuestos agregados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProducts.map((prod, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-lg border border-green-200 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{prod.nombre}</p>
                        <p className="text-xs text-slate-500">SKU: {prod.sku} • Stock disponible: {prod.stock}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const updated = [...selectedProducts];
                            updated[idx].cantidad = Math.max(1, updated[idx].cantidad - 1);
                            setSelectedProducts(updated);
                          }}
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </Button>
                        <span className="font-mono font-bold w-12 text-center">{prod.cantidad}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            const updated = [...selectedProducts];
                            if (updated[idx].cantidad < updated[idx].stock) {
                              updated[idx].cantidad += 1;
                              setSelectedProducts(updated);
                            } else {
                              toast({
                                title: "⚠️ Stock insuficiente",
                                description: `Solo hay ${updated[idx].stock} unidades disponibles`,
                                variant: "destructive"
                              });
                            }
                          }}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-medium">$</span>
                          <Input
                            type="text"
                            className="pl-7 pr-2 h-8 text-right font-bold text-emerald-600"
                            value={prod.precio.toLocaleString('es-CL')}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/\D/g, "");
                              const numValue = parseInt(rawValue) || 0;
                              const updated = [...selectedProducts];
                              updated[idx].precio = numValue;
                              setSelectedProducts(updated);
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-14 text-right">
                          x{prod.cantidad}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                          onClick={() => setSelectedProducts(selectedProducts.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t-2 border-slate-200">
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg border border-primary/10">
                <span className="text-lg font-bold text-slate-700">Total a Cobrar:</span>
                <span className="text-2xl font-bold text-primary">${calcularTotal().toLocaleString('es-CL')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Limpiar formulario
                  form.reset();

                  // Limpiar servicios marcados
                  const cleanServices: any = {};
                  servicesCatalog.forEach(s => {
                    cleanServices[s] = { checked: false, precio: 0, descripcion: "" };
                  });
                  setServices(cleanServices);

                  // Limpiar productos seleccionados
                  setSelectedProducts([]);

                  // Cerrar modal
                  onOpenChange(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="bg-emerald-400 hover:bg-emerald-500 text-white gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {initialData ? "Actualizando..." : "Creando..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    {initialData ? "Actualizar Orden" : "Crear Orden de Trabajo"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>

      <ProductSearchDialog
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSelect={(product) => {
          const exists = selectedProducts.find(p => p.sku === product.sku);
          if (exists) {
            toast({
              title: "⚠️ Producto ya agregado",
              description: "Este repuesto ya está en la lista. Puedes modificar su cantidad.",
              variant: "destructive"
            });
          } else {
            setSelectedProducts([...selectedProducts, {
              sku: product.sku,
              nombre: product.nombre,
              cantidad: 1,
              precio: product.precio_venta,
              stock: product.stock_actual
            }]);
            toast({
              title: "✅ Repuesto agregado",
              description: `${product.nombre} agregado a la orden`,
              className: "bg-emerald-50 text-emerald-900 border-emerald-200"
            });
          }
        }}
        title="🔍 Seleccionar Repuesto"
        showOutOfStock={false}
      />
    </Dialog>
  );
}

// Este componente ya no es necesario, ahora usamos ProductSearchDialog