import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createColumns, ClienteDetalle } from "@/components/clients/columns";
import { Search, Loader2, RefreshCcw, ChevronDown, Plus, UserPlus, History, Edit } from "lucide-react";
import { useClients, useCreateClient, useUpdateClient } from "@/hooks/use-clients";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
  const { toast } = useToast();

  const [searchValue, setSearchValue] = useState("");
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

  const filteredClients = useMemo(() => {
    if (!searchValue) return clientsWithStats;
    const lower = searchValue.toLowerCase();
    return clientsWithStats.filter(c =>
      c.nombre.toLowerCase().includes(lower) ||
      c.rut.toLowerCase().includes(lower)
    );
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
              placeholder="Buscar por nombre o RUT..."
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
        workOrders={workOrders.filter(wo => wo.cliente?.id === selectedClient?.id)}
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
  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <History className="w-5 h-5 text-primary" />
            Historial de Atenciones - {client.nombre}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
            <span className="font-mono">{client.rut}</span>
            {client.telefono && <span>📞 {client.telefono}</span>}
          </div>
        </DialogHeader>

        {/* Lista de Órdenes */}
        <div className="space-y-3 mt-4">
          {workOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p>Este cliente no tiene órdenes de trabajo registradas</p>
            </div>
          ) : (
            workOrders
              .sort((a, b) => new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime())
              .map((wo) => (
                <div key={wo.id} className="border border-slate-200 rounded-lg p-4 bg-white hover:border-slate-300 transition-colors">
                  {/* Header de la OT */}
                  <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">OT #{wo.numero_orden_papel}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${wo.estado === 'FINALIZADA' ? 'bg-emerald-100 text-emerald-700' :
                          wo.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                          {wo.estado}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {new Date(wo.fecha_ingreso).toLocaleDateString('es-CL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-600">
                        ${wo.total_cobrado?.toLocaleString('es-CL') || 0}
                      </div>
                    </div>
                  </div>

                  {/* Información del Vehículo */}
                  {wo.vehiculo && (
                    <div className="bg-blue-50 rounded-md p-3 mb-3 border border-blue-100">
                      <div className="font-medium text-slate-900">
                        🚗 {wo.vehiculo.marca} {wo.vehiculo.modelo} - <span className="font-mono font-bold">{wo.vehiculo.patente}</span>
                      </div>
                      {wo.kilometraje && (
                        <div className="text-sm text-slate-600 mt-1">
                          📏 {wo.kilometraje.toLocaleString('es-CL')} km
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detalles de Servicios - ENFOQUE PRINCIPAL */}
                  {wo.detalles && wo.detalles.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Trabajos Realizados</div>
                      {wo.detalles.map((detalle: any, idx: number) => (
                        <div key={detalle.id || idx} className="bg-slate-50 rounded-md p-3 border border-slate-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-slate-900">{detalle.servicio_nombre}</div>
                            <div className="font-bold text-slate-900 ml-4">
                              ${detalle.precio?.toLocaleString('es-CL') || 0}
                            </div>
                          </div>

                          {detalle.descripcion && (
                            <div className="text-sm text-slate-700 bg-white rounded p-2 border border-slate-200 mt-2">
                              <span className="font-medium text-slate-500">Descripción:</span> {detalle.descripcion}
                            </div>
                          )}

                          {detalle.producto && (
                            <div className="text-xs text-blue-700 mt-2 bg-blue-50 rounded px-2 py-1 inline-block">
                              📦 Producto: {detalle.producto.nombre} (SKU: {detalle.producto.sku})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mecánico */}
                  <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
                    <span className="font-medium">👨‍🔧 {wo.realizado_por || 'No especificado'}</span>
                    {wo.revisado_por && (
                      <span className="ml-4">✅ Revisado: {wo.revisado_por}</span>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
      </DialogContent>
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
      telefono: client?.telefono || "+56 9",
      email: client?.email || ""
    }
  });

  // Actualizar valores del formulario cuando cambia el cliente
  useEffect(() => {
    if (client) {
      form.reset({
        nombre: client.nombre,
        rut: client.rut,
        telefono: client.telefono || "+56 9",
        email: client.email || ""
      });
    }
  }, [client, form]);

  const onSubmit = (data: z.infer<typeof clientSchema>) => {
    if (!client) return;

    updateClient(
      { id: client.id, data },
      {
        onSuccess: () => {
          toast({ title: "✅ Cliente actualizado exitosamente" });
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
                    <Input {...field} placeholder="12.345.678-9" />
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
                    <Input {...field} placeholder="12.345.678-9" />
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