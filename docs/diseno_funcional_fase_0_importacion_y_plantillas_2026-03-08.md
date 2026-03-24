# Diseno Funcional Fase 0 - Importacion y Plantillas

**Fecha:** 2026-03-08  
**Estado:** Definido  
**Alcance:** Cierre de contrato funcional antes de implementar las fases 1 a 5  
**Relacionado con:**

- `docs/plan_mejora_importacion_masiva_y_plantillas_2026-03-07.md`
- `app/dashboard/graduates/page.tsx`
- `app/dashboard/certificates/import/page.tsx`
- `app/actions/import-certificates.ts`
- `app/dashboard/certificates/create/page.tsx`

---

## 1. Objetivo de la Fase 0

La Fase 0 no implementa pantallas nuevas ni cambios de backend.

Su objetivo es cerrar el contrato funcional para que la implementacion posterior no dependa de supuestos cambiantes.

Al terminar la Fase 0 deben quedar definidos:

1. columnas oficiales de cada Excel
2. reglas de deduplicacion
3. campos globales permitidos por lote
4. resultado esperado por fila
5. criterio de exito al finalizar cada fase del plan

---

## 2. Regla principal del bloque

Se separan formalmente dos flujos:

- **Importacion de participantes**
- **Importacion de certificados**

Ningun menu debe volver a mezclar ambos procesos como si fueran lo mismo.

---

## 3. Contrato funcional de importacion de participantes

## 3.1 Proposito

Permitir crear o actualizar participantes sin generar certificados.

## 3.2 Ubicacion esperada

El menu de participantes debe tener su propia ruta de importacion:

- `dashboard/graduates/import`

## 3.3 Columnas oficiales del Excel de participantes

### Requeridas

- `Matricula`
- `Nombres`
- `Apellidos`

### Opcionales

- `Cedula`
- `Email`
- `Telefono`
- `Carrera`

### Compatibilidad temporal

Se acepta una columna legacy:

- `Nombre`

Solo para compatibilidad de transicion. Si llega `Nombre` y no llegan `Nombres` y `Apellidos`, la prevalidacion debe advertir que el archivo esta en formato viejo y que sera necesario normalizarlo o dividirlo antes de importar definitivamente.

## 3.4 Reglas de deduplicacion de participantes

### Regla primaria

- `Matricula` es la clave principal del participante

### Regla secundaria

- `Cedula`, si viene informada, no puede repetirse en otro participante distinto

### Regla de correo

- `Email` no sera tratado como identificador unico obligatorio
- si viene vacio, no bloquea la importacion
- si viene duplicado, se registrara como advertencia, no como bloqueo automatico

## 3.5 Resultado por fila esperado

Cada fila debe quedar clasificada como una sola de estas opciones:

- `crear_participante`
- `actualizar_participante`
- `omitir_sin_cambios`
- `error`

## 3.6 Que se considera exito

Una fila es exitosa solo si:

- crea correctamente un participante nuevo, o
- actualiza correctamente uno existente

## 3.7 Que se considera omision

Una fila se omite cuando:

- el participante ya existe
- y el archivo no aporta ningun dato nuevo o modificable

## 3.8 Que se considera error

Una fila falla cuando:

- falta `Matricula`
- faltan `Nombres` y `Apellidos` sin compatibilidad valida
- la `Cedula` choca con otro participante
- hay datos invalidos imposibles de guardar

---

## 4. Contrato funcional de importacion de certificados

## 4.1 Proposito

Permitir generar certificados en lote con plantilla y configuracion global, pudiendo crear o actualizar participantes si hace falta.

## 4.2 Ubicacion esperada

Se mantiene el flujo en:

- `dashboard/certificates/import`

pero con responsabilidad exclusivamente orientada a certificados.

## 4.3 Configuracion global obligatoria del lote

- `Campus`

## 4.4 Configuracion global opcional del lote

- `AreaAcademica`
- `Plantilla`
- `Firmante1`
- `Firmante2`
- `ProgramaGlobal`
- `FechaExpiracionGlobal`

## 4.5 Columnas oficiales del Excel de certificados

### Requeridas

- `Matricula`
- `Nombre`
- `Curso`

### Opcionales

- `Cedula`
- `Email`
- `Tipo`
- `Fecha`
- `Folio`
- `Carrera`
- `Calificacion`
- `Duracion`
- `Descripcion`

## 4.6 Reglas de importacion de certificados

### Programa

- si existe `ProgramaGlobal`, sobreescribe `Curso`
- si no existe, se usa `Curso` de la fila

### Tipo

- si no viene `Tipo`, se asume `CAP`

### Fecha

- si no viene `Fecha`, se usara la fecha actual y se marcara advertencia

### Folio

- `Folio` deja de ser requisito para crear certificado
- si no viene `Folio`, el sistema debe generarlo automaticamente usando la misma logica del flujo manual

### Participante asociado

- si la `Matricula` no existe, se crea el participante
- si existe, se actualizan solo campos faltantes o permitidos

## 4.7 Reglas de deduplicacion de certificados

### Regla primaria

- si viene `Folio` y ya existe, la fila no crea certificado

### Regla secundaria de archivo

- si dentro del mismo Excel se repite la combinacion `Matricula + Curso + Fecha + Tipo`, la prevalidacion debe advertir duplicado potencial

### Regla de sistema

En esta fase no se declara aun una regla fuerte de deduplicacion historica por `Matricula + Curso + Fecha + Tipo` fuera del mismo archivo, para no bloquear casos legitimos sin una politica formal mas refinada.

## 4.8 Resultado por fila esperado

Cada fila debe quedar clasificada con suficiente detalle. Las salidas validas son:

- `crear_participante_y_certificado`
- `actualizar_participante_y_certificado`
- `crear_certificado_sobre_participante_existente`
- `omitir_certificado_duplicado`
- `error`

## 4.9 Que se considera exito

Una fila es exitosa solo si al final existe un certificado creado correctamente.

No se contara como exito completo una fila que solo cree o actualice participante sin emitir certificado.

## 4.10 Que se considera omision

Una fila se omite cuando:

- el `Folio` ya existe, o
- la prevalidacion marca la fila como no ejecutable y el usuario decide no incluirla

## 4.11 Que se considera error

Una fila falla cuando:

- falta `Matricula`
- falta `Nombre`
- falta `Curso` y tampoco existe `ProgramaGlobal`
- el campus global no fue configurado
- hay conflicto de `Cedula`
- hay error al persistir el participante o el certificado

---

## 5. Contrato funcional del preview previo a importar

Tanto en participantes como en certificados, antes de ejecutar debe existir una vista de prevalidacion.

## 5.1 Que debe mostrar el preview

- primeras filas del archivo
- columnas detectadas
- columnas faltantes
- columnas no reconocidas
- conteo preliminar por estado
- advertencias relevantes

## 5.2 Estados visibles en preview

- `listo_para_crear`
- `listo_para_actualizar`
- `duplicado_potencial`
- `faltan_datos`
- `error_de_formato`

## 5.3 Regla de ejecucion

No debe iniciarse la importacion si:

- faltan columnas requeridas
- no se completo la configuracion global obligatoria

---

## 6. Contrato funcional del modulo de plantillas dentro de este plan

El modulo de plantillas se alineara con estas reglas:

### 6.1 Fuente principal de verdad

- `htmlContent + cssStyles` para plantillas nuevas

### 6.2 Compatibilidad

- `layout.sections` solo como soporte legacy

### 6.3 Que debe quedar claro en el catalogo

- modo de render
- dimensiones
- orientacion
- estado
- preview coherente

### 6.4 Regla de duplicacion

Duplicar una plantilla debe copiar por completo:

- HTML
- CSS
- layout
- placeholders

---

## 7. Salida esperada al finalizar cada fase

## Fase 0

Debes esperar:

- contrato funcional cerrado
- columnas oficiales definidas
- reglas de deduplicacion definidas
- criterios de exito, omision y error definidos

Si esto sale bien:

- ya no hay ambiguedad sobre que debe hacer cada importacion

## Fase 1

Debes esperar:

- menu propio de importacion de participantes
- plantilla Excel propia de participantes
- preview claro antes de ejecutar
- resultados por fila de participantes

Si esto sale bien:

- puedes cargar participantes sin tocar certificados

## Fase 2

Debes esperar:

- la importacion masiva de certificados respeta campus, plantilla, firmantes y programa
- el certificado importado se comporta igual que uno manual
- un certificado importado abre bien su detalle y su PDF

Si esto sale bien:

- ya no hay diferencia funcional importante entre manual y masivo

## Fase 3

Debes esperar:

- experiencia guiada por pasos
- advertencias visibles antes de ejecutar
- resumen final entendible
- reporte de errores reutilizable

Si esto sale bien:

- el usuario ya no importa a ciegas

## Fase 4

Debes esperar:

- catalogo de plantillas mas claro
- preview mas fiel al render real
- duplicacion correcta de plantillas
- visibilidad del modo `HTML` o `LEGACY`

Si esto sale bien:

- el equipo entiende mejor que plantilla esta usando y como se comporta

## Fase 5

Debes esperar:

- pruebas cruzadas manual vs masivo superadas
- plantillas HTML y legacy funcionando
- detalle y PDF alineados

Si esto sale bien:

- el bloque completo queda estable y listo para uso operativo real

---

## 8. Siguiente paso operativo

Con la Fase 0 cerrada, el siguiente paso recomendado es implementar la **Fase 1 - Importacion masiva de participantes**.

Motivo:

- es el bloque mas independiente
- limpia el menu de participantes
- reduce mezcla de responsabilidades antes de tocar certificados

**Fin del documento.**
