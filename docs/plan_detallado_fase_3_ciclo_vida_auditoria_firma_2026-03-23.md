# Plan Detallado Fase 3: Ciclo de Vida, Auditoría y Firma

## Objetivo de la fase

Estabilizar el flujo operativo del certificado para que estados, auditoría, solicitud de firma, firma digital y emisión final trabajen sobre una lógica única y consistente.

## Problemas que esta fase corrige

- el certificado se creaba como `active` aunque operativamente comenzaba en `draft`;
- `certificateStates` se estaba usando al mismo tiempo como historial y como fuente de verdad del estado actual;
- el historial de transición podía duplicarse al registrar cambios;
- las acciones pendientes se calculaban sobre eventos históricos y no sobre el estado vigente del certificado;
- la solicitud de firma guardaba datos simulados o incompletos del firmante y del certificado;
- la pantalla de firma no capturaba realmente una firma usable;
- la emisión no persistía el PDF final ni sincronizaba el estado a `issued`.

## Decisión técnica implementada

### Fuente de verdad

- el estado operativo vigente ahora se sincroniza en `certificates.status`;
- `certificateStates` queda como bitácora append-only por transición;
- `stateHistories` conserva el historial consolidado por certificado.

### Reglas de consistencia

- `pending_signature` exige que exista una solicitud de firma pendiente;
- `signed` exige que exista una firma digital registrada;
- `issued` exige que el PDF final ya haya sido generado y persistido;
- las pantallas de validación y portal del participante ya no interpretan `draft` como certificado vigente.

## Cambios implementados

### Backend

- se creó un helper común de estados en `lib/types/certificateStatus.ts`;
- `Certificate` ahora soporta estados operativos y metadatos de transición;
- `CreateCertificate` crea certificados en `draft`;
- `FirebaseCertificateStateRepository`:
  - sincroniza el estado actual en `certificates.status`;
  - evita duplicar historial;
  - calcula acciones pendientes sobre el snapshot actual del certificado;
  - expone estados visibles por rol a partir del estado vigente;
- `FirebaseDigitalSignatureRepository`:
  - completa datos reales del certificado;
  - completa datos reales de firmante y solicitante;
  - registra firma con `ipAddress`, `userAgent` y timestamp real;
- `GenerateCertificateUseCase`:
  - valida que el certificado esté listo para emisión;
  - integra la firma real en la generación;
  - persiste `pdfUrl`, `qrCodeUrl` y `templateId`;
  - transiciona a `issued` luego de generar el artefacto final.

### API

- `POST /api/admin/certificate-states/transition` mantiene transición directa solo donde corresponde;
- `GET /api/admin/certificate-states` devuelve estados actuales visibles por rol en lugar de eventos obsoletos;
- `GET /api/admin/certificate-states/transition` filtra las acciones del modal de estados para no exponer la firma manual fuera de su flujo;
- `POST /api/admin/digital-signatures/request` ahora crea la solicitud real y notifica;
- `POST /api/admin/digital-signatures/sign` firma o rechaza con datos reales y notifica resultado;
- `GET /api/admin/internal-users/signers` expone candidatos válidos de firma para coordinadores y administradores.

### UI

- `app/dashboard/certificate-states/page.tsx`:
  - muestra estados actuales del certificado;
  - permite desde el modal:
    - enviar a firma seleccionando firmante;
    - emitir seleccionando plantilla activa;
- `app/dashboard/digital-signatures/page.tsx`:
  - incorpora un canvas real para capturar firma digital;
  - muestra mejor el solicitante de la firma;
- los listados y validaciones principales ya muestran etiquetas de estado coherentes con el ciclo de vida.

## Flujos de correo incorporados

- aviso interno cuando un certificado entra a verificación;
- aviso al responsable original cuando un certificado vuelve a borrador por devolución;
- notificación al firmante cuando se crea una solicitud de firma;
- notificación al solicitante cuando la firma es aprobada o rechazada.

## Resultado funcional esperado al terminar la fase

- `ERR-003 / PF-012` queda cubierto por sincronización entre estado actual y auditoría;
- `PF-013` queda habilitado porque ya existe:
  - solicitud real de firma;
  - captura real de firma;
  - transición controlada a `signed`;
- la emisión final deja evidencia persistida antes de marcar `issued`;
- acciones pendientes y pantallas de estado dejan de mezclar historial pasado con estado vigente.

## Pendiente para Fase 4

- bloqueos administrativos reales (`blocked_payment`, `blocked_documents`, `blocked_administrative`);
- control efectivo de disponibilidad y descarga según bloqueo;
- separación fina entre `issued` y `available` si el negocio decide mantener ambos;
- reglas de acceso público y descarga sujetas a restricciones administrativas reales.

## Validación pendiente

Las pruebas manuales de esta fase quedaron intencionalmente diferidas para el cierre global de todas las fases, siguiendo la decisión de proyecto.

### Casos que deben ejecutarse al cierre final

- crear certificado y confirmar estado inicial `draft`;
- mover `draft -> pending_review -> verified`;
- devolver `pending_review -> draft` y validar historial;
- solicitar firma desde `verified` con firmante real;
- confirmar recepción del correo al firmante;
- firmar desde el módulo de firmas con canvas real;
- rechazar una firma y validar retorno a `verified`;
- emitir desde `signed` con plantilla activa;
- confirmar persistencia de `pdfUrl`, `qrCodeUrl` y estado `issued`;
- validar desde portal del participante y validación pública que solo `issued/available` cuenten como vigentes.

## Observación técnica

Se ejecutó `pnpm exec tsc --noEmit` el **23 de marzo de 2026**. El chequeo sigue fallando por errores previos del repositorio fuera del alcance inmediato de la fase, especialmente:

- handlers dinámicos antiguos incompatibles con el tipado actual de Next.js;
- inconsistencias históricas entre `ICertificateRepository` y repositorios concretos;
- contenedores legacy (`container_simple.ts`, `container_new.ts`, `container_backup.ts`);
- errores previos en módulos ajenos a Fase 3.

La implementación de esta fase quedó integrada, pero el saneamiento completo de TypeScript del repositorio sigue siendo deuda técnica transversal.
