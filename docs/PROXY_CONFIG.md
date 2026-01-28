# Configuración de Proxy para Desarrollo

## Si el backend está en un puerto diferente

Si tu amigo está desarrollando el backend en `http://localhost:3000` (o cualquier otro puerto), necesitas configurar un proxy en `vite.config.ts`.

### Opción 1: Backend en localhost:3000

Agrega esto en la sección `server` de `vite.config.ts`:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    }
  },
  fs: {
    strict: true,
    deny: ["**/.*"],
  },
}
```

### Opción 2: Backend en diferente dominio

```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://backend.example.com',
      changeOrigin: true,
      secure: false, // Si es https sin certificado válido
    }
  },
  fs: {
    strict: true,
    deny: ["**/.*"],
  },
}
```

### Opción 3: Backend en el mismo servidor (producción)

Si el backend está en el mismo dominio y puerto, no necesitas proxy. El backend debe servir archivos estáticos del frontend en la carpeta `dist/public`.

## Ejemplo Completo de vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    // ⬇️ AGREGA ESTO SI EL BACKEND ESTÁ EN OTRO PUERTO ⬇️
    proxy: {
      '/api': {
        target: 'http://localhost:3000',  // 👈 Cambia al puerto del backend
        changeOrigin: true,
      }
    },
    // ⬆️ HASTA AQUÍ ⬆️
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
```

## Verificar la Conexión

1. **Inicia el backend** en su puerto (ej: 3000)
2. **Inicia el frontend** con `npm run dev` (normalmente puerto 5173)
3. **Prueba el login** en `http://localhost:5173/login`

El proxy redirigirá automáticamente todas las peticiones a `/api/*` al backend.

## Alternativa: Variable de Entorno

También puedes usar una variable de entorno:

1. Crea archivo `.env` en la raíz:
```
VITE_API_URL=http://localhost:3000
```

2. Actualiza los hooks para usar:
```typescript
const API_URL = import.meta.env.VITE_API_URL || '';
const res = await fetch(`${API_URL}/api/products`);
```

Pero la opción del proxy es más simple y no requiere cambios en el código.
