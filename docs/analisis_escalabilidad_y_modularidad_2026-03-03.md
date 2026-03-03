# Análisis de Escalabilidad y Modularidad del SIGCE (Diseño para Crecer sin Romper)

**Fecha:** 2026-03-03  
**Repositorio:** `c:\Users\LENOVO i7 7TH GAMERS\Downloads\sigce`  
**Documento complementario a:** `docs/informe_analisis_sistema_y_requerimientos_2026-03-03.md`  

---

## 1. Objetivo

Evaluar si el sistema SIGCE, tal como está hoy, es:

- **Escalable** (en volumen de datos/uso y en costo/operación).
- **Modular** (si cambiar/ampliar el módulo “Gestor de Certificados” no afecta módulos no relacionados).

Y proponer una estructura “lo más escalable posible” para:

- aislar cambios por módulo,
- reducir acoplamientos,
- permitir sustituir infraestructura (ej. Firebase -> SQL) sin reescribir todo.

---

## 2. Qué significa “modular” en este proyecto

Para este contexto, **modular** no es solo “carpetas separadas”, sino:

- **Límites claros (boundaries):** cada módulo tiene su modelo, sus reglas, y su API interna.
- **Dependencias dirigidas:** los módulos no se llaman entre sí “a lo loco”; se comunican por contratos.
- **Infraestructura aislada:** UI y casos de uso no dependen directamente de Firebase/Firestore.
- **Cambios localizados:** si refactorizas Certificados, no se rompen Plantillas, Reportes o Acceso.

---

## 3. Diagnóstico actual (as-is): ¿es modular y escalable?

### 3.1 Modularidad (as-is)

**Señales positivas (sí ayuda a escalar por módulos):**

- Existe intención de **Clean Architecture** (capas `domain/`, `application/`, `infrastructure/`).
- Hay **contratos** (ej. `ICertificateRepository`) y **use cases** (`CreateCertificate`, `GenerateFolio`).
- Existen repositorios separados por entidad (certificados, estudiantes, plantillas, accesos).

**Señales de acoplamiento (limitan modularidad):**

- **UI consume infraestructura directamente** (ej. páginas que instancian `new FirebaseCertificateRepository()`), lo que:
  - hace difícil “swapear” repositorios (Firebase -> SQL) sin tocar UI,
  - mezcla lógica de datos con UI,
  - dificulta pruebas.
- **Server Actions** y páginas usan repos de Firebase directamente en algunos flujos.
- **Autorización** es parcial y mezcla cookie + validación cliente (riesgo para endurecimiento y para evolución).
- **UploadThing** está integrado sin auth real (es infraestructura acoplada a UI/flujo).

**Conclusión modularidad (as-is):**

- El proyecto es **modular a medias**.
- Tiene base suficiente para evolucionar, pero requiere introducir:
  - un “core” de aplicación (use cases) como capa obligatoria,
  - DI (inyección) y factorías,
  - boundaries explícitos entre módulos.

### 3.2 Escalabilidad (as-is)

**Escala bien hoy:**

- Generación de folio con contador transaccional (`reserveNextSequence`) -> evita colisiones.
- Verificación pública simple por folio/matrícula (consultas puntuales).
- PDF client-side (no consume server compute).

**Escala mal hoy:**

- Listados que cargan cientos de certificados en cliente (`list(500)`) para calcular reportes.
- Agregaciones “en el cliente” como fallback (ej. programas).
- Falta de paginación real en listados generales.
- Regla de lectura pública en certificados (`allow read: if true`) puede disparar costos si no se controla la indexación/queries.

**Conclusión escalabilidad (as-is):**

- **Sí es escalable para MVP/piloto**.
- Para “institucional” necesitas:
  - queries paginadas,
  - índices,
  - estadísticas pre-agregadas por módulo,
  - roles y reglas de seguridad que reduzcan superficie de lectura.

---

## 4. Mapa de acoplamientos actuales (dónde duele al crecer)

### 4.1 Acoplamiento UI -> Firebase repos

Patrón actual típico:

- Página (React) crea repositorio Firebase.
- Página consulta Firestore.
- Página arma métricas o reglas de negocio.

**Riesgo:**

- refactor de certificados impacta muchas pantallas.

**Recomendación:**

- La UI debe llamar **use cases** (application layer), no repositorios concretos.

### 4.2 Acoplamiento Auth/Security

- `middleware.ts` depende de cookie `session=1` seteada en cliente.
- Acceso admin se valida en `DashboardLayout` en cliente.

**Riesgo:**

- La seguridad no está “centralizada” y no es modular.

**Recomendación:**

- Centralizar auth/authorization (idealmente verificación server-side) y exponer “servicios” de seguridad consumibles por módulos.

### 4.3 Acoplamiento Upload/Assets

- UploadThing funciona como infraestructura lateral.

**Riesgo:**

- Cambiar proveedor de uploads implica tocar UI + endpoints.

**Recomendación:**

- Abstraer un `IFileStorageService` (o “AssetService”) con adaptadores.

### 4.4 Acoplamiento de Reportes/Analítica

- Reportes leen y calculan desde `certificates` en cliente.

**Riesgo:**

- crece el costo y la latencia.

**Recomendación:**

- “Read models” y agregados por módulo (ej. `program_stats`, `dashboard_stats`).

---

## 5. Propuesta: arquitectura por módulos (bounded contexts)

### 5.1 Módulos recomendados

- **Identity & Access**
  - usuarios, roles, solicitudes de acceso, scopes.
- **Certification (Gestor de Certificados)**
  - emisión, estados, folios, verificación.
- **Participants (Estudiantes/Participantes)**
  - perfil, historial, vínculo con certificados.
- **Templates & Rendering**
  - plantillas, assets, render PDF.
- **Analytics & Reporting**
  - métricas, exportaciones, dashboards.
- **Integrations**
  - finanzas, académico, notificaciones.
- **Audit & Governance**
  - bitácora, trazabilidad, políticas.

> Nota: esto no obliga a microservicios. Puede ser **monorepo modular** dentro del mismo Next.js.

### 5.2 Regla de oro de dependencias

- `ui` -> `application` -> `domain`
- `infrastructure` implementa puertos (`interfaces`) definidos en `domain` o `application`.
- Los módulos no deben importar `Firebase*Repository` desde UI.

### 5.3 Contratos por módulo (puertos)

Ejemplos (conceptuales):

- **Certification**
  - `ICertificateRepository`
  - `IFolioService`
  - `ICertificateVerificationService`

- **Templates & Rendering**
  - `ITemplateRepository`
  - `ICertificatePdfRenderer`
  - `IAssetStorage`

- **Identity & Access**
  - `IAccessControlService` (authorize)
  - `IUserRepository`

- **Audit**
  - `IAuditLogRepository`

### 5.4 Comunicación entre módulos

Dos estilos posibles:

- **Directa (sin eventos)**
  - Un use case puede usar 2 repos (ej. emitir certificado y registrar auditoría).
  - Simple y rápido, pero aumenta acoplamiento si no se cuidan contratos.

- **Event-driven (recomendado para independencia)**
  - Certification emite evento `CertificateIssued`.
  - Analytics/Audit/Notifications reaccionan.

Para este proyecto, lo más realista es:

- Empezar “directo” pero **con interfaces**, y luego introducir eventos.

---

## 6. Propuesta de organización de carpetas (sin reescribir todo)

Sin cambiar el framework (Next.js), la mejor evolución es:

```
/lib
  /modules
    /certification
      /domain
      /application
      /infrastructure
    /identity
      /domain
      /application
      /infrastructure
    /templates
      /domain
      /application
      /infrastructure
    /analytics
      /domain
      /application
      /infrastructure
    /audit
      /domain
      /application
      /infrastructure

  /shared
    /kernel        # tipos base, Result, errores, utils
    /infra         # firebase init, http client, config
```

**Qué ganas con esto:**

- Puedes cambiar `certification/infrastructure` sin tocar `analytics`.
- Puedes testear `certification/application` sin Firebase.

---

## 7. Plan de migración incremental (sin romper el MVP)

### Fase 0: “Congelar” contratos

- Definir interfaces por módulo.
- Identificar “qué expone” cada módulo.

### Fase 1: UI deja de instanciar repos concretos

- Crear factorías o contenedor simple:
  - `getCertificateService()` devuelve un servicio/use case.
- Cambiar páginas para llamar a `application`.

### Fase 2: Consolidar la lógica de negocio en `application`

- Lo que hoy está en páginas (reportes, filtros, búsquedas) pasa a:
  - `GetCertificatesList` (paginado)
  - `ExportCertificatesCsv`
  - `GetProgramsStats`

### Fase 3: Separar Read Models

- Analytics no debe depender de leer 500 certificados.
- Crear documentos agregados:
  - `dashboard_stats/{date}`
  - `program_stats/{programId}` (ya existe)

### Fase 4: Eventos (opcional, cuando crezca)

- Introducir un `EventBus` simple.
- Emitir eventos en Certification.

---

## 8. ¿Es escalable “cambiar el Gestor de Certificados” sin afectar todo?

### 8.1 Hoy (as-is)

**No al 100%.** Cambiar certificados impacta:

- Reportes (leen certificados directo).
- Verify público (consume repos directo).
- Dashboard stats (lee certificados directo).

### 8.2 Con la propuesta modular

**Sí, en gran medida**, si:

- UI depende de `CertificationService` (use cases) y no de repos.
- Analytics consume read models o APIs internas.
- Verificación pública consume un caso de uso `VerifyCertificate` que encapsula la lógica.

---

## 9. Recomendación final (la más recomendable)

- **No rehacer** el sistema.
- **Sí reorganizar por módulos** manteniendo Next.js.
- Prioridad de mayor retorno:

1. **Eliminar UI -> FirebaseRepository directo** (mover a use cases + DI simple).
2. **Aislar seguridad** (autorización consistente y reglas Firestore cerradas).
3. **Read models para analytics/reportes**.

Eso te da lo más importante:

- independencia por módulos,
- escalabilidad razonable,
- posibilidad real de migración a otra infraestructura.

---

## 10. Apéndice: checklist de “modularidad real”

- [ ] Ningún archivo en `app/` importa `Firebase*Repository` directamente.
- [ ] Todo acceso a datos pasa por `application/*use-cases*`.
- [ ] Cada módulo tiene sus interfaces (puertos).
- [ ] Reglas de Firestore no permiten escrituras “por estar logueado”; requieren rol.
- [ ] Reportes no requieren descargar cientos de documentos a cliente.
- [ ] Integraciones externas están detrás de adaptadores.

---

**Fin del documento.**
