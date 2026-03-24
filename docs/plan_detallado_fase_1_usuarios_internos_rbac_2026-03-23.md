# Plan Detallado Fase 1 - Usuarios Internos y RBAC Real

Fecha: 23 de marzo de 2026

## 1. Objetivo

Cerrar la Fase 1 para que el backoffice de SIGCE opere con:

- aprovisionamiento interno administrado;
- roles consistentes por identidad estable (`uid`);
- menús, pantallas, APIs y reglas alineadas con la misma matriz de permisos;
- retiro del flujo público de autoservicio administrativo.

---

## 2. Cambios implementados en esta fase

### 2.1 Gestión interna de usuarios

Se implementó un nuevo modelo de usuarios internos basado en la colección `internal_users` y en `custom claims` de Firebase Auth.

Incluye:

- alta de usuarios internos desde `/dashboard/users`;
- asignación de rol al momento de crear el usuario;
- reutilización de cuentas Firebase existentes cuando el correo ya existe;
- envío de enlace seguro de activación o restablecimiento de contraseña;
- estados de usuario: `invited`, `active`, `disabled`;
- registro de `inviteSentAt`, `activatedAt` y `lastLoginAt`;
- actualización de nombre, rol, estado y reenvío de invitación;
- revocación de sesiones al cambiar rol o estado.

### 2.2 RBAC real por rol

Se agregó una capa central de permisos para normalizar roles y decidir accesos por ruta.

Esto cubre:

- normalización de `admin` legacy hacia `administrator`;
- guardas de navegación por ruta en dashboard;
- control de visibilidad móvil según rol;
- enforcement server-side por rol en rutas administrativas críticas.

### 2.3 Endpoints endurecidos por rol

Quedaron protegidos con validación explícita por rol:

- gestión de usuarios internos;
- recintos;
- áreas académicas;
- tipos de certificado;
- roles;
- plantillas de certificado;
- generación de certificados desde plantillas;
- creación de solicitudes de firma.

### 2.4 Retiro del flujo público viejo

Los flujos públicos `/request-access` y `/register-admin` ya no permiten solicitar ni crear cuentas administrativas.

Ahora solo muestran el mensaje institucional correcto:

- el acceso interno lo crea un administrador;
- el usuario recibe activación por correo;
- el autoservicio público administrativo queda fuera de uso.

### 2.5 Firestore rules alineadas

Se actualizaron las reglas para soportar el nuevo modelo por `custom claims` y mantener compatibilidad temporal con `access_users`.

Quedó cubierto:

- reconocimiento de `sigce_internal` y `sigce_role`;
- distinción entre administrador, coordinador, verificador y firmante;
- reglas para colecciones faltantes del backoffice;
- desactivación del alta pública de `access_requests`.

### 2.6 Limpieza de pantallas que usaban identidad simulada

Se retiraron referencias a:

- `current-user-id`;
- `userRole=coordinator`;
- `signerId` inventado en cliente;
- `createdBy` ficticio en plantillas.

Se ajustaron especialmente:

- `certificate-states`;
- `digital-signatures`;
- `certificate-templates`;
- `certificates/create` ahora usa el `uid` autenticado real en lugar de un valor simulado.

---

## 3. Qué problemas resuelve esta fase

Al culminar esta fase deben quedar resueltos estos puntos:

- un usuario interno ya no se crea desde un flujo público;
- los roles dejan de depender de mezclas entre email, whitelist visual y reglas informales;
- un usuario sin rol válido no debe navegar por el dashboard;
- un firmante o verificador no debe ver ni abrir pantallas solo de administrador;
- las APIs críticas de catálogo y usuarios ya no aceptan cualquier interno;
- las reglas de Firestore dejan de depender únicamente del esquema legacy `access_users`;
- el hallazgo `ERR-001 / PF-004` queda atacado desde UI, rutas y reglas.

---

## 4. Pendientes que pasan a fases posteriores

Esta fase no cierra todavía todo el saneamiento del sistema.

Quedan explícitamente fuera:

- portal autenticado del estudiante;
- cierre definitivo de exposición pública de certificados;
- migración total de operaciones que aún usan repositorios cliente directos hacia APIs server-side;
- máquina de estados completa y auditada de certificados;
- firma digital final con experiencia operativa madura;
- restricciones administrativas de descarga, bloqueo y visibilidad.

---

## 5. Pruebas recomendadas para validar la fase

## 5.1 Prueba de alta interna

1. Iniciar sesión con un administrador.
2. Entrar a `/dashboard/users`.
3. Crear un usuario nuevo con rol `coordinator`.
4. Verificar que:
   - el registro aparece en la tabla;
   - el estado inicial es `Invitado`;
   - se registra `inviteSentAt` si el proveedor de correo está activo;
   - en Firebase Auth el usuario tiene claims `sigce_internal=true` y `sigce_role=coordinator`.

## 5.2 Prueba de activación

1. Abrir el enlace de activación recibido por correo.
2. Definir contraseña.
3. Iniciar sesión con esa cuenta.
4. Verificar que:
   - entra al dashboard;
   - el estado cambia a `Activo`;
   - se registra `activatedAt` y `lastLoginAt`.

## 5.3 Prueba de aislamiento por rol

1. Crear cuentas de `verifier` y `signer`.
2. Iniciar sesión con cada una.
3. Verificar que no puedan abrir:
   - `/dashboard/users`
   - `/dashboard/settings`
   - `/dashboard/campuses`
   - `/dashboard/roles`
4. Verificar que el sistema redirige fuera de rutas no permitidas.

## 5.4 Prueba de APIs por rol

Con sesión autenticada:

- un `coordinator` debe recibir `403` al llamar `POST /api/admin/internal-users`;
- un `signer` debe recibir `403` al llamar `GET /api/admin/roles`;
- un `administrator` debe poder listar y modificar usuarios internos;
- un `coordinator` debe poder usar plantillas pero no catálogos administrativos.

## 5.5 Prueba de cambio de rol y desactivación

1. Cambiar el rol de un usuario interno.
2. Verificar que la sesión previa queda obsoleta tras renovar autenticación.
3. Deshabilitar el usuario.
4. Verificar que ya no puede operar con normalidad después de reintentar acceso.

## 5.6 Prueba de reglas Firestore

Validar desde el cliente:

- un administrador puede operar catálogos;
- un coordinador puede leer catálogos y operar flujos permitidos;
- un firmante no puede escribir en catálogos administrativos;
- la creación pública de `access_requests` ya no está permitida.

---

## 6. Evidencia mínima para dar por cerrada la fase

- capturas del módulo `Usuarios del Sistema`;
- evidencia de claims en Firebase Auth;
- evidencia del correo de activación o reenvío;
- evidencia de redirección por ruta prohibida;
- evidencia de respuestas `403` en APIs restringidas;
- evidencia de lectura/escritura correcta según rol en Firestore.

---

## 7. Riesgos residuales

- todavía existen flujos del sistema que operan con lógica cliente directa y deben migrarse a backend en fases siguientes;
- la convivencia temporal con `access_users` sigue siendo una compatibilidad legacy, no el destino final;
- si no se publican las reglas actualizadas en Firebase, el nuevo RBAC no quedará completo en entorno remoto.
