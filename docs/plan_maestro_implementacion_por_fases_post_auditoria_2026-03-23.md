# Plan Maestro de Implementación por Fases — SIGCE

**Fecha:** 2026-03-23  
**Proyecto:** SIGCE — Sistema Integral de Gestión de Certificaciones  
**Contexto:** actualización del roadmap a partir del análisis del repositorio, la auditoría funcional y los hallazgos de QA.  
**Fuentes base:**

- `docs/informe_analisis_sistema_y_requerimientos_2026-03-03.md`
- `docs/plan_implementacion_por_fases_roadmap_2026-03-03.md`
- `Auditoría del Sistema SIGCE v.1.1.pdf`
- `Pruebas Funcionales QA - SIGCE (2).pdf`
- `Registro de Bugs_ Hallazgos de Pruebas Funcionales QA - SIGCE (1).pdf`

---

## 1. Propósito de este documento

Este documento define el **plan maestro de implementación por fases** que guiará el trabajo del proyecto de pasantía a partir de ahora.

Su objetivo es:

- ordenar la ejecución por dependencias reales;
- incorporar los hallazgos técnicos, funcionales y de seguridad detectados;
- reflejar los nuevos cambios de negocio definidos para acceso interno y portal de estudiantes;
- servir como base para crear, más adelante, un documento detallado de implementación por cada fase.

Este plan **actualiza y sustituye** al roadmap anterior en todo lo que entre en conflicto con los nuevos lineamientos definidos en marzo de 2026.

---

## 2. Decisiones de negocio ya definidas

Estas decisiones se consideran cerradas para el diseño de las próximas fases.

### 2.1 Acceso interno de usuarios administrativos y operativos

El flujo de acceso interno cambiará de la siguiente forma:

1. Un administrador registra internamente al usuario que necesita acceso.
2. El usuario queda asociado a un rol y estado de activación dentro del sistema.
3. Cuando la cuenta esté activa, el sistema enviará un mensaje con credenciales temporales.
4. En el primer acceso, el usuario deberá ingresar, actualizar sus credenciales y completar el proceso inicial de acceso.

Implicaciones:

- deja de ser prioritario el flujo público de auto-solicitud como mecanismo principal de alta;
- el alta y la habilitación pasan a ser un proceso administrado internamente;
- el sistema debe soportar credenciales temporales, activación y primer acceso controlado;
- la asignación de roles debe ocurrir antes de que el usuario empiece a operar.

### 2.2 Separación entre validación pública y portal autenticado de estudiantes

El comportamiento objetivo cambia así:

- públicamente solo se podrá **validar** que un certificado existe y es válido;
- para ver el documento completo, descargarlo, consultar historial o solicitar acciones, el estudiante deberá iniciar sesión;
- el portal del estudiante será un espacio autenticado y separado del flujo interno administrativo.

Implicaciones:

- la verificación pública debe mostrar datos mínimos y controlados;
- la descarga pública del certificado deja de ser el comportamiento objetivo;
- debe existir una identidad autenticada del estudiante vinculada a sus certificados;
- la lógica de disponibilidad del documento debe depender del estado real del certificado y de las restricciones administrativas aplicables.

### 2.3 Política de acceso y recuperación para participantes

El acceso del participante queda definido con estas reglas:

1. El participante será registrado por administración usando el correo que quedará asociado a su ficha en el sistema.
2. Ese correo será el identificador base para el acceso al portal del estudiante.
3. El acceso inicial debe manejarse con activación controlada y cambio obligatorio de contraseña en el primer ingreso.
4. El flujo de recuperación de acceso no se tratará como autoservicio normal si el usuario no tiene acceso a su correo.
5. En ese caso, el flujo será excepcional: el participante solicitará ayuda al administrador.
6. El administrador no debe definir una contraseña permanente para el participante.
7. El administrador podrá reiniciar el acceso a una contraseña temporal generada por el sistema después de verificar identidad.
8. Ese reinicio deberá:
   - revocar sesiones activas previas;
   - marcar la cuenta con `mustChangePassword`;
   - devolver al participante al flujo de primer acceso;
   - obligarlo a cambiar la contraseña antes de usar el portal.

Implicaciones:

- no se debe modelar como comportamiento principal que el administrador asigne manualmente contraseñas permanentes;
- la recuperación excepcional debe basarse en una contraseña temporal de corta duración y un cambio obligatorio al entrar;
- el flujo administrativo de soporte requiere trazabilidad y verificación mínima de identidad;
- el modelo de datos del participante deberá contemplar estado de activación, último envío, último acceso y relación con la cuenta autenticada.

---

## 3. Principios de implementación

- **Seguridad primero.** Ninguna fase funcional debe montarse sobre autenticación o autorización débil.
- **Autorización server-side.** El backend debe derivar usuario y rol desde sesión real, no desde datos enviados por el cliente.
- **Una sola fuente de verdad.** Estados, disponibilidad, historial y permisos deben estar sincronizados y no repartidos en lógicas paralelas.
- **Separación de dominios.** Debe distinguirse claramente el backoffice administrativo del portal del estudiante y de la validación pública.
- **Migración incremental.** Los cambios deben ejecutarse por capas para no romper lo que ya existe ni perder trazabilidad.
- **Reprueba obligatoria.** Cada fase debe cerrar con pruebas dirigidas sobre los casos impactados por QA.

### 3.1 Estrategia transversal de correo transaccional

El correo debe tratarse como un servicio transversal del sistema y no como una lógica aislada dentro de pantallas o acciones sueltas.

### Estado actual

Hoy el sistema ya tiene una implementación básica con `nodemailer` y Gmail para algunos correos, pero esa solución debe considerarse transitoria para el plan maestro porque:

- depende de credenciales manuales;
- no está organizada como servicio transversal del dominio;
- no cubre todos los flujos que el nuevo modelo va a exigir;
- no es la mejor base para auditoría, plantillas, webhooks y entregabilidad.

### Recomendación principal para el proyecto

Para la etapa de pasantía y primeras fases del sistema, la recomendación principal es adoptar un proveedor de correo transaccional orientado a desarrollo. La opción inicial más conveniente es:

- **Resend** como primera opción de implementación.

Razones:

- encaja bien con proyectos basados en Next.js;
- tiene enfoque claro de correo transaccional para aplicaciones;
- ofrece API, SMTP, dominios y webhooks en una superficie más simple;
- permite arrancar rápido sin montar infraestructura propia de correo.

### Alternativa si se prioriza más volumen gratis diario

Si el criterio dominante fuera maximizar el volumen del plan gratuito desde el inicio, la alternativa principal sería:

- **Brevo** como segunda opción.

Razones:

- el plan gratuito es más amplio en volumen diario;
- incluye correos transaccionales;
- puede ser útil si el proyecto necesita más margen de envíos sin presupuesto inmediato.

Tradeoff:

- su producto es más amplio y menos enfocado exclusivamente en correo transaccional de aplicación;
- para una primera implementación técnica suele ser menos directo que una herramienta más centrada en developers.

### Criterio recomendado de decisión

La decisión operativa para SIGCE debe ser:

- usar **Resend** si el volumen esperado de correos transaccionales del MVP expandido cabe dentro de su plan gratuito inicial;
- usar **Brevo** si se confirma que el volumen diario esperado del proyecto excede ese umbral desde fases tempranas;
- no depender de Gmail como solución definitiva de producción.

### Regla de seguridad para correos de acceso

Aunque el negocio requiere enviar “credenciales temporales”, el plan debe tratar ese punto con criterio de seguridad:

- no enviar contraseñas permanentes en texto plano por correo;
- preferir enlace de activación o restablecimiento de contraseña;
- si se usa una clave temporal, debe ser de un solo uso, expirar en corto plazo y forzar cambio inmediato en el primer acceso.

### Diseño técnico transversal del servicio de correo

El sistema deberá incorporar una capa de correo con estas piezas:

- un `EmailProvider` desacoplado del proveedor concreto;
- plantillas transaccionales versionadas por tipo de evento;
- registro de envíos, errores y reintentos;
- soporte para webhooks de entrega, rebote y rechazo;
- configuración por ambiente para desarrollo, prueba y producción;
- dominio remitente institucional verificado con SPF, DKIM y DMARC.

---

## 4. Resumen ejecutivo del orden de fases

### Fase 0 — Seguridad y autenticación base

Cerrar la base de acceso del sistema antes de tocar flujos funcionales mayores.

### Fase 1 — Gestión interna de usuarios y RBAC real

Reorganizar el acceso administrativo y operativo con provisión interna, activación y roles consistentes.

### Fase 2 — Identidad del estudiante y separación público/privado

Definir el portal autenticado de estudiantes y reducir la exposición pública al mínimo necesario de validación.

Nota:

- la automatización completa del alta administrada, activación inicial y recuperación excepcional del participante queda como extensión natural posterior a la base de Fase 2.

### Fase 3 — Ciclo de vida del certificado, auditoría y firma

Estabilizar estados, transiciones y firma digital sobre una lógica única y auditable.

### Fase 4 — Restricciones administrativas y control de disponibilidad

Aplicar bloqueos por reglas administrativas y hacer que afecten realmente visualización, descarga y emisión.

### Fase 5 — Documento final, UX operativa, reportes y cierre QA

Unificar la generación documental, corregir fricciones de uso y cerrar los hallazgos funcionales pendientes.

---

## 5. Mapeo de hallazgos a fases

### Hallazgos de seguridad y arquitectura

- Sesión temporal no verificable -> **Fase 0**
- APIs administrativas sin auth/RBAC explícito -> **Fase 0 / Fase 1**
- Roles inconsistentes por email vs uid -> **Fase 1**
- Exposición pública excesiva en verificación -> **Fase 2**
- Máquina de estados desacoplada del certificado base -> **Fase 3**
- Restricciones administrativas sin efecto real sobre descarga/disponibilidad -> **Fase 4**
- Generación documental inconsistente entre preview y PDF final -> **Fase 5**

### Hallazgos de QA

- `ERR-001 / PF-004` exposición incorrecta de módulos según rol -> **Fase 1**
- `ERR-002 / PF-008` registro de participante sin cédula -> **Fase 2**
- `ERR-003 / PF-012` paso inestable de borrador a verificación -> **Fase 3**
- `PF-013` firma válida bloqueada por dependencias -> **Fase 3 / Fase 4**
- `PF-015` restricción administrativa de descarga no confiable -> **Fase 4**
- `PF-014` diferencia entre vista previa y documento descargado -> **Fase 5**

---

## 6. Fase 0 — Seguridad y autenticación base

### Objetivo

Establecer una base de autenticación y autorización confiable para que el resto del sistema no siga creciendo sobre supuestos inseguros.

### Alcance

- reemplazar cualquier sesión temporal o simulada por sesión verificable real;
- hacer que las APIs administrativas validen sesión y rol en servidor;
- eliminar o restringir endpoints de depuración y logs sensibles;
- revisar reglas de acceso a colecciones críticas para alinearlas con la arquitectura actual.

### Cambios funcionales esperados

- solo usuarios autenticados con sesión válida podrán operar en módulos internos;
- los permisos ya no dependerán de datos enviados desde el frontend;
- las rutas administrativas deberán rechazar accesos sin contexto de usuario válido.

### Flujos de correo a incorporar en esta fase

- selección formal del proveedor de correo transaccional;
- configuración de dominio remitente y autenticaciones técnicas;
- creación de la abstracción `EmailProvider` y primer pipeline de envío;
- plantilla y envío de correo de prueba técnica;
- registro base de eventos de entrega, error y rebote.

### Dependencias de salida

- sesión real operativa para personal interno;
- contexto autenticado reusable para Fase 1 y posteriores;
- criterio claro de validación server-side por usuario y rol.

### Riesgos a controlar

- romper accesos actuales si el sistema depende de lógica legacy;
- inconsistencias entre reglas del repositorio y reglas realmente desplegadas;
- cuentas ya existentes sin un identificador único consistente.

### Criterios de cierre

- no existe sesión placeholder o simulada en producción;
- ningún endpoint administrativo crítico opera solo con datos confiados al cliente;
- existe una base segura para gestionar usuarios internos y estudiantes autenticados.

---

## 7. Fase 1 — Gestión interna de usuarios y RBAC real

### Objetivo

Implementar el nuevo flujo de acceso interno administrado y corregir de raíz la matriz de roles y permisos.

### Alcance

- redefinir el flujo de creación y activación de usuarios internos;
- registrar usuarios desde administración, no desde autoservicio público;
- enviar credenciales temporales cuando la cuenta sea activada;
- exigir actualización de credenciales en primer acceso;
- consolidar RBAC usando un identificador único de usuario;
- hacer coincidir menús, acciones, APIs y reglas con la misma matriz de permisos.

### Flujo objetivo

1. Administrador crea o habilita usuario interno.
2. Administrador asigna rol y estado.
3. Sistema emite credenciales temporales.
4. Usuario inicia sesión por primera vez.
5. Usuario actualiza credenciales y queda habilitado para operar según su rol.

### Roles mínimos a estabilizar

- administrador;
- coordinador;
- verificador;
- firmante.

### Cambios funcionales esperados

- desaparecerá la ambigüedad entre “usuario permitido” y “usuario administrador”;
- un firmante no verá módulos de administrador;
- la visibilidad del menú y la capacidad de ejecutar acciones sensibles quedarán alineadas;
- el flujo público de solicitud de acceso dejará de ser el flujo principal de aprovisionamiento.

### Flujos de correo a incorporar en esta fase

- notificación de activación de cuenta interna;
- envío de credenciales temporales seguras o enlace de activación;
- confirmación de primer acceso completado;
- correo de restablecimiento de contraseña para usuarios internos;
- notificación opcional de cambio de rol, desactivación o reactivación de cuenta.

### Dependencias de salida

- RBAC real y coherente para usar estados, firmas y bloqueos;
- base de usuarios internos lista para operar sin parches manuales.

### Riesgos a controlar

- migración de roles guardados con `email` hacia un identificador único estable;
- usuarios legacy que hoy dependen de reglas informales o listas antiguas;
- necesidad de compatibilidad temporal durante transición.

### Criterios de cierre

- `ERR-001 / PF-004` debe quedar resuelto;
- la asignación de roles funciona con un único criterio de identidad;
- el alta interna con activación y credenciales temporales queda definida y probada.

---

## 8. Fase 2 — Identidad del estudiante y separación público/privado

### Objetivo

Separar correctamente el espacio público de validación del espacio autenticado del estudiante, y reforzar la calidad de los datos del participante.

### Alcance

- diseñar el acceso autenticado del estudiante;
- definir cómo se crea o habilita la cuenta del estudiante;
- limitar la validación pública a datos mínimos de verificación;
- mover visualización completa, descarga e historial al portal autenticado;
- corregir validaciones obligatorias del participante, especialmente identidad y cédula si aplica por negocio;
- revisar la relación entre matrícula, cédula, correo y cuenta autenticada.

### Flujo objetivo del estudiante

1. El estudiante accede con credenciales propias.
2. Visualiza sus certificados y su estado.
3. Descarga únicamente los certificados disponibles para él.
4. Solicita acciones futuras desde su portal autenticado si el negocio lo requiere.

### Flujo objetivo de validación pública

1. Un tercero introduce un identificador de validación.
2. El sistema confirma si el certificado es válido o no.
3. Se muestran solo datos mínimos de comprobación.
4. No se entrega el documento completo ni historial sin autenticación.

### Cambios funcionales esperados

- desaparece el comportamiento mixto donde la ruta pública sirve también como visor o descargador;
- el login de estudiante deja de ser un simple redireccionamiento a la verificación pública;
- los certificados del estudiante quedan protegidos por autenticación y por su relación real con el usuario.

### Flujos de correo a incorporar en esta fase

- activación o invitación inicial del estudiante al portal autenticado;
- correo de recuperación de acceso del estudiante;
- notificación de cuenta vinculada correctamente a sus certificados;
- correo de “certificado disponible en tu portal” con enlace al login o al panel autenticado, no al documento público.

### Dependencias de salida

- modelo claro de identidad del estudiante;
- reglas de acceso separadas entre público y autenticado;
- base de datos de participantes consistente para fases de estado y restricciones.

### Riesgos a controlar

- registros actuales sin cédula o con datos incompletos;
- falta de vínculo formal entre certificado, estudiante y cuenta de acceso;
- rediseño parcial de las pantallas públicas actuales.

### Criterios de cierre

- `ERR-002 / PF-008` debe quedar resuelto;
- la descarga de certificados ya no depende de exposición pública;
- existe definición clara del portal autenticado del estudiante.

---

## 9. Fase 3 — Ciclo de vida del certificado, auditoría y firma

### Objetivo

Corregir la lógica de estados para que el ciclo completo del certificado sea estable, auditable y compatible con firma digital controlada.

### Alcance

- definir una sola fuente de verdad para el estado operativo del certificado;
- estabilizar las transiciones entre borrador, verificación, firma, emisión y disponibilidad;
- registrar auditoría completa por acción y transición;
- eliminar valores hardcodeados de usuario y rol en los módulos de estado y firma;
- integrar firma digital sobre el flujo real, no sobre datos simulados.

### Estados mínimos esperados

- borrador;
- espera de verificación;
- verificado;
- espera de firma;
- firmado;
- emitido;
- disponible;
- rechazado;
- bloqueado por pago;
- bloqueado por documentación;
- bloqueado administrativo.

### Cambios funcionales esperados

- las transiciones dejarán de estar “a medio camino” entre un estado base y otro paralelo;
- la firma digital dependerá del estado correcto y del rol correcto;
- el historial de cambios será usable para trazabilidad y auditoría.

### Flujos de correo a incorporar en esta fase

- notificación interna de certificado enviado a verificación;
- notificación de rechazo o devolución con motivo;
- notificación al firmante cuando exista una solicitud de firma pendiente;
- notificación de firma aprobada o rechazada;
- plantillas internas para eventos críticos de transición de estado.

### Dependencias de salida

- base estable para restricciones administrativas;
- reactivación confiable de pruebas PF-012 y PF-013.

### Riesgos a controlar

- migración de certificados existentes a la nueva lógica de estado efectivo;
- reglas de transición mal definidas entre roles;
- dependencia de pantallas actuales que aún están incompletas.

### Criterios de cierre

- `ERR-003 / PF-012` debe quedar resuelto;
- las acciones de firma ya no dependen de IDs ni roles simulados;
- el historial de transición queda disponible y consistente.

---

## 10. Fase 4 — Restricciones administrativas y control de disponibilidad

### Objetivo

Hacer que las restricciones administrativas afecten de forma real y consistente la posibilidad de visualizar, descargar o emitir certificados.

### Alcance

- aplicar bloqueos por pago, documentación y administración;
- definir claramente qué puede ver el estudiante cuando existe un bloqueo;
- impedir descarga o disponibilidad pública cuando la regla de negocio lo prohíbe;
- alinear validación pública, portal del estudiante y backoffice con la misma lógica de disponibilidad.

### Cambios funcionales esperados

- el certificado podrá existir, pero no estar disponible para descarga;
- el estudiante verá su estado, pero no podrá ejecutar acciones bloqueadas;
- la validación pública podrá confirmar existencia o estado sin violar restricciones.

### Flujos de correo a incorporar en esta fase

- notificación al estudiante cuando el certificado quede bloqueado por pago;
- notificación al estudiante cuando el certificado quede bloqueado por documentación;
- notificación por bloqueo administrativo cuando aplique;
- aviso de desbloqueo y habilitación posterior;
- mensajes internos para seguimiento operativo de bloqueos críticos.

### Dependencias de salida

- motor de estados estable desde Fase 3;
- reglas de negocio claras para restricción y liberación.

### Riesgos a controlar

- contradicciones entre “válido”, “emitido” y “disponible”;
- accesos alternos que permitan descargar fuera del flujo previsto;
- inconsistencia entre documento visible y permisos de descarga.

### Criterios de cierre

- `PF-015` debe quedar resuelto;
- la disponibilidad del documento depende del estado y no de atajos en frontend;
- visualización y descarga se comportan igual en todos los puntos del sistema.

---

## 11. Fase 5 — Documento final, UX operativa, reportes y cierre QA

### Objetivo

Cerrar las diferencias entre vista previa, PDF final y experiencia operativa, además de preparar el sistema para validación final de la pasantía.

### Alcance

- unificar el pipeline de generación documental;
- alinear preview, documento descargado y formato institucional esperado;
- corregir fricciones de uso detectadas en flujos internos;
- mejorar mensajes, feedback de acciones y claridad de estados;
- revisar listados, reportes y exportaciones para que sean confiables;
- ejecutar ronda final de QA sobre los casos dependientes ya desbloqueados.

### Cambios funcionales esperados

- un mismo certificado tendrá una representación consistente entre preview y descarga;
- el usuario interno entenderá mejor qué ocurrió, qué falta y por qué una acción está bloqueada;
- reportes y listados dejarán de inducir errores por cargas parciales o filtros incompletos.

### Flujos de correo a incorporar en esta fase

- notificación final de certificado emitido y disponible en portal;
- refinamiento de plantillas visuales y tono institucional de todos los correos;
- posible digest operativo o resumen administrativo si el negocio lo necesita;
- validación QA de enlaces, contenido, remitentes, branding y entregabilidad.

### Dependencias de salida

- estados y restricciones ya estabilizados;
- portal del estudiante y validación pública ya separados.

### Riesgos a controlar

- coexistencia de múltiples generadores de PDF o múltiples criterios de render;
- deuda UX acumulada por cambios previos;
- necesidad de revalidación institucional del formato final.

### Criterios de cierre

- `PF-014` debe quedar resuelto;
- preview y PDF final son equivalentes en contenido y formato esperado;
- el sistema queda listo para una validación funcional integral.

---

## 12. Orden recomendado de ejecución

El orden recomendado es el siguiente:

1. **Fase 0** porque sin autenticación y autorización confiables cualquier mejora funcional queda comprometida.
2. **Fase 1** porque el nuevo flujo interno y el RBAC son la base operativa del backoffice.
3. **Fase 2** porque la separación entre validación pública y portal del estudiante cambia el modelo de acceso de forma estructural.
4. **Fase 3** porque estados y firma deben construirse sobre identidades y permisos ya estabilizados.
5. **Fase 4** porque las restricciones solo pueden ser efectivas cuando el estado operativo ya es confiable.
6. **Fase 5** porque el cierre documental y UX depende de las reglas reales ya implantadas.

---

## 13. Entregables documentales esperados por fase

Cuando se comience cada fase, deberá generarse un documento específico con al menos estas secciones:

- objetivo de la fase;
- alcance incluido y alcance excluido;
- módulos, rutas y datos impactados;
- cambios de modelo y migraciones necesarias;
- cambios de backend;
- cambios de frontend;
- flujos de correo afectados e impacto sobre plantillas;
- reglas de autorización;
- estrategia de pruebas;
- riesgos y plan de rollback;
- checklist de cierre.

Esto permitirá que la implementación se vaya ejecutando y documentando sin perder trazabilidad académica ni técnica.

---

## 14. Próximo paso recomendado

El siguiente paso debe ser elaborar el **plan detallado de la Fase 0**, porque es la fase que condiciona la seguridad y viabilidad del resto del plan.

Ese documento de Fase 0 debería concretar:

- arquitectura de sesión y autenticación real;
- política de autorización por roles en servidor;
- decisión final del proveedor de correo y estrategia de plantillas;
- lineamientos de endurecimiento de reglas;
- impacto sobre endpoints internos y flujos actuales;
- estrategia de validación antes de pasar a Fase 1.

---

## 15. Conclusión

El proyecto ya no debe evolucionar solo como un conjunto de módulos aislados. A partir de este punto, SIGCE debe avanzar como una plataforma con tres fronteras claramente separadas:

- backoffice interno;
- portal autenticado del estudiante;
- validación pública mínima.

La organización por fases de este documento busca que la implementación sea controlada, defendible para la pasantía y alineada con los hallazgos reales del sistema y de QA.
