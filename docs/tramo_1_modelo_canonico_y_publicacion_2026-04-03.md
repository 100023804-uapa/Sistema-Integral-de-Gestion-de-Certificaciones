# Tramo 1: Modelo Canónico, Firma y Publicación

Fecha: 2026-04-03

## Objetivo

Cerrar el modelo operativo mínimo que debe gobernar todo SIGCE antes de seguir modificando pantallas, importaciones, estados o portal.

Este tramo no busca reescribir el sistema ni borrar datos. Busca:

- fijar un contrato único para participantes y certificados;
- separar correctamente autoridad firmante de usuario firmante;
- definir formalmente qué significa `issued` y qué significa `available`;
- establecer reglas de compatibilidad para no romper lo que ya existe;
- dejar una base clara para rediseñar luego manual, masivo, firma, emisión y portal.

## Resumen Ejecutivo

El sistema actual ya tiene piezas valiosas:

- catálogos institucionales;
- gestión de participantes;
- gestión de certificados;
- flujo documental con revisión, firma y emisión;
- portal del participante;
- validación pública;
- auditorías de integridad y saneamiento.

El problema no es falta de módulos. El problema es que varios módulos llegan al mismo resultado usando contratos distintos.

Hoy:

- participante manual y participante masivo no siguen la misma estructura final;
- certificado manual y certificado masivo no exigen el mismo nivel de completitud;
- la firma digital operativa usa `internal_users`, pero el PDF usa `signers`;
- `issued` mezcla emisión interna y publicación externa;
- todavía se aceptan campos libres donde ya existen catálogos institucionales.

## Principio Rector

Todo flujo nuevo o corregido debe obedecer esta regla:

> Si un dato ya existe como entidad o catálogo del sistema, no debe volver a capturarse como texto libre en procesos operativos.

## Modelo Canónico Objetivo

## 1. Participante

El participante es la identidad académica maestra del ciudadano o estudiante dentro del sistema.

Debe vivir en `students`.

Debe mantener:

- identidad civil y académica;
- referencias institucionales fuertes;
- acceso al portal;
- compatibilidad temporal con datos legacy.

### Campos canónicos obligatorios

- `id`
- `firstName`
- `lastName`
- `email`
- `createdAt`
- `updatedAt`

### Campos canónicos recomendados

- `cedula`
- `phone`
- `programId`
- `programNameSnapshot`
- `campusId`
- `campusNameSnapshot`
- `academicAreaId`
- `academicAreaNameSnapshot`
- `portalAccess`

### Campos legacy a preservar temporalmente

- `career`

### Regla de compatibilidad

`career` no debe borrarse de inmediato. Debe mantenerse como compatibilidad temporal mientras:

- se migra a `programId`;
- se resuelven casos ambiguos;
- se actualizan vistas y formularios existentes.

### Regla de negocio

Un participante puede tener varios certificados. La ficha del participante no debe duplicarse por cada certificado.

## 2. Certificado

El certificado es un documento transaccional y auditable que depende del participante y de varios catálogos institucionales.

Debe vivir en `certificates`.

### Campos canónicos obligatorios

- `studentId`
- `studentName`
- `studentEmail`
- `type`
- `issueDate`
- `status`
- `campusId`
- `programId`
- `programNameSnapshot`
- `templateId`
- `certificateTypeId`
- `qrCodeUrl`
- `metadata`
- `createdAt`
- `updatedAt`

### Campos canónicos recomendados

- `cedula`
- `academicAreaId`
- `campusNameSnapshot`
- `academicAreaNameSnapshot`
- `templateSnapshot`
- `signer1Id`
- `signer2Id`
- `pdfUrl`
- `publicVerificationCode`
- `expirationDate`

### Campos legacy a mantener temporalmente

- `academicProgram`

### Regla de compatibilidad

`academicProgram` no debe desaparecer todavía. Debe seguir existiendo mientras:

- se incorpora `programId` como fuente fuerte;
- se recalculan snapshots de nombre;
- se migran formularios y reportes.

La fuente canónica futura debe ser:

- `programId`
- `programNameSnapshot`

No:

- `academicProgram` como texto suelto.

## 3. Autoridad firmante vs usuario firmante

Este punto debe quedar formalmente separado.

## Autoridad firmante

Colección:

- `signers`

Representa:

- la autoridad institucional que aparece impresa en el certificado;
- el nombre;
- el cargo;
- la firma visual;
- el contexto institucional.

Campos actuales relevantes:

- `name`
- `title`
- `department`
- `signatureUrl`
- `allowedEmails`

## Usuario firmante

Colección:

- `internal_users`

Representa:

- la cuenta que entra al sistema;
- recibe la solicitud de firma;
- ejecuta la firma digital operativa;
- deja trazabilidad de quién aprobó.

## Relación canónica recomendada

El certificado debe guardar:

- `signer1Id`
- `signer2Id`

La solicitud de firma debe guardar:

- `requestedTo`

Y el firmante autorizado debe poder declarar qué usuarios internos pueden firmar en su nombre.

### Estrategia de compatibilidad

Se debe mantener:

- `allowedEmails`

Y agregar como destino canónico:

- `allowedInternalUserIds`

### Regla operativa futura

1. Al crear o importar el certificado se elige la autoridad firmante.
2. Al enviar a firma se resuelve o se selecciona el usuario interno autorizado para esa autoridad.
3. El PDF usa la autoridad firmante.
4. La auditoría usa el usuario interno que realmente firmó.

## Estados y Publicación

## Flujo documental objetivo

- `draft`
- `pending_review`
- `verified`
- `pending_signature`
- `signed`
- `issued`
- `available`
- `cancelled`

## Semántica formal

### `draft`

Certificado creado, editable, todavía incompleto desde el punto de vista operativo.

### `pending_review`

Certificado enviado a verificación, pendiente de control documental.

### `verified`

Datos revisados y aprobados para pasar a firma.

### `pending_signature`

Solicitud de firma abierta y pendiente de ejecución por el usuario firmante.

### `signed`

Firma digital operativa completada. El certificado ya no debería requerir correcciones normales.

### `issued`

El PDF final fue generado correctamente y la emisión documental quedó cerrada.

`issued` debe significar como mínimo:

- existe `pdfUrl`;
- existe `templateId`;
- existe `templateSnapshot` o se puede reconstruir con integridad;
- existe `qrCodeUrl`;
- la firma operativa fue completada;
- el certificado quedó listo para publicación.

### `available`

El certificado ya fue publicado para:

- portal del participante;
- validación pública;
- descarga controlada.

### `cancelled`

El certificado fue anulado y no debe circular como documento válido.

## Regla crítica

`available` no puede existir si falta cualquiera de estas condiciones:

- `studentId` válido;
- participante resoluble;
- `studentEmail` o acceso verificable al portal si corresponde;
- `templateId`;
- `pdfUrl`;
- `qrCodeUrl`;
- firma operativa válida;
- código de verificación pública.

## Regla de restricciones

Las restricciones administrativas no sustituyen el flujo documental.

La restricción debe seguir siendo una capa paralela, no un estado documental nuevo.

## Contrato Único Manual y Masivo

Manual e importación deben llegar al mismo resultado final.

Eso implica que ambos flujos deben terminar con:

- referencias fuertes a catálogos;
- plantilla definida;
- firmantes institucionales definidos;
- vínculo fuerte con participante;
- datos suficientes para emitir y publicar.

## Participantes manuales

Deben usar:

- selector de programa;
- selector de recinto;
- selector de área si aplica;
- validación de email;
- identificador institucional único.

No deben depender de:

- `career` libre;
- nombres escritos a mano para entidades ya existentes.

## Participantes masivos

Deben permitir:

- columnas por fila para identidad;
- resolución desde catálogos para programa, recinto y área;
- overrides globales cuando el lote comparte contexto;
- prevalidación antes de persistir.

## Certificados manuales

Deben exigir:

- participante existente;
- tipo de certificado;
- programa;
- recinto;
- área si aplica;
- plantilla;
- firmante 1;
- firmante 2 opcional;
- tipo documental;
- datos de emisión.

No deben:

- crear participantes silenciosamente con datos mínimos;
- dejar `studentEmail` vacío si el participante ya existe;
- depender solo del nombre escrito del participante.

## Certificados masivos

Deben funcionar como el manual, pero en lote.

Excel debe aportar solo los datos variables por fila.

El resto debe venir por:

- catálogo;
- mapeo global;
- validación previa.

## Matriz de Alineación

## Configuración Institucional

Debe consolidar:

- recintos;
- áreas académicas;
- tipos de certificado;
- firmantes autorizados;
- gestor de medios;
- plantillas de diseño.

### Ajuste recomendado

Plantillas, firmantes y medios deben quedar claramente bajo el bloque institucional, porque son prerequisitos de emisión.

## Gestión Académica

Debe consolidar:

- programas;
- participantes manuales;
- participantes masivos.

### Ajuste recomendado

El alta de participante debe depender de catálogos institucionales ya configurados.

## Gestión de Certificados

Debe consolidar:

- certificados manuales;
- certificados masivos;
- estados;
- firmas digitales;
- emisión;
- validación.

### Ajuste recomendado

La creación manual y la masiva deben compartir el mismo contrato funcional y la misma validación de completitud.

## Portal

Debe quedar como consumidor final del flujo, no como compensación de datos incompletos.

## Estrategia de Compatibilidad

No se deben borrar datos actuales.

La estrategia correcta es:

1. agregar campos canónicos nuevos como opcionales;
2. mantener temporalmente campos legacy;
3. leer con fallback;
4. escribir ya en formato nuevo;
5. migrar y auditar lo viejo;
6. solo después endurecer obligatorios.

## Fallbacks permitidos durante transición

### Participantes

- si no existe `programId`, usar `career` solo para lectura;
- si no existe `campusId`, permitir `null` temporal con alerta operativa;
- si no existe `academicAreaId`, permitir `null` temporal si el negocio lo tolera.

### Certificados

- si no existe `programId`, usar `academicProgram` para lectura;
- si no existe `templateSnapshot`, usar `templateId` y reconstrucción temporal;
- si no existe `signer1Id`, el certificado no debe promocionarse a `available`.

## Backfill mínimo recomendado

## Participantes

- mapear `career` a `programId` cuando haya coincidencia segura;
- poblar snapshots de nombre de programa;
- inferir `campusId` y `academicAreaId` cuando exista una relación segura;
- mandar a revisión manual los ambiguos.

## Certificados

- poblar `programId` y `programNameSnapshot`;
- poblar `studentEmail` desde el participante vinculado;
- completar `templateId` y `templateSnapshot` si existen;
- completar `signer1Id` y `signer2Id` cuando sea deducible;
- auditar emitidos sin firma, PDF o plantilla.

## Estados

- mantener `issued` actuales sin reescribirlos en masa todavía;
- evaluar cuáles cumplen para promoción a `available`;
- regresar a saneamiento los emitidos incompletos.

## Riesgos que Este Tramo Debe Evitar

- romper lecturas de datos existentes;
- invalidar certificados ya emitidos sin tener plan de saneamiento;
- hacer obligatorios nuevos campos sin backfill previo;
- mezclar otra vez autoridad firmante y usuario firmante;
- mover menús sin primero corregir dominio y contrato.

## Entregables del Tramo 1

Este tramo debe dejar listos, antes de tocar UX grande:

- esquema canónico compatible hacia atrás para participante;
- esquema canónico compatible hacia atrás para certificado;
- estrategia formal de relación `signers` <-> `internal_users`;
- semántica oficial de `issued` y `available`;
- checklist de validación que manual y masivo deben compartir.

## Orden Inmediato Después de Este Tramo

1. Rediseñar alta manual de participantes con selectores de catálogo.
2. Rediseñar importación masiva de participantes con el mismo contrato.
3. Rediseñar alta manual de certificados para exigir participante, plantilla y firmantes.
4. Rediseñar importación masiva de certificados para exigir el mismo nivel de completitud.
5. Corregir el flujo de firma para que use autoridad firmante más usuario firmante autorizado.
6. Introducir `available` y recién entonces ajustar portal y validación pública.

## Decisión Final

El sistema no necesita más rutas para hacer lo mismo.

Necesita:

- una sola definición de participante;
- una sola definición de certificado;
- una sola semántica de firma;
- una sola semántica de publicación;
- y compatibilidad temporal suficiente para corregir lo viejo sin dañarlo.
