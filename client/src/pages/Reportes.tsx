import { useState } from "react";
import { useLocation } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLowStockReport, useDailyCashReport, useGlobalSearch } from "@/hooks/use-reports";
import { Package, ShoppingCart, Wrench, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Search as SearchIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function Reportes() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  
  const { data: lowStockReport, isLoading: loadingStock } = useLowStockReport();
  const { data: cashReport, isLoading: loadingCash } = useDailyCashReport();
  const { data: searchResults } = useGlobalSearch(searchQuery);

  const lowStockProducts = lowStockReport?.productos || [];
  const totalProductos = lowStockReport?.total_alertas || 0;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reportes" 
        description="Reportes de stock bajo y caja diaria"
      />

      {/* Buscador Global */}
      <div className="card-industrial bg-white p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">Buscador Global</h3>
        </div>
        
        <div className="relative">
          {!searchFocused && !searchQuery && (
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          )}
          <Input 
            placeholder=""
            className="bg-slate-50 border-slate-200 rounded-lg h-14 text-base pl-14 focus:bg-white focus:border-primary transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
        
        {searchQuery.length >= 2 && searchResults && searchResults.total_resultados > 0 && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Se encontraron <strong>{searchResults.total_resultados}</strong> resultados</span>
            </div>

            <div className="grid gap-4 max-h-96 overflow-y-auto pr-2">
              {searchResults.clientes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <SearchIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="font-semibold text-slate-900">Clientes ({searchResults.clientes.length})</p>
                  </div>
                  {searchResults.clientes.map(cliente => (
                    <div key={cliente.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{cliente.nombre}</p>
                          <p className="text-sm text-slate-600 mt-1">RUT: {cliente.rut}</p>
                          {cliente.telefono && (
                            <p className="text-sm text-slate-600">Tel: {cliente.telefono}</p>
                          )}
                        </div>
                        {cliente.cantidad_ordenes && cliente.cantidad_ordenes > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {cliente.cantidad_ordenes} {cliente.cantidad_ordenes === 1 ? 'orden' : 'órdenes'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchResults.vehiculos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Package className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="font-semibold text-slate-900">Vehículos ({searchResults.vehiculos.length})</p>
                  </div>
                  {searchResults.vehiculos.map(vehiculo => (
                    <div key={vehiculo.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-green-50 hover:border-green-300 transition-all cursor-pointer">
                      <p className="font-mono font-bold text-lg text-slate-900">{vehiculo.patente}</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {vehiculo.marca} {vehiculo.modelo}{vehiculo.anio ? ` • Año ${vehiculo.anio}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              
              {searchResults.ordenes_recientes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="font-semibold text-slate-900">Órdenes de Trabajo ({searchResults.ordenes_recientes.length})</p>
                  </div>
                  {searchResults.ordenes_recientes.map(orden => {
                    const numeroOrden = orden.numero_orden_papel || orden.numero_orden || 0;
                    const total = orden.total_cobrado || orden.total || 0;
                    return (
                      <div key={orden.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">OT #{numeroOrden}</p>
                            <p className="text-sm text-slate-600 mt-1">{orden.cliente_nombre}</p>
                            <p className="text-sm text-slate-600">Patente: {orden.patente}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">${total.toLocaleString('es-CL')}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {new Date(orden.fecha).toLocaleDateString('es-CL')}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        
        {searchQuery.length >= 2 && searchResults && searchResults.total_resultados === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <AlertTriangle className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">No se encontraron resultados para "{searchQuery}"</p>
            <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
          </div>
        )}

        {searchQuery.length === 1 && (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Escribe al menos 2 caracteres para buscar</span>
          </div>
        )}
      </div>

      {/* Alertas de Stock Bajo */}
      {loadingStock ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Cargando alertas de stock...</span>
            </div>
          </CardContent>
        </Card>
      ) : lowStockProducts.length > 0 ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-bold">⚠️ Alerta de Stock Bajo</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{lowStockProducts.length} producto(s) requieren reposición:</p>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <Badge key={product.id} variant="destructive" className="font-mono">
                  {product.sku} - {product.stock_actual}/{product.stock_minimo} u.
                </Badge>
              ))}
              {lowStockProducts.length > 5 && (
                <Badge variant="outline">+{lowStockProducts.length - 5} más</Badge>
              )}
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Cards de Caja Diaria */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taller (Hoy)</CardTitle>
            <Wrench className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {loadingCash ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${(cashReport?.total_taller || 0).toLocaleString('es-CL')}</div>
                <p className="text-xs text-muted-foreground">
                  {cashReport?.cantidad_ordenes || 0} órdenes
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mesón (Hoy)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loadingCash ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${(cashReport?.total_meson || 0).toLocaleString('es-CL')}</div>
                <p className="text-xs text-muted-foreground">
                  {cashReport?.cantidad_ventas_meson || 0} ventas
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Día</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {loadingCash ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${(cashReport?.total_final || 0).toLocaleString('es-CL')}</div>
                <p className="text-xs text-muted-foreground">
                  {cashReport?.fecha ? new Date(cashReport.fecha).toLocaleDateString('es-CL') : 'Hoy'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loadingStock ? (
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{lowStockReport?.total_alertas || 0}</div>
                <p className="text-xs text-muted-foreground">
                  productos
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setLocation('/work-orders')}
            >
              <Wrench className="w-6 h-6" />
              <span className="font-semibold">Nueva Orden de Trabajo</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex-col gap-2"
              onClick={() => setLocation('/inventory')}
            >
              <Package className="w-6 h-6" />
              <span className="font-semibold">Ver Inventario</span>
            </Button>
            
            {user?.role === 'ADMIN' || user?.role === 'administrador' ? (
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col gap-2"
                onClick={() => setLocation('/purchases')}
              >
                <ShoppingCart className="w-6 h-6" />
                <span className="font-semibold">Registrar Compra</span>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
