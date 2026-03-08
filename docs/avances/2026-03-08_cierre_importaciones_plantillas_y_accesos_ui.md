# Cierre de importaciones, plantillas y accesos UI

Fecha: 2026-03-08

## Objetivo

Cerrar el bloque funcional iniciado con la separacion de importaciones masivas y la consolidacion del modulo de plantillas, dejando tambien visibles los accesos operativos correctos desde la interfaz.

## Alcance del bloque

Este cierre consolida cinco lineas de trabajo que quedaron conectadas entre si:

1. Importacion masiva de participantes con asistente propio.
2. Importacion masiva de certificados alineada con el flujo manual.
3. Mejora operativa de ambos asistentes con prevalidacion y cierre con reporte.
4. Consolidacion del catalogo de plantillas para que use el motor real.
5. Ajustes de UI para que los accesos visibles coincidan con los flujos existentes.

## Cambios principales

### 1. Importacion propia de participantes

Se creo una ruta dedicada para participantes:

- `app/dashboard/graduates/import/page.tsx`
- `app/actions/import-students.ts`
- `lib/application/utils/student-import.ts`
- `lib/application/utils/serialize-import-rows.ts`

Resultado:

- Participantes deja de depender del importador de certificados.
- El flujo usa plantilla propia.
- Hay prevalidacion por fila.
- El cierre entrega detalle y reporte exportable.

### 2. Importacion masiva de certificados

Se alineo el importador de certificados con la logica del flujo individual:

- `app/dashboard/certificates/import/page.tsx`
- `app/actions/import-certificates.ts`
- `lib/application/use-cases/CreateCertificate.ts`
- `lib/application/utils/certificate-import.ts`

Resultado:

- El lote soporta configuracion global de recinto, area, plantilla y firmantes.
- El folio puede autogenerarse cuando no viene en el archivo.
- El resultado clasifica por fila y separa certificados creados, participantes creados o actualizados, omitidos y errores.

### 3. Experiencia operativa por pasos

Ambos importadores quedaron estructurados como asistentes:

- pasos visibles
- checklist previo
- filtros de prevalidacion
- cierre con reporte descargable
- copia rapida del resumen

Esto deja coherencia operativa entre:

- `app/dashboard/graduates/import/page.tsx`
- `app/dashboard/certificates/import/page.tsx`

### 4. Consolidacion del modulo de plantillas

Se corrigio el catalogo y la persistencia de plantillas para que el sistema trate correctamente `htmlContent`, `cssStyles`, `layout` y `placeholders`:

- `app/dashboard/certificate-templates/page.tsx`
- `app/dashboard/certificate-templates/create/page.tsx`
- `app/api/admin/certificate-templates/route.ts`
- `lib/usecases/certificateTemplate/CreateTemplateUseCase.ts`
- `lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts`
- `lib/types/certificateTemplate.ts`

Resultado:

- El catalogo muestra mejor el modo de render real.
- Duplicar una plantilla conserva estructura y estilos.
- Crear una plantilla ya no cae de vuelta a contenido HTML generico.

### 5. Ajustes de accesos visibles en la UI

Se alinearon los listados con los asistentes reales:

- `app/dashboard/graduates/page.tsx`
- `app/dashboard/certificates/page.tsx`
- `app/dashboard/users/page.tsx`

Resultado:

- En `Participantes` se elimina el boton redundante `Descargar Plantilla`.
- En `Certificados` se expone el acceso visible a `Importar Excel`.
- En `Certificados` se elimina el boton `Exportar` del header segun criterio operativo actual.
- En `Usuarios` se corrigen rutas legacy de catalogos hacia endpoints `admin` reales y se endurece el parseo de respuestas.

## Problemas corregidos

### Importaciones

- La importacion de participantes no tenia flujo propio.
- La importacion de certificados no estaba integrada visualmente como el flujo de participantes.
- Las filas del Excel podian romper las server actions si no se serializaban como objetos planos.

### Plantillas

- El catalogo y la duplicacion no siempre reflejaban el render real.
- Persistir plantillas nuevas podia conservar contenido generico en vez del HTML/CSS editado.

### UI y accesos

- El asistente de certificados existia, pero no estaba visible desde el listado principal.
- `users/page.tsx` seguia pegado a rutas antiguas (`/api/campuses`, `/api/academic-areas`, `/api/signers`).
- El listado de participantes repetia una accion disponible dentro del asistente.

## Archivos impactados

- `app/actions/import-certificates.ts`
- `app/actions/import-students.ts`
- `app/api/admin/certificate-templates/route.ts`
- `app/dashboard/certificate-templates/create/page.tsx`
- `app/dashboard/certificate-templates/page.tsx`
- `app/dashboard/certificates/import/page.tsx`
- `app/dashboard/certificates/page.tsx`
- `app/dashboard/graduates/import/page.tsx`
- `app/dashboard/graduates/page.tsx`
- `app/dashboard/users/page.tsx`
- `lib/application/use-cases/CreateCertificate.ts`
- `lib/application/utils/certificate-import.ts`
- `lib/application/utils/serialize-import-rows.ts`
- `lib/application/utils/student-import.ts`
- `lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts`
- `lib/types/certificateTemplate.ts`
- `lib/usecases/certificateTemplate/CreateTemplateUseCase.ts`

## Verificacion aplicada

Validaciones ejecutadas durante el bloque:

- `pnpm exec tsc --noEmit`
- `pnpm exec eslint "app/dashboard/graduates/import/page.tsx" "app/dashboard/certificates/import/page.tsx" --no-cache`
- `pnpm exec eslint "app/dashboard/certificate-templates/page.tsx" "app/dashboard/certificate-templates/create/page.tsx" "app/api/admin/certificate-templates/route.ts" "lib/usecases/certificateTemplate/CreateTemplateUseCase.ts" "lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts" "lib/types/certificateTemplate.ts" --no-cache`
- `pnpm exec eslint "app/dashboard/users/page.tsx" --no-cache`
- `pnpm exec eslint "app/dashboard/graduates/page.tsx" "app/dashboard/certificates/page.tsx" --no-cache`

Estado final de esas validaciones:

- TypeScript sin errores.
- ESLint sin errores bloqueantes.
- Permanecen warnings aislados de dependencias de `useEffect` en pantallas heredadas.

## Estado funcional esperado

Al finalizar este bloque se espera:

- `Participantes` muestra acceso directo al asistente de importacion y no duplica la descarga de plantilla.
- `Certificados` muestra acceso directo al asistente de importacion masiva.
- Los asistentes funcionan con plantilla descargable dentro del propio flujo.
- El catalogo de plantillas representa mejor el motor de render vigente.
- Las pantallas de administracion dejaron de depender de endpoints legacy inexistentes.

## Riesgos pendientes

- `academic-areas` sigue devolviendo `500` en ciertos caminos con `activeOnly=true`; eso debe corregirse aparte porque afecta la carga de catalogos en `Usuarios` y en flujos dependientes.
- Quedan warnings heredados de `useEffect` que no bloquean uso, pero conviene limpiar para reducir ruido de mantenimiento.

## Conclusion

Este bloque deja consistente la capa operativa entre listados, asistentes de importacion y catalogo de plantillas. El sistema ya no depende de accesos ocultos para los flujos masivos y la UI refleja mejor los caminos reales de trabajo.
