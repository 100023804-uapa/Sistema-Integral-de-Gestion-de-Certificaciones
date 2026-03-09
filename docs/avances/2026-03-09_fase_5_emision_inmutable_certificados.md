# Avance: Fase 5 implementada - Emision inmutable del certificado

**Fecha:** 2026-03-09  
**Fase:** Fase 5 - Emision inmutable del certificado  
**Estado:** Implementada

## Objetivo

Congelar una foto de la plantilla al momento de emitir el certificado para que los documentos historicos no dependan de la plantilla viva ni cambien si luego esa plantilla se edita.

## Problema que se corrige

Antes de esta fase:

- el certificado guardaba `templateId`,
- el detalle interno seguia cargando la plantilla viva por `templateId`,
- la verificacion publica hacia lo mismo,
- y la descarga podia regenerarse con una plantilla ya modificada.

Eso dejaba un riesgo documental fuerte: un certificado emitido no estaba visualmente congelado.

## Cambios implementados

### 1. Nuevo snapshot visual en el dominio del certificado

Se extendio [Certificate.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/domain/entities/Certificate.ts) con `CertificateTemplateSnapshot` y el nuevo campo `templateSnapshot`.

El snapshot guarda:

- referencia de la plantilla original,
- nombre y descripcion,
- tipo,
- `htmlContent`,
- `cssStyles`,
- `fontRefs`,
- `fontProfile`,
- `layout`,
- `placeholders`,
- fecha de captura.

### 2. Utilidad para capturar y rehidratar la plantilla congelada

Se agrego [certificate-template-snapshot.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/utils/certificate-template-snapshot.ts).

Esta utilidad resuelve dos tareas:

- crear el `templateSnapshot` a partir de una plantilla runtime,
- reconstruir una plantilla usable por el renderizador a partir del snapshot guardado.

### 3. La emision del certificado ya captura la plantilla

Se actualizo [CreateCertificate.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/use-cases/CreateCertificate.ts) para:

- cargar la plantilla seleccionada si existe `templateId`,
- generar un `templateSnapshot`,
- y persistirlo junto al certificado emitido.

Tambien se actualizo [container.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/container.ts) para inyectar el repositorio de plantillas en ese caso de uso.

### 4. El repositorio de certificados persiste y rehidrata el snapshot

Se actualizo [FirebaseCertificateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/FirebaseCertificateRepository.ts) para:

- guardar `templateSnapshot` en Firestore,
- convertir `capturedAt` a `Timestamp`,
- y reconstruirlo a `Date` al leer el certificado.

### 5. El detalle interno ya prefiere el snapshot

Se actualizo [app/dashboard/certificates/[id]/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificates/%5Bid%5D/page.tsx).

Ahora:

- si el certificado ya tiene `templateSnapshot`, se usa ese snapshot,
- solo si no existe se consulta la plantilla viva por `templateId`,
- y la descarga del PDF usa el template efectivo ya cargado, no una recarga paralela de la plantilla viva.

### 6. La verificacion publica ya prefiere el snapshot

Se actualizo [app/verify/[id]/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/verify/%5Bid%5D/page.tsx).

La verificacion publica ahora:

- usa `templateSnapshot` si existe,
- solo cae al `templateId` vivo cuando el certificado todavia no tiene snapshot,
- y muestra el nombre de plantilla desde el snapshot cuando aplica.

## Que debe esperar el usuario ahora

Tras esta fase, al emitir un certificado nuevo:

- queda congelada la plantilla usada en ese momento,
- editar la plantilla despues no debe alterar ese certificado nuevo,
- el detalle interno y la vista publica deben mostrar el mismo snapshot,
- y la descarga debe apoyarse en esa misma foto visual del documento.

## Archivos impactados

- [Certificate.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/domain/entities/Certificate.ts)
- [certificate-template-snapshot.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/utils/certificate-template-snapshot.ts)
- [CreateCertificate.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/use-cases/CreateCertificate.ts)
- [container.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/container.ts)
- [FirebaseCertificateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/FirebaseCertificateRepository.ts)
- [app/dashboard/certificates/[id]/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificates/%5Bid%5D/page.tsx)
- [app/verify/[id]/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/verify/%5Bid%5D/page.tsx)

## Verificacion realizada

- `pnpm exec tsc --noEmit` -> OK
- `pnpm exec eslint "lib/domain/entities/Certificate.ts" "lib/application/utils/certificate-template-snapshot.ts" "lib/application/use-cases/CreateCertificate.ts" "lib/infrastructure/repositories/FirebaseCertificateRepository.ts" "app/dashboard/certificates/[id]/page.tsx" "app/verify/[id]/page.tsx" --no-cache` -> OK

## Salida esperada de la Fase 5

La Fase 5 se considera bien cerrada si:

- los certificados nuevos guardan un `templateSnapshot`,
- la vista interna prioriza ese snapshot,
- la verificacion publica tambien,
- y el certificado deja de depender exclusivamente de una plantilla viva modificable.

## Siguiente paso recomendado

Iniciar la **Fase 6 - PDF definitivo y persistido**, para que la descarga deje de regenerar un documento y pase a entregar un archivo final estable por `pdfUrl`.
