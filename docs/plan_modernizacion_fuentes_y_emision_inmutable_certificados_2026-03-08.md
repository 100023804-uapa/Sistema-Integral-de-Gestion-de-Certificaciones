# Plan de modernizacion de fuentes y emision inmutable de certificados

## Fecha

2026-03-08

## Objetivo general

Actualizar el sistema completo de plantillas y certificados para que:

- las fuentes usadas en plantillas sean gestionadas por el sistema,
- la vista previa, la validacion publica y el PDF usen la misma base visual,
- los certificados emitidos no cambien si la plantilla se edita despues,
- la descarga corresponda al documento final real y no a una regeneracion fragil.

## Problema actual

El sistema ya corrigio la seleccion de plantilla en la vista interna y en la vista publica, pero todavia tiene deficiencias estructurales:

- el editor permite depender de Google Fonts o fuentes externas pegadas manualmente,
- no existe un modulo formal de fuentes internas,
- la plantilla no guarda referencias tipograficas controladas por el sistema,
- el certificado emitido depende de la plantilla viva por `templateId`,
- la descarga PDF se regenera en lugar de bajar un archivo final persistido,
- el visor y el PDF pueden diferir por fuentes remotas o metricas distintas.

## Inventario de puntos donde hoy se visualizan plantillas o certificados

### Plantillas

- `app/dashboard/certificate-templates/create/page.tsx`
- `app/dashboard/certificate-templates/[id]/edit/page.tsx`
- `app/dashboard/certificate-templates/page.tsx`

### Certificados emitidos

- `app/dashboard/certificates/[id]/page.tsx`
- `app/verify/[id]/page.tsx`
- `components/certificates/CertificateActions.tsx`
- `components/certificates/RenderedCertificatePreview.tsx`

### Render y generacion

- `lib/application/utils/certificate-template-renderer.ts`
- `lib/application/utils/pdf-generator.ts`
- `lib/services/PDFGenerationService.ts`
- `lib/services/CertificateGenerationService.ts`

### Tipos y persistencia

- `lib/types/certificateTemplate.ts`
- `lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts`
- `lib/application/use-cases/CreateCertificate.ts`
- `lib/domain/entities/Certificate.ts`

### Infraestructura reutilizable

- `app/dashboard/media/page.tsx`
- `app/api/uploadthing/core.ts`

## Riesgos estructurales detectados

### 1. Dependencia de fuentes externas

Si una plantilla usa Google Fonts o referencias remotas, el visor puede verse bien y el PDF no. Esto afecta sobre todo nombres con tipografias decorativas.

### 2. Certificado no completamente inmutable

Hoy un certificado emitido puede seguir leyendo la plantilla viva por `templateId`. Si esa plantilla cambia, un certificado historico puede cambiar visualmente.

### 3. Descarga PDF no definitiva

La descarga actual reconstruye el documento. No descarga un archivo final persistido y, por lo tanto, no garantiza identidad visual perfecta con la vista previa.

### 4. Ausencia de gestion formal de fuentes

El sistema tiene gestor de imagenes, pero no biblioteca de fuentes. Eso obliga a usar fuentes pegadas en HTML/CSS sin control del sistema.

## Vision objetivo

El estado objetivo del sistema es:

- fuentes importadas una vez y guardadas internamente,
- plantillas que referencian esas fuentes internas,
- render unificado para editor, catalogo, detalle y vista publica,
- snapshot visual del certificado al momento de emitirlo,
- PDF final generado una sola vez y persistido,
- descarga siempre del mismo archivo final.

## Fase 1. Biblioteca de fuentes del sistema

### Objetivo

Crear la base para almacenar y reutilizar fuentes internas del sistema.

### Alcance

- nueva coleccion para fuentes, por ejemplo `font_assets`,
- almacenamiento de archivos `.woff2` y `.ttf`,
- metadata de fuente:
  - nombre visible,
  - `fontFamily`,
  - peso,
  - estilo,
  - formato,
  - URL interna,
  - origen,
  - estado activo,
- ruta de subida en UploadThing o modulo de assets compatible.

### Resultado esperado

- el sistema puede registrar fuentes propias,
- ya no hace falta depender de enlaces remotos como practica principal,
- queda lista la base para que el editor las use.

## Fase 2. Nuevo apartado de fuentes en el editor de plantillas

### Objetivo

Hacer que el cambio empiece desde el editor HTML/CSS, que es donde hoy nacen las decisiones tipograficas.

### Alcance

Agregar en la pestaña `Codigo HTML/CSS`:

- panel `Fuentes`,
- `Subir fuente`,
- `Importar desde URL`,
- lista de fuentes seguras recomendadas,
- vista previa visual,
- snippet CSS listo para copiar,
- opcion de insertar `font-family`,
- advertencias para fuentes externas.

### Superficies impactadas

- `app/dashboard/certificate-templates/create/page.tsx`
- `app/dashboard/certificate-templates/[id]/edit/page.tsx`

### Resultado esperado

- el usuario puede cargar e integrar fuentes desde el propio editor,
- se reduce el uso manual de Google Fonts,
- el flujo se vuelve guiado y consistente.

## Fase 3. Modelo de plantilla con referencias a fuentes

### Objetivo

Evitar que la plantilla dependa solo de `htmlContent` y `cssStyles` sin metadata estructurada de fuentes.

### Alcance

- extender `CertificateTemplate` para guardar `fontRefs`,
- agregar un `fontProfile` estructurado con estado tipografico de la plantilla,
- asociar cada plantilla a sus fuentes internas,
- persistir y devolver esas referencias desde el repositorio,
- mantener compatibilidad con plantillas viejas.

### Resultado esperado

- una plantilla declara formalmente sus fuentes,
- el sistema entiende si la plantilla esta gestionada, segura, mixta o fragil,
- el sistema puede reconstruir el render sin adivinar ni depender de HTML pegado.

## Fase 4. Render unificado con fuentes internas

### Objetivo

Que el mismo armado visual se use en:

- editor,
- catalogo,
- detalle interno,
- verificacion publica.

### Alcance

- inyeccion automatica de `@font-face` desde `fontRefs`,
- render final unico desde `certificate-template-renderer.ts`,
- advertencias cuando una plantilla use `<link>` externos o CSS remoto,
- visibilidad del estado tipografico en el catalogo.

### Resultado esperado

- la misma plantilla se ve igual en todos los puntos del sistema,
- el sistema controla la tipografia usada.

## Fase 5. Emision inmutable del certificado

### Objetivo

Congelar el estado visual del certificado en el momento de emitirlo.

### Alcance

Guardar junto al certificado alguno de estos niveles de snapshot:

- `templateSnapshot`,
- `fontSnapshot`,
- `renderedHtmlSnapshot`,
- o una combinacion de ellos.

La emision ya no debe depender solo de una plantilla viva en el tiempo.

### Resultado esperado

- un certificado historico no cambia si luego se edita la plantilla,
- se protege la integridad documental del sistema.

## Fase 6. PDF definitivo y persistido

### Objetivo

Que la descarga corresponda al documento final emitido y no a una regeneracion en cada clic.

### Alcance

- mover la generacion final del PDF a un navegador real tipo Chromium o Playwright,
- generar el PDF a partir del HTML final ya resuelto,
- persistir `pdfUrl`,
- hacer que las descargas usen ese archivo final.

### Resultado esperado

- el PDF descargado coincide con el documento final emitido,
- desaparece la diferencia funcional entre preview y descarga,
- la descarga publica e interna usan el mismo archivo persistido.

## Fase 7. Migracion y compatibilidad

### Objetivo

Llevar las plantillas actuales al nuevo modelo sin romper la operacion.

### Alcance

- detectar plantillas con Google Fonts o dependencias remotas,
- marcar plantillas por nivel de estabilidad tipografica,
- ofrecer migracion a fuentes internas,
- actualizar plantillas base y predefinidas,
- mantener compatibilidad temporal con plantillas legadas.

### Resultado esperado

- las plantillas nuevas siguen el estandar correcto,
- las antiguas se pueden migrar progresivamente,
- el sistema distingue entre plantillas robustas y fragiles.

## Orden recomendado de implementacion

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4
5. Fase 5
6. Fase 6
7. Fase 7

## Dependencias

### Tecnicas

- UploadThing o infraestructura equivalente para archivos de fuente,
- almacenamiento estable de metadata,
- generacion PDF con motor de navegador real para cierre definitivo.

### De datos

- nuevas entidades de fuentes,
- nuevos campos opcionales en plantillas,
- nuevos campos opcionales o snapshots en certificados emitidos.

## Criterios de aceptacion finales

Se considerara completado cuando:

- el editor permita importar y usar fuentes del sistema,
- las plantillas no necesiten Google Fonts para salida certificable,
- preview, catalogo, detalle y verificacion usen el mismo render,
- un certificado emitido no cambie si la plantilla se modifica despues,
- el PDF descargado sea el documento final persistido,
- la diferencia entre visor y PDF deje de depender de fuentes remotas.

## Definition of Done

- existe una biblioteca interna de fuentes,
- las plantillas pueden referenciar esas fuentes,
- el renderizador las inyecta automaticamente,
- el certificado emitido queda congelado visualmente,
- el PDF final se genera una vez y se descarga por `pdfUrl`,
- las plantillas viejas quedan identificadas y migrables.

## Nota operativa

Este plan no busca solo mejorar tipografias. Su objetivo real es cerrar el ciclo completo de:

- diseno de plantilla,
- previsualizacion,
- emision,
- verificacion,
- descarga,
- e inmutabilidad documental.
