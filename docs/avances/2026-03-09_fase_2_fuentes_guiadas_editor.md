# Avance: Fase 2 implementada - Flujo guiado de fuentes en el editor de plantillas

**Fecha:** 2026-03-09  
**Fase:** Fase 2 - Nuevo apartado de fuentes en el editor HTML/CSS  
**Estado:** Implementada

## Objetivo

Volver operativa la biblioteca de fuentes creada en la Fase 1 y llevarla a un flujo mas guiado dentro del editor de plantillas, para que el usuario deje de depender de copiar enlaces externos de manera manual.

## Problema que se corrige

La infraestructura base de fuentes internas ya existia, pero el panel todavia se sentia tecnico:

- no detectaba riesgos en el HTML/CSS actual,
- no permitia importar desde URL directa,
- no daba ayudas suficientemente claras para insertar CSS,
- y la eliminacion de una fuente no limpiaba el archivo remoto asociado.

## Cambios implementados

### 1. Analisis de riesgos tipograficos dentro del editor

Se extendio [template-fonts.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/config/template-fonts.ts) con:

- `analyzeTemplateFontRisks(...)`
- `inferTemplateFontFallback(...)`
- `buildTemplateFontRuleSnippet(...)`

Con esto el panel ahora detecta patrones fragiles como:

- Google Fonts,
- `@import` remoto,
- hojas de estilo externas,
- `@font-face` remoto,
- ausencia de `font-family` en el CSS.

### 2. Panel de fuentes mas guiado y operativo

Se reestructuro [FontLibraryPanel.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/dashboard/templates/FontLibraryPanel.tsx).

Ahora el panel:

- resume cuantas fuentes hay vinculadas, cuantas hay en biblioteca y cuantas alertas existen,
- muestra una zona de riesgos detectados en el codigo actual,
- separa claramente `Subir archivo local` de `Importar desde URL`,
- mantiene la lista de fuentes seguras recomendadas,
- permite copiar `font-family`,
- permite copiar una regla CSS sugerida,
- permite insertar `font-family` o una regla completa en el CSS,
- diferencia fuentes internas subidas manualmente de fuentes importadas desde URL.

### 3. Importacion desde URL directa a storage interno

Se agrego la ruta:

- [app/api/admin/font-assets/import/route.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/admin/font-assets/import/route.ts)

Esta ruta:

- exige sesion administrativa,
- acepta una URL directa a un archivo `.woff2`, `.woff`, `.ttf` u `.otf`,
- descarga el archivo,
- lo sube a UploadThing,
- y devuelve la metadata lista para registrar en `font_assets`.

El registro final en Firestore lo sigue haciendo el cliente autenticado, para mantener coherencia con el resto del panel.

### 4. Limpieza del archivo remoto al borrar una fuente

Se agrego la ruta:

- [app/api/admin/font-assets/delete/route.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/admin/font-assets/delete/route.ts)

Y el panel ahora la usa antes de borrar el documento de `font_assets`.

Con esto, al eliminar una fuente de la biblioteca:

- se elimina el archivo remoto cuando hay `key`,
- se limpia la referencia de la plantilla si estaba vinculada,
- y se evita seguir acumulando archivos huerfanos en storage.

### 5. Conexion del analisis con los editores create/edit

Se actualizaron:

- [create/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/create/page.tsx)
- [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)

Ahora el panel recibe:

- `htmlContent`
- `cssStyles`

y puede analizar la plantilla real que se esta editando.

## Que debe esperar el usuario ahora

En `Codigo HTML/CSS`, el usuario debe poder:

- ver alertas si la plantilla aun usa Google Fonts o imports remotos,
- subir una fuente local,
- importar una fuente desde una URL directa,
- copiar el `font-family`,
- copiar una regla CSS sugerida,
- insertar el snippet deseado en el editor,
- distinguir si una fuente es interna o fue importada desde URL,
- y eliminar una fuente limpiando tambien el archivo remoto asociado.

## Archivos impactados

- [template-fonts.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/config/template-fonts.ts)
- [FontLibraryPanel.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/dashboard/templates/FontLibraryPanel.tsx)
- [import/route.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/admin/font-assets/import/route.ts)
- [delete/route.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/admin/font-assets/delete/route.ts)
- [create/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/create/page.tsx)
- [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)

## Verificacion realizada

- `pnpm exec tsc --noEmit` -> OK
- `pnpm exec eslint ... --no-cache` sobre archivos de Fase 2 -> OK sin errores

Warnings no bloqueantes detectados:

- `react-hooks/exhaustive-deps` en [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)
- `jsx-a11y/alt-text` en [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)

## Salida esperada de la Fase 2

La Fase 2 se considera bien cerrada si:

- el usuario ya no necesita improvisar el manejo de fuentes dentro del editor,
- puede detectar riesgos tipograficos de su plantilla actual,
- puede subir o importar una fuente desde URL directa,
- puede insertar rapidamente el CSS adecuado,
- y la biblioteca de fuentes ya tiene un flujo de vida mas completo.

## Siguiente paso recomendado

Iniciar la **Fase 3 - Consolidar formalmente el modelo de plantilla alrededor de sus referencias tipograficas**, para seguir reduciendo la brecha entre lo que el usuario diseña y lo que el sistema emite.
