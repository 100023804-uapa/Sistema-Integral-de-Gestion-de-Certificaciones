# Validación Fase 0 — Checklist DoD + Smoke Test

**Fecha:** 2026-03-03  
**Rama:** `fase-0-hardening`  

---

## Objetivo

Confirmar que **Fase 0 está completa y funcional**:

- Seguridad endurecida (sesión verificable, reglas Firestore, UploadThing auth).
- Modularidad mínima (contenedor, sin imports de infraestructura en `app/`).
- Escalabilidad mínima (paginación real, evitar full scans).
- Flujos clave operativos.

---

## Checklist DoD (Definition of Done)

### ✅ Seguridad (Fase 0.1)
- [ ] `firebase-admin` instalado y configurado (`FIREBASE_SERVICE_ACCOUNT_KEY`).
- [ ] Endpoints de sesión (`/api/auth/session/*`) creados y funcionales.
- [ ] Middleware valida sesión real (no `session=1`).
- [ ] AuthContext y login crean cookie `httpOnly` vía backend.
- [ ] UploadThing valida session cookie real.
- [ ] Firestore rules restringen escrituras a admin.
- [ ] `.gitignore` ignora service accounts.

### ✅ Modularidad (Fase 0.2)
- [ ] `lib/container.ts` exporta repositorios y casos de uso.
- [ ] **Ningún archivo** en `app/` importa `@/lib/infrastructure/repositories/*`.
- [ ] Server Actions usan contenedor.
- [ ] UI crítica usa contenedor para repos/casos de uso.
- [ ] Tipos re-exportados desde contenedor para evitar imports de infraestructura.

### ✅ Escalabilidad (Fase 0.3)
- [ ] `listPaginated` implementado en `students`, `certificates`, `templates`.
- [ ] UI ejemplo (`graduates`) muestra paginación con botones Anterior/Siguiente.
- [ ] Reportes y programas usan límites razonables (no `list(500+)`) y prefieren `program_stats`.
- [ ] Contenedor exporta `QueryDocumentSnapshot` para UI.

---

## Smoke Test (manual)

### 1) Login admin → Dashboard
- **Acción**: Inicia sesión como admin.
- **Esperado**: Se crea cookie `session` (httpOnly). Middleware permite acceso a `/dashboard`.
- **Verificar**: En DevTools → Application → Cookies → `session` (httpOnly).

### 2) Acceso denegado sin sesión
- **Acción**: Abre `/dashboard` en ventana privada o sin login.
- **Esperado**: Redirige a `/login`.
- **Verificar**: No se puede acceder a rutas protegidas.

### 3) Upload de template
- **Acción**: En dashboard → templates → crear/editar → subir imagen.
- **Esperado**: UploadThing permite upload solo con sesión válida.
- **Verificar**: Sin sesión, falla con `Unauthorized`.

### 4) Verify público
- **Acción**: Accede a `/verify` y busca por folio o matrícula.
- **Esperado**: Funciona sin sesión (público).
- **Verificar**: No requiere login.

### 5) Paginación en graduates
- **Acción**: Ve a `/dashboard/graduates`.
- **Esperado**: Carga primera página (50 ítems). Botones Anterior/Siguiente funcionan.
- **Verificar**: “Anterior” deshabilitado en pág 1; “Siguiente” habilitado si hay más.

### 6) Logout
- **Acción**: Clic en logout.
- **Esperado**: Cookie `session` eliminada. Redirige a `/login`.
- **Verificar**: Cookie desaparece; acceso a `/dashboard` denegado.

---

## Problemas conocidos / Notas

- **CRLF warnings**: normales en Windows, no afectan funcionalidad.
- **`.env.local`**: debe contener `FIREBASE_SERVICE_ACCOUNT_KEY` (no versionado).
- **`session=1` obsoleto**: ya no se usa; cualquier cookie falsa es rechazada.

---

## Resultado esperado

Si todo el checklist está ✅ y el smoke test pasa, **Fase 0 está completa** y el sistema está listo para crecer en Fase 1 con bases sólidas.

---

## Próximo paso

- Si algo falla, registrar en `docs/avances/` y corregir antes de pasar a Fase 1.
- Si todo OK, preparar resumen de Fase 0 y plan de Fase 1.
