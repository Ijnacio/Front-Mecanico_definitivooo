import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createColumns, ClienteDetalle } from "@/components/clients/columns";
import { Search, Loader2, RefreshCcw, ChevronDown, Plus, UserPlus, History, Edit, User, Car, Mail, Phone, Wrench, Calendar, Pencil } from "lucide-react";
import { useClients, useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { useWorkOrders, useUpdateWorkOrder } from "@/hooks/use-work-orders";
import { useVehicles } from "@/hooks/use-vehicles";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatPhoneCL, formatRutCL } from "@/lib/utils";

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

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const { data: workOrders = [] } = useWorkOrders();
  const { data: vehicles = [] } = useVehicles();
  const { toast } = useToast();

  const [searchValue, setSearchValue] = useState("");

  // Enriquecer workOrders con datos del catálogo de vehículos (igual que WorkOrders.tsx)
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
  const [selectedClient, setSelectedClient] = useState<ClienteDetalle | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClienteDetalle | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // ESTADO PARA DIALOGO DE CREACIÓN
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // DETECTAR URL ?action=new
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') {
      setIsCreateOpen(true);
      window.history.replaceState({}, '', '/clients');
    }
  }, []);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const clientsWithStats = useMemo(() => {
    return clients.map(client => {
      const clientOrders = workOrders.filter(wo => wo.cliente?.id === client.id);
      const totalSpent = clientOrders.reduce((sum, wo) => sum + (wo.total_cobrado || 0), 0);
      const lastOrder = clientOrders.sort((a, b) =>
        new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime()
      )[0];

      return {
        ...client,
        total_compras: totalSpent,
        ultima_visita: lastOrder?.fecha_ingreso
      };
    });
  }, [clients, workOrders]);

  // Función para normalizar texto: minúsculas + sin acentos
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const filteredClients = useMemo(() => {
    if (!searchValue) return clientsWithStats;
    const normalizedSearch = normalizeText(searchValue);
    
    return clientsWithStats.filter(c => {
      const normalizedNombre = normalizeText(c.nombre || "");
      const normalizedRut = normalizeText(c.rut || "");
      const normalizedEmail = normalizeText(c.email || "");
      const normalizedTelefono = normalizeText(c.telefono || "");
      
      return (
        normalizedNombre.includes(normalizedSearch) ||
        normalizedRut.includes(normalizedSearch) ||
        normalizedEmail.includes(normalizedSearch) ||
        normalizedTelefono.includes(normalizedSearch)
      );
    });
  }, [clientsWithStats, searchValue]);

  const handleEdit = (client: ClienteDetalle) => {
    setClientToEdit(client);
    setIsEditOpen(true);
  };

  const handleViewHistory = (client: ClienteDetalle) => {
    setSelectedClient(client);
    setIsHistoryOpen(true);
  };

  const columns = useMemo(() => createColumns(
    handleEdit,
    handleViewHistory
  ), []);

  const table = useReactTable({
    data: filteredClients,
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
        title="Cartera de Clientes"
        description="Gestión de clientes, historial y fidelización."
        // BOTÓN NUEVO CLIENTE RESTAURADO
        action={
          <>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Nuevo Cliente
            </Button>
            <CreateClientDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
          </>
        }
      />

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="relative w-full lg:w-[350px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, RUT, email o teléfono..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-10 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 bg-slate-50 border-dashed">
                  Columnas <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {searchValue && (
              <Button variant="ghost" size="icon" onClick={() => setSearchValue("")}>
                <RefreshCcw className="w-4 h-4 text-slate-400" />
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
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                <TableCell colSpan={columns.length} className="h-24 text-center">No hay clientes.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Siguiente
        </Button>
      </div>

      <ClientHistoryDialog
        client={selectedClient}
        workOrders={ordersWithVehicleRef.filter(wo => wo.cliente?.id === selectedClient?.id)}
        open={isHistoryOpen}
        onOpenChange={setIsHistoryOpen}
      />

      <EditClientDialog
        client={clientToEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </div>
  );
}

// COMPONENTE HISTORIAL DE CLIENTE
function ClientHistoryDialog({
  client,
  workOrders,
  open,
  onOpenChange
}: {
  client: ClienteDetalle | null;
  workOrders: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editingVehicle, setEditingVehicle] = useState<{ orderId: string; patente: string; marca: string; modelo: string; kilometraje: number | null } | null>(null);
  const [formMarca, setFormMarca] = useState("");
  const [formModelo, setFormModelo] = useState("");
  const { mutate: updateWorkOrder } = useUpdateWorkOrder();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleEditVehicle = (wo: any) => {
    // Los datos ya vienen enriquecidos desde ordersWithVehicleRef
    const patente = wo.vehiculo?.patente || wo.patente_vehiculo || "";
    const marca = wo.vehiculo?.marca || "";
    const modelo = wo.vehiculo?.modelo || "";
    const kilometraje = wo.vehiculo?.kilometraje || null;
    
    setEditingVehicle({ orderId: wo.id, patente, marca, modelo, kilometraje });
    setFormMarca(marca || "");
    setFormModelo(modelo || "");
  };

  const handleSaveVehicle = () => {
    if (!editingVehicle) return;
    
    updateWorkOrder({
      id: editingVehicle.orderId,
      vehiculo: {
        patente: editingVehicle.patente,
        marca: formMarca.trim().toUpperCase(),
        modelo: formModelo.trim().toUpperCase(),
        kilometraje: editingVehicle.kilometraje || undefined
      }
    }, {
      onSuccess: () => {
        toast({ title: "✅ Vehículo actualizado", className: "bg-emerald-50 text-emerald-900 border-emerald-200" });
        setEditingVehicle(null);
        queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      },
      onError: (err: any) => {
        toast({ title: "❌ Error al actualizar", description: err.message, variant: "destructive" });
      }
    });
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* HEADER SIMPLE */}
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Historial de Atenciones
          </DialogTitle>
        </DialogHeader>

        {/* CARD CLIENTE */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4" /> Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <div className="flex gap-2">
              <span className="text-slate-500 min-w-[70px]">Nombre:</span>
              <span className="font-semibold text-slate-900">{client.nombre}</span>
            </div>
            <div className="flex gap-2">
              <span className="text-slate-500 min-w-[70px]">RUT:</span>
              <span className="font-medium text-slate-800 font-mono">{formatRutCL(client.rut)}</span>
            </div>
            {client.telefono && (
              <div className="flex gap-2">
                <span className="text-slate-500 min-w-[70px]">Teléfono:</span>
                <span className="font-medium text-slate-800 font-mono">{formatPhoneCL(client.telefono)}</span>
              </div>
            )}
            {client.email && (
              <div className="flex gap-2">
                <span className="text-slate-500 min-w-[70px]">Email:</span>
                <span className="font-medium text-slate-800">{client.email}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. LISTA DE ÓRDENES DE TRABAJO - Cada una como card principal */}
        <div className="space-y-4 mt-4">
          {workOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Este cliente no tiene órdenes de trabajo registradas</p>
            </div>
          ) : (
            workOrders
              .sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime())
              .map((wo) => (
                <Card key={wo.id}>
                  <div className="flex items-start justify-between px-6 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-slate-900">OT #{wo.numero_orden_papel}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        wo.estado === 'FINALIZADA' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        wo.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {wo.estado}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(wo.fecha_ingreso).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-emerald-600">
                      ${wo.total_cobrado?.toLocaleString('es-CL') || 0}
                    </div>
                  </div>

                  <CardContent className="space-y-4 pt-6">
                    
                    {/* CARD VEHÍCULO */}
                    {(() => {
                      // Los datos ya vienen enriquecidos desde ordersWithVehicleRef
                      const patente = wo.vehiculo?.patente || wo.patente_vehiculo;
                      const marca = wo.vehiculo?.marca;
                      const modelo = wo.vehiculo?.modelo;
                      const kilometraje = wo.vehiculo?.kilometraje;

                      // Validar si marca/modelo son valores reales (no fallbacks genéricos)
                      const marcaValida = marca && marca !== "Sin Marca" && marca !== "SIN MARCA";
                      const modeloValido = modelo && modelo !== "Sin Modelo" && modelo !== "SIN MODELO";

                      return (
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                              <Car className="w-4 h-4" /> Vehículo
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1.5 text-sm">
                            <div className="flex gap-2">
                              <span className="text-slate-500 min-w-[90px]">Patente:</span>
                              <span className="font-bold text-slate-900 font-mono">{patente}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-slate-500 min-w-[90px]">Marca:</span>
                              <span className={`font-semibold uppercase ${!marcaValida ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                                {marcaValida ? marca : 'No registrado'}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-slate-500 min-w-[90px]">Modelo:</span>
                              <span className={`font-semibold uppercase ${!modeloValido ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                                {modeloValido ? modelo : 'No registrado'}
                              </span>
                            </div>
                            {kilometraje && (
                              <div className="flex gap-2">
                                <span className="text-slate-500 min-w-[90px]">Kilometraje:</span>
                                <span className="font-medium text-slate-800">{kilometraje.toLocaleString('es-CL')} km</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })()}

                    {/* CARD TRABAJOS REALIZADOS */}
                    {wo.detalles && wo.detalles.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Wrench className="w-4 h-4" /> Trabajos Realizados
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {wo.detalles.map((detalle: any, idx: number) => (
                              <div key={detalle.id || idx} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="flex-1">
                                  <p className="font-semibold text-slate-900">{detalle.servicio_nombre}</p>
                                  {detalle.descripcion && (
                                    <p className="text-xs text-slate-600 mt-0.5">{detalle.descripcion}</p>
                                  )}
                                  {detalle.producto && (
                                    <div className="text-xs text-slate-500 mt-1">
                                      📦 {detalle.producto.nombre} (SKU: {detalle.producto.sku})
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-1 ml-4">
                                  <span className="font-bold text-emerald-600">
                                    ${((detalle.precio || 0) * (detalle.cantidad || 1)).toLocaleString('es-CL')}
                                  </span>
                                  {detalle.cantidad && detalle.cantidad > 1 && (
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
                    )}

                    {/* INFO ADICIONAL */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700">Información General</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <Label className="text-slate-600">Fecha de Ingreso:</Label>
                          <span className="font-medium">{new Date(wo.fecha_ingreso).toLocaleDateString('es-CL')}</span>
                        </div>
                        <div className="flex justify-between">
                          <Label className="text-slate-600">Realizado por:</Label>
                          <span className="font-medium">{wo.realizado_por || 'No especificado'}</span>
                        </div>
                        {wo.revisado_por && (
                          <div className="flex justify-between">
                            <Label className="text-slate-600">Revisado por:</Label>
                            <span className="font-medium">{wo.revisado_por}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </DialogContent>

      {/* Dialog de Edición de Vehículo */}
      <Dialog open={!!editingVehicle} onOpenChange={(open) => !open && setEditingVehicle(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-blue-600" />
              Completar Datos del Vehículo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label className="text-slate-600 text-xs mb-1.5 block">Patente</Label>
              <Input
                value={editingVehicle?.patente || ""}
                disabled
                className="font-mono font-bold bg-slate-50"
              />
            </div>
            <div>
              <Label className="text-slate-600 text-xs mb-1.5 block">Marca</Label>
              <Input
                value={formMarca}
                onChange={(e) => setFormMarca(e.target.value.toUpperCase())}
                placeholder="Ej: TOYOTA"
                className="uppercase"
              />
            </div>
            <div>
              <Label className="text-slate-600 text-xs mb-1.5 block">Modelo</Label>
              <Input
                value={formModelo}
                onChange={(e) => setFormModelo(e.target.value.toUpperCase())}
                placeholder="Ej: YARIS"
                className="uppercase"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingVehicle(null)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveVehicle}
                disabled={!formMarca.trim() || !formModelo.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// COMPONENTE EDITAR CLIENTE
function EditClientDialog({
  client,
  open,
  onOpenChange
}: {
  client: ClienteDetalle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void
}) {
  const { mutate: updateClient, isPending } = useUpdateClient();
  const { toast } = useToast();

  // Función para normalizar teléfono al cargar
  const normalizePhoneForDisplay = (phone?: string) => {
    if (!phone) return "";
    // Si ya tiene +56 9, extraer solo los 8 dígitos
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (cleaned.startsWith("569") && cleaned.length === 11) {
      return cleaned.substring(3); // Retorna solo los 8 dígitos
    }
    if (cleaned.startsWith("56") && cleaned.length === 10) {
      return cleaned.substring(2); // Retorna solo los 8 dígitos
    }
    if (cleaned.length === 9 && cleaned.startsWith("9")) {
      return cleaned.substring(1); // Retorna solo los 8 dígitos
    }
    return cleaned.substring(0, 8); // Máximo 8 dígitos
  };

  // Función para formatear al guardar
  const formatPhoneForSave = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, "");
    if (!cleaned) return "";
    return `+56 9${cleaned}`;
  };

  const clientSchema = z.object({
    nombre: z.string().min(3, "El nombre es obligatorio"),
    rut: z.string().min(8, "RUT inválido"),
    telefono: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
  });

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      nombre: client?.nombre || "",
      rut: client?.rut || "",
      telefono: normalizePhoneForDisplay(client?.telefono),
      email: client?.email || ""
    }
  });

  // Actualizar valores del formulario cuando cambia el cliente
  useEffect(() => {
    if (client) {
      form.reset({
        nombre: client.nombre,
        rut: client.rut,
        telefono: normalizePhoneForDisplay(client.telefono),
        email: client.email || ""
      });
    }
  }, [client, form]);

  const onSubmit = (data: z.infer<typeof clientSchema>) => {
    if (!client) return;

    // Formatear teléfono antes de enviar
    const dataToSend = {
      ...data,
      telefono: data.telefono ? formatPhoneForSave(data.telefono) : undefined
    };

    updateClient(
      { id: client.id, data: dataToSend },
      {
        onSuccess: () => {
          toast({ title: "Cliente actualizado exitosamente" });
          onOpenChange(false);
        },
        onError: (err: any) => toast({
          title: "Error al actualizar",
          description: err.message,
          variant: "destructive"
        })
      }
    );
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-primary" /> Editar Cliente
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="998877111"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Juan Pérez" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium pointer-events-none select-none">
                        +56 9
                      </div>
                      <Input
                        {...field}
                        placeholder="12345678"
                        className="pl-16 font-mono"
                        maxLength={8}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, "");
                          field.onChange(value);
                        }}
                      />
                    </div>
                  </FormControl>
                  <div className="text-xs text-slate-500 mt-1">Solo los 8 dígitos después del 9</div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// NUEVO COMPONENTE DIALOGO CREAR CLIENTE
function CreateClientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate: createClient, isPending } = useCreateClient();
  const { toast } = useToast();

  const clientSchema = z.object({
    nombre: z.string().min(3, "El nombre es obligatorio"),
    rut: z.string().min(8, "RUT inválido"),
    telefono: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
  });

  const form = useForm<z.infer<typeof clientSchema>>({
    resolver: zodResolver(clientSchema),
    defaultValues: { nombre: "", rut: "", telefono: "+56 9", email: "" }
  });

  const onSubmit = (data: z.infer<typeof clientSchema>) => {
    createClient(data, {
      onSuccess: () => {
        toast({ title: "Cliente creado exitosamente" });
        onOpenChange(false);
        form.reset();
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Nuevo Cliente
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RUT</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="998877111"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Juan Pérez" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cliente"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}