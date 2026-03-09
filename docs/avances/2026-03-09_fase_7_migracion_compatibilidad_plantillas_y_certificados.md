# Fase 7: Migracion, compatibilidad y limpieza operativa

Fecha: 2026-03-09

## Objetivo

Cerrar el ciclo de compatibilidad para plantillas y certificados ya existentes, dejando visibilidad clara sobre que esta listo, que sigue en transicion y que requiere migracion.

## Cambios realizados

### 1. Capa de compatibilidad compartida

Se incorporo una utilidad central para clasificar plantillas y certificados segun su nivel de modernizacion:

- `modern`
- `transitional`
- `legacy`

La evaluacion considera, segun el caso:

- existencia de `templateSnapshot`
- existencia de `pdfUrl`
- perfil tipografico
- dependencia de plantilla viva
- uso de layout legacy

### 2. Catalogo de plantillas con estado de migracion

En el catalogo de plantillas se agregaron:

- resumen global de plantillas visibles
- conteo de plantillas listas, en transicion y con alta necesidad de migracion
- aviso por tarjeta cuando una plantilla requiere modernizacion
- detalle de compatibilidad ampliado en la vista individual

### 3. Listado y detalle de certificados con compatibilidad visible

En certificados se incorporo:

- resumen global de certificados modernizados vs pendientes
- badge de compatibilidad por fila
- panel detallado en la vista del certificado con:
  - snapshot visual
  - PDF definitivo
  - tipografia
  - dependencia de plantilla viva
  - siguiente accion recomendada

### 4. Limpieza de plantillas predefinidas

Se corrigieron remanentes de placeholders viejos en las plantillas base del editor:

- reemplazo de firmantes legacy por `signer1_*` y `signer2_*`
- eliminacion de ejemplos que seguian enseñando cargos fijos no gestionados
- mensaje explicito para usar fuentes internas o seguras en vez de enlaces remotos como patron principal

## Resultado esperado

Al finalizar esta fase:

- ya es visible que plantillas requieren migracion
- ya es visible que certificados dependen aun del flujo viejo o del nuevo
- las plantillas base ya no empujan practicas obsoletas
- queda mas claro que probar, migrar o corregir antes de una emision estable

## Que revisar al probar

1. En `Plantillas de Diseno`, verificar los nuevos contadores y avisos de migracion.
2. Abrir una plantilla y confirmar que el bloque de compatibilidad explique su situacion real.
3. En `Certificados`, validar los badges de compatibilidad por fila.
4. Abrir un certificado y revisar el panel `Compatibilidad del documento`.
5. En crear o editar plantilla, revisar que las plantillas predefinidas ya no usen firmantes legacy ni cargos fijos quemados.

## Estado posterior

Con esta fase queda completado el plan de:

- biblioteca interna de fuentes
- editor guiado de fuentes
- modelo tipografico estructurado
- render unificado
- emision inmutable
- PDF persistido
- compatibilidad y migracion visible
