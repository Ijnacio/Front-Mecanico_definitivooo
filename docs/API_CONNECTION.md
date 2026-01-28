# Conexión con el Backend

## 🎯 Configuración Actual

El frontend ahora está configurado para conectarse al backend en:
```
http://136.248.240.194:3000/api
```

Esta URL se configura a través de la variable de entorno `VITE_API_URL` en el archivo `.env.local`.

## 📝 Archivo de Configuración

**Archivo:** `.env.local`
```env
VITE_API_URL=http://136.248.240.194:3000/api
```

## 🔧 Cómo Funciona

### 1. Centralización de URL Base
Todos los hooks ahora utilizan una función centralizada `getApiUrl()` definida en `client/src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export function getApiUrl(endpoint: string): string {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  
  if (API_BASE_URL.endsWith("/api")) {
    return `${API_BASE_URL}${normalizedEndpoint}`;
  }
  
  return `${API_BASE_URL}${normalizedEndpoint}`;
}
```

### 2. Ejemplo de Uso

**Antes (hardcoded):**
```typescript
const res = await fetch("/api/products", {
  headers: getAuthHeaders()
});
```

**Ahora (dinámico):**
```typescript
const res = await fetch(getApiUrl("/products"), {
  headers: getAuthHeaders()
});
```

Esto se traduce a: `http://136.248.240.194:3000/api/products`

## 🔐 Autenticación

Los headers de autenticación también están centralizados:

```typescript
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}
```

## 📚 Hooks Actualizados

Todos estos hooks ahora usan `getApiUrl()` y `getAuthHeaders()`:

- ✅ `use-products.ts` - Gestión de productos
- ✅ `use-categories.ts` - Categorías
- ✅ `use-auth.ts` - Autenticación
- ✅ `use-clients.ts` - Clientes
- ✅ `use-providers.ts` - Proveedores
- ✅ `use-vehicles.ts` - Vehículos
- ✅ `use-vehicle-models.ts` - Modelos de vehículos
- ✅ `use-work-orders.ts` - Órdenes de trabajo
- ✅ `use-purchases.ts` - Compras
- ✅ `use-counter-sales.ts` - Ventas mostrador
- ✅ `use-reports.ts` - Reportes
- ✅ `use-users.ts` - Usuarios

## 🌐 Cambiar el Backend

### Para Desarrollo Local
Edita `.env.local`:
```env
VITE_API_URL=http://localhost:3000/api
```

### Para Producción
Edita `.env.local`:
```env
VITE_API_URL=https://tu-backend.com/api
```

### Para IP Específica (Actual)
```env
VITE_API_URL=http://136.248.240.194:3000/api
```

## 🔄 Aplicar Cambios

Después de modificar `.env.local`:
1. Detén el servidor: `Ctrl+C` en la terminal
2. Reinicia: `npm run dev`

## 🧪 Verificar Conexión

1. Abre el navegador en `http://localhost:5000`
2. Abre DevTools (F12)
3. Ve a la pestaña "Network"
4. Intenta hacer login o navegar por la aplicación
5. Verás las peticiones ir a: `http://136.248.240.194:3000/api/*`

## ⚠️ Solución de Problemas

### CORS Error
Si ves errores de CORS en la consola, el backend necesita permitir peticiones desde `http://localhost:5000`:

```typescript
// En el backend NestJS
app.enableCors({
  origin: ['http://localhost:5000', 'http://136.248.240.194:3000'],
  credentials: true
});
```

### Connection Refused
- Verifica que el backend esté corriendo en `http://136.248.240.194:3000`
- Verifica que no haya firewall bloqueando la conexión
- Verifica que la IP sea accesible desde tu red

### 401 Unauthorized
- El token JWT puede haber expirado
- Cierra sesión y vuelve a hacer login
- El backend puede estar rechazando el token

## 📖 Referencia de Endpoints

Todos los endpoints ahora se construyen automáticamente:

| Hook | Endpoint Original | URL Final |
|------|------------------|-----------|
| `useProducts()` | `/products` | `http://136.248.240.194:3000/api/products` |
| `useCategories()` | `/categories` | `http://136.248.240.194:3000/api/categories` |
| `useLogin()` | `/auth/login` | `http://136.248.240.194:3000/api/auth/login` |
| `useClients()` | `/clients` | `http://136.248.240.194:3000/api/clients` |
| ... | ... | ... |

¡Y así con todos los endpoints del sistema!
