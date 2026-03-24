# Avance: Fase 1 implementada - Biblioteca de fuentes internas para plantillas

**Fecha:** 2026-03-08  
**Fase:** Fase 1 - Biblioteca de fuentes del sistema  
**Estado:** Implementada

## Objetivo

Iniciar la modernizacion del sistema de plantillas para dejar de depender exclusivamente de fuentes externas pegadas manualmente en HTML/CSS y abrir el camino hacia una emision de certificados mas estable y coherente entre:

- editor de plantillas,
- vista previa,
- detalle del certificado,
- verificacion publica,
- y futura descarga PDF inmutable.

## Problema que se ataca

Hasta este punto, el editor HTML/CSS permitia depender de Google Fonts o de cualquier enlace remoto sin control del sistema. Eso introducia varios riesgos:

- diferencias entre visor HTML y PDF,
- plantillas sin metadata formal de tipografias,
- imposibilidad de reutilizar o gobernar fuentes desde el sistema,
- perdida de consistencia al duplicar plantillas,
- y falta de base tecnica para congelar un render visual estable mas adelante.

## Alcance implementado

### 1. Nuevo modelo de fuente interna

Se agrego el tipo [fontAsset.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/types/fontAsset.ts) para representar fuentes gestionadas por el sistema.

Ese modelo cubre:

- nombre visible,
- familia de fuente,
- URL interna,
- formato,
- peso,
- estilo,
- tipo de origen,
- y estado activo.

### 2. Fuentes seguras y helpers de integracion

Se agrego [template-fonts.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/config/template-fonts.ts) con:

- lista de fuentes seguras recomendadas para certificados,
- inferencia de formato a partir del archivo,
- normalizacion de referencias de fuente (`fontRefs`),
- generacion de snippets CSS,
- e inyeccion de bloques `@font-face` para fuentes internas.

### 3. Persistencia de referencias de fuente en plantillas

Se extendio [certificateTemplate.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/types/certificateTemplate.ts) para que las plantillas soporten `fontRefs`.

Las referencias quedan disponibles en:

- `CreateTemplateRequest`
- `UpdateTemplateRequest`
- `CertificateTemplate`

### 4. Persistencia real en repositorio y casos de uso

Se actualizo la cadena de guardado para que `fontRefs` no se pierda:

- [FirebaseCertificateTemplateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts)
- [CreateTemplateUseCase.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/usecases/certificateTemplate/CreateTemplateUseCase.ts)
- [UpdateTemplateUseCase.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/usecases/certificateTemplate/UpdateTemplateUseCase.ts)
- [route.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/admin/certificate-templates/route.ts)

Tambien se corrigio la duplicacion en el catalogo para que una copia de plantilla conserve sus fuentes:

- [page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/page.tsx)

### 5. Biblioteca interna de fuentes en el editor HTML/CSS

Se agrego el nuevo panel reutilizable:

- [FontLibraryPanel.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/dashboard/templates/FontLibraryPanel.tsx)

Ese panel permite:

- subir fuentes internas al sistema,
- ver fuentes seguras del navegador,
- asociar o desasociar fuentes a la plantilla actual,
- copiar el `font-family`,
- insertar snippets CSS en el editor,
- y visualizar la fuente con texto de muestra.

Se integro en:

- [create/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/create/page.tsx)
- [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)

### 6. Ruta de upload para fuentes

Se agrego soporte de subida de fuentes en:

- [core.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/uploadthing/core.ts)

Nueva ruta:

- `fontUpload`

### 7. Reglas para almacenar metadata de fuentes

Se extendieron las reglas para permitir gobernar la coleccion `font_assets`:

- [firestore.rules](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/firestore.rules)

### 8. Preview del editor ya preparado para fuentes internas

Se agrego el helper:

- [build-template-preview-document.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/utils/build-template-preview-document.ts)

Ese helper permite que la vista previa del editor inyecte automaticamente las fuentes internas asociadas a la plantilla.

### 9. Render runtime alineado con fuentes internas

Se actualizo el renderizador unificado:

- [certificate-template-renderer.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/utils/certificate-template-renderer.ts)

Con esto:

- HTML, legacy y default pueden recibir `fontRefs`,
- se inyecta `@font-face` en tiempo de render,
- y se prepara la base para que el certificado emitido use la misma fuente interna en distintas superficies.

## Que debe esperar el usuario ahora

En el editor de plantillas, pestaña `Codigo HTML/CSS`, ahora debe ver:

- un bloque nuevo llamado `Fuentes`,
- lista de `Fuentes seguras del navegador`,
- biblioteca de `Fuentes internas`,
- opcion de subir `.woff2`, `.woff`, `.ttf` u `.otf`,
- boton para insertar el snippet CSS recomendado,
- y posibilidad de vincular la fuente a la plantilla actual.

Ademas:

- una plantilla guardada conserva sus `fontRefs`,
- una plantilla duplicada conserva esas referencias,
- y la vista previa del editor ya puede usar esas fuentes internas.

## Archivos impactados

- [fontAsset.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/types/fontAsset.ts)
- [template-fonts.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/config/template-fonts.ts)
- [build-template-preview-document.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/utils/build-template-preview-document.ts)
- [certificateTemplate.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/types/certificateTemplate.ts)
- [FirebaseCertificateTemplateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts)
- [CreateTemplateUseCase.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/usecases/certificateTemplate/CreateTemplateUseCase.ts)
- [UpdateTemplateUseCase.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/usecases/certificateTemplate/UpdateTemplateUseCase.ts)
- [route.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/admin/certificate-templates/route.ts)
- [page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/page.tsx)
- [create/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/create/page.tsx)
- [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)
- [FontLibraryPanel.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/dashboard/templates/FontLibraryPanel.tsx)
- [core.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/uploadthing/core.ts)
- [firestore.rules](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/firestore.rules)
- [certificate-template-renderer.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/utils/certificate-template-renderer.ts)

## Verificacion realizada

- `pnpm exec tsc --noEmit` -> OK
- `pnpm exec eslint ... --no-cache` sobre los archivos de Fase 1 -> OK sin errores

Warnings no bloqueantes detectados:

- `react-hooks/exhaustive-deps` en [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)
- `jsx-a11y/alt-text` en [edit/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificate-templates/%5Bid%5D/edit/page.tsx)

No bloquean la Fase 1 y no pertenecen al nucleo del cambio.

## Riesgos y limites actuales

- La biblioteca de fuentes ya existe, pero todavia no congela un snapshot inmutable del certificado emitido.
- La descarga PDF final sigue pendiente de la fase posterior de emision inmutable.
- Aun puede haber plantillas viejas que sigan usando Google Fonts u otros enlaces remotos.
- Esta fase crea la base del sistema de fuentes, pero no cierra aun la igualdad total visor/PDF.

## Salida esperada de la Fase 1

La Fase 1 se considera correctamente terminada si:

- existen fuentes internas gestionadas por el sistema,
- el editor puede asociarlas a una plantilla,
- las plantillas guardan `fontRefs`,
- las copias de plantilla conservan esas referencias,
- y el preview del editor ya sabe inyectar esas fuentes internas.

## Siguiente paso recomendado

Iniciar la **Fase 2 - Nuevo apartado de fuentes en el editor con flujo operativo mas guiado y experiencia mas clara**, aprovechando la infraestructura ya creada para:

- importacion desde archivo o URL con mejor UX,
- ayudas de implementacion CSS,
- y advertencias mas visibles para fuentes externas no recomendadas.
