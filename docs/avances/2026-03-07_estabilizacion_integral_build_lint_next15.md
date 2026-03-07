# Avance: Estabilización Integral de Build, Typecheck y Lint

**Fecha:** 7 de Marzo de 2026  
**Estado:** ✅ Completado  
**Referencia Git:** Commit detallado de estabilización integral registrado al cierre de esta sesión

---

## Resumen Ejecutivo

Se ejecutó una intervención de estabilización integral sobre el proyecto para recuperar un estado operativo real de producción. El repositorio no estaba fallando por un único bug, sino por una cadena de regresiones acumuladas en el contenedor principal, contratos de dominio, rutas dinámicas incompatibles con Next.js 15 y varios errores de tipado y lint que impedían compilar y validar el sistema de forma confiable.

El resultado de esta sesión es:

- `pnpm exec tsc --noEmit` en verde
- `pnpm run lint` en verde, sin errores
- `pnpm run build` en verde

---

## Problemas Resueltos

### 1. Contenedor Central Inconsistente

El archivo `lib/container.ts` había quedado en un estado intermedio:

- Importaba el repositorio de estudiantes desde un archivo incorrecto.
- Seguía usando `getCertificateTemplateRepository()` sin exportarlo.
- Instanciaba `FirebaseTemplateRepository` sin importarlo.
- Inyectaba repositorios equivocados en use cases de historial estudiantil.
- Pasaba argumentos incompatibles a `DeleteAcademicAreaUseCase`.

**Corrección aplicada:**

- Restauración del wiring correcto del contenedor.
- Reintroducción de `getCertificateTemplateRepository()`.
- Separación explícita entre:
  - `FirebaseStudentRepository` para CRUD de estudiantes
  - `FirebaseStudentCertificateRepository` para historial y lectura de certificados del estudiante
- Reexport de `QueryDocumentSnapshot` para compatibilidad con páginas existentes.

---

### 2. Contrato de Dominio Mezclado para Certificados

`ICertificateRepository` estaba mezclando dos responsabilidades distintas:

- Escritura/gestión del agregado `Certificate`
- Consultas del historial estudiantil y read-models de certificados

Eso rompía la implementación de repositorios concretos y forzaba inyecciones incorrectas en varios use cases.

**Corrección aplicada:**

- Limpieza de `ICertificateRepository` para dejar sólo operaciones del agregado `Certificate`.
- Creación de `IStudentCertificateRepository` para el read-model estudiantil.
- Actualización de:
  - `GetStudentCertificatesUseCase`
  - `GetCertificateDetailsUseCase`
  - `DownloadCertificateUseCase`
  - `FirebaseStudentCertificateRepository`

---

### 3. Incompatibilidad con Next.js 15 en Rutas Dinámicas

Tres rutas seguían usando el contrato anterior de parámetros:

- `app/api/admin/campuses/[id]/route.ts`
- `app/api/admin/certificate-types/[id]/route.ts`
- `app/api/admin/roles/[id]/route.ts`

**Error observado:**

Next.js 15 esperaba `context.params` como `Promise<{ id: string }>` y el código seguía usando `{ params: { id: string } }`.

**Corrección aplicada:**

- Migración al contrato correcto de Next.js 15.
- Resolución explícita de `await context.params`.

---

### 4. Tipos y DTOs Desalineados

Se corrigieron varios puntos donde el modelo de tipos y el código ya no coincidían:

- `CreateCertificateDTO` requería `campusId`, pero la importación desde Excel no lo enviaba.
- `SignatureRequest` era consumido con `rejectionReason` en UI, pero el tipo no lo definía.
- `FirebaseDigitalSignatureRepository` no propagaba `rejectionReason` al mapper.
- Varias páginas usaban `JSX.Element` y fallaban con la configuración actual del proyecto.
- El sidebar trataba `href` como opcional y lo pasaba a `Link` sin cerrar ese contrato.

**Corrección aplicada:**

- Validación y mapeo de `campusId` en importación Excel.
- Extensión del tipo `SignatureRequest`.
- Actualización de mappers de firma digital.
- Sustitución de `JSX.Element` por `ReactElement`.
- Endurecimiento del `href` efectivo en `Sidebar`.

---

### 5. Errores Bloqueantes de Lint

`eslint` todavía fallaba por:

- Comillas sin escapar en JSX
- Un `setState` derivado dentro de `useEffect`

**Corrección aplicada:**

- Escape correcto de textos con entidades HTML.
- Refactor del filtrado en `/dashboard/student/certificates` hacia `useMemo`, eliminando el patrón de estado derivado dentro del efecto.

Resultado:

- `pnpm run lint` ahora termina sin errores
- Permanecen sólo advertencias no bloqueantes

---

### 6. Higiene de Compilación

El proyecto seguía incluyendo archivos temporales o alternos en el scope del compilador:

- `lib/container_backup.ts`
- `lib/container_new.ts`
- `lib/container_simple.ts`

Además, `tsc` generó `tsconfig.tsbuildinfo`, que no debía quedar visible para el control de versiones.

**Corrección aplicada:**

- Exclusión de los contenedores alternos desde `tsconfig.json`.
- Inclusión de `*.tsbuildinfo` en `.gitignore`.

---

## Archivos Impactados

### Núcleo y Dominio

- `lib/container.ts`
- `lib/domain/repositories/ICertificateRepository.ts`
- `lib/domain/repositories/IStudentCertificateRepository.ts`
- `lib/usecases/student/*`
- `lib/usecases/certificateTemplate/CreateTemplateUseCase.ts`

### Infraestructura

- `lib/infrastructure/repositories/FirebaseStudentCertificateRepository.ts`
- `lib/infrastructure/repositories/FirebaseDigitalSignatureRepository.ts`
- `lib/infrastructure/repositories/MockCertificateRepository.ts`

### API

- `app/api/admin/campuses/[id]/route.ts`
- `app/api/admin/certificate-types/[id]/route.ts`
- `app/api/admin/roles/[id]/route.ts`

### Frontend / Dashboard

- `app/actions/import-certificates.ts`
- `app/dashboard/certificate-states/page.tsx`
- `app/dashboard/certificate-templates/page.tsx`
- `app/dashboard/digital-signatures/page.tsx`
- `app/dashboard/roles/page.tsx`
- `app/dashboard/settings/page.tsx`
- `app/dashboard/student/certificates/page.tsx`
- `app/dashboard/users/page.tsx`
- `components/dashboard/Sidebar.tsx`
- `app/about/page.tsx`

### Configuración

- `tsconfig.json`
- `.gitignore`

---

## Verificación Ejecutada

### 1. Typecheck

```bash
pnpm exec tsc --noEmit
```

**Resultado:** ✅ Sin errores

### 2. Lint

```bash
pnpm run lint
```

**Resultado:** ✅ Sin errores  
**Nota:** Se mantienen advertencias menores sobre:

- uso de `<img>` en vez de `next/image`
- dependencias faltantes en algunos `useEffect`

Estas advertencias no bloquean la compilación ni la ejecución.

### 3. Build de Producción

```bash
pnpm run build
```

**Resultado:** ✅ Build completado exitosamente  
**Resultado adicional:** Next.js generó correctamente todas las rutas estáticas y dinámicas del proyecto.

---

## Resultado Operativo

Después de esta estabilización:

- el proyecto vuelve a compilar
- el typecheck quedó limpio
- el lint ya no falla
- el build de producción vuelve a ser confiable
- las rutas administrativas afectadas por Next.js 15 quedaron funcionales
- el contenedor central volvió a un estado coherente con la arquitectura del repositorio

---

## Nota de Trabajo

Durante esta sesión ya existía una modificación previa en `app/api/admin/academic-areas/[id]/route.ts`. Esa edición fue respetada y no forma parte de la estabilización descrita aquí.

---

## Próximos Pasos Recomendados

1. Resolver las advertencias de lint restantes para dejar el repositorio completamente limpio.
2. Reemplazar `<img>` por `next/image` donde aplique.
3. Revisar dependencias de `useEffect` y estabilizar callbacks con el patrón que use el equipo.
4. Rotar las credenciales expuestas localmente en `.env.local`.

---

## Conclusión

**La base del proyecto volvió a un estado sano de compilación y despliegue.**

La intervención no fue cosmética: se corrigieron fallos estructurales de integración entre dominio, infraestructura, UI y runtime de Next.js 15. El proyecto vuelve a estar en condiciones de continuar desarrollo y despliegue con una línea base mucho más confiable.
