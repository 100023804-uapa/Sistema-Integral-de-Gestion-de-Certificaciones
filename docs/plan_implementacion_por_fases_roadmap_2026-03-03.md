# Plan de Implementación por Fases (Roadmap Completo) — SIGCE

**Fecha:** 2026-03-03  
**Basado en:**

- `docs/informe_analisis_sistema_y_requerimientos_2026-03-03.md`
- `docs/analisis_escalabilidad_y_modularidad_2026-03-03.md`
- Requerimientos del PDF: `docs/requerimientos_pdf.txt` (US-01..US-17)

---

## 1. Propósito del plan

Este plan define una ejecución **progresiva por fases e hitos**, con:

- objetivos claros,
- entregables verificables,
- dependencias explícitas,
- criterios de salida (“Definition of Done” por fase),
- checklist de validación.

La intención es que puedas implementar **todo** lo requerido (PDF + hardening + modularidad) sin dejar cabos sueltos.

---

## 2. Principios de implementación (para no romper el sistema al crecer)

- **P1 — Seguridad primero:** antes de “más features”, cerrar reglas de acceso y validar server-side.
- **P2 — UI no toca infraestructura:** evitar `new Firebase*Repository()` dentro de `app/**`.
- **P3 — Use cases como API interna:** cada módulo expone casos de uso (application layer) consumibles por UI.
- **P4 — Métricas y reportes con read-models:** evitar descargas masivas en cliente.
- **P5 — Migración incremental:** refactor por “estrangulamiento” (Strangler Pattern), sin reescribir.

---

## 3. Vista general de fases

### Fase 0 — Estabilización técnica (base para avanzar sin deuda explosiva)

- Endurecer seguridad y permisos.
- Ajustar autenticación/autorización.
- Preparar estructura modular mínima.

### Fase 1 — Gobernanza institucional (recintos, áreas, tipología, roles)

- Implementar US-01, US-03, US-05, US-17.

### Fase 2 — Ciclo de vida del certificado + auditoría + firma controlada

- Implementar US-06, US-16, US-08, US-07.

### Fase 3 — Bloqueos administrativos e integraciones

- Implementar US-09, US-10, US-11.

### Fase 4 — Experiencia final: historial del participante + verificación + dashboard macro + reportes

- Implementar US-12, US-13, US-14, US-15.

---

## 4. Fase 0 — Estabilización técnica (Hardening + Base modular)

### Objetivo

Convertir el MVP en una base **segura, testeable y modularizable**, sin cambiar aún la lógica funcional mayor.

### Entregables

- **Seguridad** cerrada (Firestore/Storage/UploadThing).
- **Autorización consistente** (no solo cookie cliente).
- **Contenedor simple de dependencias** (factorías) para no instanciar repos en UI.
- **Paginación mínima** en listados críticos.

### Alcance recomendado

#### Hito 0.1 — Seguridad (P0)

- **FireStore rules**:
  - Mantener lectura pública de `certificates` (requerimiento de verificación), pero:
    - restringir escrituras por rol (no solo `isSignedIn()`).
  - blindar `access_users` para evitar escalamiento de privilegios.
- **UploadThing**:
  - implementar middleware de auth real (no `userId: "user"`).
- **Middleware**:
  - evolucionar de `session=1` a sesión verificable (ideal: token/cookie firmada o verificación con Firebase Admin).

#### Hito 0.2 — Modularidad mínima (P0/P1)

- Crear una capa “service/use-case” para que `app/**` deje de instanciar repos concretos.
  - Ejemplo: `lib/services/getCertificateService()` o `lib/container.ts`.
- Reemplazar en UI:
  - `new FirebaseCertificateRepository()` -> `getCertificationUseCases()`.

#### Hito 0.3 — Escalabilidad mínima (P1)

- Implementar paginación en:
  - `/dashboard/certificates`
  - `/dashboard/graduates` (si aplica)
- Evitar full scans:
  - preferir `program_stats` (ya existe) vs recomputar.

### Criterios de salida (DoD Fase 0)

- **[Seguridad]** Ninguna colección permite escalamiento de privilegios por “solo estar logueado”.
- **[Arquitectura]** Ningún archivo en `app/**` importa `Firebase*Repository`.
- **[Operación]** Listados y reportes no requieren descargar cientos de docs sin paginación.

---

## 5. Fase 1 — Gobernanza institucional (US-01, US-03, US-05, US-17)

### Objetivo

Incorporar la estructura institucional para que certificados se emitan con:

- recinto,
- área académica,
- tipología,
- control de roles.

### Entregables

#### Hito 1.1 — Recintos (US-01)

- CRUD de recintos.
- Campo obligatorio en certificados: `campusId` (equivalente a `recinto_id`).
- Validación: no emitir/crear en estado “operativo” sin recinto.

#### Hito 1.2 — Áreas académicas (US-03, US-04 base)

- CRUD de áreas.
- Campo obligatorio en certificado: `academicAreaId`.

#### Hito 1.3 — Tipología (US-05)

- Definir tipologías pedidas:
  - horizontal,
  - vertical,
  - institucional macro.
- Relación plantilla <-> tipología.

#### Hito 1.4 — Roles RBAC (US-17)

- Modelo de roles (mínimos):
  - coordinador,
  - verificador,
  - firmante,
  - administrador.
- UI de asignación de roles.
- Enforcement en:
  - use cases,
  - reglas de Firestore.

### Criterios de salida (DoD Fase 1)

- **[Datos]** Todo certificado nuevo tiene `campusId` y `academicAreaId`.
- **[Roles]** Acciones sensibles requieren rol (no solo login).
- **[UI]** filtros por recinto/área al menos en listados admin.

---

## 6. Fase 2 — Flujo de estados + auditoría + firma (US-06, US-16, US-08, US-07)

### Objetivo

Implementar el ciclo de vida institucional del certificado con trazabilidad total.

### Entregables

#### Hito 2.1 — Máquina de estados (US-06)

- Ampliar `CertificateStatus` con estados del PDF:
  - borrador,
  - espera verificación,
  - verificado,
  - espera firma,
  - firmado,
  - emitido,
  - disponible,
  - rechazado,
  - bloqueado por pago,
  - bloqueado por documentación,
  - bloqueado administrativo.
- Use cases explícitos por transición:
  - `SubmitForVerification`
  - `VerifyCertificate`
  - `RequestSignature`
  - `ApproveSignature`
  - `RejectCertificate`
  - `PublishCertificate`

#### Hito 2.2 — Auditoría (US-16)

- Registro en `audit_logs` (o subcolección) por transición:
  - actor,
  - timestamp,
  - from/to,
  - motivo.

#### Hito 2.3 — Firma digital controlada (US-08)

- Firma **parametrizada por usuario firmante**.
- Render/plantilla:
  - firma solo aparece cuando estado lo permita.
- Bloqueo:
  - no se puede firmar sin aprobación previa.

#### Hito 2.4 — Notificación a firmante (US-07)

- Notificación automática al entrar a estado `pending_signature`.
- Listado consolidado para firmantes.
- Acción aprobar/rechazar.

### Criterios de salida (DoD Fase 2)

- **[Estados]** transiciones válidas y protegidas por rol.
- **[Auditoría]** cada transición genera evento/log.
- **[Firma]** firma no se incrusta antes de aprobación.

---

## 7. Fase 3 — Control administrativo: pagos y documentación (US-09..US-11)

### Objetivo

Bloquear automáticamente certificados por pendientes institucionales y restringir descarga.

### Entregables

#### Hito 3.1 — Integración financiera (US-09)

- Adaptador de integración (mock primero; real después).
- Use case `CheckFinancialStatus`.
- Cambio automático a `blocked_payment`.

#### Hito 3.2 — Integración documental (US-10)

- Adaptador de integración (mock primero; real después).
- Use case `CheckDocumentStatus`.
- Cambio automático a `blocked_documents`.

#### Hito 3.3 — Restricción de visualización (US-11)

- En portal público:
  - participante ve estado,
  - no puede descargar PDF si está bloqueado.
- Mostrar mensaje “pendiente de regularización”.

### Criterios de salida (DoD Fase 3)

- **[Bloqueos]** estados de bloqueo automáticos.
- **[Portal]** no expone PDF cuando existe bloqueo.

---

## 8. Fase 4 — Experiencia completa + analítica (US-12..US-15)

### Objetivo

Completar la experiencia institucional:

- historial filtrable,
- verificación robusta,
- dashboard ejecutivo,
- reportes exportables.

### Entregables

#### Hito 4.1 — Historial filtrable (US-12)

- Historial por participante:
  - filtro por área,
  - filtro por estado.

#### Hito 4.2 — Código hash único (US-13)

- Campo `publicVerificationCode` (hash) + ruta pública de verificación.
- Mostrar datos esenciales.
- Indicar bloqueos.

#### Hito 4.3 — Dashboard macro (US-14)

- Métricas:
  - total emitidos,
  - por recinto,
  - por área,
  - pendientes de firma,
  - bloqueados,
  - tendencia mensual.
- Read-models agregados para evitar queries caras.

#### Hito 4.4 — Reportes exportables (US-15)

- Export por recinto/área/estado.
- CSV/Excel, con paginación.

### Criterios de salida (DoD Fase 4)

- **[Analítica]** dashboard no depende de descargar certificados a cliente.
- **[Verificación]** hash + folio funcionan y reportan estado/bloqueo.
- **[Reportes]** export segmentado.

---

## 9. Plan transversal (aplica en todas las fases)

### 9.1 Pruebas

- Unit tests para use cases críticos:
  - generación de folio,
  - transiciones de estado,
  - bloqueo por pago/documentos.
- Integración:
  - server actions/use cases + repos.
- E2E mínimo:
  - crear -> verificar -> firmar -> publicar -> consultar público.

### 9.2 Observabilidad

- Logs estructurados para errores de server actions.
- Métricas básicas de uso (cantidad de verificaciones, bloqueos, firmas, etc.).

### 9.3 Migrations

- Scripts para backfill:
  - agregar `campusId/academicAreaId` a certificados existentes,
  - migración de status (active -> disponible o emitido, según regla definida).

---

## 10. Checklist final de “Sistema Institucional”

- **[Seguridad]** reglas cerradas, roles, auditoría.
- **[Gobernanza]** recintos + áreas + tipologías.
- **[Ciclo de vida]** estados completos + firma controlada + notificaciones.
- **[Bloqueos]** pagos/documentos integrados + restricción pública.
- **[Analítica]** dashboard macro + export segmentado.
- **[Modularidad]** UI -> use cases, infra aislada, módulos con contratos.

---

**Fin del plan.**
