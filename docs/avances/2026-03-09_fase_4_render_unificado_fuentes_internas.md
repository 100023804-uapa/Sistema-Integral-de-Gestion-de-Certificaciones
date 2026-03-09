# Avance: Fase 4 implementada - Render unificado con fuentes internas

**Fecha:** 2026-03-09  
**Fase:** Fase 4 - Render unificado con fuentes internas  
**Estado:** Implementada

## Objetivo

Hacer que editor, catalogo, detalle y verificacion se apoyen en el mismo armado visual del certificado, para reducir diferencias entre lo que se diseña y lo que luego se visualiza en el sistema.

## Problema que se corrige

Antes de esta fase, el sistema ya tenia:

- render real en detalle interno y verificacion publica,
- catalogo con preview runtime,
- y biblioteca interna de fuentes.

Pero el editor de plantillas todavia conservaba un preview armado por `srcDoc` directo y un camino de visualizacion menos alineado con el motor real. Eso dejaba una brecha justo en el punto donde nace el diseño.

## Cambios implementados

### 1. Nuevo preview runtime reutilizable

Se agrego [TemplateRuntimePreview.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/dashboard/templates/TemplateRuntimePreview.tsx).

Este componente:

- usa `renderCertificateTemplate(...)`,
- arma un certificado de ejemplo consistente,
- acepta plantillas ya guardadas o borradores del editor,
- y devuelve un `iframe` escalado con el mismo documento HTML final que luego usan otros puntos del sistema.

Tambien incorpora `buildRuntimePreviewTemplate(...)` para normalizar borradores del editor a una plantilla runtime valida.

### 2. El editor create usa el render real

Se actualizo [create/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/create/page.tsx).

Ahora la modal `Vista Previa de la Plantilla` construye un `previewTemplate` runtime y lo pasa a `TemplateRuntimePreview`.

Con esto, la vista previa del editor:

- ya no depende solo del `srcDoc` crudo,
- usa las fuentes internas declaradas en la plantilla,
- y se alinea mucho mejor con detalle y verificacion.

### 3. El editor edit usa el mismo preview runtime

Se actualizo [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx).

La edicion ahora comparte el mismo preview runtime que el flujo de creacion y el catalogo.

### 4. El catalogo expone el perfil tipografico junto al modo real

Se actualizo [page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/page.tsx).

El catalogo ahora:

- reutiliza `TemplateRuntimePreview` como pieza compartida,
- muestra badge de `perfil tipografico`,
- y expone en tarjeta/modal datos como:
  - estado tipografico,
  - fuentes gestionadas,
  - fuentes externas.

Eso vuelve visible, desde el catalogo, si una plantilla ya esta lista para un flujo mas estable o si todavia depende de recursos fragiles.

## Que debe esperar el usuario ahora

En plantillas, el usuario debe notar que:

- la vista previa de crear, editar y catalogo se parece mucho mas entre si,
- el catalogo ya muestra si la plantilla esta `gestionada`, `segura`, `mixta`, `externa`, etc.,
- y las fuentes internas ya forman parte del preview real, no solo del CSS pegado manualmente.

## Archivos impactados

- [TemplateRuntimePreview.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/dashboard/templates/TemplateRuntimePreview.tsx)
- [create/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/create/page.tsx)
- [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)
- [page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/page.tsx)

## Verificacion realizada

- `pnpm exec tsc --noEmit` -> OK
- `pnpm exec eslint "components/dashboard/templates/TemplateRuntimePreview.tsx" "app/dashboard/certificate-templates/page.tsx" "app/dashboard/certificate-templates/create/page.tsx" "app/dashboard/certificate-templates/[id]/edit/page.tsx" --no-cache` -> OK sin errores

Warnings no bloqueantes ya existentes:

- `react-hooks/exhaustive-deps` en [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)
- `jsx-a11y/alt-text` en [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)

## Salida esperada de la Fase 4

La Fase 4 se considera bien cerrada si:

- crear, editar y catalogo ya no dependen de previews tipograficos paralelos,
- el preview de plantilla usa el mismo motor base que detalle y verificacion,
- el catalogo deja visible el estado tipografico real de cada plantilla,
- y la plantilla se visualiza con un comportamiento mas consistente a traves del sistema.

## Siguiente paso recomendado

Iniciar la **Fase 5 - Emision inmutable del certificado**, para congelar el estado visual al momento de emitir y dejar de depender por completo de la plantilla viva para documentos ya generados.
