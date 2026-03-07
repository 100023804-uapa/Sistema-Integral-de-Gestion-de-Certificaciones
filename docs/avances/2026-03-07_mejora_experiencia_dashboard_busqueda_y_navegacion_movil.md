# Avance: Mejora de experiencia del dashboard, busqueda operativa y navegacion movil

**Fecha:** 7 de Marzo de 2026  
**Estado:** Completado  
**Referencia Git:** Pendiente de asociar al commit de esta sesion

---

## Resumen Ejecutivo

Se consolido un bloque de mejora transversal orientado a operacion diaria y uso movil del sistema:

- se reorganizo la navegacion del dashboard para escritorio y movil desde una sola fuente de verdad
- se corrigio la barra inferior movil para evitar que la accion central de busqueda tape otras opciones
- se normalizo el espaciado superior y lateral de multiples modulos administrativos
- se agrego busqueda rapida de participantes para autocompletar la creacion manual de certificados
- se introdujo seleccion asistida de programas academicos tanto en creacion manual como en importacion
- se extendio el catalogo de tipos de certificado con un prefijo de folio por defecto
- se reforzo la operacion de desarrollo con sembrado selectivo y busqueda administrativa de estudiantes

El resultado es un bloque combinado de UX, UI, API y repositorios que reduce friccion manual, mejora consistencia visual y hace mas usable el sistema en pantallas pequenas.

---

## 1. Navegacion Unificada del Dashboard

Se desacoplo la definicion del menu del `Sidebar` y se movio a una configuracion compartida en `components/dashboard/navigation.ts`.

### Cambios principales

- se definio `dashboardMenuItems` con separadores, enlaces e informacion de roles permitidos
- se creo `mobileQuickLinkOrder` para priorizar accesos rapidos en la barra inferior movil
- `components/dashboard/Sidebar.tsx` ahora consume esa configuracion compartida
- el filtrado por rol queda centralizado y consistente entre escritorio y movil

### Beneficio

Antes habia dos capas de navegacion con riesgo de divergir. Ahora el dashboard usa una sola fuente de verdad para accesos, agrupaciones y permisos.

---

## 2. Rediseño de la Barra Inferior Movil

`components/dashboard/BottomNav.tsx` fue reescrito para resolver el problema de superposicion del boton central de busqueda.

### Problema anterior

- la accion central con icono de lupa quedaba montada sobre otra opcion
- el dashboard intentaba mostrar demasiadas opciones simultaneas en una barra inferior estrecha
- el patron no escalaba bien cuando el menu crecia

### Solucion aplicada

- se reservan dos accesos rapidos a la izquierda
- se reserva el centro para la accion principal de validacion y busqueda
- se deja un acceso rapido a la derecha
- el resto del menu se mueve a un panel `Mas` tipo hoja inferior
- al cambiar de ruta, el panel movil se cierra automaticamente
- el menu movil reutiliza el mismo esquema de roles y secciones del `Sidebar`

### Resultado UX

La accion principal sigue destacada, pero deja de invadir otras opciones y el sistema gana escalabilidad para agregar nuevas rutas sin romper la composicion movil.

---

## 3. Normalizacion de Layout y Espaciado

Se corrigieron wrappers y encabezados que estaban demasiado pegados al borde superior o lateral, especialmente en el dashboard administrativo.

### Ajustes base

- `app/dashboard/layout.tsx` aumenta el espacio inferior de `pb-20` a `pb-28` para que la barra movil no tape contenido
- se adopta una pauta recurrente de `px-4 py-6 md:px-8 md:py-10` en paginas administrativas
- varios encabezados pasan de layout horizontal rigido a variantes flexibles con `flex-col` en movil

### Paginas ajustadas

- `app/dashboard/users/page.tsx`
- `app/dashboard/programs/page.tsx`
- `app/dashboard/dev-tools/page.tsx`
- `app/dashboard/certificates/import/page.tsx`
- `app/dashboard/campuses/page.tsx`
- `app/dashboard/academic-areas/page.tsx`
- `app/dashboard/certificate-types/page.tsx`
- `app/dashboard/roles/page.tsx`
- `app/dashboard/certificate-templates/page.tsx`
- `app/dashboard/certificate-templates/create/page.tsx`
- `app/dashboard/certificate-states/page.tsx`
- `app/dashboard/digital-signatures/page.tsx`
- `app/dashboard/graduates/[id]/page.tsx`

### Resultado visual

Las pantallas del dashboard quedan mas consistentes entre si, con mejor respiracion superior y mejor comportamiento en widths moviles o intermedios.

---

## 4. Busqueda de Participantes en Creacion Manual

Se incorporo una busqueda operativa de participantes dentro de `app/dashboard/certificates/create/page.tsx`.

### Componentes y API nuevos

- `app/api/admin/students/search/route.ts`
- `components/ui/StudentCombobox.tsx`

### Comportamiento incorporado

- el usuario puede buscar por nombre, matricula o cedula
- la busqueda usa un debounce en cliente
- la API devuelve solo coincidencias limitadas para no saturar el dropdown
- al seleccionar un participante se autocompletan:
  - nombre
  - matricula
  - cedula
  - correo
  - programa academico

### Decision de UX

Los campos que ahora provienen de la busqueda quedan en modo solo lectura para reducir errores manuales y asegurar coherencia con el registro existente del participante.

---

## 5. Seleccion Asistida de Programas Academicos

Se agrego un combobox reutilizable para programas academicos.

### Pieza nueva

- `components/ui/ProgramCombobox.tsx`

### Integraciones

- `app/dashboard/certificates/create/page.tsx`
- `app/dashboard/certificates/import/page.tsx`

### Beneficios

- permite buscar por nombre o codigo del programa
- evita listas largas poco manejables en `select`
- conserva flexibilidad para entrada libre cuando el flujo lo necesita
- mejora la importacion masiva al permitir elegir un programa global sin depender de un dropdown basico

---

## 6. Prefijo de Folio por Defecto en Tipos de Certificado

Se amplio el modelo de tipos de certificado para soportar un prefijo operativo de folio.

### Archivos impactados

- `lib/types/certificateType.ts`
- `lib/infrastructure/repositories/FirebaseCertificateTypeRepository.ts`
- `app/dashboard/certificate-types/page.tsx`
- `app/dashboard/certificates/create/page.tsx`

### Comportamiento nuevo

- cada tipo de certificado puede almacenar `defaultFolioPrefix`
- la vista administrativa permite capturarlo y visualizarlo
- al cambiar el tipo seleccionado en la creacion de certificado, el formulario autocompleta `folioPrefix`
- si el tipo no define prefijo, se usa `sigce` como fallback

### Impacto operativo

Se reduce trabajo repetitivo y se normaliza el patron de folios desde el catalogo, en vez de depender exclusivamente de digitacion manual.

---

## 7. Refuerzo del Repositorio de Participantes

`lib/infrastructure/repositories/FirebaseStudentRepository.ts` ahora valida duplicados antes de crear nuevos registros.

### Validaciones agregadas

- evita crear un participante si ya existe la misma matricula
- evita crear un participante si ya existe la misma cedula

### Valor

Esto protege el read-model de participantes y evita errores posteriores en certificados, busqueda y reportes.

---

## 8. Seeder Selectivo para Desarrollo

Se amplio `app/api/admin/dev-tools/route.ts` para que el sembrado de datos no sea monolitico.

### Cambios

- el endpoint ahora acepta `collectionsToSeed`
- se pueden sembrar de forma selectiva:
  - `academicAreas`
  - `campuses`
  - `academicPrograms`
  - `certificateTypes`
  - `roles`
  - `students`
  - `system_config`
  - `certificates`
  - `certificateStates`
- se incorpora `system_config/core` mediante `setDoc`
- la respuesta devuelve un detalle por coleccion sembrada

### Mejora operativa

El entorno de desarrollo queda mas controlable: ya no obliga a sembrar todo el bloque completo cuando solo se necesita una parte del catalogo o del flujo.

---

## 9. Ajustes Asociados

- `app/dashboard/graduates/page.tsx` simplifica la tabla y deja la matricula como dato principal en lugar de una columna combinada con cedula
- `app/dashboard/graduates/[id]/page.tsx` gana margen superior para alinearse con el resto del dashboard
- `app/dashboard/certificate-types/page.tsx` mejora presentacion y muestra el prefijo de folio cuando existe

---

## Archivos Impactados

### Navegacion y layout

- `components/dashboard/navigation.ts`
- `components/dashboard/Sidebar.tsx`
- `components/dashboard/BottomNav.tsx`
- `app/dashboard/layout.tsx`

### Busqueda y formularios operativos

- `app/api/admin/students/search/route.ts`
- `components/ui/StudentCombobox.tsx`
- `components/ui/ProgramCombobox.tsx`
- `app/dashboard/certificates/create/page.tsx`
- `app/dashboard/certificates/import/page.tsx`

### Catalogos y repositorios

- `lib/types/certificateType.ts`
- `lib/infrastructure/repositories/FirebaseCertificateTypeRepository.ts`
- `lib/infrastructure/repositories/FirebaseStudentRepository.ts`
- `app/dashboard/certificate-types/page.tsx`

### Desarrollo y dashboards administrativos

- `app/api/admin/dev-tools/route.ts`
- `app/dashboard/dev-tools/page.tsx`
- `app/dashboard/users/page.tsx`
- `app/dashboard/programs/page.tsx`
- `app/dashboard/campuses/page.tsx`
- `app/dashboard/academic-areas/page.tsx`
- `app/dashboard/roles/page.tsx`
- `app/dashboard/certificate-templates/page.tsx`
- `app/dashboard/certificate-templates/create/page.tsx`
- `app/dashboard/certificate-states/page.tsx`
- `app/dashboard/digital-signatures/page.tsx`
- `app/dashboard/graduates/page.tsx`
- `app/dashboard/graduates/[id]/page.tsx`

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

- el dashboard movil deja de tener superposiciones en la barra inferior
- la navegacion queda centralizada y coherente entre escritorio y movil
- los modulos administrativos presentan mejor espaciado y respiracion visual
- la creacion manual de certificados puede apoyarse en busqueda de participantes reales
- los programas academicos tienen un selector mas util que un dropdown basico
- los tipos de certificado pueden gobernar el prefijo inicial del folio
- el seeding de desarrollo es mas granular y aprovechable
- el repositorio de participantes evita duplicados criticos por matricula o cedula

---

## Nota de Riesgo

La busqueda administrativa de participantes sigue resolviendose con filtrado en memoria sobre un lote acotado para mantener simplicidad MVP. Si el volumen de participantes crece de forma importante, convendra mover esta capacidad a un read-model indexado o a una estrategia de busqueda mas especializada.
