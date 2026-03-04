# Fase 0.3 — Escalabilidad mínima: paginación real y evitar full scans

**Fecha:** 2026-03-03  
**Commit:** (próximo)  
**Rama:** `fase-0-hardening`  

---

## Objetivo

Reducir riesgos de escalabilidad en listados grandes y reportes:

- Implementar paginación real con cursor en repositorios.
- Evitar “full scans” en reportes/programas.
- Mantener compatibilidad con UI existente.

---

## Cambios principales

### 1) Paginación real en repositorios
- **`FirebaseStudentRepository`**:
  - Nuevo método `listPaginated(cursor?, pageSize)` → `{ data, hasMore, lastVisible }`.
  - Usa `startAfter(cursor)` + `limit(pageSize)`.
- **`FirebaseCertificateRepository`**:
  - `listPaginated(cursor?, pageSize)` con mismo patrón.
- **`FirebaseTemplateRepository`**:
  - `listPaginated(activeOnly, cursor?, pageSize)`.

### 2) UI con paginación (ejemplo graduates)
- **`app/dashboard/graduates/page.tsx`**:
  - Usa `listPaginated` en lugar de `list(50)`.
  - Botones Anterior/Siguiente.
  - Estado `page`, `hasMore`, `lastVisible`.
  - Reset a página 1 al volver atrás.

### 3) Evitar full scans en reportes/programas
- **`app/dashboard/reports/page.tsx`**:
  - Cambió de `list(500)` a `listPaginated(undefined, 100)`.
- **`app/dashboard/programs/page.tsx`**:
  - Preferencia a `getProgramStats` (read-model).
  - Fallback a `listPaginated(undefined, 200)` en lugar de `list(500)`.

### 4) Contenedor
- **`lib/container.ts`**:
  - Exporta `QueryDocumentSnapshot` para que UI pueda manejar cursor sin importar Firebase.
  - Re-exporta tipos para evitar imports de infraestructura.

---

## Archivos impactados

- `lib/infrastructure/repositories/FirebaseStudentRepository.ts`
- `lib/infrastructure/repositories/FirebaseCertificateRepository.ts`
- `lib/infrastructure/repositories/FirebaseTemplateRepository.ts`
- `lib/container.ts`
- `app/dashboard/graduates/page.tsx`
- `app/dashboard/reports/page.tsx`
- `app/dashboard/programs/page.tsx`

---

## Comportamiento esperado

- **Listados grandes**: ahora cargan en páginas (ej. 50/20 ítems) sin bloquear.
- **Reportes**: no intentan leer toda la colección; usan límites razonables.
- **Templates**: paginados, con opción `activeOnly`.

---

## Próximos pasos (opcional)

- Extender paginación a `certificates/page.tsx` y `templates/page.tsx` si se desea.
- Considerar “infinite scroll” en lugar de botones si se prefiere UX más fluida.

---

## Validación (manual)

- Navegar a `/dashboard/graduates`:
  - Debe cargar primera página (50 ítems).
  - Botón “Siguiente” habilitado si hay más.
  - “Anterior” deshabilitado en página 1.
- Reportes y programas deben cargar rápido sin timeouts por full scans.

---

## Riesgos mitigados

- **Timeouts** en listados grandes.
- **Costos de lectura** masiva en Firestore.
- **UX bloqueada** mientras se cargan cientos de registros.

---

## Nota

Se mantiene compatibilidad con `list()` existente por si otras partes del sistema lo usan. La migración a `listPaginated` es progresiva.
