# Plan Detallado Fase 4 - Restricciones Administrativas y Control de Disponibilidad

Fecha: 24 de marzo de 2026

## Objetivo de la fase

Hacer que un bloqueo administrativo afecte de forma real y consistente:

- la disponibilidad publica del certificado;
- la descarga desde el portal del participante;
- la descarga interna cuando el certificado esta restringido;
- la trazabilidad operativa del bloqueo y su liberacion.

## Problemas que esta fase resuelve

- `PF-015` deja de depender de un bloqueo solo visual.
- El estado `blocked_payment`, `blocked_documents` y `blocked_administrative` ya no es solo una etiqueta.
- El participante deja de descargar el certificado desde el navegador por una ruta libre de frontend.
- El backoffice gana una accion formal para bloquear y desbloquear con motivo.
- El sistema notifica por correo cuando el certificado es bloqueado o liberado.

## Implementacion realizada

### 1. Modelo de restriccion

Se agrego un modelo explicito de restriccion en:

- `lib/types/certificateRestriction.ts`
- `lib/domain/entities/Certificate.ts`
- `lib/infrastructure/repositories/FirebaseCertificateRepository.ts`

El certificado ahora puede conservar:

- tipo de restriccion;
- motivo;
- actor que bloqueo;
- fecha del bloqueo;
- estado previo a restaurar;
- datos de liberacion.

### 2. Servicio de bloqueo y liberacion

Se implemento el servicio:

- `lib/server/certificateRestrictions.ts`

Responsabilidades:

- validar si el certificado admite bloqueo;
- traducir el tipo de restriccion al estado bloqueado correcto;
- persistir la restriccion activa en el documento del certificado;
- restaurar el estado previo al liberar;
- registrar auditoria en la coleccion `certificateRestrictions`.

### 3. API administrativa

Se agrego la ruta:

- `app/api/admin/certificates/[id]/restriction/route.ts`

Comportamiento:

- `POST { action: "block", type, reason }`
- `POST { action: "release", reason? }`

Acceso permitido:

- `administrator`
- `coordinator`

### 4. Descarga controlada del participante

Se agrego la ruta:

- `app/api/student/certificates/[id]/download/route.ts`

Esta ruta:

- valida sesion;
- valida que el certificado pertenece al participante autenticado;
- valida que el estado permita descarga;
- bloquea la descarga si existe restriccion activa;
- rechaza la descarga si no existe `pdfUrl`.

Con esto la descarga del participante deja de depender de generar un PDF libremente desde el navegador.

### 5. Ajustes de UI

Se actualizaron:

- `components/certificates/CertificateActions.tsx`
- `app/student/certificates/[id]/page.tsx`
- `app/student/page.tsx`
- `app/dashboard/certificates/[id]/page.tsx`
- `app/dashboard/certificates/page.tsx`
- `app/dashboard/reports/page.tsx`

Cambios visibles:

- el participante ve el estado del bloqueo y el motivo;
- la descarga muestra mensaje de indisponibilidad cuando aplica;
- el backoffice puede aplicar o levantar restriccion desde el detalle del certificado;
- listados y reportes ya contemplan estados bloqueados.

### 6. Correo transaccional

Se extendio:

- `lib/server/certificateWorkflowNotifications.ts`

Flujos incorporados:

- correo al participante al bloquear;
- correo al participante al liberar;
- correo interno a administradores/coordinadores cuando se bloquea;
- correo interno cuando se libera la restriccion.

### 7. Reglas

Se agrego soporte de reglas para:

- `certificateRestrictions`

Archivo:

- `firestore.rules`

## Resultado funcional esperado al cerrar la fase

- un certificado puede existir y seguir siendo visible internamente, pero quedar indisponible para descarga del participante;
- la validacion publica informa el estado real del certificado cuando esta bloqueado;
- el participante ve el bloqueo dentro del portal y no puede descargar mientras siga activo;
- el personal interno cuenta con un flujo claro para bloquear o desbloquear con motivo;
- el sistema deja evidencia operativa del bloqueo y su liberacion.

## Riesgos o limites que quedan

- las pruebas manuales de esta fase siguen diferidas al cierre completo del proyecto, segun la decision del trabajo por fases;
- la validacion automatica global con `tsc` sigue afectada por deuda previa del repositorio fuera de esta fase;
- la consistencia final del documento descargado frente al preview queda pendiente de la Fase 5.

## Verificacion tecnica recomendada cuando llegue el cierre final

- bloquear un certificado emitido y verificar que:
  - el portal del participante lo muestra como restringido;
  - la descarga falla;
  - la validacion publica lo muestra como no habilitado;
  - el backoffice refleja el estado bloqueado.
- liberar la restriccion y verificar que:
  - el estado vuelve al anterior;
  - la descarga vuelve a estar disponible;
  - se generaron los correos esperados.
