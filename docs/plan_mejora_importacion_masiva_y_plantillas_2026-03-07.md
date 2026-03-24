# Plan Maestro de Mejora de Importacion Masiva y Plantillas

**Fecha:** 2026-03-07  
**Estado:** Planificado  
**Alcance:** Participantes, certificados, importacion masiva, preview, PDF y catalogo de plantillas  
**Relacionado con:**

- `docs/avances/2026-03-07_consolidacion_render_certificados_y_portabilidad_datos.md`
- `lib/application/utils/certificate-template-renderer.ts`

---

## 1. Proposito de este plan

Este documento define el orden y la estrategia para corregir el bloque de importacion masiva y dejarlo alineado con el sistema actual de certificados y plantillas.

El problema de fondo no es solo visual. Hoy existe una separacion incompleta entre:

- importacion de participantes
- importacion de certificados
- seleccion y uso real de plantillas
- render final en detalle y PDF

La meta es que el sistema se comporte de forma coherente en todos los caminos:

1. alta manual de participante
2. alta manual de certificado
3. importacion masiva de participantes
4. importacion masiva de certificados
5. vista previa de plantilla
6. detalle del certificado
7. descarga PDF

---

## 2. Problemas actuales que obligan este orden

### 2.1 Importacion de participantes sin flujo propio

En la practica, el menu de participantes depende del flujo de importacion de certificados.

Eso mezcla responsabilidades y hace que el usuario no tenga un proceso separado para:

- solo cargar participantes
- solo actualizar participantes
- importar participantes sin generar certificados

### 2.2 Importacion de certificados desalineada con la creacion individual

La carga masiva de certificados no sigue exactamente el mismo camino de negocio que la creacion individual.

Eso implica riesgo de divergencia en:

- plantilla aplicada
- metadatos generados
- firmantes
- area academica
- datos persistidos del participante
- comportamiento del PDF y la vista previa

### 2.3 Resumen operativo ambiguo

Hoy una fila puede terminar contada como exito aunque solo haya actualizado o creado el participante, sin dejar totalmente claro si tambien se creo el certificado.

Eso vuelve dificil auditar una importacion.

### 2.4 Catalogo de plantillas todavia no refleja del todo el motor real

Aunque el sistema ya tiene un renderizador unificado, el menu de plantillas aun debe dejar mas claro:

- si una plantilla es `HTML` o `LEGACY`
- cual es su comportamiento real
- como se previsualiza con datos consistentes
- que se duplica realmente al clonar una plantilla

---

## 3. Decision funcional base

Se adoptan estas reglas para el trabajo:

### 3.1 Separacion de flujos

Habra dos flujos distintos:

- importacion de participantes
- importacion de certificados

### 3.2 Regla de comportamiento

- importar participantes no crea certificados
- importar certificados puede crear o actualizar participantes si hace falta
- importar certificados debe informar de forma explicita si una fila:
  - creo participante
  - actualizo participante
  - creo certificado
  - fue omitida
  - fallo

### 3.3 Regla de consistencia

La importacion masiva de certificados debe producir el mismo resultado funcional que la creacion individual.

Eso incluye:

- plantilla
- metadatos
- firmantes
- campus
- area academica
- folio
- detalle del certificado
- PDF descargado

### 3.4 Regla de plantillas

La fuente principal para plantillas nuevas sigue siendo:

- `htmlContent + cssStyles`

`layout.sections` queda como compatibilidad para plantillas viejas.

---

## 4. Objetivos del bloque

Al cerrar este plan, el sistema debe permitir:

1. importar participantes en un flujo propio y claro
2. importar certificados en un flujo separado y trazable
3. validar archivos antes de ejecutar
4. aplicar una plantilla global real a un lote completo
5. aplicar firmantes globales reales a un lote completo
6. generar certificados importados que se vean igual que los manuales
7. mostrar en el catalogo de plantillas previews mas fieles al render real

---

## 5. Fases de implementacion

## Fase 0 - Cierre de contrato funcional

### Objetivo

Definir de forma cerrada como deben comportarse ambos menus y sus resultados.

### Decisiones a fijar

- columnas oficiales del Excel de participantes
- columnas oficiales del Excel de certificados
- campos globales permitidos por lote
- reglas de deduplicacion por matricula, cedula y correo
- diferencia exacta entre `exito`, `omitido` y `error`
- comportamiento cuando falta `Folio`
- comportamiento cuando falta `Curso`
- comportamiento cuando existe ya el participante
- comportamiento cuando existe ya el certificado

### Entregable

- documento de contrato funcional y de columnas esperadas

---

## Fase 1 - Importacion masiva de participantes

### Objetivo

Crear un flujo propio para participantes.

### Trabajo a realizar

- crear pantalla dedicada de importacion de participantes
- mover el acceso del menu de participantes a esa pantalla
- crear plantilla Excel especifica para participantes
- validar columnas requeridas antes de procesar
- implementar `preview` de filas antes de ejecutar
- clasificar cada fila como:
  - crear
  - actualizar
  - omitir
  - error
- mostrar resultado final por fila
- permitir nueva importacion sin mezclar estados previos

### Criterios de aceptacion

- se puede cargar solo participantes sin tocar certificados
- el usuario entiende que pasara antes de importar
- el resultado final deja claro que ocurrio con cada fila

---

## Fase 2 - Rehacer la importacion masiva de certificados

### Objetivo

Hacer que la carga masiva siga el mismo flujo base que la creacion individual.

### Trabajo a realizar

- desacoplar el import actual de logica directa por repositorio
- reutilizar el caso de uso de creacion o una capa orquestadora equivalente
- soportar configuracion global del lote para:
  - campus
  - area academica
  - programa opcional
  - plantilla
  - firmante 1
  - firmante 2
  - fecha de expiracion opcional
- enriquecer `metadata` igual que en la creacion individual
- distinguir claramente filas que:
  - solo crean o actualizan participante
  - crean certificado
  - son duplicadas
  - fallan

### Criterios de aceptacion

- un certificado importado se comporta igual que uno manual
- usa la plantilla correcta
- las firmas salen correctamente
- el detalle y el PDF quedan alineados con el flujo individual

---

## Fase 3 - Mejora de experiencia operativa de importacion

### Objetivo

Convertir ambos menus de importacion en asistentes claros y predecibles.

### Trabajo a realizar

- estructurar el flujo por pasos
- mostrar campos globales antes de subir el archivo
- detectar columnas faltantes o invalidas
- mostrar resumen previo con primeras filas
- advertir inconsistencias antes de ejecutar
- resumir resultados por conteo y por detalle
- habilitar descarga o copia del reporte de errores

### Criterios de aceptacion

- el usuario no importa a ciegas
- la interfaz deja claro que datos globales se aplicaran al lote
- errores y omisiones se entienden sin revisar codigo

---

## Fase 4 - Consolidacion del modulo de plantillas

### Objetivo

Hacer que el menu de plantillas refleje mejor el motor real de generacion.

### Trabajo a realizar

- mostrar si la plantilla trabaja en modo `HTML` o `LEGACY`
- mejorar la vista previa del catalogo usando datos de ejemplo consistentes
- revisar la duplicacion de plantillas para copiar correctamente:
  - `htmlContent`
  - `cssStyles`
  - `layout`
  - `placeholders`
- reforzar los metadatos visibles del catalogo:
  - tipo
  - tamano
  - orientacion
  - estado
  - modo de render

### Criterios de aceptacion

- lo que se ve en el catalogo se acerca a lo que luego ve el usuario en el certificado
- duplicar una plantilla no pierde el diseno real

---

## Fase 5 - Validacion cruzada de punta a punta

### Objetivo

Probar el sistema completo despues de la refactorizacion.

### Casos de prueba obligatorios

1. importar participantes nuevos
2. importar participantes existentes con datos incompletos
3. importar certificados con plantilla global
4. importar certificados con firmantes globales
5. abrir detalle de certificado importado
6. descargar PDF de certificado importado
7. comparar certificado manual vs importado
8. probar una plantilla `HTML`
9. probar una plantilla `LEGACY`

### Criterios de aceptacion

- no hay divergencia visible entre manual y masivo
- la plantilla seleccionada se respeta
- el PDF y la vista del detalle coinciden

---

## 6. Orden exacto recomendado

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5

Este orden evita hacer primero mejoras visuales sobre una logica todavia inconsistente.

---

## 7. Riesgos de implementacion y mitigacion

### Riesgo 1 - Romper el flujo manual que ya quedo estable

**Mitigacion:** reutilizar el caso de uso existente y no crear una segunda logica paralela.

### Riesgo 2 - Mezclar importacion de participantes y certificados otra vez

**Mitigacion:** separar menus, plantillas de Excel y resultados.

### Riesgo 3 - Duplicados o actualizaciones silenciosas

**Mitigacion:** clasificar cada fila antes y despues de ejecutar, con reglas visibles.

### Riesgo 4 - Plantillas que se vean bien en preview pero no en PDF

**Mitigacion:** mantener preview, detalle y PDF sobre el mismo render base.

### Riesgo 5 - Plantillas legacy rotas por el nuevo orden

**Mitigacion:** mantener compatibilidad temporal y etiquetar el modo de render.

---

## 8. Definition of Done del bloque

Se considerara cerrado este plan cuando:

- exista importacion propia de participantes
- exista importacion de certificados alineada con la creacion manual
- ambos menus tengan validacion previa clara
- el resultado por fila sea trazable
- las firmas y plantillas se respeten en el flujo masivo
- el catalogo de plantillas explique mejor el comportamiento real de cada diseno
- los certificados importados se vean igual de consistentes que los manuales

---

## 9. Siguiente paso recomendado

El siguiente paso operativo debe ser iniciar la **Fase 0 - Cierre de contrato funcional**.

Antes de implementar conviene dejar por escrito:

- columnas exactas de cada Excel
- reglas de deduplicacion
- campos globales del lote
- comportamiento oficial ante filas incompletas
- formato de resumen de importacion

Asi evitamos rehacer pantallas por decisiones funcionales no cerradas.

---

## 10. Resultado esperado al finalizar cada fase

## Fase 0

Debes esperar:

- columnas oficiales definidas
- reglas de deduplicacion cerradas
- criterios de exito, omision y error definidos

Si todo salio bien:

- ya no hay dudas sobre como debe comportarse cada importacion

## Fase 1

Debes esperar:

- importacion propia de participantes
- plantilla Excel propia de participantes
- preview de filas antes de ejecutar
- resumen final por fila

Si todo salio bien:

- puedes cargar participantes sin tocar certificados

## Fase 2

Debes esperar:

- certificados masivos alineados con la logica del flujo manual
- campus, plantilla, firmantes y metadatos aplicados correctamente
- detalle y PDF coherentes en certificados importados

Si todo salio bien:

- manual y masivo dejan de comportarse como dos sistemas distintos

## Fase 3

Debes esperar:

- importaciones guiadas por pasos
- advertencias claras antes de ejecutar
- reporte de errores entendible

Si todo salio bien:

- el usuario ya no importa a ciegas

## Fase 4

Debes esperar:

- catalogo de plantillas mas claro
- preview mas fiel
- duplicacion completa de plantillas
- visibilidad del modo `HTML` o `LEGACY`

Si todo salio bien:

- el modulo de plantillas ya refleja mejor el comportamiento real del sistema

## Fase 5

Debes esperar:

- pruebas cruzadas manual vs masivo superadas
- plantillas nuevas y legacy funcionando
- PDF, detalle y preview alineados

Si todo salio bien:

- el bloque completo queda listo para uso operativo con confianza

**Fin del documento.**
