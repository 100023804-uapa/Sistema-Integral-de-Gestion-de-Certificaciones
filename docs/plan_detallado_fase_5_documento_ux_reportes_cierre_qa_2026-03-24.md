# Plan Detallado Fase 5 - Documento Final, UX Operativa, Reportes y Cierre QA

Fecha: 24 de marzo de 2026

## Objetivo de la fase

Cerrar la diferencia entre:

- vista operativa interna;
- PDF oficial emitido;
- mensajes del sistema;
- listados y reportes usados por el personal.

Con esta fase el sistema queda preparado para la ronda manual final de QA de la pasantia.

## Problemas que esta fase resuelve

- `PF-014` deja de depender de una descarga regenerada en cliente distinta al PDF oficial.
- El detalle interno del certificado ya no induce a pensar que el mock visual es el documento emitido.
- Los reportes y listados dejan de depender de cargas parciales de 500 registros.
- El usuario interno recibe mejor contexto sobre que documento es oficial y que parte es solo referencia operativa.
- El participante recibe notificacion final cuando su certificado ya fue emitido.

## Implementacion realizada

### 1. Documento oficial interno

Se agrego:

- `app/api/admin/certificates/[id]/document/route.ts`

Esta ruta:

- exige sesion interna;
- abre el PDF oficial persistido;
- bloquea el acceso si el certificado tiene restriccion activa;
- devuelve error claro si aun no existe documento final.

### 2. Vista interna alineada con el documento final

Se actualizo:

- `app/dashboard/certificates/[id]/page.tsx`

Comportamiento nuevo:

- si existe `pdfUrl` y el certificado no esta restringido, la pantalla embebe el PDF oficial emitido;
- la descarga usa el mismo documento oficial y no una regeneracion paralela;
- si aun no hay PDF oficial, la pantalla muestra una vista operativa de referencia con mensaje explicito.

### 3. Reportes y listados confiables

Se actualizaron:

- `app/dashboard/reports/page.tsx`
- `app/dashboard/certificates/page.tsx`

Cambios:

- se consulta el conjunto completo disponible desde `findAll()`;
- se eliminan cargas parciales usadas como atajo en cliente;
- se mejoran indicadores de emitidos, bloqueados y en flujo.

### 4. UX de validacion interna

Se actualizo:

- `app/dashboard/validate/page.tsx`

Mejoras:

- el enlace al detalle publico usa ahora `publicVerificationCode` o `folio`, no el `id` interno;
- los mensajes distinguen entre no encontrado y no habilitado;
- se aclara mejor el estado actual cuando el certificado existe pero no esta vigente.

### 5. Correo final de certificado emitido

Se extendio:

- `lib/server/certificateWorkflowNotifications.ts`
- `app/api/admin/certificate-templates/generate/route.ts`

Flujo agregado:

- al emitir correctamente un certificado, el participante recibe aviso de que ya puede entrar al portal y consultarlo.

## Resultado esperado al cerrar la fase

- el backoffice usa el PDF oficial emitido como referencia principal;
- la descarga interna e interna-visual quedan alineadas con el mismo documento;
- el participante es notificado cuando su certificado queda disponible;
- reportes y listados dejan de inducir errores por cortes artificiales de datos;
- el sistema queda listo para la ronda final de pruebas manuales y evidencia de pasantia.

## Validacion tecnica realizada

Se ejecuto validacion con:

- `node_modules/.bin/tsc.cmd --noEmit`

Resultado:

- sin errores en este entorno.

## Pendiente deliberadamente fuera de esta fase

- no se ejecutaron pruebas manuales, porque fueron reservadas para el cierre integral de todas las fases;
- la ronda final de QA funcional queda como siguiente actividad del proyecto.
