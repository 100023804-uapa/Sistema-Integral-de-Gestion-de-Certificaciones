# Paquete de Hallazgos Priorizados y Orden de Corrección

Fecha: 2026-04-03

## Objetivo

Concentrar los hallazgos funcionales y UX/UI más importantes detectados durante:

- el análisis end-to-end del sistema;
- la revisión del flujo operativo esperado;
- la captura real de pantallas dentro del panel administrativo;
- la redacción del manual operativo.

Este documento no redefine el producto. Su función es ordenar el trabajo para corregir SIGCE sin romper lo que ya existe.

## Resumen Ejecutivo

El problema central no es un bug aislado. El problema central es que hoy existen varios caminos para crear, completar, firmar, emitir y publicar certificados, y esos caminos no comparten el mismo contrato de datos.

Mientras eso no se cierre, seguirán apareciendo síntomas en distintos módulos:

- certificados manuales con menos metadatos que los masivos;
- participantes incompletos;
- firmantes mezclados entre autoridad institucional y usuario interno;
- portal dependiente de datos previos poco consistentes;
- estados que no terminan de representar publicación real;
- formularios que permiten escribir donde deberían seleccionar.

## Prioridades

### P0. Crítico

#### 1. Manual y masivo no usan el mismo contrato de certificado

**Impacto**

- rompe la coherencia del flujo principal;
- permite que algunos certificados nazcan sin la misma calidad institucional;
- hace que firma, emisión, portal y validación dependan de excepciones.

**Síntoma visible**

- la creación manual de certificados sigue capturando datos libres y no obliga participante existente, firmantes institucionales ni contrato completo;
- la importación masiva sí trabaja más cerca del modelo objetivo.

**Entradas afectadas**

- [app/dashboard/certificates/create/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificates/create/page.tsx)
- [app/dashboard/certificates/import/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificates/import/page.tsx)
- [app/actions/import-certificates.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/actions/import-certificates.ts)
- [lib/application/use-cases/CreateCertificate.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/application/use-cases/CreateCertificate.ts)
- [lib/domain/entities/Certificate.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/domain/entities/Certificate.ts)

**Causa raíz**

- el flujo manual todavía permite construir certificados con menos datos que el flujo masivo;
- el contrato canónico todavía no está impuesto desde origen.

**Corrección**

- definir un solo contrato obligatorio para todo certificado nuevo:
  - `studentId`
  - `programId`
  - `campusId`
  - `certificateTypeId`
  - `templateId`
  - `signer1Id`
  - `signer2Id` opcional
  - `issuedAt` o fecha base
- hacer que manual y masivo llamen al mismo validador/caso de uso.

**Migración**

- no borrar certificados existentes;
- completar metadata faltante por saneamiento y backfill.

**Criterio de cierre**

- no puede crearse un certificado nuevo sin ese contrato mínimo, venga de UI manual o de lote.

#### 2. El modelo de firma está mezclando dos entidades distintas

**Impacto**

- confunde el proceso de `Enviar a firma`;
- produce PDFs que pueden quedar con firma operativa pero sin autoridad institucional correctamente representada;
- dificulta auditoría y soporte.

**Síntoma visible**

- en `Estados`, al enviar a firma se consultan usuarios internos en vez del catálogo de `Firmantes Autorizados`;
- el texto del flujo hace parecer que ambos son lo mismo.

**Entradas afectadas**

- [app/dashboard/certificate-states/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificate-states/page.tsx)
- [app/dashboard/signers/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/signers/page.tsx)
- [app/dashboard/digital-signatures/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/digital-signatures/page.tsx)
- [lib/infrastructure/repositories/FirebaseDigitalSignatureRepository.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/infrastructure/repositories/FirebaseDigitalSignatureRepository.ts)
- [lib/usecases/certificateTemplate/GenerateCertificateUseCase.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/usecases/certificateTemplate/GenerateCertificateUseCase.ts)
- [lib/types/signer.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/types/signer.ts)

**Causa raíz**

- no quedó formalizada la diferencia entre:
  - autoridad institucional impresa;
  - usuario interno que ejecuta la firma digital.

**Corrección**

- mantener ambas entidades separadas;
- vincular `signer` con usuarios internos autorizados;
- cambiar el lenguaje en UI:
  - `Autoridad firmante`
  - `Usuario interno firmante`

**Migración**

- asignar `signer1Id/signer2Id` a certificados legacy que no lo tengan;
- resolver si el usuario interno firmante se elige manualmente o por relación autorizada.

**Criterio de cierre**

- el usuario entiende sin ambigüedad quién firma operativamente y qué autoridad queda impresa en el documento.

#### 3. `issued` y `available` no están cerrados como semántica final de publicación

**Impacto**

- mezcla emisión interna con disponibilidad pública;
- deja portal y validación pública dependiendo de estados no definitivos;
- complica restricciones, descargas y auditoría.

**Entradas afectadas**

- [lib/types/certificateState.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/types/certificateState.ts)
- [lib/types/certificateStatus.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/types/certificateStatus.ts)
- [lib/usecases/certificateState/TransitionStateUseCase.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/usecases/certificateState/TransitionStateUseCase.ts)
- [lib/server/studentPortal.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/server/studentPortal.ts)
- [app/dashboard/certificate-states/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificate-states/page.tsx)

**Corrección**

- cerrar la máquina formal como:
  - `draft`
  - `pending_review`
  - `verified`
  - `pending_signature`
  - `signed`
  - `issued`
  - `available`
- usar `issued` para PDF final generado;
- usar `available` para publicación en portal y validación pública.

**Migración**

- mapear estados legacy;
- revisar emitidos incompletos antes de migrarlos a `available`.

**Criterio de cierre**

- portal y validación pública solo consumen certificados `available`.

### P1. Alto

#### 4. Participantes siguen existiendo con ficha incompleta

**Impacto**

- portal bloqueado;
- certificados con identidad académica parcial;
- dificultad para reportar y corregir datos.

**Evidencia visible**

- en la captura de `Participantes` ya aparecen filas con:
  - `sin programa`
  - `sin recinto`
  - `sin correo`

**Entradas afectadas**

- [app/dashboard/graduates/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/page.tsx)
- [app/dashboard/graduates/create/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/create/page.tsx)
- [app/dashboard/graduates/import/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/import/page.tsx)
- [lib/domain/entities/Student.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/domain/entities/Student.ts)
- [lib/infrastructure/repositories/FirebaseStudentRepository.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/infrastructure/repositories/FirebaseStudentRepository.ts)

**Causa raíz**

- la app todavía conserva compatibilidad con registros legacy incompletos;
- no todos los flujos bloquean lo suficiente cuando faltan datos base.

**Corrección**

- distinguir entre:
  - ficha legacy incompleta;
  - ficha apta para certificado;
  - ficha apta para portal;
- impedir que una ficha incompleta avance a procesos que dependen de esos datos.

**Migración**

- backfill de `programId`, `campusId`, `academicAreaId`, correo y snapshots;
- cola de saneamiento asistido desde `Integridad de Datos`.

**Criterio de cierre**

- el sistema no deja emitir ni publicar un certificado ligado a un participante incompleto.

#### 5. La importación masiva todavía conserva semántica legacy

**Impacto**

- el usuario sigue teniendo dos modelos mentales;
- los lotes no transmiten con claridad el nuevo flujo institucional.

**Evidencia visible**

- la carga masiva de certificados todavía muestra lenguaje como `Curso o ProgramaGlobal`.

**Entradas afectadas**

- [app/dashboard/certificates/import/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificates/import/page.tsx)
- [app/actions/import-certificates.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/actions/import-certificates.ts)
- [app/dashboard/graduates/import/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/import/page.tsx)
- [app/actions/import-students.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/actions/import-students.ts)

**Corrección**

- cambiar terminología de archivos, ayudas y validadores al contrato canónico;
- dejar claro qué viene del Excel y qué se resuelve por catálogo del sistema.

**Criterio de cierre**

- el lenguaje del flujo masivo coincide con el flujo manual y con el modelo de datos.

#### 6. Identidades internas poco normalizadas en `Usuarios del Sistema`

**Impacto**

- confusión en activación, auditoría y notificación;
- posibilidad de duplicados o registros visualmente ambiguos.

**Evidencia visible**

- la captura muestra entradas muy parecidas o repetidas para la misma identidad administrativa.

**Entradas afectadas**

- [app/dashboard/users/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/users/page.tsx)
- [lib/server/internalUsers.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/server/internalUsers.ts)
- [app/api/admin/internal-users](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/api/admin/internal-users)

**Corrección**

- normalizar email e identidad visible;
- reforzar unicidad lógica;
- mostrar advertencias de duplicidad o colisión antes de crear.

**Criterio de cierre**

- una persona interna no puede aparecer en UI como si fueran varias identidades distintas por simple variación de email/nombre.

### P2. Medio

#### 7. El menú todavía no agrupa todo lo que se debe configurar antes de operar

**Impacto**

- obliga al usuario a descubrir dependencias por ensayo y error;
- aumenta errores de carga inicial.

**Corrección**

- reagrupar operativamente:
  - configuración institucional;
  - catálogos visuales y firma;
  - carga académica;
  - operación documental.

**Criterio de cierre**

- un administrador nuevo puede configurar SIGCE sin saltar entre módulos sueltos para completar dependencias.

#### 8. Exceso de texto libre donde debería haber selección guiada

**Impacto**

- errores ortográficos;
- pérdida de trazabilidad;
- duplicidades lógicas.

**Corrección**

- usar selectores, búsquedas vinculadas y modales de selección para entidades ya catalogadas.

**Criterio de cierre**

- si una entidad existe en una tabla del sistema, no debería reescribirse a mano en otro módulo.

#### 9. Estados de carga todavía muestran UX intermedia poco informativa

**Impacto**

- varias pantallas quedan en loaders grandes sin contexto;
- capturar y auditar se vuelve difícil;
- el usuario puede interpretar “no hay datos” o “está roto”.

**Evidencia visible**

- algunas capturas iniciales del dashboard, programas, participantes y firmas quedaron tomadas durante carga porque la UI tarda y no siempre diferencia bien `cargando`, `vacío` y `error`.

**Corrección**

- normalizar skeletons, estados vacíos y mensajes de dependencia faltante;
- no mostrar mensajes engañosos mientras aún está resolviendo datos.

**Criterio de cierre**

- cada pantalla diferencia claramente:
  - cargando
  - vacío real
  - error
  - dependencia faltante

## Orden de Corrección Recomendado

### Tramo A. Cerrar contrato canónico

1. Certificados manuales y masivos con un solo contrato.
2. Firmantes: separar autoridad institucional y usuario interno firmante.
3. Definir definitivamente `issued` vs `available`.

### Tramo B. Saneamiento de datos

4. Backfill de participantes incompletos.
5. Backfill de certificados sin `templateId` o `signer1Id/signer2Id`.
6. Limpieza de identidades internas duplicadas o ambiguas.

### Tramo C. Endurecimiento de entradas

7. Bloqueos en UI y backend para impedir crear datos incompletos nuevos.
8. Alineación de importaciones manual/masiva y lenguaje operativo.

### Tramo D. Portal y publicación

9. Portal basado solo en `available`.
10. Validación pública basada solo en certificados publicados.

### Tramo E. UX/UI y estructura operativa

11. Reordenar menús.
12. Unificar estados de carga, vacíos y dependencias faltantes.

## Pruebas que deben cerrar el paquete

1. Crear participante manual y masivo con el mismo contrato de datos.
2. Crear certificado manual y masivo con plantilla y firmantes obligatorios.
3. Pasar un certificado por:
   - `draft`
   - `pending_review`
   - `verified`
   - `pending_signature`
   - `signed`
   - `issued`
   - `available`
4. Confirmar que el PDF final contiene:
   - QR
   - código de verificación
   - autoridad firmante correcta
   - firma operativa auditada
5. Confirmar que solo un certificado `available` aparece en portal y validación pública.
6. Confirmar que datos incompletos ya no pueden entrar al flujo.

## Recomendación Final

No conviene abrir varios frentes a la vez.

El siguiente paso correcto es ejecutar el **Tramo A** como paquete técnico único:

1. contrato único de certificado;
2. contrato único de firma;
3. cierre semántico de publicación.

Después de eso, sí vale la pena entrar a saneamiento, portal y refinamiento UX/UI.
