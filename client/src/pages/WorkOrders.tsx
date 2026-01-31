import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { 
  useWorkOrders, 
  useDeleteWorkOrder, 
  useCreateWorkOrder, 
  useServicesCatalog, 
  type CreateWorkOrderDTO, 
  type WorkOrder 
} from "@/hooks/use-work-orders";
import { useVehicles } from "@/hooks/use-vehicles";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createColumns } from "@/components/work-orders/columns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Car, User, Calendar, Filter, RefreshCcw, ChevronDown, 
  Wrench, Plus, Search, Loader2, ChevronsUpDown, ChevronUp, ChevronDown as ChevronDownIcon, Mail 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WorkOrders() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const { data: workOrders = [], isLoading } = useWorkOrders();
  const { mutate: deleteWorkOrder } = useDeleteWorkOrder();
  const { data: vehicles = [] } = useVehicles();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [sorting, setSorting] = useState<SortingState>([]);

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

  const handleDelete = (wo: WorkOrder) => {
    if (confirm(`¿Estás seguro de eliminar la orden #${wo.numero_orden_papel}?`)) {
      deleteWorkOrder(wo.id, {
        onSuccess: () => toast({ title: "Orden eliminada realizada" }),
        onError: () => toast({ title: "Error al eliminar", variant: "destructive" })
      });
    }
  };

  const columns = useMemo(() => createColumns(
    (wo) => setSelectedOrder(wo),
    (wo) => alert("Editar no implementado"),
    (wo) => handleDelete(wo)
  ), []);

  const table = useReactTable({
    data: filteredOrders,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: { sorting },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Órdenes de Trabajo"
        description="Gestione las órdenes de trabajo, seguimiento y facturación."
        action={<CreateWorkOrderDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />}
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
      </div>
    </div>
  );
}

function CreateWorkOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate: createWorkOrder, isPending } = useCreateWorkOrder();
  const { data: servicesCatalog = [] } = useServicesCatalog();
  const { data: allProducts = [] } = useProducts();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      numero_orden_papel: 0, realizado_por: "", revisado_por: "",
      cliente_rut: "", cliente_nombre: "", cliente_email: "", cliente_telefono: "",
      vehiculo_patente: "", vehiculo_marca: "", vehiculo_modelo: "", vehiculo_km: 0,
    },
  });

  // Helpers de Formateo
  const formatRut = (value: string) => {
    const clean = value.replace(/[^0-9kK]/g, "");
    if (!clean) return "";
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();
    return body.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.") + "-" + dv;
  };

  const formatPhone = (value: string) => {
  // Elimina todo lo que no sea número
  const clean = value.replace(/\D/g, "");
  if (clean.length === 0) return "";

  // Si empieza por 2 (Fijo): X XXXX XXXX
  if (clean.startsWith("2")) {
    const part1 = clean.slice(0, 1);
    const part2 = clean.slice(1, 5);
    const part3 = clean.slice(5, 9);
    return [part1, part2, part3].filter(Boolean).join(" ");
  } 
  
  // Si empieza por 5 (Móvil/Internacional): +XX X XXXX XXXX
  if (clean.startsWith("5")) {
    const part1 = "+" + clean.slice(0, 2);
    const part2 = clean.slice(2, 3);
    const part3 = clean.slice(3, 7);
    const part4 = clean.slice(7, 11);
    return [part1, part2, part3, part4].filter(Boolean).join(" ");
  }

  return clean; // Retorna el número limpio si no cumple los criterios
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
    product_sku?: string; 
    cantidad: number 
  }>>({});

  useEffect(() => {
    if (servicesCatalog.length > 0) {
      const initial: any = {};
      servicesCatalog.forEach(s => { initial[s] = { checked: false, precio: 0, descripcion: "", cantidad: 1 }; });
      setServices(initial);
    }
  }, [servicesCatalog]);

  const calcularTotal = () => {
    return Object.values(services).reduce((t, s) => s.checked ? t + (s.precio * s.cantidad) : t, 0);
  };

  const onSubmit = (data: any) => {
    const items = Object.entries(services)
      .filter(([_, s]) => s.checked)
      .map(([name, s]) => ({
        servicio_nombre: name,
        descripcion: s.descripcion,
        precio: s.precio,
        product_sku: s.product_sku,
        product_cantidad: s.product_sku ? s.cantidad : undefined
      }));

    createWorkOrder({
      numero_orden_papel: data.numero_orden_papel,
      realizado_por: data.realizado_por,
      cliente: { 
        nombre: data.cliente_nombre, 
        rut: data.cliente_rut.replace(/\./g, ""), 
        email: data.cliente_email, 
        telefono: data.cliente_telefono.replace(/\s/g, "").replace(/\+/g, "") // Quita espacios y el símbolo + 
      },
      vehiculo: { 
        patente: data.vehiculo_patente.replace(/-/g, '').toUpperCase(), 
        marca: data.vehiculo_marca, 
        modelo: data.vehiculo_modelo, 
        kilometraje: data.vehiculo_km 
      },
      items
    }, {
      onSuccess: () => {
        toast({ title: "Orden Creada exitosamente" });
        onOpenChange(false);
        form.reset();
        queryClient.invalidateQueries({ queryKey: ["/work-orders"] });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Nueva Orden</Button></DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Crear Orden de Trabajo</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border">
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
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 border rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2"><User className="w-4 h-4"/> DATOS DEL CLIENTE</h3>
                <div className="grid grid-cols-1 gap-3">
                  <FormField control={form.control} name="cliente_nombre" render={({ field }) => (
                    <Input 
                      placeholder="Nombre Completo" 
                      {...field} 
                      onChange={e => field.onChange(e.target.value.replace(/[0-9]/g, ""))}
                      onBlur={e => field.onChange(capitalize(e.target.value))}
                    />
                  )} />
                  <div className="flex gap-2">
                    <FormField control={form.control} name="cliente_rut" render={({ field }) => (
                      <Input 
                        placeholder="RUN" 
                        className="flex-1" 
                        {...field} 
                        onChange={e => field.onChange(formatRut(e.target.value))} 
                      />
                    )} />
                    <FormField control={form.control} name="cliente_telefono" render={({ field }) => (
                      <Input 
                        placeholder="Teléfono" 
                        className="flex-1" 
                        {...field} 
                        onChange={e => field.onChange(formatPhone(e.target.value))} 
                      />
                    )} />
                  </div>
                  <FormField control={form.control} name="cliente_email" render={({ field }) => (
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input placeholder="Correo Electrónico (Opcional)" className="pl-10" {...field} />
                    </div>
                  )} />
                </div>
              </div>

              <div className="space-y-3 p-4 border rounded-xl bg-white shadow-sm">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2"><Car className="w-4 h-4"/> DATOS DEL VEHÍCULO</h3>
                <div className="grid grid-cols-1 gap-3">
                  <FormField control={form.control} name="vehiculo_patente" render={({ field }) => (
                    <Input 
                      placeholder="PT-CL-23" 
                      className="uppercase font-mono" 
                      {...field} 
                      maxLength={9}
                      onChange={e => field.onChange(formatPatente(e.target.value))}
                    />
                  )} />
                  <div className="flex gap-2">
                    <FormField control={form.control} name="vehiculo_marca" render={({ field }) => (
                      <Input 
                        placeholder="Marca" 
                        className="flex-1" 
                        {...field} 
                        onChange={e => field.onChange(e.target.value.replace(/[0-9]/g, ""))}
                      />
                    )} />
                    <FormField control={form.control} name="vehiculo_modelo" render={({ field }) => <Input placeholder="Modelo" className="flex-1" {...field} />} />
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

            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 flex items-center gap-2"><Wrench className="w-5 h-5" /> SERVICIOS Y REPUESTOS</h3>
              <div className="grid gap-3">
                {servicesCatalog.map((serviceName) => {
                  const keyword = serviceName.split(' ').pop() || "";
                  const isChecked = services[serviceName]?.checked;

                  return (
                    <div key={serviceName} className={cn("transition-all border rounded-xl p-4", isChecked ? "bg-blue-50/50 border-primary/30 shadow-sm" : "bg-white")}>
                      <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox checked={isChecked} onCheckedChange={v => setServices(p => ({ ...p, [serviceName]: { ...p[serviceName], checked: !!v } }))} />
                          <span className="font-semibold text-slate-800">{serviceName}</span>
                        </div>

                        {isChecked && (
                          <div className="flex flex-1 gap-3 w-full items-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="flex-1 justify-between bg-white border-dashed">
                                  {services[serviceName].product_sku ? `📦 SKU: ${services[serviceName].product_sku}` : `Buscar ${keyword}...`}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                  <CommandInput placeholder={`Filtrando ${keyword}...`} />
                                  <CommandList>
                                    <CommandEmpty>No hay productos en {keyword}.</CommandEmpty>
                                    <CommandGroup heading="Sugerencias">
                                      <CommandItem onSelect={() => setServices(p => ({ ...p, [serviceName]: { ...p[serviceName], product_sku: undefined } }))}>Solo mano de obra</CommandItem>
                                      {allProducts
                                        .filter(p => p.stock_actual > 0 && (p.nombre.toLowerCase().includes(keyword.toLowerCase()) || (p.categoria?.nombre || "").toLowerCase().includes(keyword.toLowerCase())))
                                        .map(p => (
                                          <CommandItem key={p.id} onSelect={() => setServices(pr => ({ ...pr, [serviceName]: { ...pr[serviceName], product_sku: p.sku, precio: pr[serviceName].precio || p.precio_venta } }))}>
                                            <div className="flex flex-col">
                                              <span className="font-medium">{p.nombre}</span>
                                              <span className="text-xs text-muted-foreground">SKU: {p.sku} | Stock: {p.stock_actual} | ${p.precio_venta.toLocaleString()}</span>
                                            </div>
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>

                            <div className="flex items-center border rounded-lg bg-white overflow-hidden h-10 shadow-sm">
                              <Button type="button" variant="ghost" size="icon" className="h-full rounded-none border-r w-8 hover:bg-slate-100" onClick={() => setServices(p => ({ ...p, [serviceName]: { ...p[serviceName], cantidad: Math.max(1, p[serviceName].cantidad - 1) } }))}>
                                <ChevronDownIcon className="w-4 h-4" />
                              </Button>
                              <span className="px-3 font-mono font-bold min-w-[40px] text-center">{services[serviceName].cantidad}</span>
                              <Button type="button" variant="ghost" size="icon" className="h-full rounded-none border-l w-8 hover:bg-slate-100" onClick={() => setServices(p => ({ ...p, [serviceName]: { ...p[serviceName], cantidad: p[serviceName].cantidad + 1 } }))}>
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="relative w-32">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                              <Input type="number" className="pl-7 text-right font-bold text-primary focus-visible:ring-primary" value={services[serviceName].precio || ""} onChange={e => setServices(p => ({ ...p, [serviceName]: { ...p[serviceName], precio: parseInt(e.target.value) || 0 } }))} />
                            </div>
                          </div>
                        )}
                      </div>
                      {isChecked && <Input placeholder="Descripción detallada del trabajo realizado..." className="mt-3 bg-white/50 text-sm italic" value={services[serviceName].descripcion} onChange={e => setServices(p => ({ ...p, [serviceName]: { ...p[serviceName], descripcion: e.target.value } }))} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t-2 border-slate-200">
              <div className="flex justify-between items-center bg-primary/5 p-4 rounded-lg border border-primary/10">
                <span className="text-lg font-bold text-slate-700">Total a Cobrar:</span>
                <span className="text-2xl font-bold text-primary">${calcularTotal().toLocaleString('es-CL')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending}>{isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creando...</> : "Crear Orden de Trabajo"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}