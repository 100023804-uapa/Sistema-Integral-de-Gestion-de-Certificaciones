# Avance: Fase 6 implementada - PDF definitivo persistido

**Fecha:** 2026-03-09  
**Fase:** Fase 6 - PDF definitivo y persistido  
**Estado:** Implementada

## Objetivo

Hacer que el sistema deje de depender solo de una regeneracion temporal del PDF y empiece a guardar un `pdfUrl` real en el certificado para reutilizarlo en descargas futuras.

## Problema que se corrige

Antes de esta fase:

- el modelo ya tenia `pdfUrl`,
- la vista publica y el detalle lo respetaban si existia,
- pero el flujo real de emision no generaba ni persistia ese archivo,
- por lo tanto el PDF se reconstruia en cada descarga.

Eso provocaba dos problemas:

- el certificado descargado podia no coincidir siempre con el preview,
- y la vista publica no tenia un archivo final estable al cual apuntar.

## Enfoque aplicado en esta fase

En esta etapa no se introdujo todavia un motor nuevo tipo Chromium o Playwright.

Se cerro primero la base operativa:

- generar el PDF con el render actual,
- subirlo a UploadThing,
- guardar `pdfUrl` y `pdfStorageKey`,
- y reutilizar ese archivo en descargas futuras.

Esto deja la persistencia del documento final lista, aun cuando la evolucion futura del motor PDF todavia pueda mejorar.

## Cambios implementados

### 1. El repositorio ya sabe actualizar el PDF persistido

Se extendio [ICertificateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/domain/repositories/ICertificateRepository.ts) con `updatePdfAsset(...)`.

Se implemento en:

- [FirebaseCertificateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/FirebaseCertificateRepository.ts)
- [MockCertificateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/MockCertificateRepository.ts)

Ahora el certificado puede guardar:

- `pdfUrl`
- `metadata.pdfStorageKey`
- `metadata.pdfPersistedAt`

### 2. Nueva ruta admin para persistir el PDF

Se agrego [app/api/admin/certificates/[id]/pdf/route.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/admin/certificates/%5Bid%5D/pdf/route.ts).

Esta ruta:

- exige sesion admin,
- recibe el PDF por `multipart/form-data`,
- lo sube a UploadThing con `UTApi.uploadFiles(file)`,
- elimina el archivo previo si habia un `pdfStorageKey`,
- y actualiza el certificado con el nuevo `pdfUrl`.

### 3. Helper cliente reutilizable para persistir el PDF

Se agrego [persist-certificate-pdf.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/utils/persist-certificate-pdf.ts).

Este helper:

- empaqueta el `Blob` del PDF como `File`,
- llama la ruta admin,
- y devuelve `pdfUrl` y `pdfStorageKey`.

### 4. La creacion manual ya persiste el PDF al emitir

Se actualizo [app/dashboard/certificates/create/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificates/create/page.tsx).

Ahora, despues de crear el certificado:

- usa el `templateSnapshot` si existe,
- genera el PDF con la plantilla efectiva,
- y lo persiste inmediatamente.

Con esto, los certificados nuevos creados manualmente ya deben nacer con `pdfUrl`.

### 5. El detalle interno persiste el PDF en el primer download si falta

Se actualizo [app/dashboard/certificates/[id]/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificates/%5Bid%5D/page.tsx).

Ahora:

- si el certificado ya tiene `pdfUrl`, abre el PDF definitivo,
- si no lo tiene, lo genera, intenta persistirlo y luego descarga el resultado actual,
- ademas actualiza el estado local del certificado para reutilizar el `pdfUrl` en descargas siguientes.

### 6. La descarga publica tambien intenta persistir cuando es posible

Se actualizo [CertificateActions.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/certificates/CertificateActions.tsx).

El comportamiento ahora es:

- si existe `pdfUrl`, se abre ese archivo definitivo,
- si no existe, se genera el PDF,
- se intenta persistir en segundo plano,
- y si no hay permisos o falla la persistencia, la descarga local sigue funcionando.

Esto permite que la vista publica se beneficie del `pdfUrl` cuando ya existe o cuando un usuario con permisos lo dispara primero.

## Que debe esperar el usuario ahora

Tras esta fase:

- los certificados nuevos creados manualmente deben quedar con `pdfUrl`,
- el detalle interno debe reutilizar ese PDF final,
- la vista publica debe abrirlo directamente si ya existe,
- y los certificados sin `pdfUrl` deben ir migrando naturalmente al primer flujo de descarga con permisos.

## Alcance y limite real de esta fase

Esta fase resuelve la **persistencia del PDF**.

Todavia no reemplaza el motor visual actual por Playwright o Chromium. Por eso:

- la estabilidad del archivo final mejora mucho,
- pero la calidad absoluta del render todavia depende del generador PDF actual.

La siguiente evolucion, si se decide, seria endurecer el motor de generacion. Pero la base documental y operativa del `pdfUrl` ya quedo cerrada.

## Archivos impactados

- [ICertificateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/domain/repositories/ICertificateRepository.ts)
- [FirebaseCertificateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/FirebaseCertificateRepository.ts)
- [MockCertificateRepository.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/infrastructure/repositories/MockCertificateRepository.ts)
- [persist-certificate-pdf.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/lib/application/utils/persist-certificate-pdf.ts)
- [app/api/admin/certificates/[id]/pdf/route.ts](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/api/admin/certificates/%5Bid%5D/pdf/route.ts)
- [create/page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificates/create/page.tsx)
- [page.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/app/dashboard/certificates/%5Bid%5D/page.tsx)
- [CertificateActions.tsx](/c:/Users/LENOVO%20i7%207TH%20GAMERS/Downloads/sigce/components/certificates/CertificateActions.tsx)

## Verificacion realizada

- `pnpm exec tsc --noEmit` -> OK
- `pnpm exec eslint "lib/domain/repositories/ICertificateRepository.ts" "lib/infrastructure/repositories/FirebaseCertificateRepository.ts" "lib/infrastructure/repositories/MockCertificateRepository.ts" "lib/application/utils/persist-certificate-pdf.ts" "components/certificates/CertificateActions.tsx" "app/dashboard/certificates/create/page.tsx" "app/dashboard/certificates/[id]/page.tsx" "app/api/admin/certificates/[id]/pdf/route.ts" --no-cache` -> OK

## Salida esperada de la Fase 6

La Fase 6 se considera bien cerrada si:

- un certificado nuevo queda con `pdfUrl`,
- la descarga deja de depender siempre de regeneracion,
- la vista publica puede reutilizar el mismo archivo final,
- y el sistema ya tiene un punto formal de persistencia documental del PDF.

## Siguiente paso recomendado

Iniciar la **Fase 7 - Migracion y compatibilidad**, para identificar plantillas y certificados antiguos que todavia dependan de fuentes externas, `templateId` vivo o PDFs no persistidos, y definir su migracion gradual.
