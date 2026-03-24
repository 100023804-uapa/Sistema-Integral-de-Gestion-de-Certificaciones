# Avance: Plan definido para mejora de importacion masiva y plantillas

**Fecha:** 2026-03-07  
**Estado:** Planificado  
**Fase:** Preparacion funcional y operativa  
**Relacionado con:**

- `docs/plan_mejora_importacion_masiva_y_plantillas_2026-03-07.md`
- `docs/avances/2026-03-07_consolidacion_render_certificados_y_portabilidad_datos.md`

---

## Resumen ejecutivo

Se definio el plan formal para corregir el bloque de:

- importacion masiva de participantes
- importacion masiva de certificados
- consistencia funcional del modulo de plantillas

La decision principal fue no atacar primero la interfaz de plantillas aislada, sino comenzar por separar y normalizar la logica de importacion masiva, porque es donde hoy existe mayor mezcla de responsabilidades y mayor riesgo de inconsistencias operativas.

---

## Decisiones centrales ya fijadas

### 1. Dos flujos separados

Se formaliza que habra:

- un flujo propio para importar participantes
- un flujo propio para importar certificados

### 2. Un solo comportamiento correcto para certificados

La importacion masiva de certificados debe terminar produciendo el mismo resultado que la creacion manual en:

- plantilla
- metadatos
- firmantes
- detalle del certificado
- PDF

### 3. Plantillas nuevas sobre HTML/CSS

Se mantiene `htmlContent + cssStyles` como fuente principal para plantillas nuevas.

El soporte `legacy` se conserva solo como compatibilidad.

### 4. Importacion auditable por fila

El resultado de cada lote debe dejar claro si una fila:

- creo participante
- actualizo participante
- creo certificado
- fue omitida
- fallo

---

## Fases acordadas

1. Cierre de contrato funcional
2. Importacion masiva de participantes
3. Rehacer importacion masiva de certificados
4. Mejora de experiencia operativa de importacion
5. Consolidacion del modulo de plantillas
6. Validacion cruzada de punta a punta

---

## Por que este orden

Porque primero hay que corregir el flujo de datos y la logica de negocio del lote, y despues pulir la capa de plantillas y preview.

Si se invierte el orden, la interfaz puede verse mejor pero seguir produciendo resultados inconsistentes en importacion.

---

## Riesgos reconocidos desde el inicio

- romper el flujo manual ya estabilizado
- seguir mezclando importacion de participantes con certificados
- contar como exito filas ambiguas
- mantener divergencia entre preview, detalle y PDF
- afectar plantillas legacy sin control

---

## Siguiente paso operativo recomendado

Antes de tocar codigo debe cerrarse la **Fase 0**, dejando definidos:

- columnas oficiales de cada Excel
- reglas de deduplicacion
- campos globales del lote
- criterios de exito, omision y error
- formato del resumen final por fila

Con eso se puede implementar el resto sin improvisacion.

**Fin del avance.**
