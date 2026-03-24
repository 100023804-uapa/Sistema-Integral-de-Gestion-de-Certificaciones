# Estado Actual y Alineacion de Flujos SIGCE

**Fecha:** 2026-03-24  
**Objetivo:** dejar una referencia corta y vigente sobre como opera hoy el sistema, que depende de que y que decisiones ya no siguen el modelo historico.

---

## 1. Superficies activas del producto

### Validacion publica
- Ruta principal: `/verify`
- Entrada permitida: folio o codigo de verificacion.
- Resultado esperado: confirmar existencia, vigencia y estado general del certificado.
- No permite descarga publica del documento completo.

### Portal autenticado del participante
- Entrada: `/login` como participante.
- Requiere acceso activado por administracion.
- Si la cuenta tiene contrasena temporal, obliga a pasar por `/student/change-password`.
- Permite ver detalle, estado y descarga solo de certificados propios y disponibles.

### Backoffice interno
- Entrada: `/login` como administrador o usuario interno autorizado.
- La sesion se valida en servidor.
- Los roles internos base que gobiernan acceso critico son: `administrator`, `coordinator`, `verifier`, `signer`.

---

## 2. Flujo operativo principal

1. Administracion configura catalogos institucionales.
2. Administracion crea usuarios internos y les envia activacion.
3. Administracion o coordinacion registra participantes.
4. Administracion habilita el portal del participante con contrasena temporal si aplica.
5. Coordinacion crea o importa certificados.
6. Todo certificado nace en `draft`.
7. El flujo continua por `pending_review`, `verified`, `pending_signature`, `signed`, `issued`.
8. La emision genera el PDF oficial y el codigo de verificacion.
9. El participante autenticado consulta y descarga si el certificado no tiene restriccion activa.
10. El publico solo valida autenticidad y estado general.

---

## 3. Dependencias estructurales

- `campusId` es obligatorio para crear certificados.
- Las areas academicas dependen del recinto.
- Los programas academicos deben existir como catalogo antes de la creacion manual o importacion consistente.
- La solicitud de firma depende de que el certificado este `verified`.
- La firma depende de una solicitud pendiente para el firmante correcto.
- La emision depende de firma completada y plantilla activa.
- La descarga del participante depende de sesion valida, `pdfUrl` disponible y ausencia de bloqueo activo.

---

## 4. Decisiones vigentes de flujo

### Acceso interno
- Ya no existe autoservicio publico para personal interno.
- El alta de usuarios se hace desde `Usuarios Internos`.
- El sistema envia enlace de activacion y definicion de contrasena.

### Acceso del participante
- El correo registrado en la ficha del participante es la base del acceso.
- La activacion se hace desde el detalle del participante.
- La recuperacion excepcional se resuelve con reinicio a contrasena temporal.
- En el proximo ingreso se fuerza cambio de contrasena.

### Restricciones
- Los bloqueos por pago, documentos o tema administrativo no forman parte del modal general de estados.
- Se gestionan desde la restriccion del certificado y afectan disponibilidad y descarga.

### Validacion publica
- Se redujo al minimo necesario.
- Ya no usa matricula como criterio publico de consulta.
- Ya no entrega PDF completo al visitante anonimo.

---

## 5. Alineaciones aplicadas el 2026-03-24

- `/status` deja de comportarse como flujo publico independiente y redirige a `/verify`.
- La navegacion publica reemplaza el enlace viejo de "Estado de Solicitud" por `Portal del Participante`.
- La creacion manual de certificados usa el catalogo de `Programas` y deja de depender de texto libre para el programa academico.
- `Roles y Permisos` pasa a presentarse como catalogo de apoyo operativo; no como fuente unica del control de acceso critico.
- `Configuracion` se reorienta a perfil, seguridad y estado operativo del correo, evitando mezclar credenciales tecnicas heredadas con ajustes personales.

---

## 6. Fuente de verdad actual

Para el estado vigente del sistema, priorizar:
- este documento;
- `plan_maestro_implementacion_por_fases_post_auditoria_2026-03-23.md`;
- `plan_detallado_fase_0` a `plan_detallado_fase_5`;
- el codigo fuente actual en `app/`, `lib/`, `components/` y `middleware.ts`.

Los documentos de principios de marzo de 2026 deben leerse como referencia historica y no como descripcion exacta del comportamiento actual.
