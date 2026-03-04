# e901c65 — Hardening: restrict uploads and Firestore writes to admin

**Fecha:** 2026-03-03  
**Commit:** `e901c65`  
**Rama:** `fase-0-hardening`  

---

## Objetivo

Reducir riesgos críticos de seguridad del MVP:

- evitar uploads anónimos en UploadThing,
- evitar escrituras a Firestore por cualquier usuario autenticado,
- centralizar la noción de “admin” para escribir entidades sensibles.

---

## Cambios principales

### 1) UploadThing — exigir sesión

- Se endureció el middleware de `uploadthing` para requerir la cookie `session=1`.
- Si no hay sesión, el upload falla con `Unauthorized`.

**Motivación:** el middleware anterior devolvía un `userId` fijo y permitía subida de archivos sin validar identidad.

### 2) Firestore rules — writes solo admin

- Se agregó `isAdmin()` basado en documento `access_users/{email_lower}`.
- Se restringieron escrituras de:
  - `certificates`
  - `students`
  - `templates`
  - `program_stats`
  - `folio_counters`
  - `programs`
  - `access_users`

- Se agregó `access_requests` con:
  - `create` público solo si `status == pending` y `requestId == email.lower()`
  - `read/update/delete` solo admin

**Compatibilidad:** se permitió `get` público en `access_users/{userId}` para mantener el flujo actual de whitelist (registro/login), pero `list` y escrituras quedan solo admin.

---

## Archivos impactados

- `app/api/uploadthing/core.ts`
- `firestore.rules`

---

## Riesgos / Consideraciones

- El sistema actual de sesión (`session=1`) todavía es una cookie simple; este commit solo la usa como condición mínima.
- Recomendación en Fase 0.1: migrar a sesión verificable (Firebase Admin + cookie firmada o equivalente).

---

## Verificación (manual)

- Subida en templates:
  - sin login: debe fallar `Unauthorized`.
  - logueado: debe permitir upload.

- Firestore:
  - crear/editar certificados/plantillas/estudiantes requiere admin.

---

## Deploy de reglas

Desde la raíz:

```bash
firebase deploy --only firestore:rules
```
