# Avance: Inicio de Fase 0 para importacion y plantillas

**Fecha:** 2026-03-08  
**Estado:** Definido  
**Fase:** Fase 0 - Cierre de contrato funcional  
**Relacionado con:**

- `docs/plan_mejora_importacion_masiva_y_plantillas_2026-03-07.md`
- `docs/diseno_funcional_fase_0_importacion_y_plantillas_2026-03-08.md`

---

## Resumen ejecutivo

Se inicio formalmente la Fase 0 del bloque de mejora de importacion masiva y plantillas.

Esta fase no introduce cambios funcionales en el sistema. Su objetivo es dejar cerradas las reglas del juego antes de implementar:

- que se considera importacion de participantes
- que se considera importacion de certificados
- que columnas se aceptan
- como se decide si una fila crea, actualiza, se omite o falla
- que debe esperarse al terminar cada fase del plan

---

## Decisiones funcionales ya tomadas

### 1. Separacion de menus

Se formaliza que:

- participantes tendra su propio flujo de importacion
- certificados tendra su propio flujo de importacion

### 2. Criterio de exito en certificados

Una fila no contara como exito completo si solo creo o actualizo participante pero no genero certificado.

### 3. Folio en certificados

`Folio` deja de considerarse obligatorio para el flujo masivo nuevo.

Si no viene en la fila, el sistema debe poder generarlo automaticamente con la misma logica del flujo manual.

### 4. Plantillas nuevas

Se mantiene `htmlContent + cssStyles` como fuente principal para plantillas nuevas, dejando `legacy` como compatibilidad.

---

## Entregables dejados por esta fase

- contrato funcional detallado de importacion y plantillas
- reglas de deduplicacion
- columnas oficiales y compatibilidad temporal
- salida esperada al finalizar cada fase del plan

---

## Siguiente paso recomendado

Con la Fase 0 cerrada, el siguiente paso recomendado es iniciar la **Fase 1 - Importacion masiva de participantes**.

Motivo:

- es el bloque mas independiente
- corrige primero la confusion del menu de participantes
- deja limpio el terreno antes de rehacer la importacion de certificados

**Fin del avance.**
