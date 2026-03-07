# Avance: Integracion de programas academicos y flujos operativos

**Fecha:** 7 de Marzo de 2026  
**Estado:** Completado  
**Referencia Git:** Pendiente de asociar al commit de esta sesion

---

## Resumen Ejecutivo

Se consolido un bloque funcional orientado a operacion real del sistema:

- se introdujo un catalogo formal de programas academicos
- se conecto ese catalogo con la creacion e importacion de certificados
- se mejoraron los tableros de estados y firmas para que usen el usuario autenticado
- se hizo navegable la actividad reciente del dashboard
- se agrego un panel de herramientas de desarrollo para sembrado y limpieza selectiva

El resultado no es un ajuste aislado: es un bloque transversal entre UI, API, contenedor, repositorios y casos de uso.

---

## 1. Catalogo de Programas Academicos

Se agrego soporte completo para `academicPrograms` como catalogo propio del sistema.

### Piezas nuevas

- `lib/types/academicProgram.ts`
- `lib/infrastructure/repositories/FirebaseAcademicProgramRepository.ts`
- `lib/usecases/academicProgram/*`
- `app/api/admin/academic-programs/route.ts`

### Comportamiento incorporado

- crear programas academicos
- listar todos o solo activos
- editar programas
- eliminar programas por soft delete
- validar nombre/codigo obligatorios
- evitar codigos duplicados activos

### Integracion de contenedor

`lib/container.ts` ahora expone:

- repositorio de programas academicos
- use cases de crear, listar, actualizar y eliminar
- tipo `AcademicProgram` para consumo desde `app/`

### UI de administracion

`app/dashboard/programs/page.tsx` fue reescrita para pasar de una vista derivada de certificados a un CRUD real del catalogo:

- tabla con filtros
- conteo de activos/inactivos
- modal de creacion y edicion
- confirmacion de borrado
- consumo de `/api/admin/academic-programs`

---

## 2. Integracion con Creacion e Importacion de Certificados

El flujo de certificados ya no depende solo de texto libre.

### Creacion manual

En `app/dashboard/certificates/create/page.tsx` se incorporo:

- carga de programas academicos activos
- carga de tipos de certificado activos
- filtro de plantillas por tipo visual
- seleccion de programa desde catalogo cuando existe
- uso del `user.uid` autenticado como `createdBy`

Esto reduce inconsistencia manual y alinea el formulario con catalogos reales del sistema.

### Importacion masiva

En `app/dashboard/certificates/import/page.tsx` y `app/actions/import-certificates.ts` se introdujo:

- configuracion global previa a la importacion
- recinto obligatorio para todo el lote
- plantilla opcional para todo el lote
- programa academico opcional para sobreescribir la columna `Curso`
- firma nueva de `importCertificatesFromExcel(data, campusId, templateId?)`

Con eso el lote deja de depender de que cada fila traiga un `CampusId` y se vuelve mas manejable desde UI.

### Compatibilidad de scripts

`scripts/test-import.ts` fue ajustado a la nueva firma de importacion para no romper typecheck.

---

## 3. Estados del Certificado y Firma Digital

### Estados

En `app/api/admin/certificate-states/route.ts` y `lib/infrastructure/repositories/FirebaseCertificateStateRepository.ts` se agrego capacidad de listado general mediante `listAll`.

En `app/dashboard/certificate-states/page.tsx` se mejoro el tablero para:

- usar `useAuth()`
- derivar el rol actual del usuario autenticado
- pedir en paralelo acciones pendientes y listado general
- refrescar por filtro y por usuario
- enviar `changedBy` y `userRole` reales en las transiciones

### Firmas digitales

En `app/dashboard/digital-signatures/page.tsx` se corrigio el uso del firmante actual:

- ya no usa IDs simulados
- carga solicitudes del `user.uid` autenticado
- rechaza usando el firmante real
- pasa el `signerId` al modal de firma

Ademas, el modal ahora implementa captura de firma con `canvas`:

- dibujo por mouse y tactil
- persistencia como base64
- boton para limpiar firma

Eso convierte el modal en un flujo operativo real y no en un placeholder visual.

---

## 4. Dashboard y Navegacion

### Actividad reciente clickeable

`lib/application/use-cases/GetDashboardStats.ts` ahora expone `href` por actividad reciente.

Con eso:

- `app/dashboard/page.tsx` puede enrutar al detalle correcto
- `components/dashboard/ActivityList.tsx` navega tanto por item como por el boton "Ver todo"

### Sidebar

`components/dashboard/Sidebar.tsx` ahora agrega una seccion de desarrollo visible solo cuando `NODE_ENV === 'development'`.

---

## 5. Dev Tools para Desarrollo

Se agrego un modulo de herramientas de desarrollo:

- `app/dashboard/dev-tools/page.tsx`
- `app/api/admin/dev-tools/route.ts`

Capacidades:

- inspeccionar conteos de colecciones Firestore
- limpiar selectivamente colecciones
- sembrar certificados de prueba alineados con catalogos reales
- restringir la herramienta al entorno de desarrollo

El seeder toma como base catalogos ya existentes de:

- recintos
- areas academicas
- programas academicos
- tipos de certificado

Eso ayuda a poblar datos validos para pruebas end-to-end sin depender de carga manual repetitiva.

---

## 6. Ajustes Menores Asociados

- `app/api/admin/academic-areas/[id]/route.ts` queda alineado con el contrato async de `context.params`
- `components/dashboard/Sidebar.tsx` y `app/dashboard/page.tsx` quedan conectados con los nuevos flujos

---

## Archivos Impactados

### Dominio, infraestructura y contenedor

- `lib/container.ts`
- `lib/types/academicProgram.ts`
- `lib/infrastructure/repositories/FirebaseAcademicProgramRepository.ts`
- `lib/infrastructure/repositories/FirebaseCertificateStateRepository.ts`
- `lib/usecases/academicProgram/CreateAcademicProgramUseCase.ts`
- `lib/usecases/academicProgram/ListAcademicProgramsUseCase.ts`
- `lib/usecases/academicProgram/UpdateAcademicProgramUseCase.ts`
- `lib/usecases/academicProgram/DeleteAcademicProgramUseCase.ts`
- `lib/application/use-cases/GetDashboardStats.ts`

### API

- `app/api/admin/academic-programs/route.ts`
- `app/api/admin/certificate-states/route.ts`
- `app/api/admin/dev-tools/route.ts`
- `app/api/admin/academic-areas/[id]/route.ts`

### Dashboard y componentes

- `app/dashboard/programs/page.tsx`
- `app/dashboard/certificates/create/page.tsx`
- `app/dashboard/certificates/import/page.tsx`
- `app/dashboard/certificate-states/page.tsx`
- `app/dashboard/digital-signatures/page.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/dev-tools/page.tsx`
- `components/dashboard/ActivityList.tsx`
- `components/dashboard/Sidebar.tsx`

### Scripts y acciones

- `app/actions/import-certificates.ts`
- `scripts/test-import.ts`

---

## Validacion Ejecutada

### Typecheck

```bash
pnpm exec tsc --noEmit
```

**Resultado:** OK

---

## Resultado Operativo

Despues de este bloque:

- el sistema tiene un catalogo formal de programas academicos
- la creacion e importacion de certificados consumen ese catalogo
- estados y firmas dependen del usuario autenticado y no de placeholders
- el dashboard reciente ya puede navegar al detalle
- existe una herramienta de desarrollo para limpiar y sembrar datos de prueba

---

## Nota de Riesgo

El modulo `dev-tools` esta pensado exclusivamente para desarrollo y depende de `NODE_ENV === 'development'` para su exposicion. No debe considerarse una herramienta administrativa de produccion.
