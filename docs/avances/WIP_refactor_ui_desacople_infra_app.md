# WIP — Refactor UI: desacople total de `app/**` respecto a `lib/infrastructure/**`

**Estado:** WIP (pendiente de commit)  
**Rama:** `fase-0-hardening`  

---

## Objetivo

Completar Fase 0.2:

- Garantizar que **ningún archivo** en `app/**` importe `@/lib/infrastructure/repositories/*`.
- Forzar el consumo de repositorios y casos de uso mediante `lib/container.ts`.

---

## Alcance actual (según `git status`)

Cambios locales aún no commiteados incluyen refactors en:

- Certificados:
  - `app/dashboard/certificates/page.tsx`
  - `app/dashboard/certificates/create/page.tsx`
  - `app/dashboard/certificates/[id]/page.tsx`
  - `app/verify/[id]/page.tsx`
  - `app/dashboard/validate/page.tsx`

- Reportes y programas:
  - `app/dashboard/reports/page.tsx`
  - `app/dashboard/programs/page.tsx`

- Plantillas:
  - `app/dashboard/templates/page.tsx`
  - `app/dashboard/templates/create/page.tsx`
  - `app/admin/seed-template/page.tsx`

- Acceso y auth:
  - `app/dashboard/users/page.tsx`
  - `app/dashboard/layout.tsx`
  - `app/login/page.tsx`
  - `app/register-admin/page.tsx`
  - `app/request-access/page.tsx`

- Participantes:
  - `app/dashboard/graduates/page.tsx`
  - `app/dashboard/graduates/create/page.tsx`
  - `app/dashboard/graduates/[id]/page.tsx`

Además:

- `lib/container.ts` fue extendido para re-exportar tipos (`ProgramStat`, `AccessUser`, `AccessRequest`) requeridos por UI.

---

## Cambios técnicos

- Reemplazo sistemático de:
  - `new Firebase*Repository()`
  - imports desde `@/lib/infrastructure/repositories/*`

por:

- `get*Repository()`
- `get*UseCase()`

---

## Verificación (manual)

- Navegación admin:
  - login admin -> dashboard.
  - users: listar solicitudes/admins.

- Certificados:
  - listar, crear, ver detalle.
  - verify público por folio.

- Templates:
  - listar, crear, subir assets (UploadThing).

- Graduates:
  - listar, crear, ver detalle.

---

## Criterio de cierre

- `grep` en `app/**` no debe encontrar imports a `@/lib/infrastructure/repositories/`.
