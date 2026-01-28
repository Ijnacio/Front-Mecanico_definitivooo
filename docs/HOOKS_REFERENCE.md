# 📚 Hooks Disponibles - Frontend Frenos Aguilera

## 🔐 Autenticación

### `use-auth.ts`
```typescript
import { useAuth } from '@/hooks/use-auth';

const { 
  user,              // Usuario actual
  isLoading,         // Cargando usuario
  isAuthenticated,   // Si está autenticado
  isAdmin,           // Si es ADMIN
  isWorker,          // Si es WORKER o ADMIN
  login,             // Función de login
  logout,            // Función de logout
  loginError,        // Error de login
  isLoggingIn        // Estado de login
} = useAuth();

// Login
login({ rut: "11.111.111-1", password: "admin123" });
```

## 🏷️ Categorías

### `use-categories.ts`
```typescript
import { 
  useCategories, 
  useCreateCategory, 
  useUpdateCategory, 
  useDeleteCategory 
} from '@/hooks/use-categories';

// Listar categorías
const { data: categories, isLoading } = useCategories();

// Crear categoría
const createCategory = useCreateCategory();
createCategory.mutate({
  nombre: "Frenos",
  descripcion: "Pastillas, discos, líquido"
});

// Actualizar categoría
const updateCategory = useUpdateCategory();
updateCategory.mutate({
  id: "uuid",
  nombre: "Frenos Avanzados"
});

// Eliminar categoría
const deleteCategory = useDeleteCategory();
deleteCategory.mutate("uuid");
```

## 📦 Productos

### `use-products.ts`
```typescript
import { 
  useProducts, 
  useCreateProduct, 
  useUpdateProduct,
  useDeleteProduct 
} from '@/hooks/use-products';

// Listar productos (con búsqueda opcional)
const { data: products, isLoading } = useProducts("busqueda");

// Crear producto
const createProduct = useCreateProduct();
createProduct.mutate({
  sku: "F-001",
  nombre: "Pastilla Delantera",
  marca: "Bosch",
  calidad: "Cerámica",
  precio_venta: 28000,
  stock_actual: 10,
  stock_minimo: 5,
  categoria_id: "uuid",
  modelos_compatibles_ids: ["uuid1", "uuid2"]
});

// Actualizar producto
const updateProduct = useUpdateProduct();
updateProduct.mutate({
  id: "uuid",
  precio_venta: 30000
});

// Eliminar producto
const deleteProduct = useDeleteProduct();
deleteProduct.mutate("uuid");
```

## 🚗 Modelos de Vehículos (Compatibilidad)

### `use-vehicle-models.ts`
```typescript
import { 
  useVehicleModels,
  useSearchVehicleModels,
  useVehicleModelBrands,
  useVehicleModelsByBrand,
  useCreateVehicleModel,
  useUpdateVehicleModel,
  useDeleteVehicleModel
} from '@/hooks/use-vehicle-models';

// Listar todos los modelos
const { data: models } = useVehicleModels();

// Buscar modelos (autocompletado)
const { data: results } = useSearchVehicleModels("corolla");

// Listar marcas únicas
const { data: brands } = useVehicleModelBrands();
// ["Toyota", "Honda", "Chevrolet"]

// Obtener modelos de una marca
const { data: modelos } = useVehicleModelsByBrand("Toyota");
// ["Corolla", "Yaris", "Hilux"]

// Crear modelo
const createModel = useCreateVehicleModel();
createModel.mutate({
  marca: "Toyota",
  modelo: "Corolla",
  anio: 2020
});
```

## 🚙 Vehículos de Clientes

### `use-vehicles.ts`
```typescript
import { 
  useVehicles,
  useVehicle,
  useCreateVehicle,
  useUpdateVehicle,
  useDeleteVehicle
} from '@/hooks/use-vehicles';

// Listar vehículos
const { data: vehicles } = useVehicles();

// Obtener vehículo por ID
const { data: vehicle } = useVehicle("uuid");

// Crear vehículo
const createVehicle = useCreateVehicle();
createVehicle.mutate({
  patente: "ABCD12",
  marca: "Toyota",
  modelo: "Corolla",
  anio: 2020,
  color: "Blanco",
  cliente_id: "uuid-cliente"
});
```

## 👥 Clientes

### `use-clients.ts`
```typescript
import { useClients, useCreateClient } from '@/hooks/use-clients';

// Listar clientes
const { data: clients } = useClients();

// Crear cliente
const createClient = useCreateClient();
createClient.mutate({
  rut: "12.345.678-9",
  nombre: "Juan Pérez",
  telefono: "+56912345678",
  email: "juan@email.com",
  direccion: "Av. Principal 123"
});
```

## 🏢 Proveedores (Solo ADMIN)

### `use-providers.ts`
```typescript
import { 
  useProviders,
  useProvider,
  useCreateProvider,
  useUpdateProvider,
  useDeleteProvider
} from '@/hooks/use-providers';

// Listar proveedores
const { data: providers } = useProviders();

// Obtener proveedor
const { data: provider } = useProvider("uuid");

// Crear proveedor
const createProvider = useCreateProvider();
createProvider.mutate({
  nombre: "Distribuidora Frenos SpA",
  rut: "76.123.456-7",
  direccion: "Av. Industrial 456",
  telefono: "+56222334455",
  email: "ventas@distribuidora.cl"
});
```

## 🛒 Compras (Solo ADMIN)

### `use-purchases.ts`
```typescript
import { 
  usePurchases,
  useCreatePurchase,
  useDeletePurchase
} from '@/hooks/use-purchases';

// Listar compras
const { data: purchases } = usePurchases();

// Crear compra (crea productos si no existen)
const createPurchase = useCreatePurchase();
createPurchase.mutate({
  proveedor_id: "uuid",
  numero_factura: "FAC-2026-001",
  items: [{
    sku: "F-001",
    nombre: "Pastilla Bosch",
    cantidad: 20,
    precio_unitario: 15000,
    modelos_compatibles_ids: ["uuid1", "uuid2"]
  }]
});

// Eliminar compra (revierte stock)
const deletePurchase = useDeletePurchase();
deletePurchase.mutate("uuid");
```

## 📋 Órdenes de Trabajo

### `use-work-orders.ts`
```typescript
import { 
  useWorkOrders,
  useServicesCatalog,
  useCreateWorkOrder,
  useUpdateWorkOrder,
  useDeleteWorkOrder
} from '@/hooks/use-work-orders';

// Listar órdenes
const { data: orders } = useWorkOrders();

// Catálogo de servicios
const { data: services } = useServicesCatalog();
// ["Cambio Pastillas", "Cambio Discos", "Rectificado", ...]

// Crear orden (crea/actualiza cliente y vehículo automáticamente)
const createOrder = useCreateWorkOrder();
createOrder.mutate({
  numero_orden_papel: 1547,
  cliente_rut: "12.345.678-9",
  cliente_nombre: "Juan Pérez",
  cliente_telefono: "+56912345678",
  vehiculo_patente: "ABCD12",
  vehiculo_marca: "Toyota",
  vehiculo_modelo: "Corolla",
  vehiculo_anio: 2020,
  vehiculo_km: 85000,
  items: [{
    servicio_nombre: "Cambio Pastillas",
    descripcion: "Cambio pastillas delanteras Bosch",
    precio: 45000,
    product_sku: "F-001",
    product_cantidad: 1
  }]
});
```

## 💰 Ventas Mostrador / Movimientos

### `use-counter-sales.ts`
```typescript
import { useCounterSales, useCreateCounterSale } from '@/hooks/use-counter-sales';

// Listar ventas (con filtro opcional)
const { data: sales } = useCounterSales(); // Todas
const { data: ventas } = useCounterSales("VENTA"); // Solo ventas
const { data: perdidas } = useCounterSales("PERDIDA"); // Solo pérdidas
const { data: usoInterno } = useCounterSales("USO_INTERNO"); // Solo uso interno

// Crear venta de mostrador
const createSale = useCreateCounterSale();
createSale.mutate({
  tipo_movimiento: "VENTA",
  comprador: "Juan Pérez (walk-in)",
  comentario: "Cliente compró sin instalación",
  items: [{
    sku: "F-001",
    cantidad: 2,
    precio_venta: 28000
  }]
});

// Registrar pérdida
createSale.mutate({
  tipo_movimiento: "PERDIDA",
  comentario: "Producto dañado",
  items: [{
    sku: "F-002",
    cantidad: 1
  }]
});
```

## 📊 Reportes

### `use-reports.ts`
```typescript
import { 
  useLowStockReport,
  useDailyCashReport,
  useGlobalSearch
} from '@/hooks/use-reports';

// Reporte de stock bajo
const { data: lowStock } = useLowStockReport();
// {
//   total_alertas: 2,
//   fecha_consulta: "2026-01-24...",
//   productos: [...]
// }

// Reporte de caja diaria (hoy)
const { data: cashToday } = useDailyCashReport();

// Reporte de caja específica
const { data: cashDate } = useDailyCashReport("2026-01-24");
// {
//   fecha: "2026-01-24",
//   total_taller: 350000,
//   cantidad_ordenes: 5,
//   total_meson: 85000,
//   cantidad_ventas_meson: 3,
//   total_final: 435000
// }

// Búsqueda global
const { data: results } = useGlobalSearch("Juan");
// {
//   busqueda: "Juan",
//   total_resultados: 5,
//   clientes: [...],
//   vehiculos: [...],
//   ordenes_recientes: [...]
// }
```

## 💡 Ejemplo de Uso en Componentes

```typescript
import { useProducts, useCreateProduct } from '@/hooks/use-products';
import { useCategories } from '@/hooks/use-categories';

function ProductsPage() {
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();

  if (isLoading) return <div>Cargando...</div>;

  const handleCreate = () => {
    createProduct.mutate({
      sku: "F-003",
      nombre: "Disco Ventilado",
      precio_venta: 45000,
      categoria_id: categories[0].id
    }, {
      onSuccess: () => {
        alert("Producto creado!");
      },
      onError: (error) => {
        alert(error.message);
      }
    });
  };

  return (
    <div>
      <button onClick={handleCreate}>Crear Producto</button>
      {products.map(p => (
        <div key={p.id}>{p.nombre} - ${p.precio_venta}</div>
      ))}
    </div>
  );
}
```

## 🔑 Notas Importantes

1. Todos los hooks usan autenticación Bearer Token automáticamente
2. Si el token expira (401), el usuario es redirigido al login
3. Las mutaciones invalidan automáticamente las queries relacionadas
4. Los hooks manejan estados de loading y error
5. Uso de TanStack Query para caché y sincronización
