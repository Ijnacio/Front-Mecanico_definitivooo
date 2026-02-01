# 🔧 BACKEND CONTEXTO DEFINITIVO - Taller Mecánico "Frenos Aguilera"

> **Versión:** 1.0.0  
> **Stack:** NestJS 11 + TypeORM + PostgreSQL  
> **Fecha Auditoría:** Febrero 2026  
> **Base URL Producción:** `http://tu-servidor:3000/api`  
> **Documentación Swagger:** `/docs`

---

## 📋 ÍNDICE

1. [Arquitectura General](#1-arquitectura-general)
2. [Autenticación y Roles](#2-autenticación-y-roles)
3. [Endpoints por Módulo](#3-endpoints-por-módulo)
4. [Contratos de Datos (DTOs)](#4-contratos-de-datos-dtos)
5. [Lógica de Impuestos (IVA)](#5-lógica-de-impuestos-iva)
6. [Relaciones de Vehículos y Productos](#6-relaciones-de-vehículos-y-productos)
7. [Códigos de Error](#7-códigos-de-error)
8. [Auditoría de Lógica de Negocio](#8-auditoría-de-lógica-de-negocio)
9. [Sugerencias de Optimización](#9-sugerencias-de-optimización)

---

## 1. ARQUITECTURA GENERAL

### Stack Tecnológico
- **Framework:** NestJS 11
- **ORM:** TypeORM
- **Base de Datos:** PostgreSQL (producción) / SQLite (desarrollo)
- **Autenticación:** JWT con bcrypt
- **Documentación:** Swagger/OpenAPI

### Módulos del Sistema
```
├── auth/          # Login, JWT, Guards
├── users/         # Gestión de usuarios (ADMIN/WORKER)
├── products/      # Inventario de repuestos
├── categories/    # Categorías de productos
├── clients/       # Clientes del taller
├── vehicles/      # Vehículos de clientes (con patente)
├── vehicle-models/# Modelos genéricos (para compatibilidad)
├── providers/     # Proveedores de repuestos
├── purchases/     # Compras a proveedores (+stock)
├── work-orders/   # Órdenes de trabajo (-stock)
├── counter-sales/ # Ventas mostrador/pérdidas (-stock)
├── reports/       # Reportes y alertas
```

---

## 2. AUTENTICACIÓN Y ROLES

### Credenciales de Prueba (Seed)
| Rol    | RUT        | Contraseña  | Acceso                        |
|--------|------------|-------------|-------------------------------|
| ADMIN  | 111111111  | admin123    | Todo el sistema               |
| WORKER | 99999999   | taller123   | Órdenes, ventas, consultas    |

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "rut": "111111111",
  "password": "admin123"
}
```

### Respuesta Exitosa
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "rut": "111111111",
    "nombre": "Admin",
    "role": "ADMIN"
  }
}
```

### Uso del Token
```http
Authorization: Bearer <access_token>
```

### Permisos por Rol
| Recurso           | ADMIN | WORKER |
|-------------------|-------|--------|
| Compras           | ✅    | ❌     |
| Usuarios          | ✅    | ❌     |
| Órdenes de Trabajo| ✅    | ✅     |
| Ventas Mostrador  | ✅    | ✅     |
| Productos         | ✅    | ✅     |
| Reportes          | ✅    | ✅     |

---

## 3. ENDPOINTS POR MÓDULO

### 🔐 Auth
| Método | Ruta            | Descripción          | Auth  |
|--------|-----------------|----------------------|-------|
| POST   | /api/auth/login | Login con RUT+pass   | ❌    |

### 👥 Users (Solo ADMIN)
| Método | Ruta              | Descripción              |
|--------|-------------------|--------------------------|
| GET    | /api/users        | Listar usuarios          |
| POST   | /api/users        | Crear usuario            |
| PATCH  | /api/users/:id    | Actualizar usuario       |
| DELETE | /api/users/:id    | Desactivar usuario       |

### 📦 Products
| Método | Ruta                    | Descripción                              |
|--------|-------------------------|------------------------------------------|
| GET    | /api/products           | Listar productos activos                 |
| GET    | /api/products/deleted   | Listar productos eliminados (soft)       |
| GET    | /api/products/:id       | Obtener producto por ID                  |
| POST   | /api/products           | Crear producto                           |
| PATCH  | /api/products/:id       | Actualizar producto                      |
| PATCH  | /api/products/:id/restore | Restaurar producto eliminado           |
| DELETE | /api/products/:id       | Eliminar producto (soft delete)          |

### 🏷️ Categories
| Método | Ruta                 | Descripción              |
|--------|----------------------|--------------------------|
| GET    | /api/categories      | Listar categorías        |
| POST   | /api/categories      | Crear categoría          |
| PATCH  | /api/categories/:id  | Actualizar categoría     |
| DELETE | /api/categories/:id  | Eliminar categoría       |

### 🚗 Vehicle Models (Compatibilidad)
| Método | Ruta                   | Descripción                  |
|--------|------------------------|------------------------------|
| GET    | /api/vehicle-models    | Listar modelos disponibles   |
| POST   | /api/vehicle-models    | Crear modelo                 |

### 🧾 Purchases (Solo ADMIN)
| Método | Ruta               | Descripción                      |
|--------|--------------------|----------------------------------|
| GET    | /api/purchases     | Listar compras                   |
| POST   | /api/purchases     | Registrar compra (+stock)        |
| DELETE | /api/purchases/:id | Eliminar compra (revierte stock) |

### 📋 Work Orders
| Método | Ruta                            | Descripción                    |
|--------|---------------------------------|--------------------------------|
| GET    | /api/work-orders                | Listar órdenes                 |
| GET    | /api/work-orders/services-catalog | Catálogo de servicios       |
| POST   | /api/work-orders                | Crear orden (-stock)           |
| PATCH  | /api/work-orders/:id            | Actualizar orden               |

### 💰 Counter Sales
| Método | Ruta                   | Descripción                       |
|--------|------------------------|-----------------------------------|
| GET    | /api/counter-sales     | Listar movimientos                |
| GET    | /api/counter-sales?tipo=VENTA | Filtrar por tipo           |
| POST   | /api/counter-sales     | Registrar movimiento (-stock)     |

### 📊 Reports
| Método | Ruta                          | Descripción                   |
|--------|-------------------------------|-------------------------------|
| GET    | /api/reports/low-stock        | Productos con stock bajo      |
| GET    | /api/reports/daily-cash       | Caja del día                  |
| GET    | /api/reports/daily-cash?fecha=2026-01-30 | Caja de fecha específica |
| GET    | /api/reports/search?q=patente | Buscador global               |

---

## 4. CONTRATOS DE DATOS (DTOs)

### 📦 Crear Producto
```json
POST /api/products
{
  "sku": "F-001",
  "nombre": "Pastilla de Freno Delantera",
  "marca": "Bosch",
  "calidad": "Cerámica",
  "precio_venta": 28000,
  "stock_actual": 10,
  "stock_minimo": 5,
  "categoriaId": "uuid-categoria",
  "modelosCompatiblesIds": ["uuid-modelo-1", "uuid-modelo-2"]
}
```

### 🧾 Registrar Compra (FACTURA con IVA)
```json
POST /api/purchases
{
  "proveedor_nombre": "Repuestos Chile",
  "numero_documento": "F-12345",
  "tipo_documento": "FACTURA",
  "items": [
    {
      "sku": "F-001",
      "nombre": "Pastilla de Freno",
      "marca": "Bosch",
      "calidad": "Cerámica",
      "cantidad": 10,
      "precio_costo": 15000,
      "precio_venta_sugerido": 28000,
      "modelos_compatibles_ids": ["uuid-modelo-1"]
    }
  ]
}
```

### 🧾 Registrar Compra (INFORMAL sin IVA)
```json
POST /api/purchases
{
  "proveedor_nombre": "Proveedor Informal",
  "tipo_documento": "INFORMAL",
  "items": [
    {
      "sku": "F-002",
      "nombre": "Disco de Freno",
      "cantidad": 5,
      "precio_costo": 20000,
      "precio_venta_sugerido": 35000
    }
  ]
}
```

### 📋 Crear Orden de Trabajo
```json
POST /api/work-orders
{
  "numero_orden_papel": 1547,
  "realizado_por": "Pedro Mecánico",
  "revisado_por": "Supervisor Juan",
  "cliente": {
    "nombre": "María González",
    "rut": "12.345.678-9",
    "email": "maria@gmail.com",
    "telefono": "+56912345678"
  },
  "vehiculo": {
    "patente": "ABCD12",
    "marca": "Toyota",
    "modelo": "Yaris",
    "kilometraje": 45000
  },
  "items": [
    {
      "servicio_nombre": "Cambio Pastillas",
      "descripcion": "Cambio pastillas delanteras cerámicas Bosch",
      "precio": 45000,
      "product_sku": "F-001",
      "cantidad_producto": 1
    },
    {
      "servicio_nombre": "Revisión",
      "descripcion": "Revisión sistema completo",
      "precio": 15000
    }
  ]
}
```

### 💰 Venta de Mostrador
```json
POST /api/counter-sales
{
  "tipo_movimiento": "VENTA",
  "vendedor": "Juan Vendedor",
  "comentario": "Cliente compró sin instalación",
  "items": [
    {
      "sku": "F-001",
      "cantidad": 2,
      "precio_venta": 28000
    }
  ]
}
```

### 💀 Registrar Pérdida
```json
POST /api/counter-sales
{
  "tipo_movimiento": "PERDIDA",
  "comentario": "Producto dañado en bodega",
  "items": [
    {
      "sku": "F-002",
      "cantidad": 1
    }
  ]
}
```

### 🔧 Uso Interno
```json
POST /api/counter-sales
{
  "tipo_movimiento": "USO_INTERNO",
  "comentario": "Aceite usado para herramientas",
  "items": [
    {
      "sku": "ACE-001",
      "cantidad": 1
    }
  ]
}
```

---

## 5. LÓGICA DE IMPUESTOS (IVA)

### ⚠️ REGLA CRÍTICA: Los precios siempre son NETOS

El backend maneja todos los precios como **valores NETOS (sin IVA)**:

| Campo              | Descripción                           |
|--------------------|---------------------------------------|
| `precio_costo`     | Lo que pagamos al proveedor (NETO)    |
| `precio_venta`     | Lo que cobramos al cliente (NETO)     |

### Cálculo de IVA en Compras

```typescript
// En purchases.service.ts (líneas 119-127)
if (tipo_documento === 'FACTURA') {
  purchase.monto_neto = sumaTotalGasto;          // Suma de items
  purchase.monto_iva = Math.round(sumaTotalGasto * 0.19);  // 19% IVA
  purchase.monto_total = purchase.monto_neto + purchase.monto_iva;
} else {
  // INFORMAL: sin IVA
  purchase.monto_neto = sumaTotalGasto;
  purchase.monto_iva = 0;
  purchase.monto_total = sumaTotalGasto;
}
```

### Ejemplo Práctico
```
Compra FACTURA:
- Item: 10 unidades x $15.000 = $150.000 (neto)
- IVA (19%): $28.500
- Total a pagar: $178.500

Compra INFORMAL:
- Item: 10 unidades x $15.000 = $150.000 (neto)
- IVA: $0
- Total: $150.000
```

### ✅ AUDITORÍA IVA: Sin problemas detectados
- El IVA solo se aplica a compras tipo FACTURA
- Los cálculos usan `Math.round()` para evitar decimales
- El stock se actualiza independiente del tipo de documento

---

## 6. RELACIONES DE VEHÍCULOS Y PRODUCTOS

### Conceptos Clave

```
┌─────────────────────────────────────────────────────────────────┐
│  Vehicle (vehículos de clientes)                                │
│  - Tiene PATENTE única (ej: ABCD12)                             │
│  - Se usa en órdenes de trabajo                                 │
│  - Pertenece a un Cliente (ManyToOne)                           │
│  - Un cliente puede tener múltiples vehículos                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Client (dueño del vehículo)                                    │
│  - Tiene RUT único y email                                      │
│  - Tiene múltiples vehículos (OneToMany)                        │
│  - Tiene múltiples órdenes de trabajo (OneToMany)               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  VehicleModel (modelos para compatibilidad de productos)        │
│  - Marca + Modelo + Año (ej: Toyota Yaris 2018)                 │
│  - NO tiene patente ni cliente                                  │
│  - Se relaciona con productos (ManyToMany)                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Product                                                        │
│  - Tiene SKU único                                              │
│  - Puede ser compatible con múltiples VehicleModel              │
│  - Relación ManyToMany con VehicleModel                         │
└─────────────────────────────────────────────────────────────────┘
```

### Relación Vehicle ↔ Client

```typescript
// vehicle.entity.ts
@ManyToOne(() => Client, (client) => client.vehiculos, { nullable: true })
cliente: Client;

// client.entity.ts
@OneToMany(() => Vehicle, (vehicle) => vehicle.cliente)
vehiculos: Vehicle[];
```

### Endpoints para Vehículos

| Método | Ruta                                | Descripción                        |
|--------|-------------------------------------|------------------------------------|
| GET    | /api/vehicles                       | Listar todos los vehículos         |
| GET    | /api/vehicles?clienteId=uuid        | Filtrar vehículos por cliente      |
| GET    | /api/vehicles/patente/:patente      | Buscar por patente                 |
| GET    | /api/vehicles/:id                   | Obtener vehículo por ID            |
| POST   | /api/vehicles                       | Crear vehículo (con clienteId)     |
| PATCH  | /api/vehicles/:id                   | Actualizar vehículo                |

### Crear Vehículo con Cliente
```json
POST /api/vehicles
{
  "patente": "WXYZ99",
  "marca": "Nissan",
  "modelo": "V16",
  "anio": 2020,
  "kilometraje": 35000,
  "clienteId": "uuid-del-cliente"
}
```

### Respuesta de Cliente (incluye vehículos)
```json
GET /api/clients/:id
{
  "id": "uuid",
  "nombre": "Juan Pérez",
  "rut": "123456789",
  "email": "juan@gmail.com",
  "telefono": "+56912345678",
  "ordenes": [...],
  "vehiculos": [
    {
      "id": "uuid",
      "patente": "ABCD12",
      "marca": "Toyota",
      "modelo": "Yaris",
      "anio": 2018,
      "kilometraje": 45000
    }
  ]
}
```

### Relación ManyToMany (Producto ↔ VehicleModel)

```typescript
// product.entity.ts
@ManyToMany(() => VehicleModel, (vm) => vm.productos)
@JoinTable({
  name: 'product_vehicle_models',
  joinColumn: { name: 'product_id' },
  inverseJoinColumn: { name: 'vehicle_model_id' },
})
modelosCompatibles: VehicleModel[];
```

### Cómo asignar modelos compatibles

**Al crear producto:**
```json
POST /api/products
{
  "sku": "F-001",
  "nombre": "Pastilla Freno Toyota",
  "precio_venta": 28000,
  "modelosCompatiblesIds": ["uuid-yaris-2018", "uuid-corolla-2020"]
}
```

**Al registrar compra (se agregan automáticamente):**
```json
POST /api/purchases
{
  ...
  "items": [{
    "sku": "F-001",
    "modelos_compatibles_ids": ["uuid-nuevo-modelo"]
  }]
}
```

---

## 7. CÓDIGOS DE ERROR

### HTTP 400 - Bad Request
```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "error": "Bad Request"
}
```

**Casos comunes:**
- `"La cantidad debe ser positiva"`
- `"El SKU es obligatorio"`
- `"El precio de venta no puede ser negativo"`
- `"Stock insuficiente para [producto]. Disponible: X"`
- `"El producto con SKU [sku] no existe en inventario"`
- `"Las ventas requieren el nombre del vendedor"`
- `"El nombre del proveedor es obligatorio"`

### HTTP 401 - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Credenciales inválidas",
  "error": "Unauthorized"
}
```

**Casos:**
- Token JWT no proporcionado
- Token JWT expirado o inválido
- Contraseña incorrecta en login
- Usuario desactivado

### HTTP 403 - Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

**Casos:**
- WORKER intentando acceder a recursos de ADMIN
- Intentar crear compras sin rol ADMIN

### HTTP 404 - Not Found
```json
{
  "statusCode": 404,
  "message": "Recurso no encontrado",
  "error": "Not Found"
}
```

**Casos:**
- Producto con ID no existe
- Categoría no encontrada
- Cliente no encontrado

### HTTP 409 - Conflict
```json
{
  "statusCode": 409,
  "message": "Ya existe un [recurso] con [campo] [valor]",
  "error": "Conflict"
}
```

**Casos:**
- `"Ya existe un producto con SKU F-001"`
- `"Ya existe un cliente con RUT 12345678"`
- `"El número de orden 1547 ya existe en el sistema"`

---

## 8. AUDITORÍA DE LÓGICA DE NEGOCIO

### ✅ Compras a Proveedores (purchases.service.ts)
| Aspecto                  | Estado | Notas                                      |
|--------------------------|--------|--------------------------------------------|
| Validación proveedor     | ✅     | Nombre obligatorio                         |
| Validación items         | ✅     | Al menos 1 item requerido                  |
| Validación SKU           | ✅     | No puede estar vacío                       |
| Validación cantidades    | ✅     | Debe ser positiva                          |
| Validación precios       | ✅     | No pueden ser negativos                    |
| Cálculo IVA              | ✅     | Solo para FACTURA, Math.round()            |
| Actualización stock      | ✅     | Suma correctamente                         |
| Transacción atómica      | ✅     | QueryRunner con rollback                   |
| Reversión al eliminar    | ✅     | Stock se resta al borrar compra            |

### ✅ Ventas de Mostrador (counter-sales.service.ts)
| Aspecto                  | Estado | Notas                                      |
|--------------------------|--------|--------------------------------------------|
| Validación tipo          | ✅     | VENTA, PERDIDA, USO_INTERNO                |
| Validación vendedor      | ✅     | Obligatorio solo para VENTA               |
| Validación stock         | ✅     | Verifica disponibilidad antes de restar    |
| Validación precio venta  | ✅     | Obligatorio y >0 para VENTA               |
| Descuento stock          | ✅     | Resta correctamente                        |
| Registro pérdida         | ✅     | Guarda costo_perdida                       |
| Transacción atómica      | ✅     | QueryRunner con rollback                   |

### ✅ Órdenes de Trabajo (work-orders.service.ts)
| Aspecto                  | Estado | Notas                                      |
|--------------------------|--------|--------------------------------------------|
| Find or Create cliente   | ✅     | Busca por RUT normalizado o email          |
| Find or Create vehículo  | ✅     | Busca por patente normalizada              |
| Validación stock         | ✅     | Si usa producto, valida stock              |
| Descuento stock          | ✅     | Resta si hay product_sku                   |
| Número orden único       | ✅     | Constraint unique, manejo error 23505      |
| Transacción atómica      | ✅     | QueryRunner con rollback                   |

### ⚠️ Observaciones Menores

1. **Vehicle.cliente**: ✅ **CORREGIDO** - La entidad Vehicle ahora tiene relación ManyToOne con Client. Al crear una orden de trabajo, el vehículo se asocia automáticamente al cliente.

2. **Eliminación cascada**: Los detalles de compras/ventas/órdenes se eliminan en cascada, pero los productos tienen `onDelete: 'RESTRICT'` (correcto, evita eliminar productos usados).

---

## 9. SUGERENCIAS DE OPTIMIZACIÓN

### 🟢 Implementadas/No Invasivas

1. **Índices en BD** (ya implementados):
   - `Purchase.fecha` - Índice para reportes por fecha
   - `WorkOrder.fecha_ingreso` - Índice para búsquedas
   - `WorkOrder.patente_vehiculo` - Índice para buscador
   - `VehicleModel [marca, modelo, anio]` - Índice compuesto único

2. **Validaciones robustas**:
   - Todos los DTOs usan class-validator
   - Precios/cantidades validados como enteros positivos
   - RUTs/emails normalizados antes de guardar

3. **Serialización segura**:
   - Passwords nunca se retornan en respuestas
   - Referencias circulares manejadas en JSON

### 🟡 Sugerencias Futuras (No urgentes)

1. **Paginación**: Los endpoints de listado podrían beneficiarse de paginación para grandes volúmenes.

2. **Soft Delete**: Considerar borrado lógico para productos/clientes en lugar de DELETE físico.

3. **Cache**: Para el catálogo de servicios y modelos de vehículos que cambian poco.

4. **Logs de auditoría**: Agregar tabla de logs para cambios críticos (cambios de precio, eliminaciones).

---

## 📝 CATÁLOGO DE SERVICIOS

```typescript
const WORK_ORDER_SERVICES = [
  'Cambio Pastillas',
  'Cambio Balatas',
  'Cambio Liquido',
  'Cambio Gomas',
  'Rectificado',
  'Sangrado',
  'Cambio Piola',
  'Revision',
  'Otros',
];
```

---

## 🔄 TIPOS DE MOVIMIENTO (Counter Sales)

```typescript
enum MovementType {
  VENTA = 'VENTA',           // Cliente compra sin servicio
  PERDIDA = 'PERDIDA',       // Producto dañado/robado
  USO_INTERNO = 'USO_INTERNO' // Consumo del taller
}
```

---

## 📌 RESUMEN PARA FRONTEND

1. **Todos los precios son NETOS** (sin IVA incluido)
2. **El stock se actualiza automáticamente** en compras (+), órdenes (-), ventas mostrador (-)
3. **RUTs y emails se normalizan** automáticamente en el backend
4. **El token JWT debe enviarse** en header `Authorization: Bearer <token>`
5. **Los errores 400** indican datos inválidos o violaciones de negocio
6. **Los errores 409** indican duplicados (SKU, RUT, número de orden)
7. **Swagger disponible** en `/docs` para pruebas interactivas

---

*Documento generado automáticamente por auditoría de código - Febrero 2026*
