# Fix Build Error — Firebase Admin Lazy Initialization

**Fecha:** 2026-03-04  
**Rama:** `main` (post-merge)  
**Error:** `Failed to collect page data for /api/auth/session/login` en build

---

## 🐛 Problema

`lib/firebaseAdmin.ts` inicializaba Firebase Admin **en build time** (static generation), pero las variables de entorno (`FIREBASE_SERVICE_ACCOUNT_KEY`) no están disponibles en ese contexto. Esto causaba error en `pnpm run build`.

### Error típico
```
[Error: Failed to collect page data for /api/auth/session/login] {
  type: 'Error'
}
```

---

## 🔧 Solución: Lazy initialization

Cambiamos la inicialización a **runtime-only**:

### Antes
```ts
export const adminApp = initAdmin();  // Se ejecuta en build
export const adminAuth = adminApp.auth();
```

### Después
```ts
export function getAdminApp() {
    return initAdmin();  // Solo se ejecuta en runtime
}

export function getAdminAuth() {
    return getAdminApp().auth();
}
```

---

## Archivos modificados

- `lib/firebaseAdmin.ts` — lazy init con funciones.
- `app/api/auth/session/login/route.ts` — usa `getAdminAuth()`.
- `app/api/auth/session/logout/route.ts` — usa `getAdminAuth()`.
- `app/api/auth/session/verify/route.ts` — usa `getAdminAuth()`.
- `app/api/uploadthing/core.ts` — usa `getAdminAuth()`.

---

## Verificación

- **Build**: `pnpm run build` debe completar sin errores.
- **Runtime**: Login/logout/upload siguen funcionando igual.

---

## Nota

Este patrón es común en Next.js con Firebase Admin: evitar inicialización en build time para que las variables de entorno se lean solo en runtime.
