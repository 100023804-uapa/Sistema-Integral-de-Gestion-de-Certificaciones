# Informe de Análisis Exhaustivo del Sistema SIGCE + Trazabilidad de Requerimientos (Pasantía)

**Fecha:** 2026-03-03  
**Proyecto:** SIGCE — Sistema Integral de Gestión de Certificaciones  
**Fuente de requerimientos:** `docs/requerimientos_pdf.txt` (extraído de `Requerimientos-Pasantia-Proyecto.pdf`)  
**Repositorio analizado:** `c:\Users\LENOVO i7 7TH GAMERS\Downloads\sigce`  

---

## 1. Objetivo del informe

- **Identificar todo lo que existe hoy en el sistema** (stack, módulos, rutas, repositorios, entidades, persistencia, reglas, seguridad).
- **Extraer lo que piden los requerimientos del PDF** (épicas e historias US-01..US-17).
- **Comparar requerimientos vs implementación actual** (matriz de trazabilidad):
  - evidencia en el código,
  - brecha / riesgo,
  - propuesta de implementación,
  - archivos/áreas afectadas.
- Dejar una base clara para implementar lo que falta, sin perder lo ya construido.

---

## 2. Resumen ejecutivo (estado actual)

El repositorio contiene un **MVP funcional** para el ciclo principal de certificados:

- Emisión de certificados (manual + importación desde Excel).
- Generación de folios y QR de verificación.
- Consulta pública de certificados por folio o matrícula (`/verify`).
- Detalle público del certificado (`/verify/[id]`), con QR.
- Gestión de plantillas visuales (builder drag & drop) con almacenamiento de imágenes vía UploadThing.
- Gestión de acceso administrativo (solicitudes + aprobación) vía Firestore.

Sin embargo, el PDF exige una evolución significativa hacia un sistema institucional con:

- Segmentación por **recinto**, clasificación por **área académica**, y **tipología** de certificados.
- **Máquina de estados** completa del ciclo de vida del certificado.
- **Firma digital controlada** por aprobación, con notificación a firmantes.
- Bloqueos por **pago** y **documentación** con integraciones.
- Dashboard ejecutivo (métricas macro: por recinto/área/bloqueos/pending firma) y reportes exportables.
- **RBAC real** (coordinador/verificador/firmante/admin) y auditoría detallada por transición.

---

## 3. Requerimientos (según PDF)

### 3.1 Épicas y user stories

Fuente: `docs/requerimientos_pdf.txt`

- **ÉPICA 1: Segmentación por Recinto**
  - **US-01 Parametrización de Recintos**
    - CRUD de recintos.
    - Campo obligatorio `recinto_id` en certificado.
    - No permitir emisión sin recinto asociado.
  - **US-02 Filtro por Recinto**
    - Filtro en listado.
    - Métrica en dashboard.
    - Reporte exportable por recinto.

- **ÉPICA 2: Clasificación por Área Académica**
  - **US-03 Parametrización de Áreas**
  - **US-04 Certificados por Área**
    - Campo obligatorio `area_academica`.
    - Visualización agrupada en dashboard.
    - Historial del participante filtrable por área.

- **ÉPICA 3: Tipología de Certificados**
  - **US-05 Configuración de Tipos**
    - Tipos: horizontal, vertical, institucional macro.
    - Selector de tipo.
    - Plantilla diferenciada por tipo.
    - Macro: solo estructura sin firma automática.

- **ÉPICA 4: Flujo de Aprobación y Firma**
  - **US-06 Flujo de Estados**
    - Estados mínimos: borrador, espera verificación, verificado, espera firma, firmado, emitido, disponible, rechazado, bloqueado por pago, bloqueado por documentación, bloqueado administrativo.
  - **US-07 Notificación a Firmante**
    - Notificación automática.
    - Listado consolidado.
    - Acción aprobar/rechazar.
  - **US-08 Firma Digital Controlada**
    - Firma parametrizada por usuario.
    - Registro en auditoría.
    - No permitir generación con firma sin aprobación.

- **ÉPICA 5: Control Administrativo (Pago y Documentación)**
  - **US-09 Validación Financiera**
    - Integración con sistema financiero.
    - Validación en tiempo real.
    - Cambio automático a “Bloqueado por pago”.
  - **US-10 Validación Documental**
    - Integración con sistema académico.
    - Cambio a “Bloqueado por documentación”.
  - **US-11 Restricción de Visualización**
    - Participante ve estado pero no descarga si hay pendientes.

- **ÉPICA 6: Historial del Participante y Verificación Pública**
  - **US-12 Historial Filtrable** (por área y estado)
  - **US-13 Código de Verificación**
    - Código hash único.
    - Consulta pública.
    - Mostrar datos esenciales.
    - Indicar si está bloqueado.

- **ÉPICA 7: Dashboard Ejecutivo y Analítica**
  - **US-14 Métricas Globales**
    - Total emitidos.
    - Por recinto.
    - Por área.
    - Pendientes de firma.
    - Bloqueados.
    - Tendencia mensual.
  - **US-15 Reportes Exportables**

- **ÉPICA 8: Seguridad, Auditoría y Gobernanza**
  - **US-16 Registro de Auditoría**
    - Usuario, fecha/hora, acción, transición de estado.
  - **US-17 Control de Roles**
    - Roles mínimos: Coordinador, Verificador, Firmante, Administrador.

---

## 4. Sistema actual (lo que hay hoy)

### 4.1 Stack tecnológico

- **Framework:** Next.js 15 (`next` en `package.json`).
- **UI:** React 19, TailwindCSS 4.
- **Persistencia/Auth/Storage:** Firebase (Firestore, Auth, Storage), configuración en `lib/firebase.ts`.
- **Carga de archivos:** UploadThing (`uploadthing`, `@uploadthing/react`).
- **PDF:** `jspdf` + `qrcode` (generación client-side) en `lib/application/utils/pdf-generator.ts`.
- **Email:** `nodemailer` (Gmail) en `app/actions/send-email.ts`.

### 4.2 Estructura del repo (alto nivel)

- `app/`: rutas (public + dashboard), server actions, API routes.
- `components/`: UI components, dashboard components.
- `lib/`:
  - `domain/`: entidades y contratos.
  - `application/use-cases/`: casos de uso (`CreateCertificate`, `GenerateFolio`, `GetDashboardStats`).
  - `infrastructure/repositories/`: repositorios concretos Firebase.
  - `contexts/`: sesión/auth.

### 4.3 Rutas principales (Next.js App Router)

- **Público:**
  - `/` (`app/page.tsx`) landing.
  - `/verify` (`app/verify/page.tsx`) consulta pública.
  - `/verify/[id]` (`app/verify/[id]/page.tsx`) detalle público (busca por id o por folio).

- **Acceso:**
  - `/login` (`app/login/page.tsx`) login admin + rol “student” redirige a `/verify`.
  - `/request-access` (`app/request-access/page.tsx`) solicitud de acceso admin.
  - `/register-admin` (`app/register-admin/page.tsx`) registro de admin (requiere whitelist en `access_users`).

- **Dashboard (Admin):**
  - `/dashboard` (`app/dashboard/page.tsx`) resumen (stats parciales + notificaciones mock).
  - `/dashboard/certificates` + subrutas `create`, `import`, `[id]`.
  - `/dashboard/templates` + `create`.
  - `/dashboard/users` (gestión de solicitudes y admins).
  - `/dashboard/reports` (métricas básicas + export CSV).
  - `/dashboard/validate` (validación interna básica por folio/uuid).

### 4.4 Server Actions

- `app/actions/consult-certificates.ts`:
  - Consulta por folio o studentId.
  - Devuelve un DTO resumido para `/verify`.
- `app/actions/import-certificates.ts`:
  - Importación masiva desde Excel (desde UI que parsea con `xlsx`).
  - Crea/actualiza `students` y crea `certificates` si viene `Folio`.
- `app/actions/send-email.ts`:
  - Envío por Gmail (Nodemailer) de certificado / solicitud admin.

### 4.5 Modelo de dominio actual

- `Certificate` (`lib/domain/entities/Certificate.ts`)
  - `status`: **solo** `'active' | 'revoked' | 'expired'`.
  - `type`: `'CAP' | 'PROFUNDO'`.
  - `history?`: existe campo opcional, pero **no hay auditoría real implementada**.

- `Student` (`lib/domain/entities/Student.ts`)
  - `id` (matrícula), `cedula?`, `career?`, etc.

- `CertificateTemplate` (`lib/domain/entities/Template.ts`)
  - Fondo + elementos (text/variable/qr/image).

### 4.6 Persistencia (Firestore) — colecciones inferidas

Por repositorios y reglas:

- `certificates` (certificados emitidos)
- `students` (participantes)
- `templates` (plantillas)
- `folio_counters` (contador transaccional por prefijo/año/tipo)
- `program_stats` (estadísticas agregadas por programa)
- `access_users` (whitelist de admin)
- `access_requests` (solicitudes de acceso)

### 4.7 Seguridad actual

- `middleware.ts`: protege rutas `/dashboard` y `/admin` con cookie `session=1`.
  - Nota: la cookie se setea del lado cliente (`AuthContext` y `/login`), por lo que **no prueba identidad real por token**.

- `firestore.rules`:
  - Certificados: `allow read: if true` (necesario para verificación pública), pero `create/update` solo requiere `isSignedIn()`.
  - `access_users`: permite read/write a cualquier autenticado (riesgo: un user autenticado podría agregarse como admin si no se blinda con reglas adicionales).

- `storage.rules`:
  - Solo permite `profile_images/{uid}` para el dueño.
  - Todo lo demás denegado.

- UploadThing: `app/api/uploadthing/core.ts` retorna `userId: "user"` (sin auth real) -> riesgo.

---

## 5. Hallazgos clave (gap técnico vs PDF)

### 5.1 Gap de modelo de estados

El PDF exige una máquina de estados con más de 10 estados (borrador, verificado, firmado, emitido, disponible, bloqueos, etc.).

Hoy:

- `Certificate.status` es solo `active/revoked/expired`.
- `/dashboard/validate` valida básicamente `active` como “válido”.

**Impacto:** no se puede implementar “pendientes de firma”, “bloqueado por pago”, “bloqueado por documentación”, ni auditoría de transiciones sin ampliar el modelo.

### 5.2 Gap de segmentación institucional (recintos/áreas)

Hoy:

- `Certificate` no tiene `recinto_id` ni `area_academica`.
- No hay CRUD de recintos ni áreas.

### 5.3 Gap de roles (RBAC)

Hoy:

- Existe whitelist de admins en `access_users`, pero el repositorio fuerza `role: 'admin'`.
- No hay roles `coordinador/verificador/firmante`.

### 5.4 Gap de firma digital

Hoy:

- Plantillas permiten subir “imagen/firma” como elemento, pero:
  - no existe proceso de aprobación,
  - no existe “firmante” como rol,
  - no existe bloqueo para impedir firmar antes de aprobar.

### 5.5 Gap de integraciones (finanzas / académico)

Hoy:

- No hay integraciones.
- No existe un “estado financiero” ni “documentación pendiente” en el certificado.

### 5.6 Dashboard ejecutivo y reportes

Hoy:

- `GetDashboardStats` calcula `totalIssued` y programas únicos (aprox.) con las últimas 50 emisiones.
- `/dashboard/reports` exporta CSV básico y muestra tendencia 6 meses, pero:
  - no segmenta por recinto ni área,
  - no distingue “pendientes de firma” (no existe estado),
  - no calcula “bloqueados” (no existe estado).

---

## 6. Matriz de trazabilidad (US-01..US-17)

> Leyenda

- **Implementado:** existe funcionalidad completa.
- **Parcial:** existe base pero falta requisito clave.
- **No implementado:** no existe.

### US-01: Parametrización de Recintos

- **Estado:** No implementado.
- **Evidencia:** no existe colección/repo/páginas “recintos”; `Certificate` no tiene `recinto_id`.
- **Brecha:** no se puede emitir certificado segmentado.
- **Propuesta:**
  - Crear entidad `Campus`/`Recinto` y colección `campuses`.
  - Agregar campo `campusId` (obligatorio) en certificado.
  - UI: CRUD en dashboard.

### US-02: Filtro por Recinto

- **Estado:** No implementado.
- **Evidencia:** filtros en `/dashboard/certificates` son visuales (no funcionan) y no existe `campusId`.
- **Propuesta:**
  - Filtro Firestore por `campusId`.
  - Dashboard: métricas por recinto.
  - Reporte CSV filtrado.

### US-03: Parametrización de Áreas

- **Estado:** No implementado.
- **Propuesta:** colección `academic_areas` + CRUD.

### US-04: Certificados por Área

- **Estado:** No implementado.
- **Brecha:** `Certificate` no tiene `area`.
- **Propuesta:**
  - Campo `academicAreaId` obligatorio.
  - Dashboard agrupado por área.
  - Historial filtrable del participante.

### US-05: Configuración de Tipos (horizontal/vertical/macro)

- **Estado:** Parcial.
- **Evidencia:** existe `Certificate.type` pero solo `CAP/PROFUNDO` (no orientaciones ni macro) (`lib/domain/entities/Certificate.ts`).
- **Plantillas:** builder permite layouts, pero no hay “tipología” formal.
- **Propuesta:**
  - Separar conceptos:
    - `certificateProgramType`: CAP/PROFUNDO (si aplica al negocio)
    - `templateOrientationType`: horizontal/vertical
    - `institutionalMacro`: bandera o tipo
  - Reglas para macro: estructura sin firma automática.

### US-06: Flujo de Estados

- **Estado:** No implementado.
- **Evidencia:** status actual es reducido; no existe transición.
- **Propuesta:**
  - Ampliar `CertificateStatus` para incluir estados del PDF.
  - Implementar un “state machine” en `lib/application/use-cases`.
  - Proteger transiciones por rol.

### US-07: Notificación a Firmante

- **Estado:** Parcial (infraestructura de email existe, pero no para este caso).
- **Evidencia:** `app/actions/send-email.ts` solo maneja:
  - email al participante,
  - email de solicitud admin.
- **Propuesta:**
  - Evento: cuando un certificado pasa a `pending_signature`, notificar a firmantes.
  - Módulo de bandeja consolidada.

### US-08: Firma Digital Controlada

- **Estado:** Parcial (plantillas permiten insertar firma como imagen, pero no control).
- **Brecha:** no se evita “firma incrustada” ni se registra auditoría.
- **Propuesta:**
  - Asociar firmas a usuarios firmantes (`signatures/{uid}` o campo en perfil).
  - Firma solo se aplica al render cuando el estado sea `signed`/`issued`.
  - Auditoría obligatoria.

### US-09: Validación Financiera

- **Estado:** No implementado.
- **Propuesta:**
  - Integración por API/endpoint del sistema financiero.
  - Campo `financialStatus` o `blockedReason`.
  - Job/trigger (o verificación en tiempo real al consultar).

### US-10: Validación Documental

- **Estado:** No implementado.
- **Propuesta:** similar a US-09, con sistema académico.

### US-11: Restricción de Visualización

- **Estado:** No implementado.
- **Evidencia:** `/verify/[id]` siempre muestra el certificado si existe.
- **Propuesta:**
  - Condicionar en UI pública:
    - si `status` es bloqueado, mostrar datos esenciales + mensaje, sin PDF.

### US-12: Historial Filtrable (participante)

- **Estado:** Parcial.
- **Evidencia:** `/verify` permite consultar por matrícula y ver lista de resultados.
- **Brecha:** no existe “mi historial autenticado” ni filtros por área/estado.
- **Propuesta:**
  - Definir experiencia del participante: login (o acceso por matrícula + verificación) y filtros.

### US-13: Código hash único y verificación pública

- **Estado:** Parcial.
- **Evidencia:**
  - existe `folio` + `qrCodeUrl` (`FirebaseCertificateRepository.save`).
  - verificación pública existe.
- **Brecha:** el PDF pide “hash único” explícito; hoy el folio es un ID humano.
- **Propuesta:**
  - Generar `publicVerificationCode` (hash) adicional.
  - Permitir validación por hash.
  - Mostrar si está bloqueado.

### US-14: Métricas Globales (por recinto/área/bloqueados/pending firma)

- **Estado:** Parcial.
- **Evidencia:** `GetDashboardStats` solo calcula total activos, y programas (aprox). `pendingValidation` es placeholder.
- **Propuesta:**
  - Rediseñar estadísticas con queries/indexes.
  - Agregados por recinto/área.

### US-15: Reportes Exportables

- **Estado:** Parcial.
- **Evidencia:** `/dashboard/reports` exporta CSV básico.
- **Brecha:** no filtra por recinto/área y no incluye estados del ciclo completo.

### US-16: Registro de Auditoría

- **Estado:** No implementado.
- **Evidencia:** `Certificate.history?` existe pero no se escribe.
- **Propuesta:**
  - Colección `audit_logs` o subcolección por certificado.
  - Registrar cada transición + actor + timestamps.

### US-17: Control de Roles

- **Estado:** Parcial.
- **Evidencia:** whitelist de admins (`access_users`) existe, pero no más roles.
- **Propuesta:**
  - Modelo de usuario/rol en Firestore.
  - Enforcement server-side (idealmente con custom claims o verificación de token).

---

## 7. Propuesta de diseño de datos para cubrir el PDF (alto nivel)

### 7.1 Colecciones sugeridas

- `campuses` (recintos)
  - `id`, `name`, `isActive`
- `academic_areas`
  - `id`, `name`, `isActive`
- `roles`
  - (o enum) `admin`, `coordinator`, `verifier`, `signer`
- `users`
  - `uid`, `email`, `roles: string[]`, `campusScope?: string[]`
- `certificates`
  - agregar: `campusId`, `academicAreaId`, `status` ampliado, `blockedReason?`, `publicVerificationCode?`, `approvedBy?`, `signedBy?`
- `audit_logs`
  - `entityType`, `entityId`, `action`, `fromStatus`, `toStatus`, `actorUid`, `createdAt`, `metadata`

### 7.2 Reglas e invariantes

- No emitir (pasar a `issued/available`) si falta `campusId` o `academicAreaId`.
- No permitir `signed` sin aprobación previa.
- Bloqueos por pago/documentación deben impedir descarga pública.

---

## 8. Riesgos actuales (operación / seguridad)

- **Middleware basado en cookie “session=1”** sin validación criptográfica de identidad.
- **Firestore rules** permiten que cualquier usuario autenticado escriba en `access_users`.
- **UploadThing sin auth** (`userId: "user"`).

---

## 9. Backlog recomendado para implementar el PDF (orden sugerido)

### Sprint 1 (Gobernanza base)

- US-17 roles (modelo + enforcement mínimo).
- US-01 recintos (CRUD + campo obligatorio).
- US-03 áreas (CRUD + campo obligatorio).
- US-05 tipología (definición y relación con plantillas).

### Sprint 2 (Estados + firma + auditoría)

- US-06 máquina de estados.
- US-16 auditoría.
- US-08 firma digital controlada.
- US-07 notificaciones a firmante.

### Sprint 3 (Bloqueos e integraciones)

- US-09 finanzas.
- US-10 documental.
- US-11 restricción de visualización.

### Sprint 4 (Visibilidad y reportes)

- US-12 historial filtrable.
- US-13 hash público + verificación completa.
- US-14 dashboard ejecutivo.
- US-15 reportes exportables segmentados.

---

## 10. Archivos clave a tocar (guía rápida)

- **Modelo:**
  - `lib/domain/entities/Certificate.ts`
  - `lib/infrastructure/repositories/FirebaseCertificateRepository.ts`

- **Seguridad:**
  - `middleware.ts`
  - `firestore.rules`
  - `app/api/uploadthing/core.ts`

- **Dashboard/Reportes:**
  - `lib/application/use-cases/GetDashboardStats.ts`
  - `app/dashboard/reports/page.tsx`

- **Roles/Acceso:**
  - `lib/infrastructure/repositories/FirebaseAccessRepository.ts`
  - `app/dashboard/users/page.tsx`

---

## 11. Cierre

- El sistema actual cubre bien el **MVP de emisión y verificación básica**.
- El PDF pide un sistema más institucional: **segmentación**, **RBAC**, **máquina de estados**, **firma controlada**, **integraciones**, **auditoría** y **analítica**.
- La implementación recomendada es **evolutiva** (ampliar modelo y casos de uso), evitando rehacer el MVP.

---

**Fin del informe.**
