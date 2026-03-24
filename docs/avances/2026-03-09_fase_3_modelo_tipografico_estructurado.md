# Avance: Fase 3 implementada - Modelo tipografico estructurado en plantillas

**Fecha:** 2026-03-09  
**Fase:** Fase 3 - Modelo de plantilla con referencias a fuentes  
**Estado:** Implementada

## Objetivo

Dejar de depender solo de `htmlContent` y `cssStyles` para entender la tipografia real de una plantilla, y pasar a un modelo persistido donde el sistema pueda reconstruir y clasificar formalmente el estado tipografico.

## Problema que se corrige

Con la Fase 1 y la Fase 2 ya existian:

- una biblioteca interna de fuentes,
- `fontRefs` vinculados a la plantilla,
- y un panel guiado para gestionarlas.

Pero el sistema todavia no tenia un resumen persistido y estructurado del estado tipografico de cada plantilla. Eso implicaba:

- inferencias repetidas en cliente,
- poca trazabilidad del estado real de la plantilla,
- y ninguna clasificacion formal entre plantilla gestionada, segura, mixta o fragil.

## Cambios implementados

### 1. Nuevo perfil tipografico en el modelo de plantilla

Se extendio [certificateTemplate.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/types/certificateTemplate.ts) con:

- `TemplateFontStatus`
- `TemplateFontProfile`
- `fontProfile` dentro de `CertificateTemplate`

El perfil ahora resume:

- estado tipografico de la plantilla,
- familias gestionadas por el sistema,
- familias seguras del navegador,
- familias no gestionadas,
- familias declaradas en el CSS,
- fuentes externas detectadas,
- y riesgos conocidos.

### 2. Construccion formal del perfil desde HTML, CSS y `fontRefs`

Se amplio [template-fonts.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/config/template-fonts.ts) con:

- `extractDeclaredFontFamilies(...)`
- `extractRemoteFontSources(...)`
- `buildTemplateFontProfile(...)`

Con esto el sistema puede clasificar una plantilla como:

- `managed`
- `safe`
- `mixed`
- `external`
- `unmanaged`
- `unstyled`

sin depender de una interpretacion ad hoc en cada pantalla.

### 3. Persistencia del perfil desde el repositorio

Se actualizo [FirebaseCertificateTemplateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts).

Ahora:

- al crear una plantilla se calculan `htmlContent`, `cssStyles`, `fontRefs` y `fontProfile` como un bloque consistente,
- al actualizar una plantilla se reconstruye `fontProfile` a partir de la version efectiva final,
- y al mapear desde Firestore se devuelve `fontProfile`, con fallback de reconstruccion si aun no existia en el documento.

Eso deja la compatibilidad abierta para plantillas viejas mientras el sistema converge al modelo nuevo.

### 4. Visibilidad del perfil en el panel de fuentes

Se actualizo [FontLibraryPanel.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/dashboard/templates/FontLibraryPanel.tsx).

El panel ahora muestra:

- el estado tipografico global de la plantilla,
- conteos de familias gestionadas, seguras, no gestionadas y externas,
- y las familias declaradas actualmente en el HTML/CSS.

Esto permite validar la Fase 3 directamente en el editor, sin esperar a inspeccionar Firestore.

## Que debe esperar el usuario ahora

En `Codigo HTML/CSS`, el usuario debe poder ver claramente si la plantilla:

- ya esta controlada por fuentes internas,
- depende solo de fuentes seguras,
- mezcla ambas,
- o sigue teniendo dependencias tipograficas fragiles.

Ademas, al guardar una plantilla, ese estado ya queda persistido como parte del modelo.

## Archivos impactados

- [certificateTemplate.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/types/certificateTemplate.ts)
- [template-fonts.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/config/template-fonts.ts)
- [FirebaseCertificateTemplateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts)
- [FontLibraryPanel.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/dashboard/templates/FontLibraryPanel.tsx)
- [plan_modernizacion_fuentes_y_emision_inmutable_certificados_2026-03-08.md](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/docs/plan_modernizacion_fuentes_y_emision_inmutable_certificados_2026-03-08.md)

## Verificacion realizada

- `pnpm exec tsc --noEmit` -> OK
- `pnpm exec eslint "lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts" "components/dashboard/templates/FontLibraryPanel.tsx" --no-cache` -> OK

## Salida esperada de la Fase 3

La Fase 3 se considera bien cerrada si:

- una plantilla ya no depende solo de HTML/CSS suelto para definir su estado tipografico,
- el repositorio persiste y devuelve un perfil tipografico estructurado,
- el editor puede mostrar ese estado de forma comprensible,
- y las plantillas antiguas siguen funcionando mientras se migran.

## Siguiente paso recomendado

Iniciar la **Fase 4 - Render unificado con fuentes internas**, para que editor, catalogo, detalle y verificacion usen el mismo armado tipografico controlado por el sistema.
