# Fase 0.1 — Sesión verificable con Firebase Admin + cookie httpOnly

**Fecha:** 2026-03-03  
**Commit:** (próximo)  
**Rama:** `fase-0-hardening`  

---

## Objetivo

Eliminar la falsable cookie client-side `session=1` y migrar a una **sesión real verificable**:

- Crear session cookie `httpOnly` firmada por Firebase Admin.
- Validar sesión en middleware, UploadThing y endpoints protegidos.
- Evitar que cualquier cliente pueda falsificar acceso.

---

## Cambios principales

### 1) Dependencia e inicialización
- Se agregó `firebase-admin` a `package.json`.
- Se creó `lib/firebaseAdmin.ts` que inicializa Admin SDK usando `FIREBASE_SERVICE_ACCOUNT_KEY`.

### 2) Endpoints de sesión
- `POST /api/auth/session/login`:
  - Recibe `idToken` del cliente.
  - Crea session cookie `httpOnly` con `adminAuth.createSessionCookie`.
- `POST /api/auth/session/logout`:
  - Borra la cookie.
- `GET /api/auth/session/verify`:
  - Verifica el session cookie con `adminAuth.verifySessionCookie`.
  - Usado por el middleware.

### 3) Middleware
- `middleware.ts` ahora valida sesión real llamando a `/api/auth/session/verify`.
- Ya no acepta `session=1` como válido.

### 4) Auth y Login
- `lib/contexts/AuthContext.tsx`:
  - Ya no escribe `document.cookie`.
  - Al detectar `authUser`, llama a `/api/auth/session/login` con `idToken`.
  - En logout llama a `/api/auth/session/logout`.
- `app/login/page.tsx`:
  - Login admin/Google ahora crea la session cookie vía backend.

### 5) UploadThing
- `app/api/uploadthing/core.ts`:
  - Middleware ahora valida el session cookie real con `adminAuth.verifySessionCookie`.
  - Devuelve `userId` del token decodificado.

### 6) Seguridad y Git
- `.gitignore` actualizado para ignorar `*firebase-adminsdk*.json`.
- No se suben claves privadas al repo.

---

## Archivos impactados

- `package.json`
- `lib/firebaseAdmin.ts`
- `app/api/auth/session/login/route.ts`
- `app/api/auth/session/logout/route.ts`
- `app/api/auth/session/verify/route.ts`
- `middleware.ts`
- `lib/contexts/AuthContext.tsx`
- `app/login/page.tsx`
- `app/api/uploadthing/core.ts`
- `.gitignore`

---

## Configuración requerida

### Variable de entorno
- `FIREBASE_SERVICE_ACCOUNT_KEY` (contenido JSON del Service Account, en una línea o vía PowerShell).

### Instalación
- `pnpm install` (para `firebase-admin`).

---

## Verificación (manual)

1) **Login admin** → crea cookie `session` (httpOnly).
2) **Acceso a `/dashboard`** → middleware permite paso.
3) **Upload de template** → UploadThing valida session cookie.
4) **Logout** → cookie eliminada y redirige a login.

---

## Riesgos mitigados

- Ya no es posible falsificar sesión con `document.cookie='session=1'`.
- Solo usuarios con `idToken` válido pueden crear sesión.
- UploadThing solo permite uploads de usuarios autenticados.

---

## Próximo paso

- **Fase 0.3**: Escalabilidad mínima (paginación, evitar full scans, read-models).
- **Validación Fase 0**: checklist DoD + smoke test completo.
