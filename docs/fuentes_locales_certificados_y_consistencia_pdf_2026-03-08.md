# Fuentes locales para consistencia entre visor y PDF

## Contexto

En la validacion publica de certificados y en la descarga PDF ya se corrigio el problema principal de plantilla equivocada. Tanto el visor como la descarga usan la plantilla seleccionada por `templateId`.

Sin embargo, todavia puede existir una diferencia visual entre:

- el visor HTML del certificado,
- y el PDF generado a partir de ese mismo render.

La diferencia visible mas importante aparece en tipografias decorativas, en especial en el nombre del participante.

## Diagnostico

El visor renderiza el certificado como HTML real dentro de un `iframe`. En ese contexto, el navegador puede cargar fuentes remotas y dibujar el texto con bastante fidelidad.

La descarga PDF no imprime el `iframe` de forma nativa. El sistema renderiza el HTML y luego lo captura para llevarlo a un PDF. En ese proceso, las fuentes web externas pueden fallar o resolver con distinta metrica.

Esto produce sintomas como:

- cambio de tipografia en el nombre,
- letras mas anchas o mas estrechas,
- perdida de espaciado,
- desalineacion de bloques que dependen del ancho del texto.

## Causa principal

La causa principal es la dependencia de fuentes externas cargadas por URL, por ejemplo mediante Google Fonts.

Aunque el visor del navegador pueda cargarlas correctamente, el paso de captura/exportacion a PDF es mas fragil porque:

- puede iniciar antes de que la fuente termine de cargar,
- puede usar una fuente de reemplazo,
- puede calcular el layout con metricas distintas,
- puede comportarse diferente dentro de un `iframe` y luego en la rasterizacion.

## Alcance del problema

Esto no significa que la plantilla seleccionada sea incorrecta.

El problema actual ya no esta en la seleccion de plantilla, sino en la fidelidad tipografica entre dos salidas del mismo render:

- la vista HTML,
- y la exportacion PDF.

## Estrategia recomendada

La estrategia correcta es dejar de depender de fuentes remotas en plantillas certificables y pasar a fuentes locales dentro del proyecto.

### Recomendacion principal

Guardar las fuentes dentro del proyecto y declararlas con `@font-face`.

Ejemplo de estructura:

- `public/fonts/pinyon-script/`
- `public/fonts/montserrat/`

Luego, dentro del CSS real de la plantilla:

```css
@font-face {
  font-family: 'Pinyon Script Local';
  src:
    url('/fonts/pinyon-script/PinyonScript-Regular.woff2') format('woff2'),
    url('/fonts/pinyon-script/PinyonScript-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}

@font-face {
  font-family: 'Montserrat Local';
  src:
    url('/fonts/montserrat/Montserrat-Regular.woff2') format('woff2'),
    url('/fonts/montserrat/Montserrat-Regular.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}
```

Y despues usar esas familias en la plantilla en lugar de depender de enlaces remotos.

## Alternativa

Otra opcion es incrustar la fuente en base64 dentro del propio CSS del certificado.

Ventajas:

- maxima portabilidad,
- menor dependencia del entorno,
- mas consistencia entre visor y exportacion.

Desventajas:

- HTML y CSS mas pesados,
- mantenimiento mas incomodo,
- plantillas mas dificiles de editar.

Por eso, para este proyecto se considera mejor empezar con fuentes locales servidas desde `public/fonts`.

## Recomendacion especifica para SIGCE

Para las plantillas actuales de certificados, especialmente las que usan nombre decorativo, se recomienda localizar como minimo:

- `Pinyon Script`
- `Montserrat`

Aunque la diferencia visible mas fuerte este en el nombre, ambas deberian quedar locales para maximizar consistencia entre visor y PDF.

## Criterio de aceptacion

Se considerara resuelto cuando:

- el visor HTML y el PDF usen la misma familia tipografica real,
- el nombre del participante conserve la misma forma visual,
- no existan saltos o desalineaciones causados por fallback de fuentes,
- la plantilla no dependa de Google Fonts para la salida final certificable.

## Observacion operativa

La variable de entorno `APP_URL` o `NEXT_PUBLIC_APP_URL` debe estar correctamente configurada al momento de generar certificados, porque de lo contrario la URL de validacion puede quedar persistida con un valor placeholder. Ese punto es independiente del problema de fuentes.
