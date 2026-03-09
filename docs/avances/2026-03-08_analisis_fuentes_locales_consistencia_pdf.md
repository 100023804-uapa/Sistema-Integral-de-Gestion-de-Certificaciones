# 2026-03-08 - Analisis de fuentes locales para consistencia PDF

## Objetivo

Registrar el diagnostico del desfase visual entre el visor del certificado y el PDF descargado, una vez corregida la seleccion de plantilla en la vista publica.

## Hallazgo

La diferencia restante no apunta a una plantilla incorrecta, sino a la carga de fuentes web externas durante la exportacion PDF.

El visor HTML muestra correctamente la plantilla porque el navegador resuelve mejor las tipografias remotas. En la descarga PDF, la captura del HTML puede resolver esas fuentes con fallback o con metricas distintas, afectando sobre todo el nombre del participante.

## Decision tecnica recomendada

No depender de Google Fonts para plantillas certificables.

Se recomienda:

- descargar las fuentes necesarias,
- guardarlas localmente dentro del proyecto,
- declararlas con `@font-face`,
- actualizar las plantillas para usar esas fuentes locales.

## Fuentes prioritarias

- `Pinyon Script`
- `Montserrat`

## Resultado esperado

Cuando las fuentes queden locales:

- el visor y el PDF deberian verse mucho mas parecidos,
- el nombre del participante no deberia cambiar de forma ni desalinearse,
- la salida final sera mas estable y menos dependiente de condiciones externas.

## Nota adicional

Tambien se identifico que la URL de validacion puede guardar un placeholder si `APP_URL` o `NEXT_PUBLIC_APP_URL` no estan definidas al generar el certificado. Ese punto es independiente del problema tipografico.
