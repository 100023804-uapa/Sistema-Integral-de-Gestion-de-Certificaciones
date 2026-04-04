# Reporte De Reunión: Flujos Y Ajustes Pendientes

Fecha: 2026-04-04

## Objetivo
Consolidar los hallazgos detectados durante la revisión funcional del sistema para discutirlos con Javier y usarlos como base de ajuste del flujo operativo mínimo de SIGCE.

## Resumen Ejecutivo
Los problemas observados no son aislados. La mayoría se concentran en cinco ejes:

- ciclo de vida del certificado
- reglas de publicación y descarga
- restricciones administrativas
- consistencia visual del documento final
- definiciones funcionales aún no cerradas

La recomendación es corregirlos por paquetes de dominio, no pantalla por pantalla.

## Hallazgos Confirmados

### 1. Flujo de estados de certificados
- En algunos estados solo aparece `Cancelar`, lo que genera dudas sobre si el sistema quedó sin transición válida o si realmente ese estado ya no admite otra acción.
- No todos los estados deben permitir edición. `Borrador` sí debe permitir cambios estructurales; `Emitido` y `Disponible` no deben comportarse como estados editables.
- `Emitido` no debe equivaler automáticamente a “visible para el participante”.
- `Disponible` debe ser el único estado que habilite acceso del participante y publicación final.

### 2. Restricciones administrativas
- Se detectaron casos donde aplicar o levantar restricciones no reflejaba claramente el resultado esperado.
- Cuando el certificado ya está en un estado final o publicado, el sistema debe explicar mejor por qué una acción ya no está permitida.
- La regla funcional debe ser explícita:
  - certificados en flujo pueden admitir restricción según política
  - certificados ya publicados no deben quedar con acciones ambiguas o contradictorias

### 3. Firma y publicación
- El flujo esperado es:
  - `borrador -> espera_verificacion -> verificado -> espera_firma -> firmado -> emitido -> disponible`
- Se detectaron inconsistencias entre el estado esperado y lo que algunas pantallas mostraban.
- También se observaron casos donde la firma o el paso de emisión/publicación no reflejaban bien el flujo completo.

### 4. Visualización y descarga antes de tiempo
- Se detectó que en algunos casos se podía intentar descargar el certificado antes de estar realmente publicado.
- El acceso del participante debe depender del flujo mínimo completo:
  - certificado válido
  - PDF oficial correcto
  - estado `disponible`
  - sin restricción activa

### 5. Tipografía y consistencia del PDF
- La vista previa de la plantilla puede verse correcta, pero el PDF final no siempre coincide.
- Esto ocurre porque la vista previa y la exportación PDF no usan exactamente el mismo mecanismo de render.
- Algunas fuentes subidas manualmente, especialmente decorativas o variables, se deforman al generar el PDF final.
- Operativamente conviene usar solo tipografías estables para plantillas oficiales.

### 6. Validación del identificador del participante
- No está completamente definido si el identificador debe aceptar solo cédula, también pasaporte, matrícula u otros documentos.
- Sin una definición funcional clara, no se puede cerrar correctamente:
  - validación
  - unicidad
  - búsqueda
  - relación con certificados y portal

### 7. Validación del QR / certificado
- Falta cerrar si la validación principal debe basarse en:
  - el folio
  - el código público
  - el estado vigente del certificado
- La validación pública no debe depender de datos ambiguos ni de reglas implícitas.

### 8. Notificaciones
- Las notificaciones internas ya funcionan en algunos eventos.
- El flujo de correo todavía no está completamente definido para todos los cambios de estado.
- Hay eventos que ya notifican, pero el canal correo sigue condicionado por configuración y disponibilidad del servicio.

### 9. Regla final para certificados publicados
- Una vez el certificado está `disponible`, no debe permitir:
  - edición estructural
  - cambios operativos normales de flujo
  - acciones ambiguas de restricción sin política clara
- El sistema debe mostrar mensajes explícitos cuando una acción deje de estar disponible.

## Criterio Funcional Acordado

### Ciclo mínimo del certificado
- `borrador`: editable
- `espera_verificacion`: pendiente de revisión
- `verificado`: aprobado para firma
- `espera_firma`: pendiente de aprobación del firmante interno autorizado
- `firmado`: aprobado operativamente
- `emitido`: PDF oficial generado
- `disponible`: visible y descargable para el participante

### Regla de edición
- Solo `borrador` admite edición estructural del certificado.

### Regla de publicación
- `emitido` no implica acceso del participante.
- Solo `disponible` habilita acceso y descarga en portal.

### Regla de visualización del documento
- Antes de firmar, emitir o publicar, el usuario debe poder revisar el certificado con la plantilla real asignada.

### Regla de tipografía
- Las plantillas oficiales deben trabajar con tipografías estables y compatibles con el generador PDF real del sistema.

## Prioridad De Corrección

### Prioridad alta
- cerrar reglas de estados `emitido` vs `disponible`
- endurecer acciones permitidas por estado
- terminar de blindar descarga/publicación solo en `disponible`
- estabilizar el PDF oficial y la tipografía

### Prioridad media
- unificar comportamiento de restricciones administrativas
- cerrar definición funcional del identificador del participante
- cerrar criterio de validación pública por QR y folio

### Prioridad media-baja
- terminar de completar la matriz de correos por evento
- mejorar mensajes de UX cuando una acción ya no está permitida

## Recomendación De Abordaje
No seguir corrigiendo estos puntos como fallos independientes. Conviene tratarlos en tres paquetes:

### Paquete A: Workflow documental
- estados
- firma
- emisión
- publicación
- descarga

### Paquete B: Reglas de negocio y validación
- restricciones
- identificador del participante
- validación pública

### Paquete C: Documento final y UX operativa
- tipografías
- consistencia del PDF
- mensajes del sistema
- claridad de acciones en cada pantalla

## Conclusión
El sistema ya tiene gran parte de la estructura operativa, pero todavía necesita cerrar varias reglas funcionales para que el comportamiento sea consistente en todos los módulos. Los puntos principales a revisar con Javier son:

- qué estados permiten qué acciones
- cuándo un certificado se considera realmente público
- cómo deben comportarse las restricciones
- qué identificador oficial debe usar el participante
- qué tipografías y reglas visuales serán válidas para los certificados oficiales

Una vez esos criterios queden cerrados, el resto del sistema se puede alinear sin rehacer el modelo completo.
