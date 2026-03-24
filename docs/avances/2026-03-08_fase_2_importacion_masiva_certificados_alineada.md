# Avance: Fase 2 implementada - Importacion masiva de certificados alineada con el flujo manual

**Fecha:** 2026-03-08  
**Estado:** Completado  
**Fase:** Fase 2 - Rehacer importacion masiva de certificados  
**Relacionado con:**

- `docs/diseno_funcional_fase_0_importacion_y_plantillas_2026-03-08.md`
- `docs/plan_mejora_importacion_masiva_y_plantillas_2026-03-07.md`
- `docs/avances/2026-03-08_fase_1_importacion_masiva_participantes.md`

---

## Resumen ejecutivo

Se rehizo la importacion masiva de certificados para que deje de usar un camino directo por repositorio y pase a apoyarse en el mismo caso de uso base que la creacion manual.

El resultado es que el lote ahora puede aplicar correctamente:

- recinto
- area academica
- plantilla
- firmante 1
- firmante 2
- programa global
- fecha de expiracion global

y generar certificados que quedan mejor alineados con el detalle, el render y el PDF del sistema.

---

## Problemas que quedaron corregidos

### 1. La importacion masiva no seguia el flujo manual

Antes, la carga masiva construia certificados directamente por repositorio.

Ahora usa el caso de uso de creacion de certificados, lo que unifica:

- enriquecimiento de metadatos
- resolucion de recinto
- resolucion de area academica
- resolucion de firmantes
- creacion del estado inicial

### 2. El lote no soportaba configuracion global completa

La pantalla de importacion ahora incluye:

- recinto obligatorio
- area academica opcional
- plantilla opcional
- firmante 1 opcional
- firmante 2 opcional
- programa global opcional
- fecha de expiracion global opcional

### 3. El folio estaba atado al archivo

Se ajusto el caso de uso para permitir dos comportamientos desde el mismo flujo:

- si el Excel trae `Folio`, se respeta como override y se valida duplicado
- si no trae `Folio`, el sistema lo genera automaticamente

### 4. El resumen del lote era ambiguo

La importacion ahora distingue mejor:

- certificados creados
- participantes creados
- participantes actualizados
- omitidos por duplicado
- errores

---

## Archivos funcionales introducidos o modificados

### Flujo masivo de certificados

- `app/actions/import-certificates.ts`
- `app/dashboard/certificates/import/page.tsx`
- `lib/application/utils/certificate-import.ts`
- `lib/application/use-cases/CreateCertificate.ts`

### Contexto relacionado ya disponible

- `lib/application/utils/certificate-template-renderer.ts`
- `app/dashboard/graduates/import/page.tsx`

---

## Comportamiento resultante

Despues de esta fase:

- la pantalla de importacion de certificados valida el lote antes de ejecutar
- si falta `Folio`, el sistema puede generarlo automaticamente
- si el folio ya existe, la fila se marca como omitida
- los firmantes globales entran al mismo flujo que usa la creacion manual
- la plantilla global seleccionada se persiste en los certificados generados
- el campus y el area academica del lote se aplican correctamente
- los participantes asociados pueden crearse o actualizarse durante el mismo proceso

---

## Criterio de salida cumplido

Lo que debia verse al cerrar la fase 2 era:

- certificados masivos alineados con la logica del flujo manual
- campus, plantilla, firmantes y metadatos aplicados correctamente
- detalle y PDF coherentes en certificados importados

Eso ya quedo cubierto a nivel funcional del flujo de importacion.

---

## Verificacion ejecutada

### 1. Typecheck

```bash
pnpm exec tsc --noEmit
```

**Resultado:** OK

### 2. ESLint focalizado

```bash
pnpm exec eslint "app/dashboard/certificates/import/page.tsx" "app/actions/import-certificates.ts" "lib/application/use-cases/CreateCertificate.ts" "lib/application/utils/certificate-import.ts"
```

**Resultado:** OK

---

## Que debes esperar al probar esta fase

Si todo salio bien, debes ver esto:

1. En `Certificados > Importar`, aparecen nuevas opciones globales para area, firmantes y expiracion.
2. Puedes subir un archivo sin `Folio` y el sistema sigue generando certificados.
3. Si una fila trae un `Folio` ya existente, se omite en lugar de romper todo el lote.
4. Los certificados creados en lote muestran la plantilla y los firmantes correctos al abrir su detalle.
5. El resumen final del proceso ya no confunde certificados creados con participantes creados o actualizados.

---

## Riesgo residual

Quedan puntos para la fase 3:

1. la experiencia del import aun puede mejorarse mas como asistente por pasos
2. el reporte de errores todavia no se exporta
3. la prevalidacion visual aun puede enriquecerse con estados mas detallados

---

## Siguiente fase recomendada

La siguiente fase debe ser:

- **Fase 3 - Mejora de experiencia operativa de importacion**

Motivo:

- la logica del lote ya esta mejor alineada
- ahora toca hacer mas claro el proceso para el usuario antes, durante y despues de importar

**Fin del avance.**
