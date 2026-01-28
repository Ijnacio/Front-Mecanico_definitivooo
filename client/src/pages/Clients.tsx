import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, User, Car, Phone, FileText, Mail, MapPin, Calendar, DollarSign, Wrench, ChevronRight } from "lucide-react";
import { useGlobalSearch } from "@/hooks/use-reports";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClienteDetalle {
  id: string;
  nombre: string;
  rut: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  cantidad_ordenes?: number;
}

export default function Clients() {
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClienteDetalle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Buscador global desde el backend
  const { data: searchResults, isLoading } = useGlobalSearch(search);

  const handleClientClick = (cliente: ClienteDetalle) => {
    setSelectedClient(cliente);
    setShowDetailModal(true);
  };

  // Filtrar órdenes del cliente seleccionado
  const ordenesDelCliente = selectedClient 
    ? searchResults?.ordenes_recientes?.filter(
        orden => orden.cliente_nombre?.toLowerCase().includes(selectedClient.nombre.toLowerCase())
      ) || []
    : [];

  const totalGastado = ordenesDelCliente.reduce((sum, orden) => {
    const total = orden.total_cobrado || orden.total || 0;
    return sum + total;
  }, 0);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Gestión de Clientes" 
        description="Búsqueda de clientes, vehículos y órdenes de trabajo."
      />

      <div className="card-industrial p-6 bg-white space-y-4">
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

        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Buscando...
          </div>
        )}

        {!isLoading && search && searchResults && (
          <div className="space-y-6">
            {/* Clientes encontrados */}
            {searchResults.clientes && searchResults.clientes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Clientes ({searchResults.clientes.length})
                </h3>
                <div className="grid gap-3">
                  {searchResults.clientes.map((cliente) => (
                    <div 
                      key={cliente.id} 
                      className="p-4 border border-slate-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group"
                      onClick={() => handleClientClick(cliente)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1 flex-1">
                          <p className="font-semibold text-foreground flex items-center gap-2">
                            {cliente.nombre}
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {cliente.rut}
                            </span>
                            {cliente.telefono && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {cliente.telefono}
                              </span>
                            )}
                            {cliente.cantidad_ordenes && cliente.cantidad_ordenes > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {cliente.cantidad_ordenes} {cliente.cantidad_ordenes === 1 ? 'orden' : 'órdenes'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vehículos encontrados */}
            {searchResults.vehiculos && searchResults.vehiculos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  Vehículos ({searchResults.vehiculos.length})
                </h3>
                <div className="grid gap-3">
                  {searchResults.vehiculos.map((vehiculo, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 border border-slate-200 rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{vehiculo.patente}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{vehiculo.marca} {vehiculo.modelo}</span>
                            <span className="text-xs">Año {vehiculo.anio}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Órdenes recientes */}
            {searchResults.ordenes_recientes && searchResults.ordenes_recientes.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Órdenes de Trabajo Recientes ({searchResults.ordenes_recientes.length})
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OT#</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Vehículo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.ordenes_recientes.map((orden) => (
                      <TableRow key={orden.id}>
                        <TableCell className="font-medium">#{orden.numero_orden}</TableCell>
                        <TableCell>{orden.cliente_nombre}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            {orden.patente}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(orden.fecha).toLocaleDateString('es-CL')}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              orden.estado === "FINALIZADA" ? "default" :
                              orden.estado === "EN_PROCESO" ? "secondary" :
                              "destructive"
                            }
                          >
                            {orden.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${orden.total?.toLocaleString('es-CL') || '0'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* No hay resultados */}
            {(!searchResults.clientes || searchResults.clientes.length === 0) &&
             (!searchResults.vehiculos || searchResults.vehiculos.length === 0) &&
             (!searchResults.ordenes_recientes || searchResults.ordenes_recientes.length === 0) && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No se encontraron resultados para "{search}"</p>
              </div>
            )}
          </div>
        )}

        {!search && !isLoading && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <p className="text-lg font-semibold text-foreground mb-1">Buscar Clientes y Vehículos</p>
            <p className="text-muted-foreground text-sm">
              Ingresa un nombre, RUT, patente o información del vehículo para comenzar
            </p>
          </div>
        )}
      </div>

      {/* Modal de Detalle del Cliente */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Información del Cliente</DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6">
              {/* Información Personal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Datos Personales
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre Completo</p>
                    <p className="font-semibold text-lg">{selectedClient.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RUT</p>
                    <p className="font-semibold">{selectedClient.rut}</p>
                  </div>
                  {selectedClient.telefono && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        Teléfono
                      </p>
                      <p className="font-semibold">{selectedClient.telefono}</p>
                    </div>
                  )}
                  {selectedClient.email && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </p>
                      <p className="font-semibold">{selectedClient.email}</p>
                    </div>
                  )}
                  {selectedClient.direccion && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Dirección
                      </p>
                      <p className="font-semibold">{selectedClient.direccion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estadísticas */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Órdenes</p>
                        <p className="text-2xl font-bold">{ordenesDelCliente.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Gastado</p>
                        <p className="text-2xl font-bold">${totalGastado.toLocaleString('es-CL')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Promedio por OT</p>
                        <p className="text-2xl font-bold">
                          ${ordenesDelCliente.length > 0 
                            ? Math.round(totalGastado / ordenesDelCliente.length).toLocaleString('es-CL') 
                            : '0'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Historial de Órdenes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Historial de Órdenes de Trabajo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ordenesDelCliente.length > 0 ? (
                    <div className="space-y-3">
                      {ordenesDelCliente.map((orden) => {
                        const numeroOrden = orden.numero_orden_papel || orden.numero_orden || 0;
                        const total = orden.total_cobrado || orden.total || 0;
                        return (
                          <div key={orden.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-lg">OT #{numeroOrden}</p>
                                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                  <Car className="w-4 h-4" />
                                  {orden.patente}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-xl text-primary">${total.toLocaleString('es-CL')}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(orden.fecha).toLocaleDateString('es-CL')}
                                </p>
                              </div>
                            </div>
                            {orden.estado && (
                              <Badge 
                                variant={
                                  orden.estado === "FINALIZADA" ? "default" :
                                  orden.estado === "EN_PROCESO" ? "secondary" :
                                  "outline"
                                }
                              >
                                {orden.estado}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No hay órdenes registradas para este cliente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
