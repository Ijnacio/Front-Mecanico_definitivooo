# Sistema de Autenticación - Instrucciones

## ✅ Sistema de Login Implementado

He creado un sistema completo de autenticación con las siguientes características:

### 🔐 Características Implementadas

1. **Login con RUT y Contraseña**
   - Formato chileno de RUT (12.345.678-9)
   - Autenticación segura con bcrypt
   - Sesiones persistentes

2. **Sistema de Roles**
   - **Administrador**: Acceso completo al sistema
   - **Mecánico**: Acceso limitado a funciones específicas

3. **Permisos por Rol**
   - **Administrador**:
     - Ver, crear, editar y eliminar productos
     - Ver y crear compras
     - Ver, crear, editar y eliminar órdenes de trabajo
   
   - **Mecánico**:
     - Ver productos (solo lectura)
     - Ver compras (solo lectura)
     - Ver, crear y editar órdenes de trabajo
     - No puede eliminar órdenes de trabajo

### 📋 Configuración Inicial

1. **Configurar Base de Datos**
   ```bash
   # Copiar el archivo de ejemplo
   cp .env.example .env
   
   # Editar .env y configurar tu DATABASE_URL
   # Ejemplo: DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/taller_mecanico
   ```

2. **Crear las Tablas**
   ```bash
   npm run db:push
   ```

3. **Crear Usuarios de Prueba**
   ```bash
   npm run db:seed
   ```

   Esto creará dos usuarios:
   
   **Administrador:**
   - RUT: `11.111.111-1`
   - Contraseña: `admin123`
   - Rol: Administrador
   
   **Mecánico:**
   - RUT: `22.222.222-2`
   - Contraseña: `mecanico123`
   - Rol: Mecánico

4. **Iniciar el Servidor**
   ```bash
   npm run dev
   ```

### 🎯 Uso del Sistema

1. **Acceso Inicial**
   - Al abrir la aplicación, serás redirigido automáticamente a `/login`
   - Ingresa tu RUT y contraseña
   - El sistema validará tus credenciales y te dará acceso según tu rol

2. **Navegación**
   - La barra lateral muestra tu información de usuario (nombre, RUT y rol)
   - Puedes cerrar sesión usando el botón "Cerrar Sesión"
   - Las rutas están protegidas - necesitas estar autenticado para acceder

3. **Diferencias por Rol**
   - El **administrador** verá todas las opciones habilitadas
   - El **mecánico** tendrá restricciones en crear/editar/eliminar según los permisos

### 🛠️ Archivos Creados/Modificados

**Backend:**
- `server/auth.ts` - Configuración de Passport y middlewares de autenticación
- `server/routes.ts` - Rutas de login/logout protegidas con middlewares
- `server/storage.ts` - Métodos para usuarios (getUserByRut, getUserById, createUser)
- `server/seed.ts` - Script para crear usuarios iniciales
- `shared/schema.ts` - Tabla de usuarios con validaciones

**Frontend:**
- `client/src/pages/Login.tsx` - Página de inicio de sesión con formato de RUT
- `client/src/hooks/use-auth.ts` - Hook para manejar autenticación
- `client/src/App.tsx` - Protección de rutas y redirección
- `client/src/components/Sidebar.tsx` - Información de usuario y logout

### 🔒 Seguridad

- Contraseñas hasheadas con bcrypt (10 rounds)
- Sesiones seguras con express-session
- Cookies HTTP-only
- Validación de roles en backend
- Middleware de autenticación en todas las rutas protegidas

### 📝 Crear Nuevos Usuarios

Puedes crear nuevos usuarios haciendo una petición POST a `/api/auth/register`:

```json
{
  "rut": "33.333.333-3",
  "password": "tu_contraseña",
  "name": "Nombre del Usuario",
  "role": "mecanico" // o "administrador"
}
```

O modificar el archivo `server/seed.ts` para agregar más usuarios.

### 🚀 Siguiente Paso

1. Configura tu DATABASE_URL en el archivo `.env`
2. Ejecuta `npm run db:push` para crear las tablas
3. Ejecuta `npm run db:seed` para crear los usuarios de prueba
4. Ejecuta `npm run dev` para iniciar el servidor
5. Abre tu navegador y prueba el login con las credenciales de prueba

¡Todo listo! 🎉
