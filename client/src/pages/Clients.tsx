import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createColumns, ClienteDetalle } from "@/components/clients/columns";
import { Search, Loader2, RefreshCcw, ChevronDown, Plus, UserPlus } from "lucide-react";
import { useClients, useDeleteClient, useCreateClient } from "@/hooks/use-clients";
import { useWorkOrders } from "@/hooks/use-work-orders";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const deleteClientMutation = useDeleteClient();
  const { toast } = useToast();
  
  const [searchValue, setSearchValue] = useState("");
  const [clientToDelete, setClientToDelete] = useState<ClienteDetalle | null>(null);
  
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
    toast({ title: "Editar cliente no implementado aún" });
  };

  const columns = useMemo(() => createColumns(
    handleEdit,
    (c) => setClientToDelete(c)
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

      <AlertDialog open={!!clientToDelete} onOpenChange={(o) => !o && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al cliente {clientToDelete?.nombre}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => clientToDelete && deleteClientMutation.mutate(clientToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
    defaultValues: { nombre: "", rut: "", telefono: "+569", email: "" }
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