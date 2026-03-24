# Fase 2: Portal autenticado del estudiante y validación pública mínima

Fecha: 23 de marzo de 2026

## Objetivo

Mover el acceso del participante desde una consulta pública hacia un portal autenticado y dejar la validación pública limitada a confirmar si un certificado existe y está vigente.

## Alcance implementado

- Login de participante con correo y contraseña.
- Resolución server-side de sesión para distinguir:
  - usuario interno;
  - participante autenticado;
  - cuenta autenticada sin vínculo con participante.
- Estado explícito de acceso del participante dentro de `students.portalAccess`.
- Activación administrativa del portal del participante con contraseña temporal generada por el sistema.
- Reinicio administrativo a contraseña temporal para soporte excepcional cuando el participante no puede recuperar acceso por su cuenta.
- Redirección obligatoria al flujo de cambio de contraseña antes de permitir uso del portal cuando la cuenta está marcada con `mustChangePassword`.
- Portal `/student` autenticado con:
  - perfil básico del participante;
  - listado de certificados;
  - búsqueda por folio, programa o código de verificación.
- Detalle autenticado del certificado en `/student/certificates/[id]`.
- Descarga del certificado solo dentro del portal autenticado.
- Validación pública reducida a:
  - búsqueda por folio o código de verificación;
  - confirmación de estado;
  - sin vista completa del documento;
  - sin descarga pública.
- Endurecimiento del middleware para separar:
  - rutas internas `/dashboard` y `/api/admin`;
  - rutas del participante `/student` y `/api/student`.
- Cierre de lectura pública de `certificates` en `firestore.rules`.

## Problemas que esta fase resuelve

- El rol `student` del login deja de ser una simple redirección a búsqueda pública.
- El portal de estudiante deja de estar basado en datos simulados.
- La vista pública del certificado deja de exponer el documento completo.
- La descarga pública del certificado queda eliminada.
- Un estudiante con sesión válida ya no puede caer en `/dashboard` solo por tener cookie activa.
- Un usuario interno autenticado ya no usa por error el portal de participante.

## Decisiones técnicas

- La sesión sigue usando Firebase Auth + cookie de sesión del servidor.
- La resolución de acceso del participante se hace del lado servidor usando el correo autenticado y la colección `students`.
- El acceso del participante ya no depende solo del correo: requiere `portalAccess.enabled`, `authUid` asociado y estado distinto de `disabled`.
- La validación pública usa consultas server-side con Firebase Admin para no depender de reglas públicas de Firestore.
- La lectura de certificados desde cliente queda reservada al personal interno; el participante usa renderizado server-side.

## Decisión funcional adicional ya definida

La recuperación del participante queda implementada y definida con esta política:

- el correo registrado del participante será la base del acceso;
- el primer ingreso deberá forzar cambio de contraseña;
- si el participante no tiene acceso a su correo, la recuperación será un flujo excepcional asistido por administración;
- el administrador no debe definir una contraseña permanente;
- el administrador podrá reiniciar la cuenta a una contraseña temporal generada por el sistema;
- ese reinicio deberá revocar sesiones previas y obligar al participante a cambiar la contraseña en el siguiente ingreso.

## Archivos principales impactados

- `lib/server/studentPortal.ts`
- `app/login/page.tsx`
- `middleware.ts`
- `app/api/auth/session/login/route.ts`
- `app/api/auth/session/verify/route.ts`
- `app/api/student/me/route.ts`
- `app/student/layout.tsx`
- `app/student/page.tsx`
- `app/student/change-password/page.tsx`
- `app/student/certificates/[id]/page.tsx`
- `app/verify/page.tsx`
- `app/verify/[id]/page.tsx`
- `app/api/admin/students/[id]/portal-access/route.ts`
- `app/api/student/change-password/route.ts`
- `app/actions/consult-certificates.ts`
- `app/dashboard/graduates/[id]/page.tsx`
- `components/certificates/CertificateActions.tsx`
- `firestore.rules`
- `lib/server/studentAccounts.ts`
- `lib/domain/entities/Student.ts`

## Criterios de cierre de la fase

- El participante puede autenticarse y entrar a `/student`.
- El participante solo obtiene acceso si su ficha fue habilitada explícitamente para portal.
- El administrador puede activar acceso o reiniciar a contraseña temporal desde la ficha del participante.
- Si la cuenta está en modo temporal, el participante es llevado obligatoriamente a cambiar su contraseña antes de usar el portal.
- El portal muestra solo certificados del participante autenticado.
- El detalle del certificado es visible solo dentro del portal autenticado.
- La validación pública no muestra el certificado completo ni permite descargarlo.
- La búsqueda pública ya no acepta matrícula ni cédula.
- Las rutas internas rechazan o redirigen sesiones de participante.

## Pruebas manuales a ejecutar al final del proyecto

### Flujo del participante

- Iniciar sesión con cuenta vinculada a un participante.
- Confirmar acceso a `/student`.
- Verificar listado de certificados propios.
- Abrir detalle de un certificado.
- Descargar certificado desde el portal.
- Cerrar sesión y confirmar que `/student` vuelve a exigir login.

### Activación y reinicio excepcional

- Desde la ficha del participante, activar acceso al portal.
- Confirmar que el sistema genera una contraseña temporal.
- Probar ingreso con esa contraseña temporal.
- Confirmar redirección obligatoria a `/student/change-password`.
- Cambiar la contraseña.
- Confirmar que la sesión anterior queda invalidada y el siguiente acceso ya entra al portal.
- Repetir el flujo usando “reiniciar a contraseña temporal”.

### Casos negativos del participante

- Iniciar sesión con cuenta autenticada pero sin participante vinculado.
- Confirmar mensaje de cuenta sin vínculo.
- Intentar entrar a `/dashboard` con sesión de participante.
- Confirmar redirección al portal o bloqueo.

### Validación pública

- Buscar por folio válido.
- Buscar por código de verificación válido.
- Confirmar que la respuesta pública muestra solo estado y metadatos mínimos.
- Confirmar que no existe botón público de descarga ni visualización completa.
- Probar un folio inexistente y confirmar mensaje de no encontrado.

### Seguridad funcional

- Intentar abrir `/api/student/me` sin sesión.
- Intentar abrir `/api/admin/*` con sesión de participante.
- Confirmar que la colección `certificates` ya no queda pública por reglas.
- Confirmar que un participante con el mismo correo pero sin `portalAccess` habilitado no obtiene acceso al portal.

## Riesgos o pendientes que permanecen fuera de esta fase

- La lógica fina de bloqueo por estados complejos del certificado sigue dependiendo de la Fase 3.
- La validación manual completa de UX y reglas se dejó para el cierre global, por decisión del proyecto.
