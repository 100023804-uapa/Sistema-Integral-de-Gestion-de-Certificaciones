# Hallazgos de pruebas posteriores a las fases de modernizacion

Fecha: 2026-03-09

## Contexto

Despues de completar las fases de:

- biblioteca interna de fuentes
- editor guiado de fuentes
- modelo tipografico estructurado
- render unificado
- emision inmutable
- PDF persistido
- compatibilidad y migracion visible

se realizaron pruebas manuales sobre plantillas, certificados emitidos, verificacion publica y formularios con catalogos asincronos.

Este documento deja registro de los temas detectados para tratarlos como ajustes posteriores sin perder contexto.

## Hallazgos principales

### 1. Uso de fuente interna cargada pero no aplicada visualmente

Se confirmo que las fuentes fueron subidas correctamente a la biblioteca interna, incluyendo:

- `PinyonScript-Regular.ttf`
- `Montserrat-VariableFont_wght.ttf`
- `Montserrat-Italic-VariableFont_wght.ttf`

El problema observado no apunta a un fallo de UploadThing ni de storage, sino al uso posterior dentro de la plantilla:

- subir la fuente no basta por si solo
- la fuente debe quedar vinculada a la plantilla mediante `Usar en plantilla`
- el CSS debe usar exactamente el nombre interno de la familia guardada por el sistema
- la plantilla no debe conservar dependencias remotas viejas como Google Fonts o `style.css`

### 2. Dependencias remotas heredadas dentro del HTML/CSS de plantillas

Durante las pruebas se detecto que algunas plantillas siguen incluyendo:

- `link` a Google Fonts
- `link rel="stylesheet" href="style.css"`
- reglas de ejemplo `.selector { ... }` pegadas sin aplicarse a clases reales

Esto provoca mezcla de fuentes gestionadas y fuentes remotas, y dificulta que el visor y el PDF coincidan.

### 3. Diferencias tipograficas entre visor y PDF

Aunque el flujo mejoro, se mantiene como punto sensible:

- el visor puede mostrar una fuente interna correcta
- el PDF puede degradar si la plantilla sigue declarando mal la familia o depende de recursos heredados/remotos

En las pruebas el caso mas visible fue el nombre del estudiante, donde debia entrar `PinyonScript` y se termino viendo una cursiva generica.

### 4. Variables de entorno no declaradas al emitir

Se identifico un caso donde la URL de verificacion reflejaba un placeholder porque la variable de entorno no estaba configurada al momento de generar el certificado.

Esto no se considero un fallo de implementacion del flujo nuevo, sino un hallazgo de configuracion detectado por las pruebas.

### 5. Selectores asincronos sin feedback suficiente

Se detecto que varios desplegables que dependen de catalogos remotos pueden quedar visualmente vacios durante unos segundos, dando la impresion de que no existen datos.

Los casos mas evidentes se vieron en:

- importacion masiva de certificados
- creacion manual de certificados
- gestion de usuarios

El ajuste recomendado es mostrar estados explicitos como:

- `Cargando...`
- `Primero selecciona ...`
- `No hay datos disponibles`

## Interpretacion de los hallazgos

Los hallazgos no invalidan el trabajo previo.

Lo que indican es que la base estructural ya esta lista, pero las pruebas reales expusieron ajustes de experiencia y de consistencia operativa que todavia conviene resolver:

- limpieza de HTML/CSS heredado en plantillas
- uso correcto de fuentes internas en la practica
- mensajes de carga en selectores asincronos
- validacion final de coincidencia entre visor y PDF

## Siguiente bloque de trabajo sugerido

1. Ajuste fino de uso de fuentes internas en plantillas reales.
2. Limpieza de dependencias remotas heredadas en HTML/CSS.
3. Mejora UX de catalogos y selectores asincronos con mensajes de carga.
4. Nueva ronda de pruebas integrales sobre:
   - editor
   - detalle interno
   - verificacion publica
   - descarga PDF

## Objetivo de este documento

Servir como punto de control entre:

- las fases ya cerradas
- y los ajustes finos detectados por pruebas reales

para que los cambios siguientes no se pierdan dentro de la documentacion anterior ni se mezclen con los entregables ya estabilizados.
