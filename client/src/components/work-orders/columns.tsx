import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Car, ArrowUpDown } from "lucide-react"
import { WorkOrder } from "@/hooks/use-work-orders"
import { formatRutCL } from "@/lib/utils"

export const createColumns = (
    onView: (wo: WorkOrder) => void
): ColumnDef<WorkOrder>[] => [
        {
            accessorKey: "numero_orden_papel",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-transparent"
                    >
                        N° Orden
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => <span className="font-mono font-bold">#{row.getValue("numero_orden_papel") || "S/N"}</span>,
        },
        {
            accessorKey: "cliente.nombre",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Cliente
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-900">{row.original.cliente?.nombre || "N/A"}</span>
                    <span className="text-xs text-slate-500 font-mono">{row.original.cliente?.rut ? formatRutCL(row.original.cliente.rut) : "Sin RUT"}</span>
                </div>
            ),
        },
        {
            id: "vehiculo",
            header: "Vehículo",
            cell: ({ row }) => {
                const wo = row.original as any;
                const v = wo.vehiculo || {};
                
                const marca = v.marca || "";
                const modelo = v.modelo || "";
                const patente = wo.patente_vehiculo || v.patente || "";
                const kilometraje = v.kilometraje || wo.kilometraje;

                return (
                    <div className="flex flex-col gap-0.5">
                        {patente && (
                            <span className="font-bold text-slate-800 font-mono text-xs flex items-center gap-1">
                                {patente}
                            </span>
                        )}
                        {(marca && marca !== "Sin Marca") || (modelo && modelo !== "Sin Modelo") ? (
                            <span className="text-xs text-slate-600 uppercase">
                                {marca} {modelo}
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400 italic flex items-center gap-1">
                                <Car className="w-3 h-3" />
                                Sin info
                            </span>
                        )}
                        {kilometraje > 0 && (
                            <span className="text-[10px] text-slate-500">
                                {kilometraje.toLocaleString('es-CL')} km
                            </span>
                        )}
                    </div>
                )
            }
        },
        {
            accessorKey: "fecha_ingreso",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Ingreso
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const date = new Date(row.getValue("fecha_ingreso"))
                return <span className="text-slate-600">{date.toLocaleDateString("es-CL")}</span>
            },
        },
        {
            accessorKey: "estado",
            header: "Estado",
            cell: ({ row }) => {
                const estado = row.getValue("estado") as string
                return (
                    <Badge variant={estado === "FINALIZADA" ? "default" : estado === "EN_PROCESO" ? "secondary" : "outline"}>
                        {estado}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "total_cobrado",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 hover:bg-transparent"
                    >
                        Total
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("total_cobrado") || "0")
                const formatted = new Intl.NumberFormat("es-CL", {
                    style: "currency",
                    currency: "CLP",
                }).format(amount)
                return <div className="font-bold text-slate-700">{formatted}</div>
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const wo = row.original

                return (
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onView(wo)}
                        className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalle
                    </Button>
                )
            },
        },
    ]