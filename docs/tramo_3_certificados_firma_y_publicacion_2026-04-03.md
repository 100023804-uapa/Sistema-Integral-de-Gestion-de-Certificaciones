# Tramo 3. Certificados, Firma y Publicación

Fecha: 2026-04-03

## Objetivo

Ejecutar el primer bloque técnico del Tramo A definido en el paquete priorizado:

1. endurecer el contrato de creación de certificados;
2. separar con claridad la autoridad firmante del usuario interno que firma;
3. dejar `available` operativo como etapa final de publicación.

## Cambios aplicados

### 1. Contrato mínimo de certificado endurecido

Se endureció el caso de uso de creación de certificados en:

- [lib/application/use-cases/CreateCertificate.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/application/use-cases/CreateCertificate.ts)

Ahora:

- ya no se crea un participante “silencioso” desde el certificado manual;
- el participante debe existir previamente;
- la plantilla institucional es obligatoria;
- la autoridad firmante principal es obligatoria;
- el programa académico debe resolverse desde el catálogo activo;
- el certificado se persiste con más snapshots canónicos:
  - `programId`
  - `programCodeSnapshot`
  - `campusNameSnapshot`
  - `academicAreaNameSnapshot`
  - `signer1Id`
  - `signer1NameSnapshot`
  - `signer2Id`
  - `signer2NameSnapshot`

### 2. Creación manual alineada con el contrato

Se rehízo la pantalla manual en:

- [app/dashboard/certificates/create/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificates/create/page.tsx)

Ahora el flujo manual:

- obliga a seleccionar un participante existente;
- obliga a seleccionar programa activo;
- obliga a seleccionar plantilla activa;
- obliga a seleccionar autoridad firmante principal;
- deja segunda autoridad como opcional;
- deja de capturar nombre/matrícula como texto libre.

### 3. Carga masiva endurecida

Se endureció la importación en:

- [app/dashboard/certificates/import/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificates/import/page.tsx)
- [app/actions/import-certificates.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/actions/import-certificates.ts)

Ahora el lote exige antes de importar:

- recinto;
- plantilla activa;
- autoridad firmante principal.

## 4. Firma institucional vs firma operativa

No se cambió todavía el modelo profundo de firmas, pero sí se corrigió la lectura operativa en UI:

- [app/dashboard/certificate-states/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificate-states/page.tsx)

Ahora el módulo ya no presenta al usuario interno como si fuera la autoridad impresa. El texto distingue mejor:

- `Usuario interno firmante`
- autoridad firmante configurada en el certificado

Esto reduce la ambigüedad aunque la relación técnica completa todavía requiere un tramo adicional.

### 5. Estado final de publicación

Se dejó `available` operativo en:

- [lib/types/certificateState.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/types/certificateState.ts)
- [lib/usecases/certificateState/TransitionStateUseCase.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/usecases/certificateState/TransitionStateUseCase.ts)
- [lib/infrastructure/repositories/FirebaseCertificateStateRepository.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/infrastructure/repositories/FirebaseCertificateStateRepository.ts)

La secuencia ya soporta:

- `signed -> issued`
- `issued -> available`

Y el repositorio ya diferencia:

- `issuedAt / issuedBy`
- `availableAt / availableBy`

## Compatibilidad temporal

Para no romper lo ya emitido:

- [lib/types/certificateStatus.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/types/certificateStatus.ts)

todavía trata `issued` como públicamente disponible por compatibilidad temporal con datos legacy.

Esto es deliberado y transitorio.

## Validación técnica

Se ejecutó TypeScript fuera del sandbox y quedó en verde:

- `node_modules\\.bin\\tsc.cmd --noEmit`

## Pendiente inmediato

### 1. Migración operativa

Falta una migración o saneamiento para:

- certificados legacy `issued` que realmente deban pasar a `available`;
- certificados sin `signer1Id` o sin `templateId`;
- participantes vinculados a certificados pero con ficha incompleta.

### 2. Firma con relación explícita

Falta cerrar técnicamente la relación:

- `Firmante Autorizado`
- `usuario interno firmante`

para que el sistema pueda resolver sugerencias o validaciones entre ambas capas.

### 3. Publicación externa real

Falta mover portal y validación pública al criterio final:

- solo `available`

una vez que el backfill de legacy esté listo.

## Siguiente paso recomendado

El siguiente bloque correcto es:

1. saneamiento/migración de certificados legacy;
2. relación explícita entre firmante institucional y usuario interno firmante;
3. cierre definitivo de portal y validación pública solo sobre `available`.
