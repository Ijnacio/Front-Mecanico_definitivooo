import { Client } from "@/hooks/use-clients";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, ArrowUpDown } from "lucide-react";
import { formatPhoneCL, formatRutCL } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ClienteDetalle = Client & {
  total_compras: number;
  ultima_visita: string;
};

export const createColumns = (
  onEdit: (client: ClienteDetalle) => void,
  onViewHistory: (client: ClienteDetalle) => void
): ColumnDef<ClienteDetalle>[] => [
  {
    accessorKey: "nombre",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-transparent"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium text-slate-900">
        {row.original.nombre}
      </div>
    ),
  },
  {
    accessorKey: "rut",
    header: "RUT",
    cell: ({ row }) => (
      <div className="text-slate-700 font-mono">
        {formatRutCL(row.original.rut)}
      </div>
    ),
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
    cell: ({ row }) => (
      <div className="text-slate-700 font-mono text-sm">
        {row.original.telefono ? formatPhoneCL(row.original.telefono) : "-"}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="text-slate-700">{row.original.email || "-"}</div>,
  },
  {
    accessorKey: "total_compras",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 hover:bg-transparent"
        >
          Total Compras
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const amount = row.original.total_compras;
      return (
        <div className="font-semibold text-slate-900">
          ${amount.toLocaleString('es-CL')}
        </div>
      );
    },
  },
  {
    accessorKey: "ultima_visita",
    header: "Última Visita",
    cell: ({ row }) => {
      const date = row.original.ultima_visita ? new Date(row.original.ultima_visita) : null;
      return <div className="text-slate-700">{date ? date.toLocaleDateString("es-CL") : "-"}</div>;
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const client = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewHistory(client)}>
              <Eye className="mr-2 h-4 w-4" />
              Ver Historial
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(client)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];