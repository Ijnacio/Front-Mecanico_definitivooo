import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useWorkOrders, useDeleteWorkOrder, useCreateWorkOrder, type CreateWorkOrderDTO } from "@/hooks/use-work-orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Search, FileText, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";

export default function WorkOrders() {
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const { data: allWorkOrders = [], isLoading } = useWorkOrders();
  
  // Filtrado de órdenes
  let workOrders = allWorkOrders.filter(wo => {
    const matchesSearch = search === "" || 
                         wo.patente_vehiculo?.toLowerCase().includes(search.toLowerCase()) || 
                         wo.numero_orden_papel?.toString().includes(search) ||
                         wo.cliente?.nombre?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || wo.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Ordenar por fecha descendente
  workOrders = [...workOrders].sort((a, b) => 
    new Date(b.fecha_ingreso).getTime() - new Date(a.fecha_ingreso).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Órdenes de Trabajo" 
        description="Seguimiento de reparaciones y servicios del taller."
        action={<CreateWorkOrderDialog />}
      />

      <div className="card-industrial bg-white p-6 space-y-4">
        {/* Búsqueda Principal */}
        <div className="relative">
          {!searchFocused && !search && (
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
          <Input 
            placeholder=""
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-slate-50 border-slate-200 rounded-lg h-12 text-base pl-14"
          />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 pt-2 flex-wrap">
          <span className="text-sm text-slate-600 font-medium">Filtrar por:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Estados</SelectItem>
              <SelectItem value="EN_PROCESO">En Proceso</SelectItem>
              <SelectItem value="FINALIZADA">Finalizada</SelectItem>
              <SelectItem value="CANCELADA">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="card-industrial bg-white p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && workOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p>No se encontraron órdenes de trabajo.</p>
          </div>
        )}

        {!isLoading && workOrders.length > 0 && (
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">OT#</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Vehículo</TableHead>
                  <TableHead className="font-semibold">Mecánico</TableHead>
                  <TableHead className="font-semibold">Fecha</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="font-semibold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((workOrder) => (
                  <WorkOrderRow key={workOrder.id} workOrder={workOrder} />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkOrderRow({ workOrder }: { workOrder: any }) {
  const { toast } = useToast();
  const deleteMutation = useDeleteWorkOrder();

  const handleDelete = () => {
    if (confirm(`¿Eliminar Orden de Trabajo #${workOrder.numero_orden_papel} (${workOrder.patente_vehiculo})?`)) {
      deleteMutation.mutate(workOrder.id, {
        onSuccess: () => {
          toast({
            title: "Orden Eliminada",
            description: "La orden de trabajo ha sido eliminada.",
          });
        },
        onError: () => {
          toast({
            title: "Error",
            description: "No se pudo eliminar la orden de trabajo.",
            variant: "destructive",
          });
        },
      });
    }
  };

  return (
    <TableRow className="hover:bg-slate-50/50 transition-colors">
      <TableCell className="font-semibold text-primary">
        #{workOrder.numero_orden_papel || "N/A"}
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{workOrder.cliente?.nombre || "Sin cliente"}</p>
          {workOrder.cliente?.rut && (
            <p className="text-xs text-muted-foreground">{workOrder.cliente.rut}</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <p className="font-medium">{workOrder.patente_vehiculo || "Sin patente"}</p>
          {workOrder.vehiculo && (
            <p className="text-xs text-muted-foreground">
              {workOrder.vehiculo.marca} {workOrder.vehiculo.modelo}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell>
        {workOrder.mecanico_asignado?.nombre || workOrder.realizado_por || "Sin asignar"}
      </TableCell>
      <TableCell>
        {workOrder.fecha_ingreso 
          ? new Date(workOrder.fecha_ingreso).toLocaleDateString('es-CL')
          : "Sin fecha"
        }
      </TableCell>
      <TableCell>
        <StatusBadge status={workOrder.estado} />
      </TableCell>
      <TableCell className="text-right font-mono font-semibold">
        ${(workOrder.total_cobrado || 0).toLocaleString('es-CL')}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
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
  );
}

// Dialog para crear órdenes de trabajo
function CreateWorkOrderDialog() {
  const [open, setOpen] = useState(false);
  const { mutate: createWorkOrder, isPending } = useCreateWorkOrder();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      numero_orden_papel: 0,
      cliente_rut: "",
      cliente_nombre: "",
      cliente_telefono: "",
      vehiculo_patente: "",
      vehiculo_marca: "",
      vehiculo_modelo: "",
      vehiculo_anio: 2024,
      vehiculo_km: 0,
      items: [] as any[],
    },
  });

  const [services, setServices] = useState({
    cambioPastillas: { checked: false, precio: 0, descripcion: "" },
    cambioBalatas: { checked: false, precio: 0, descripcion: "" },
    cambioLiquido: { checked: false, precio: 0, descripcion: "" },
    cambioGomas: { checked: false, precio: 0, descripcion: "" },
    rectificado: { checked: false, precio: 0, descripcion: "" },
    sangrado: { checked: false, precio: 0, descripcion: "" },
    cambioPiola: { checked: false, precio: 0, descripcion: "" },
    revision: { checked: false, precio: 0, descripcion: "" },
    otros: { checked: false, precio: 0, descripcion: "" },
  });

  const calcularTotal = () => {
    return Object.values(services).reduce((total, service) => {
      return service.checked ? total + (service.precio || 0) : total;
    }, 0);
  };

  const onSubmit = (data: any) => {
    // Convertir los servicios seleccionados a items
    const items = Object.entries(services)
      .filter(([_, service]) => service.checked)
      .map(([key, service]) => ({
        servicio_nombre: key === 'cambioPastillas' ? 'Cambio Pastillas' :
                        key === 'cambioBalatas' ? 'Cambio Balatas' :
                        key === 'cambioLiquido' ? 'Cambio Líquido' :
                        key === 'cambioGomas' ? 'Cambio Gomas' :
                        key === 'rectificado' ? 'Rectificado' :
                        key === 'sangrado' ? 'Sangrado' :
                        key === 'cambioPiola' ? 'Cambio Piola' :
                        key === 'revision' ? 'Revisión' :
                        'Otros',
        descripcion: service.descripcion || '',
        precio: service.precio,
      }));

    const payload: CreateWorkOrderDTO = {
      numero_orden_papel: data.numero_orden_papel,
      cliente_rut: data.cliente_rut,
      cliente_nombre: data.cliente_nombre,
      cliente_telefono: data.cliente_telefono,
      vehiculo_patente: data.vehiculo_patente,
      vehiculo_marca: data.vehiculo_marca,
      vehiculo_modelo: data.vehiculo_modelo,
      vehiculo_anio: data.vehiculo_anio,
      vehiculo_km: data.vehiculo_km,
      items,
    };

    createWorkOrder(payload, {
      onSuccess: () => {
        toast({
          title: "Orden Creada",
          description: "La orden de trabajo ha sido creada exitosamente.",
        });
        setOpen(false);
        form.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear la orden de trabajo.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva Orden
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Orden de Trabajo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Número de Orden */}
            <FormField
              control={form.control}
              name="numero_orden_papel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Orden</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1001" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Información del Cliente */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Datos del Cliente
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliente_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cliente_rut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RUT</FormLabel>
                      <FormControl>
                        <Input placeholder="12.345.678-9" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="cliente_telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+56 9 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Información del Vehículo */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Datos del Vehículo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehiculo_patente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Patente</FormLabel>
                      <FormControl>
                        <Input placeholder="AB-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehiculo_km"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilometraje</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="50000" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vehiculo_marca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Toyota" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehiculo_modelo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo</FormLabel>
                      <FormControl>
                        <Input placeholder="Corolla" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Servicios */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Servicios a Realizar
              </h3>
              <div className="space-y-3">
                {[
                  { key: 'cambioPastillas', label: 'Cambio Pastillas' },
                  { key: 'cambioBalatas', label: 'Cambio Balatas' },
                  { key: 'cambioLiquido', label: 'Cambio Líquido' },
                  { key: 'cambioGomas', label: 'Cambio Gomas' },
                  { key: 'rectificado', label: 'Rectificado' },
                  { key: 'sangrado', label: 'Sangrado' },
                  { key: 'cambioPiola', label: 'Cambio Piola' },
                  { key: 'revision', label: 'Revisión' },
                  { key: 'otros', label: 'Otros' },
                ].map(({ key, label }) => (
                  <div key={key} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={services[key as keyof typeof services].checked}
                        onCheckedChange={(checked) => 
                          setServices(prev => ({
                            ...prev,
                            [key]: { ...prev[key as keyof typeof prev], checked: !!checked }
                          }))
                        }
                      />
                      <label className="flex-1 cursor-pointer font-medium">
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="text"
                          placeholder="0"
                          className="w-32 text-right"
                          disabled={!services[key as keyof typeof services].checked}
                          value={
                            services[key as keyof typeof services].precio 
                              ? services[key as keyof typeof services].precio.toLocaleString('es-CL')
                              : ''
                          }
                          onChange={(e) => {
                            const value = e.target.value.replace(/\./g, '');
                            const numValue = parseInt(value) || 0;
                            setServices(prev => ({
                              ...prev,
                              [key]: { ...prev[key as keyof typeof prev], precio: numValue }
                            }))
                          }}
                        />
                      </div>
                    </div>
                    {services[key as keyof typeof services].checked && (
                      <Input
                        placeholder="Descripción del servicio (opcional)..."
                        className="text-sm"
                        value={services[key as keyof typeof services].descripcion || ''}
                        onChange={(e) => 
                          setServices(prev => ({
                            ...prev,
                            [key]: { ...prev[key as keyof typeof prev], descripcion: e.target.value }
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>TOTAL</span>
                <span className="text-primary">${calcularTotal().toLocaleString('es-CL')}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  "Crear Orden"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
