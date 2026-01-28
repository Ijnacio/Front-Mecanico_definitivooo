# 🚀 Inicio Rápido - Conexión con Backend NestJS

## Checklist de Conexión

### 1. ✅ Frontend Listo
- ✅ Autenticación con JWT Bearer Token
- ✅ Todos los hooks actualizados
- ✅ DTOs según documentación del backend
- ✅ Headers de autenticación en todas las peticiones

### 2. 🔧 Configuración Necesaria

#### Opción A: Backend en el mismo servidor (Producción)
No se necesita configuración adicional. El backend debe:
- Servir archivos estáticos del frontend desde `/dist/public`
- Responder en rutas `/api/*`

#### Opción B: Backend en puerto diferente (Desarrollo)
1. **Determina el puerto del backend** (ej: 3000)
2. **Edita `vite.config.ts`** y agrega:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',  // 👈 Puerto del backend
      changeOrigin: true,
    }
  },
  // ... resto de la configuración
}
```

Ver archivo [PROXY_CONFIG.md](./PROXY_CONFIG.md) para más detalles.

### 3. 🗄️ Datos Iniciales del Backend (Seed)

Tu amigo debe crear estos datos iniciales:

#### Usuario Administrador
```typescript
{
  rut: "11.111.111-1",
  nombre: "Administradora",
  password: "admin123", // Hash en backend
  role: "ADMIN"
}
```

#### Categorías Sugeridas
```typescript
[
  { nombre: "Frenos", descripcion: "Pastillas, discos, líquido" },
  { nombre: "Suspensión", descripcion: "Amortiguadores, gomas" },
  { nombre: "Lubricantes", descripcion: "Aceites y líquidos" }
]
```

#### Modelos de Vehículos (Ejemplos)
```typescript
[
  { marca: "Toyota", modelo: "Corolla", anio: 2020 },
  { marca: "Toyota", modelo: "Yaris", anio: 2019 },
  { marca: "Honda", modelo: "Civic", anio: 2021 },
  { marca: "Chevrolet", modelo: "Sail", anio: 2018 }
]
```

### 4. 🧪 Pruebas de Conexión

#### Paso 1: Iniciar Backend
```bash
# En la carpeta del backend
npm run start:dev
```

#### Paso 2: Iniciar Frontend
```bash
# En la carpeta del frontend
npm run dev
```

#### Paso 3: Probar Login
1. Ve a `http://localhost:5173/login` (o el puerto de Vite)
2. Ingresa:
   - RUT: `11.111.111-1`
   - Password: `admin123`
3. Si funciona, serás redirigido al Dashboard

#### Paso 4: Verificar Endpoints

**En el navegador (DevTools > Network):**

✅ `POST /api/auth/login` → 200 OK
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "rut": "111111111",
    "nombre": "Administradora",
    "role": "ADMIN"
  }
}
```

✅ `GET /api/auth/me` → 200 OK
```json
{
  "id": "uuid",
  "rut": "111111111",
  "nombre": "Administradora",
  "role": "ADMIN"
}
```

✅ `GET /api/products` → 200 OK
```json
[]  // Puede estar vacío al inicio
```

### 5. 🐛 Solución de Problemas

#### Error: "Failed to fetch" / CORS
**Causa:** El backend no tiene CORS configurado o está en dominio diferente.

**Solución:**
En el backend (NestJS), habilita CORS en `main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:5173', // Puerto del frontend
  credentials: true,
});
```

#### Error: 401 Unauthorized
**Causa:** Token no se está enviando o es inválido.

**Verificar:**
1. En DevTools > Application > Local Storage
2. Debe haber una clave `access_token`
3. En DevTools > Network > Headers debe aparecer:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```

**Solución:**
- Cerrar sesión y volver a hacer login
- Verificar que el backend acepta el token

#### Error: 404 Not Found en /api/...
**Causa:** El endpoint no existe en el backend o el proxy no está configurado.

**Verificar:**
1. El backend tiene la ruta implementada
2. El proxy en `vite.config.ts` está configurado
3. El backend está corriendo en el puerto correcto

### 6. 📋 Endpoints Críticos

Estos endpoints **DEBEN** funcionar para que la app básica funcione:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login (crítico) |
| `/api/auth/me` | GET | Usuario actual (crítico) |
| `/api/products` | GET | Listar productos |
| `/api/work-orders` | GET | Listar órdenes |
| `/api/work-orders/services-catalog` | GET | Catálogo de servicios |

Los demás pueden implementarse progresivamente.

### 7. 🔍 Verificación de DTOs

#### Crear Orden de Trabajo
**Frontend envía:**
```json
{
  "numero_orden_papel": 1547,
  "cliente_rut": "12.345.678-9",
  "cliente_nombre": "Juan Pérez",
  "cliente_telefono": "+56912345678",
  "vehiculo_patente": "ABCD12",
  "vehiculo_marca": "Toyota",
  "vehiculo_modelo": "Corolla",
  "vehiculo_anio": 2020,
  "vehiculo_km": 85000,
  "items": [{
    "servicio_nombre": "Cambio Pastillas",
    "descripcion": "Cambio pastillas delanteras",
    "precio": 45000,
    "product_sku": "F-001",
    "product_cantidad": 1
  }]
}
```

**Backend debe responder:**
```json
{
  "message": "Orden de trabajo creada exitosamente",
  "id": "uuid",
  "numero_orden_papel": 1547,
  "total_cobrado": 45000,
  "cliente": "Juan Pérez",
  "vehiculo": "ABCD12",
  "items_procesados": 1
}
```

### 8. 📊 Estado de Implementación

#### Backend (Tu amigo debe implementar)
- [ ] Autenticación JWT
- [ ] CRUD de Productos
- [ ] CRUD de Categorías
- [ ] CRUD de Modelos de Vehículos
- [ ] CRUD de Órdenes de Trabajo
- [ ] Reportes básicos
- [ ] Seed de datos iniciales

#### Frontend (YA IMPLEMENTADO ✅)
- ✅ Login con JWT
- ✅ Todos los hooks creados
- ✅ Páginas funcionando
- ✅ Formularios completos
- ✅ Validación de roles

### 9. 🎯 Próximos Pasos

1. **Tu amigo corre el backend**
2. **Tú corres el frontend** con `npm run dev`
3. **Prueban el login**
4. **Verifican que los endpoints respondan**
5. **Ajustan si hay diferencias en los DTOs**

### 10. 📞 Contacto con el Backend

Si hay diferencias entre lo que envía el frontend y lo que espera el backend:

1. **Revisa los hooks** en `client/src/hooks/use-*.ts`
2. **Ajusta los DTOs** según lo que necesite el backend
3. **Todos los hooks tienen la misma estructura**, fácil de modificar

---

## 📚 Documentación Adicional

- [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) - Detalles de la integración
- [HOOKS_REFERENCE.md](./HOOKS_REFERENCE.md) - Referencia de todos los hooks
- [PROXY_CONFIG.md](./PROXY_CONFIG.md) - Configuración de proxy

---

## ✨ ¡Todo listo!

El frontend está **100% preparado** para conectarse con el backend NestJS. Solo falta que tu amigo implemente los endpoints y ¡a funcionar! 🚀
