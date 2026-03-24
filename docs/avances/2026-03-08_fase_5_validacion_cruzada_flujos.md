# Fase 5 - Validacion cruzada de flujos manuales y masivos

**Fecha:** 2026-03-08  
**Estado:** Cerrada a nivel técnico  

---

## 1. Objetivo

Esta fase cierra el bloque validando que el sistema no siga comportándose como caminos separados entre:

- creación manual,
- importación masiva,
- preview del catálogo de plantillas,
- detalle del certificado,
- descarga PDF.

---

## 2. Matriz de validación técnica

### Caso 1 - Participantes manuales vs importación de participantes

**Validación técnica:** correcta

Motivo:

- la fase 1 separó completamente el flujo de participantes,
- el resultado por fila deja claro si crea, actualiza u omite,
- la fase 3 agregó lectura operativa y reporte exportable.

### Caso 2 - Certificados manuales vs importación masiva

**Validación técnica:** correcta

Motivo:

- la fase 2 dejó la importación reutilizando la misma base funcional del flujo manual,
- campus, plantilla, firmantes y metadata viajan por el mismo contrato operativo,
- el lote ya no depende de una creación paralela y simplificada.

### Caso 3 - Catálogo de plantillas vs render real

**Validación técnica:** correcta

Motivo:

- la fase 4 hizo que el catálogo consuma el renderizador real con datos de ejemplo,
- el modo de render queda visible en la UI,
- el preview del catálogo ya no depende de una maqueta aislada.

### Caso 4 - Duplicación de plantillas

**Validación técnica:** correcta

Motivo:

- la duplicación ahora conserva `htmlContent`, `cssStyles`, `layout` y `placeholders`,
- la persistencia ya no sustituye silenciosamente el diseño real por contenido genérico.

### Caso 5 - Tipado y consistencia estática

**Validación técnica:** correcta

Ejecutado con:

- `pnpm exec tsc --noEmit`
- lint focalizado sobre importaciones y plantillas

---

## 3. Validación manual todavía recomendable

Aunque el cierre técnico quedó correcto, conviene ejecutar una pasada manual visual en estos casos:

1. crear una plantilla nueva desde el editor y confirmar que el catálogo la previsualiza correctamente,
2. duplicar una plantilla HTML compleja y verificar que el diseño no se degrade,
3. importar un lote de certificados con plantilla global y abrir uno de los certificados generados,
4. comparar preview del catálogo, detalle del certificado y PDF descargado,
5. repetir con una plantilla `LEGACY`.

---

## 4. Resultado de la fase

Esta fase queda cerrada técnicamente porque:

- manual y masivo ya no descansan en contratos distintos,
- el catálogo de plantillas refleja mejor el motor real,
- la cadena de creación y duplicación de plantillas conserva el diseño real,
- el bloque completo pasó validación de tipo y lint focalizado.

La validación visual final queda lista para ejecución operativa en el navegador.

