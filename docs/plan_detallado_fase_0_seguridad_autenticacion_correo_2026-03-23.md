# Plan Detallado de Implementación — Fase 0

**Fecha:** 2026-03-23  
**Proyecto:** SIGCE — Sistema Integral de Gestión de Certificaciones  
**Fase:** Fase 0 — Seguridad y autenticación base  
**Documento maestro relacionado:** `docs/plan_maestro_implementacion_por_fases_post_auditoria_2026-03-23.md`

---

## 1. Propósito de este documento

Este documento traduce la **Fase 0** del plan maestro a una especificación de implementación ejecutable.

Su función es dejar definido:

- qué se implementará exactamente en esta fase;
- qué problemas quedarán resueltos al terminarla;
- qué cambios técnicos se harán por capas;
- cómo se probará la fase antes de declararla cerrada;
- qué queda explícitamente fuera de alcance para no mezclar Fase 0 con Fase 1 o posteriores.

---

## 2. Objetivo de la Fase 0

Establecer una base segura y verificable para el acceso al sistema, la protección de rutas internas y la futura mensajería transaccional, de forma que el proyecto deje de depender de sesiones simuladas, autorizaciones implícitas y correo improvisado.

En esta fase no se busca completar todavía el rediseño total de roles, estudiantes ni flujos de negocio. Se busca cerrar la base técnica sin la cual las siguientes fases seguirían siendo frágiles.

---

## 3. Qué problemas debe resolver esta fase al terminar

Al cierre de Fase 0 deben quedar resueltos, como mínimo, estos problemas:

- ya no existirá una sesión simulada o falsable para entrar al dashboard;
- las rutas internas críticas no dependerán de datos de usuario o rol enviados desde el cliente para autorizar acceso;
- existirá una forma estándar de obtener el usuario autenticado desde el servidor;
- endpoints de depuración o logs sensibles no expondrán información operativa o credenciales;
- la base de configuración del servicio de correo dejará de depender de Gmail como solución final;
- existirá una capa inicial de correo transaccional lista para soportar invitaciones y notificaciones en fases posteriores;
- quedará definido cómo validar manual y técnicamente que el acceso interno está realmente protegido.

---

## 4. Alcance de la Fase 0

### Incluido

- sesión verificable real con Firebase Auth + Firebase Admin;
- endurecimiento de rutas internas y superficies administrativas críticas;
- helper reutilizable de autenticación server-side;
- cierre o restricción de endpoints de debug inseguros;
- limpieza de logs y manejo seguro de credenciales;
- revisión base de reglas y configuración necesaria para acceso privilegiado;
- definición e implementación inicial de un proveedor de correo transaccional desacoplado;
- plantillas base de correo técnico para pruebas;
- checklist de pruebas manuales y técnicas de cierre.

### Excluido

- rediseño completo del RBAC funcional por módulo;
- migración definitiva de roles por `email` a `uid`;
- flujo final de aprovisionamiento interno de usuarios;
- portal autenticado de estudiantes;
- separación funcional completa entre validación pública y portal privado;
- máquina de estados, firma digital y bloqueos administrativos;
- rediseño de plantillas visuales de correos orientadas al negocio final.

Lo excluido se aborda en Fase 1 y posteriores.

---

## 5. Decisiones técnicas cerradas para esta fase

### 5.1 Autenticación base

- El login seguirá partiendo de Firebase Auth en cliente.
- El backend emitirá una **session cookie verificable** usando Firebase Admin.
- El servidor validará la cookie para permitir acceso a superficies internas.
- El middleware seguirá siendo una capa de entrada útil, pero la autorización real debe suceder también en endpoints internos.

### 5.2 Autorización base

- En Fase 0 no se cierra todavía el RBAC completo.
- Sí debe quedar resuelto que ningún endpoint administrativo crítico opere sin un usuario autenticado obtenido desde servidor.
- Cuando una ruta aún no tenga enforcement completo por rol, al menos debe exigir identidad interna válida y no confiar en parámetros como `userRole`, `changedBy`, `signerId` o equivalentes enviados por cliente.

### 5.3 Correo transaccional

- El proveedor objetivo inicial será **Resend**.
- La implementación no debe acoplarse al SDK concreto; debe existir una capa `EmailProvider`.
- Debe quedar posible sustituir Resend por Brevo en el futuro sin reescribir flujos de negocio.
- No se enviarán contraseñas permanentes en texto plano por correo.

### 5.4 Seguridad operativa

- Variables sensibles no se mostrarán en responses públicas ni en logs.
- Se mantendrá soporte para `FIREBASE_SERVICE_ACCOUNT_KEY` o su variante Base64 si el despliegue lo requiere.
- El documento `.env.example` debe reflejar la configuración mínima real requerida por la fase.

---

## 6. Estado actual relevante del repositorio

A día 2026-03-23, la Fase 0 parte de este estado:

- `middleware.ts` protege rutas internas, pero depende de una verificación indirecta de sesión.
- `app/api/auth/session/login/route.ts` crea una cookie temporal simulada.
- `app/api/auth/session/verify/route.ts` acepta la cookie fija `temp-session`.
- `app/api/debug/env/route.ts` expone información de entorno.
- `lib/firebaseAdmin.ts` registra previews de credenciales en logs.
- `app/api/uploadthing/core.ts` ya apunta a verificación con Firebase Admin y puede servir como referencia.
- `app/actions/send-email.ts` usa `nodemailer` con Gmail.
- `package.json` ya incluye la dependencia `resend`, pero aún no está integrada.
- `.env.example` no refleja hoy la configuración real que el sistema necesita para autenticación y correo.

Esto confirma que la fase no es opcional: es una condición para poder seguir.

---

## 7. Diseño de implementación por hitos

### 7.1 Hito 0.1 — Sesión verificable real

### Objetivo

Eliminar la sesión simulada y reemplazarla por una cookie `httpOnly` verificable con Firebase Admin.

### Entradas técnicas

- `app/api/auth/session/login/route.ts`
- `app/api/auth/session/verify/route.ts`
- `app/api/auth/session/logout/route.ts`
- `middleware.ts`
- `lib/firebaseAdmin.ts`
- `lib/contexts/AuthContext.tsx`
- `app/login/page.tsx`

### Implementación esperada

- verificar el `idToken` recibido en backend;
- emitir session cookie real con vencimiento controlado;
- invalidar la cookie en logout;
- validar cookie en endpoint de verificación;
- mantener la redirección de acceso en `middleware.ts`;
- asegurar que el cliente no escriba manualmente cookies de sesión.

### Resultado de este hito

- una cookie falsificada ya no permitirá acceso;
- el login y logout internos quedarán centralizados;
- existirá una base real para identificar usuarios internos.

---

### 7.2 Hito 0.2 — Helper de autenticación server-side y protección base de endpoints

### Objetivo

Crear una forma estándar de obtener el usuario autenticado desde el servidor y empezar a usarla en superficies internas críticas.

### Entradas técnicas

- `lib/middleware/rbac.ts`
- `app/api/admin/**`
- `app/api/uploadthing/core.ts`
- posibles nuevos helpers bajo `lib/auth/**` o estructura equivalente

### Implementación esperada

- crear helper reutilizable para extraer y verificar la sesión desde request;
- normalizar el objeto de usuario autenticado server-side;
- agregar guardas base para endpoints administrativos;
- hacer que rutas críticas dejen de depender de identidad enviada por cliente;
- documentar claramente qué rutas quedan cubiertas en Fase 0 y cuáles quedan para Fase 1.

### Criterio de diseño

En Fase 0 no se busca cerrar todavía la matriz completa de permisos, pero sí asegurar que:

- toda ruta administrativa crítica requiere sesión válida;
- el usuario autenticado proviene de servidor;
- los datos enviados por cliente se tratan como input funcional, no como fuente de identidad.

### Resultado de este hito

- el backend interno deja de operar “a ciegas”;
- se reduce el riesgo de suplantación lógica en rutas críticas;
- queda lista la base para endurecer RBAC en Fase 1.

---

### 7.3 Hito 0.3 — Hardening de depuración, logs y credenciales

### Objetivo

Eliminar exposiciones innecesarias de información sensible.

### Entradas técnicas

- `app/api/debug/env/route.ts`
- `lib/firebaseAdmin.ts`
- cualquier otro log de credenciales o sesión detectado durante la implementación

### Implementación esperada

- desactivar o restringir el endpoint de debug;
- impedir que el backend imprima previews de service accounts, tokens o secretos;
- estandarizar mensajes de error para no filtrar datos sensibles;
- revisar configuración de logs para entornos de desarrollo y producción.

### Resultado de este hito

- se reduce fuga operativa;
- la depuración deja de exponer valores de entorno;
- el sistema queda en mejor condición para despliegue institucional.

---

### 7.4 Hito 0.4 — Configuración, reglas mínimas y superficies privilegiadas

### Objetivo

Alinear configuración y acceso mínimo para que el sistema no dependa de variables ocultas o reglas incompletas.

### Entradas técnicas

- `.env.example`
- `firestore.rules`
- superficies privilegiadas relacionadas con dashboard, uploads y administración

### Implementación esperada

- actualizar `.env.example` con las variables mínimas reales de Fase 0;
- revisar reglas para que escritura privilegiada no dependa solo de “estar autenticado”;
- revisar coherencia entre reglas del repositorio y colecciones críticas usadas por acceso interno;
- documentar prerequisitos de despliegue para esta fase.

### Variables esperadas a documentar

- `FIREBASE_SERVICE_ACCOUNT_KEY` o `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64`
- `NEXT_PUBLIC_APP_URL` o equivalente estable de aplicación
- `EMAIL_PROVIDER`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`
- `EMAIL_WEBHOOK_SECRET` si aplica

### Resultado de este hito

- la fase queda desplegable de forma más consistente;
- disminuye dependencia de conocimiento implícito;
- el sistema queda preparado para correo transaccional real.

---

### 7.5 Hito 0.5 — Fundación del servicio de correo transaccional

### Objetivo

Dejar incorporada la base técnica de correo que soportará los flujos de Fase 1 en adelante.

### Entradas técnicas

- `app/actions/send-email.ts`
- `package.json`
- nuevos módulos sugeridos en `lib/email/**` o estructura equivalente

### Implementación esperada

- crear interfaz `EmailProvider`;
- crear implementación inicial `ResendEmailProvider`;
- desacoplar el uso actual de Gmail/Nodemailer del flujo principal;
- dejar una plantilla técnica mínima para envío de prueba;
- preparar soporte para webhooks de entrega, rebote o rechazo;
- dejar documentada la política de no enviar contraseñas permanentes.

### Decisión técnica recomendada

La primera implementación concreta debe montarse sobre Resend porque:

- ya existe la dependencia en el proyecto;
- reduce fricción para comenzar;
- encaja bien con el stack actual.

Nodemailer + Gmail puede mantenerse solo como referencia temporal mientras se hace la migración, pero no como solución objetivo de la fase.

### Resultado de este hito

- el proyecto tendrá una base profesional para notificaciones transaccionales;
- Fase 1 podrá montar invitaciones internas sin improvisar la infraestructura de correo;
- la pasantía tendrá una decisión técnica clara y defendible sobre entregabilidad y arquitectura.

---

### 7.6 Hito 0.6 — Validación, smoke test y evidencia de cierre

### Objetivo

No cerrar la fase solo por “haber hecho cambios”, sino por contar con evidencia de que la base de acceso funciona.

### Implementación esperada

- checklist manual de acceso y no acceso;
- validación de uploads protegidos;
- validación de endpoint debug bloqueado o removido;
- prueba de envío técnico de correo;
- evidencia escrita del resultado de la fase;
- lista de pendientes explícitos que pasan a Fase 1.

### Resultado de este hito

- cierre de fase con trazabilidad;
- menor riesgo de arrastrar errores a la siguiente fase;
- base lista para documentar el plan detallado de Fase 1.

---

## 8. Qué se debe considerar resuelto al culminar la Fase 0

Al finalizar esta fase se debe poder afirmar lo siguiente:

- el acceso interno ya no depende de una cookie temporal simulada;
- el sistema puede identificar usuarios internos desde backend con una sesión verificable;
- las rutas administrativas críticas ya no operan sin autenticación real;
- endpoints o logs con fuga sensible quedaron corregidos;
- existe una configuración mínima documentada para despliegue;
- el correo transaccional ya tiene proveedor objetivo, interfaz técnica y prueba base operativa;
- la siguiente fase puede concentrarse en aprovisionamiento interno y RBAC, no en “arreglar primero la base”.

Lo que **no** se considera resuelto todavía:

- asignación definitiva de roles por `uid`;
- onboarding final de usuarios internos;
- login final del estudiante;
- notificaciones de negocio por estados, firmas o bloqueos.

---

## 9. Estrategia de pruebas de la Fase 0

La fase debe validarse por tres vías:

- prueba técnica mínima de compilación y revisión;
- smoke test manual end-to-end;
- pruebas negativas de acceso y seguridad.

### 9.1 Validación técnica mínima

Debe intentarse al menos:

- `npm run lint`
- `next build` o validación equivalente del proyecto
- revisión de variables requeridas documentadas

Si el entorno local impide alguno de estos pasos, debe quedar documentado como incidencia del entorno y no como “prueba omitida sin explicación”.

### 9.2 Smoke test manual obligatorio

#### Caso 1 — Acceso interno válido

1. Iniciar sesión con un usuario interno autorizado.
2. Verificar que la sesión se crea correctamente.
3. Entrar al dashboard.
4. Navegar al menos a un módulo protegido.

**Resultado esperado:** acceso concedido y persistencia de sesión.

#### Caso 2 — Acceso sin sesión

1. Abrir ruta protegida sin login.
2. Intentar acceder directamente a `/dashboard` o un endpoint interno.

**Resultado esperado:** redirección a login o respuesta `401/403` según corresponda.

#### Caso 3 — Cookie falsificada

1. Intentar inyectar manualmente una cookie con valor fijo o inválido.
2. Reintentar acceso a dashboard.

**Resultado esperado:** acceso rechazado.

#### Caso 4 — Logout

1. Iniciar sesión.
2. Cerrar sesión.
3. Intentar volver a entrar a una ruta protegida usando el mismo navegador.

**Resultado esperado:** cookie inválida o eliminada y acceso denegado.

#### Caso 5 — Endpoint administrativo sin autenticación

1. Invocar un endpoint interno crítico sin sesión.
2. Invocarlo con sesión inválida.

**Resultado esperado:** respuesta de no autorizado o prohibido.

#### Caso 6 — Upload protegido

1. Intentar upload sin sesión.
2. Repetir upload con sesión válida.

**Resultado esperado:** el upload anónimo falla y el upload autenticado funciona.

#### Caso 7 — Debug y logs

1. Intentar acceder al endpoint de debug.
2. Revisar logs de inicio y autenticación.

**Resultado esperado:** no se expone información sensible en response ni en logs.

#### Caso 8 — Prueba técnica de correo

1. Configurar el proveedor de correo de Fase 0.
2. Enviar un correo de prueba a un buzón controlado.
3. Confirmar recepción.
4. Confirmar que el contenido no expone contraseñas permanentes.

**Resultado esperado:** envío exitoso, remitente válido y contenido seguro.

### 9.3 Pruebas negativas recomendadas

- intentar llamar rutas internas con `userRole` manipulado desde cliente;
- intentar omitir sesión pero enviar `changedBy` o `signerId` válidos;
- probar sesión expirada;
- probar variables de correo ausentes;
- probar fallo del proveedor de correo y verificar manejo de error controlado.

### 9.4 Evidencia que debe guardarse

Para cierre de fase conviene guardar:

- capturas o notas de smoke test;
- listado de rutas probadas;
- registro del correo de prueba entregado;
- confirmación de variables requeridas;
- incidencias encontradas y decisión de aceptación o corrección.

---

## 10. Definition of Done de la Fase 0

La Fase 0 solo se considera terminada si se cumplen todas estas condiciones:

- sesión simulada eliminada del flujo real;
- verificación server-side operativa;
- rutas administrativas críticas protegidas por sesión válida;
- endpoint debug inseguro corregido;
- logs sensibles eliminados;
- configuración mínima de entorno documentada;
- proveedor de correo base implementado o listo para operar con prueba real;
- smoke test ejecutado con resultado registrado;
- pendientes de Fase 1 claramente separados.

---

## 11. Riesgos y dependencias

### Riesgos principales

- dificultad de despliegue de Firebase Admin según entorno;
- incompatibilidad entre reglas actuales y comportamiento esperado;
- dependencia de flujos legacy de acceso aún no migrados;
- retraso en verificación del dominio de correo;
- mezcla accidental de tareas de RBAC de Fase 1 dentro de Fase 0.

### Dependencias operativas

- acceso a credenciales de Firebase Admin;
- acceso al dominio remitente para configurar correo;
- buzón de prueba para validación de envío;
- confirmación de qué endpoints administrativos se consideran críticos desde el primer corte.

---

## 12. Entregables de esta fase

Al terminar la fase deben existir, como mínimo:

- implementación técnica de autenticación base;
- helper reutilizable de sesión server-side;
- protección base en endpoints internos críticos;
- hardening de debug y logs;
- configuración documentada de entorno;
- capa base de correo transaccional;
- bitácora o resumen de validación;
- documento de cierre o avance que registre lo logrado.

---

## 13. Handoff a Fase 1

Fase 1 debe recibir de Fase 0 una base estable para empezar el aprovisionamiento interno de usuarios.

Eso significa que Fase 1 no debería volver a discutir:

- cómo se autentica un usuario interno;
- cómo se obtiene la identidad del usuario en servidor;
- si existe o no un proveedor de correo;
- si el sistema puede enviar invitaciones seguras;
- si el acceso al dashboard depende de una simulación.

Si alguno de esos puntos sigue abierto, la Fase 0 no está realmente cerrada.

---

## 14. Próximo documento después de cerrar esta fase

Una vez completada la implementación y validación de Fase 0, el siguiente documento a crear debe ser:

- **Plan detallado de Fase 1 — Gestión interna de usuarios y RBAC real**

Ese siguiente documento ya podrá enfocarse en:

- alta interna de usuarios;
- activación controlada;
- credenciales temporales seguras;
- primer acceso;
- matriz real de roles por tipo de usuario interno.

---

## 15. Conclusión

La Fase 0 no es una fase “menor” ni solo de orden técnico. Es la fase que convierte al sistema en una base utilizable y defendible para continuar el proyecto.

Si esta fase queda bien cerrada:

- el acceso interno deja de ser improvisado;
- la seguridad mínima del sistema deja de depender de supuestos;
- el correo deja de ser un parche y pasa a ser infraestructura real;
- las fases siguientes podrán enfocarse en negocio y no en remediar una base insegura.
