# Plan Maestro de Unificación de Flujos Operativos

Fecha: 2026-04-03

## Objetivo

Unificar el funcionamiento operativo de SIGCE para que:

- exista un solo flujo institucional de punta a punta;
- los catálogos institucionales sean la fuente real de verdad;
- los procesos manuales y masivos usen el mismo criterio;
- el participante solo vea certificados que ya pasaron el flujo completo;
- no se sigan creando datos libres o inconsistentes según el módulo.

## Diagnóstico

Hoy el sistema sí tiene piezas funcionales, pero no está operando bajo un modelo único.

Los problemas principales son:

1. Participantes y certificados no consumen de forma consistente los catálogos institucionales.
2. La creación manual y la importación masiva no siguen el mismo contrato de datos.
3. El flujo de firma mezcla dos conceptos distintos:
   - usuario interno que firma en el sistema;
   - autoridad firmante que sale impresa en el certificado.
4. El flujo de estados termina en `issued`, pero el concepto de disponibilidad pública y portal no está separado formalmente.
5. Algunas pantallas siguen permitiendo o induciendo captura libre de datos que deberían venir de tablas institucionales.

## Hallazgos Reales en el Código

### 1. Participantes

El modelo actual de participante sigue siendo demasiado libre:

- [Student.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/domain/entities/Student.ts)
- campo `career` como texto libre;
- no hay `programId`, `campusId` ni `academicAreaId` como referencias fuertes.

La creación manual de participantes usa inputs libres en:

- [graduates/create/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/graduates/create/page.tsx)

La importación masiva de participantes también escribe texto libre:

- [import-students.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/actions/import-students.ts)

Conclusión:
- el participante existe, pero todavía no está modelado como ficha institucional fuerte.

### 2. Certificados

La creación manual de certificados usa algunos catálogos, pero sigue incompleta:

- [certificates/create/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificates/create/page.tsx)

Sí usa:
- recinto;
- programa;
- plantilla.

Pero no exige:
- selección de participante desde ficha existente;
- firmante institucional 1;
- firmante institucional 2;
- correo del participante;
- validación de integridad previa a creación.

Además, hoy manda:
- `studentEmail: ''`

La importación masiva sí está más cerca del modelo correcto:

- [certificates/import/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificates/import/page.tsx)
- [import-certificates.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/actions/import-certificates.ts)

Porque sí puede aplicar:
- recinto;
- área académica;
- plantilla;
- firmante 1;
- firmante 2;
- programa global.

Conclusión:
- manual y masivo no están alineados;
- la importación hoy está más madura que la creación manual.

### 3. Firma Digital

Hoy hay dos modelos distintos:

1. `Firmantes Autorizados`
- [signers/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/signers/page.tsx)
- representan autoridades institucionales;
- tienen nombre, cargo, firma visual y `allowedEmails`.

2. `internal_users` con rol `signer`
- usados por el flujo de firma digital operativa.

El módulo de estados usa usuarios internos como candidatos al enviar a firma:

- [certificate-states/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/certificate-states/page.tsx)
- [internal-users/signers/route.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/api/admin/internal-users/signers/route.ts)

La solicitud de firma también resuelve el firmante desde `internal_users`:

- [FirebaseDigitalSignatureRepository.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/infrastructure/repositories/FirebaseDigitalSignatureRepository.ts)

Pero la emisión del PDF usa `signer1Id` y `signer2Id` del certificado:

- [GenerateCertificateUseCase.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/usecases/certificateTemplate/GenerateCertificateUseCase.ts)

Conclusión:
- el flujo hoy no está roto del todo;
- pero el modelo conceptual está mezclado y la UI lo presenta como si fuera un único tipo de firmante.

### 4. Estados

La máquina actual es:

- `draft`
- `pending_review`
- `verified`
- `pending_signature`
- `signed`
- `issued`
- `cancelled`

Definida en:

- [certificateState.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/types/certificateState.ts)

Esto está bastante bien para el flujo documental interno.

La carencia real es que no existe un estado formal de publicación final:

- `available`

Eso complica separar:
- documento emitido internamente;
- documento disponible para participante y validación pública.

### 5. Portal del participante

El portal sí depende de un vínculo fuerte:

- participante autenticado;
- `studentId`;
- `portalAccess`;
- certificados asociados a ese `studentId`.

Eso está bien.

El problema no está en el portal mismo, sino en la calidad del dato que llega antes.

## Flujo Único Objetivo

## Fase A. Configuración Institucional

Esta fase debe completarse primero.

Debe incluir:

1. Recintos
2. Áreas académicas
3. Tipos de certificado
4. Catálogo de roles
5. Firmantes autorizados
6. Gestor de medios
7. Plantillas de diseño

### Regla

Nada que dependa de estos catálogos debe capturarse como texto libre después, salvo campos meramente descriptivos.

## Fase B. Gestión Académica

Debe incluir:

1. Programas
2. Participantes manuales
3. Participantes por importación

### Regla

La ficha del participante debe guardar referencias institucionales reales.

El modelo objetivo del participante debe incluir, como mínimo:

- `id`
- `firstName`
- `lastName`
- `email`
- `cedula`
- `phone`
- `programId`
- `campusId`
- `academicAreaId` si aplica
- `portalAccess`

`career` como texto libre debe salir del flujo nuevo y quedar solo como compatibilidad temporal.

## Fase C. Gestión de Certificados

Debe incluir:

1. Certificados manuales
2. Certificados por importación
3. Estados
4. Firmas digitales
5. Emisión
6. Validación

### Regla

Manual e importación deben usar el mismo contrato.

Todo certificado nuevo debe nacer con:

- `studentId`
- `studentEmail`
- `programId` o resolución equivalente desde catálogo
- `campusId`
- `academicAreaId` si aplica
- `certificateTypeId`
- `templateId`
- `signer1Id`
- `signer2Id` opcional
- `metadata` enriquecida a partir de catálogos

## Fase D. Portal y Publicación

Solo después del flujo documental completo.

El participante debe ver certificados únicamente cuando:

1. el certificado existe;
2. está vinculado a su `studentId`;
3. tiene PDF final válido;
4. pasó por firma;
5. ya fue publicado.

## Modelo Canónico Recomendado

## 1. Participante

Fuente maestra de identidad académica.

Campos objetivo:

- `id`
- `firstName`
- `lastName`
- `email`
- `cedula`
- `phone`
- `programId`
- `programNameSnapshot`
- `campusId`
- `campusNameSnapshot`
- `academicAreaId`
- `academicAreaNameSnapshot`
- `portalAccess`
- `createdAt`
- `updatedAt`

## 2. Certificado

Documento transaccional que depende del participante y de catálogos.

Campos obligatorios objetivo:

- `studentId`
- `studentName`
- `studentEmail`
- `programId`
- `programNameSnapshot`
- `campusId`
- `campusNameSnapshot`
- `academicAreaId`
- `academicAreaNameSnapshot`
- `certificateTypeId`
- `templateId`
- `templateSnapshot`
- `signer1Id`
- `signer2Id`
- `status`
- `pdfUrl`
- `qrCodeUrl`
- `publicVerificationCode`
- `metadata`

## 3. Autoridad firmante vs usuario firmante

Estos conceptos deben quedar explícitos:

### Autoridad firmante

Colección:
- `signers`

Representa:
- quién aparece en el documento;
- nombre;
- cargo;
- firma visual;
- correo(s) autorizado(s) para operar en su nombre.

### Usuario firmante

Colección:
- `internal_users`

Representa:
- quién entra al panel y ejecuta la firma digital.

### Regla de vínculo

Debe existir una relación fuerte entre ambos.

Opciones válidas:

1. mantener `allowedEmails` y resolver usuario interno por email;
2. migrar a un modelo más fuerte con `allowedInternalUserIds`.

La opción recomendada es:
- mantener compatibilidad con `allowedEmails`;
- agregar `allowedInternalUserIds` como destino canónico.

## Flujo Documental Objetivo

1. `draft`
2. `pending_review`
3. `verified`
4. `pending_signature`
5. `signed`
6. `issued`
7. `available`
8. `cancelled`

## Semántica

- `draft`: certificado creado, aún editable.
- `pending_review`: en espera de revisión.
- `verified`: información validada.
- `pending_signature`: solicitud de firma activa.
- `signed`: firma digital completada.
- `issued`: PDF final generado correctamente.
- `available`: publicado para portal y validación pública.
- `cancelled`: anulado.

## Regla crítica

No debe existir `available` si falta:

- firma digital válida;
- PDF final;
- plantilla;
- vínculo con participante;
- código de verificación.

## Qué Debe Hacer Cada Módulo

## Configuración Institucional

Debe ser el lugar donde se crea todo lo que luego se selecciona.

Debe concentrar:

- recintos;
- áreas;
- tipos de certificado;
- firmantes autorizados;
- medios;
- plantillas.

### Ajuste recomendado de menú

Mover o agrupar claramente:

- `Firmantes Autorizados`
- `Gestor de Medios`
- `Plantillas de Diseño`

dentro del bloque institucional como dependencia directa de emisión.

## Participantes manuales

No debe escribir carrera/recinto/programa libremente.

Debe usar:

- selector de programa;
- selector de recinto;
- selector de área si aplica.

Si algún dato depende de catálogo, debe seleccionarse, no escribirse.

## Participantes masivos

Debe funcionar como el manual, pero en dos capas:

1. datos por fila desde Excel;
2. datos institucionales globales o mapeados desde catálogo.

Debe permitir:

- programa por columna o programa global;
- recinto global obligatorio o mapeo;
- área global o por regla;
- validación previa antes de crear.

## Certificados manuales

Debe usar:

- participante seleccionado desde ficha existente;
- tipo de certificado;
- programa;
- recinto;
- área;
- plantilla;
- firmante 1;
- firmante 2 opcional;
- fecha;
- prefijo o folio si aplica.

No debe crear participantes de forma silenciosa y mínima.

## Certificados masivos

Debe seguir exactamente el mismo contrato del manual.

Excel debe aportar solo datos variables por fila.

Lo demás debe venir por:

- selección global;
- o mapeo controlado por catálogo.

## Estados

Debe reflejar solo el flujo documental.

No debe mezclar:

- disponibilidad pública;
- restricciones administrativas;
- identidad de autoridad firmante;
- firma visual del PDF.

## Firmas Digitales

Debe operar sobre el usuario interno autorizado a firmar.

Pero esa solicitud debe estar asociada a una autoridad firmante institucional concreta del certificado.

## Portal

No debe ser una fuente de verdad.

Solo consume certificados ya completados y publicados.

## Qué Hay Que Corregir Primero

## Prioridad 1. Modelo canónico

Antes de tocar más UI:

1. definir campos obligatorios finales para participante;
2. definir campos obligatorios finales para certificado;
3. definir relación entre `signers` e `internal_users`;
4. definir el nuevo estado `available`.

## Prioridad 2. Unificar alta manual y masiva de participantes

Ambos flujos deben terminar en la misma estructura.

## Prioridad 3. Unificar alta manual y masiva de certificados

Ambos flujos deben requerir:

- participante válido;
- plantilla;
- firmantes;
- referencias institucionales.

## Prioridad 4. Corregir firma y emisión

Separar formalmente:

- usuario que firma;
- autoridad que aparece impresa.

## Prioridad 5. Publicación y portal

Agregar `available` y limitar portal/validación pública a ese estado.

## Estrategia de Migración Sin Romper lo Existente

## Regla general

No borrar datos actuales.

Hacer migración progresiva y reversible.

## Migración 1. Participantes

Backfill:

- resolver `career` a `programId` donde sea posible;
- guardar snapshots de nombre;
- completar `campusId` y `academicAreaId` si pueden inferirse.

Los casos ambiguos deben ir a auditoría manual.

## Migración 2. Certificados

Backfill:

- `templateId`
- `templateSnapshot`
- `signer1Id`
- `signer2Id`
- `studentEmail`
- `programId`
- `campusId`
- `academicAreaId`

## Migración 3. Estados

Mapeo:

- `issued` completos -> `available` o listos para promoción;
- `issued` incompletos -> saneamiento;
- estados legacy -> reporte y corrección.

## Migración 4. Firma

Crear relación explícita entre:

- certificado;
- autoridad firmante;
- usuario firmante autorizado.

## Riesgos

1. Hay certificados ya emitidos sin firmantes institucionales en metadata.
2. Hay certificados creados manualmente con información mínima.
3. Hay participantes con campos libres no trazables a catálogos.
4. Hay estados y folios legacy que requieren auditoría.

## Orden de Implementación Recomendado

## Tramo 1. Diseño y esquema

1. cerrar modelo canónico de participante;
2. cerrar modelo canónico de certificado;
3. definir `available`;
4. definir vínculo `signer authority` <-> `signing account`.

## Tramo 2. Participantes

1. rediseñar creación manual;
2. rediseñar importación masiva;
3. migrar datos legacy.

## Tramo 3. Certificados

1. rediseñar creación manual;
2. rediseñar importación masiva;
3. exigir plantilla y firmantes desde origen;
4. eliminar creación silenciosa de participante desde certificado.

## Tramo 4. Firma y emisión

1. corregir selector de envío a firma;
2. resolver autoridad vs usuario firmante;
3. endurecer emisión;
4. reemitir o sanear certificados incompletos.

## Tramo 5. Publicación y portal

1. introducir `available`;
2. publicar solo certificados completos;
3. ajustar portal y validación pública.

## Tramo 6. Menú y UX

1. reordenar menús;
2. mover dependencias institucionales bajo un mismo bloque;
3. reducir escritura libre;
4. sustituir inputs por selectores vinculados.

## Decisión Recomendada

La próxima ejecución no debe empezar implementando menús o ajustes cosméticos.

Debe empezar por:

1. congelar el modelo canónico final;
2. rediseñar participantes manual/importación;
3. rediseñar certificados manual/importación;
4. luego corregir firma, emisión y portal.

Ese es el orden con menos riesgo y con más capacidad de limpiar la lógica sin romper lo que ya está operativo.

## Documento de Continuación

El desarrollo técnico detallado del Tramo 1 quedó en:

- [tramo_1_modelo_canonico_y_publicacion_2026-04-03.md](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/tramo_1_modelo_canonico_y_publicacion_2026-04-03.md)

El desarrollo técnico detallado del Tramo 2 quedó en:

- [tramo_2_participantes_catalogos_y_lote_2026-04-03.md](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/tramo_2_participantes_catalogos_y_lote_2026-04-03.md)
