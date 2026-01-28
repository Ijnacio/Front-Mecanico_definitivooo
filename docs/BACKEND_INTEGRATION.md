# Conexión Frontend-Backend - Frenos Aguilera

## ✅ Integración Completada

Este frontend está listo para conectarse con el backend NestJS desarrollado por tu amigo.

### 🔑 Cambios Principales Implementados

#### 1. Autenticación con JWT (Bearer Token)

- ✅ El login ahora guarda el `access_token` en `localStorage`
- ✅ Todas las peticiones incluyen header: `Authorization: Bearer [token]`
- ✅ El token se obtiene de la respuesta: `{ access_token: "...", user: {...} }`
- ✅ Si el token expira, se elimina y redirige al login

#### 2. Hooks Nuevos Creados

- ✅ `use-categories.ts` - CRUD de categorías
- ✅ `use-vehicle-models.ts` - Modelos de vehículos (compatibilidad)
- ✅ `use-vehicles.ts` - Vehículos de clientes (con patente)
- ✅ `use-clients.ts` - Gestión de clientes
- ✅ `use-providers.ts` - Proveedores (solo ADMIN)

#### 3. Hooks Actualizados

- ✅ `use-auth.ts` - Ahora usa Bearer token en localStorage
- ✅ `use-products.ts` - Agregado soporte para `modelos_compatibles_ids`
- ✅ `use-purchases.ts` - DTO actualizado: `proveedor_id` + `items[]`
- ✅ `use-work-orders.ts` - DTO aplanado según documentación
- ✅ `use-counter-sales.ts` - Headers de autenticación
- ✅ `use-reports.ts` - Headers de autenticación

### 📋 Endpoints Implementados

Todos los endpoints están prefijados con `/api/`:

#### Autenticación
- `POST /api/auth/login` - Login con RUT y password
- `POST /api/auth/register` - Registro (solo ADMIN)
- `GET /api/auth/me` - Usuario actual

#### Categorías
- `GET /api/categories` - Listar
- `POST /api/categories` - Crear
- `PATCH /api/categories/:id` - Actualizar
- `DELETE /api/categories/:id` - Eliminar

#### Productos
- `GET /api/products` - Listar
- `GET /api/products/:id` - Obtener uno (con modelos compatibles)
- `POST /api/products` - Crear
- `PATCH /api/products/:id` - Actualizar
- `DELETE /api/products/:id` - Eliminar

#### Modelos de Vehículos (Compatibilidad)
- `GET /api/vehicle-models` - Listar todos
- `GET /api/vehicle-models/search?q=` - Buscar (autocompletado)
- `GET /api/vehicle-models/marcas` - Listar marcas únicas
- `GET /api/vehicle-models/marcas/:marca/modelos` - Modelos de una marca
- `POST /api/vehicle-models` - Crear (ADMIN)
- `PATCH /api/vehicle-models/:id` - Actualizar (ADMIN)
- `DELETE /api/vehicle-models/:id` - Eliminar (ADMIN)

#### Vehículos de Clientes
- `GET /api/vehicles` - Listar
- `GET /api/vehicles/:id` - Obtener uno
- `POST /api/vehicles` - Crear
- `PATCH /api/vehicles/:id` - Actualizar
- `DELETE /api/vehicles/:id` - Eliminar

#### Clientes
- `GET /api/clients` - Listar
- `POST /api/clients` - Crear

#### Proveedores (Solo ADMIN)
- `GET /api/providers` - Listar
- `GET /api/providers/:id` - Obtener uno
- `POST /api/providers` - Crear
- `PATCH /api/providers/:id` - Actualizar
- `DELETE /api/providers/:id` - Eliminar

#### Compras (Solo ADMIN)
- `GET /api/purchases` - Listar
- `POST /api/purchases` - Crear (actualiza/crea productos automáticamente)
- `DELETE /api/purchases/:id` - Eliminar (revierte stock)

#### Órdenes de Trabajo
- `GET /api/work-orders` - Listar
- `GET /api/work-orders/services-catalog` - Catálogo de servicios
- `POST /api/work-orders` - Crear (crea/actualiza cliente y vehículo automáticamente)

#### Ventas Mostrador / Movimientos
- `GET /api/counter-sales` - Listar
- `GET /api/counter-sales?tipo=VENTA` - Filtrar por tipo
- `POST /api/counter-sales` - Crear (VENTA, PERDIDA, USO_INTERNO)

#### Reportes
- `GET /api/reports/low-stock` - Productos con stock bajo
- `GET /api/reports/daily-cash` - Caja diaria
- `GET /api/reports/daily-cash?fecha=YYYY-MM-DD` - Caja fecha específica
- `GET /api/reports/search?q=` - Búsqueda global

### 🔄 DTOs Actualizados

#### CreatePurchaseDTO (Compras)
```typescript
{
  proveedor_id: string;          // ID del proveedor
  numero_factura?: string;       // Opcional
  items: [{
    sku: string;                 // Si existe: suma stock, si no: crea producto
    nombre: string;
    cantidad: number;
    precio_unitario: number;
    modelos_compatibles_ids?: string[];  // IDs de VehicleModels
  }]
}
```

#### CreateWorkOrderDTO (Órdenes de Trabajo)
```typescript
{
  numero_orden_papel: number;
  cliente_rut: string;           // Si existe: reutiliza, si no: crea
  cliente_nombre: string;
  cliente_telefono?: string;
  vehiculo_patente: string;      // Si existe: reutiliza, si no: crea
  vehiculo_marca: string;
  vehiculo_modelo: string;
  vehiculo_anio?: number;
  vehiculo_km?: number;
  items: [{
    servicio_nombre: string;     // De catálogo o "Otros"
    descripcion?: string;
    precio: number;
    product_sku?: string;        // Si presente: descuenta stock
    product_cantidad?: number;
  }]
}
```

### 🚀 Próximos Pasos

1. **Conectar el Backend**
   - El backend debe estar corriendo en el mismo dominio o configurar CORS
   - Si está en diferente puerto, configurar proxy en `vite.config.ts`

2. **Verificar Endpoints**
   - Probar login: `POST /api/auth/login`
   - Verificar que todos los endpoints respondan correctamente

3. **Seed de Datos Iniciales**
   - Usuario admin: RUT `11.111.111-1`, password `admin123`, role `ADMIN`
   - Crear categorías iniciales
   - Crear modelos de vehículos para compatibilidad

### 🔧 Configuración de Proxy (si es necesario)

Si el backend está en `http://localhost:3000`, agrega esto en `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
});
```

### 📝 Notas Importantes

- **Roles**: El backend usa `ADMIN` y `WORKER` (no `administrador`/`mecanico`)
- **RUT**: El backend normaliza automáticamente (acepta con o sin puntos/guiones)
- **Token**: Expira en 8 horas según documentación
- **Modelos**: Diferencia entre `VehicleModel` (genérico) y `Vehicle` (con patente)

### 🎯 Funcionalidades Listas

- ✅ Login con JWT
- ✅ Gestión de productos con categorías
- ✅ Modelos de vehículos para compatibilidad
- ✅ Compras a proveedores (ADMIN)
- ✅ Órdenes de trabajo con cliente/vehículo automático
- ✅ Ventas de mostrador
- ✅ Reportes (stock bajo, caja diaria, búsqueda global)
- ✅ Protección por roles (ADMIN/WORKER)

### 📞 Soporte

Si hay diferencias entre el backend y estos DTOs, puedes ajustar los hooks en:
- `client/src/hooks/use-*.ts`

Todos los hooks tienen la misma estructura:
1. Helper `getAuthToken()` para obtener el token
2. Helper `getAuthHeaders()` para construir headers con Authorization
3. Fetch con headers de autenticación
