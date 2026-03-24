# Avance: Inicio de Fase 1 de Remediacion - Autenticacion Real y Blindaje Inicial de APIs

**Fecha:** 2026-03-07  
**Estado:** Planificado y aprobado para implementacion  
**Tipo:** Documento de arranque de fase  
**Referencia principal:** `docs/plan_remediacion_seguridad_y_control_operativo_2026-03-07.md`
**Diseno tecnico asociado:** `docs/diseno_tecnico_fase_1_sesion_guard_y_blindaje_inicial_2026-03-07.md`

---

## Resumen ejecutivo

Se define el inicio formal de la fase 1 de remediacion del sistema. Esta fase no introduce cambios funcionales todavia; fija el orden de trabajo para corregir la autenticacion y comenzar a blindar las rutas administrativas mas sensibles sin romper la operacion actual.

La motivacion principal es que hoy la sesion de aplicacion no representa una identidad validada de forma confiable y varias rutas administrativas no tienen una barrera real de entrada del lado del servidor.

---

## Objetivo de la fase

Cerrar el primer anillo de seguridad del sistema mediante:

- reemplazo de la sesion temporal
- introduccion de una sesion propia de aplicacion
- validacion real desde middleware
- proteccion inicial de rutas `admin` de mayor impacto

---

## Decisiones ya tomadas para esta fase

### 1. No usar Firebase Admin

La verificacion del `idToken` se resolvera sin Firebase Admin para evitar dependencia de service account y mantener el modelo operativo definido para este proyecto.

### 2. Mantener Firebase Auth en cliente

No se va a reescribir el inicio de sesion del frontend. El cambio se concentra en el intercambio entre cliente y backend.

### 3. Mantener UploadThing como solucion principal de archivos

La fase 1 no toca aun la migracion de medios, salvo lo necesario para que la estrategia global quede consistente.

### 4. No mezclar esta fase con redisenos o mejoras visuales

El foco es seguridad operativa y control de acceso.

---

## Problemas concretos que esta fase ataca

1. Sesion temporal basada en cookie fija
2. Middleware que confia en esa sesion temporal
3. Rutas administrativas expuestas sin validacion server-side suficiente
4. Ausencia de un guard reutilizable para autenticar APIs

---

## Alcance exacto

### Incluye

- contrato nuevo de sesion de aplicacion
- endpoint de login de sesion
- endpoint de verificacion o mecanismo equivalente
- middleware del dashboard/admin
- helper o guard reutilizable para APIs
- primer lote de rutas administrativas de alto riesgo

### No incluye

- refactor completo del sistema de roles
- migracion de identidad `email` a `uid`
- cierre completo del modelo publico de certificados
- migracion de perfil de usuario fuera de Firebase Storage
- endurecimiento de `request-access` y `register-admin`

---

## Primer lote recomendado de rutas a blindar

La fase debe comenzar por las rutas con mayor capacidad de dano operativo o exposicion:

1. gestion de usuarios y accesos
2. roles
3. estados y transiciones de certificados
4. firmas digitales
5. busqueda de estudiantes
6. plantillas
7. catalogos maestros con escritura administrativa

La idea es no intentar cubrir las 100 por ciento de las rutas en el primer movimiento, sino cerrar primero las de mayor impacto.

---

## Enfoque de implementacion recomendado

### Paso 1 - Definir la sesion propia

La aplicacion debe emitir una cookie `httpOnly` propia, con expiracion, firma y payload minimo.

El payload debe incluir solo lo necesario para resolver identidad base y trazabilidad:

- `uid`
- `email`
- `issuedAt`
- `expiresAt`

### Paso 2 - Verificar `idToken` en backend

El endpoint de login debe dejar de aceptar cualquier token ciegamente.

### Paso 3 - Hacer que middleware dependa de la cookie propia

El middleware no debe depender de una cookie fija ni de un bypass temporal.

### Paso 4 - Crear guard reutilizable para APIs

Toda ruta administrativa nueva o migrada debe apoyarse en un helper comun y no reimplementar auth a mano.

### Paso 5 - Blindar primer lote de rutas

Aplicar el guard a las rutas mas sensibles y validar que sigan respondiendo con los contratos esperados por la UI.

---

## Riesgos de esta fase

### Riesgo 1 - Rebotar usuarios logueados

Si el intercambio `idToken -> cookie propia` no queda bien alineado con el cliente, el dashboard puede redirigir usuarios validos al login.

### Riesgo 2 - Ruptura silenciosa de llamadas desde frontend

Si se protege una API sin revisar su consumidor, la UI puede empezar a fallar con 401 o 403 sin manejo apropiado.

### Riesgo 3 - Sesion valida pero permisos ambiguos

Aunque la autenticacion quede cerrada, todavia puede haber huecos de autorizacion hasta que se complete la fase 2.

---

## Mitigaciones definidas

1. Mantener contratos de respuesta sin cambios innecesarios
2. Proteger rutas por lotes y no todas al mismo tiempo
3. Verificar cada ruta migrada con su consumidor principal
4. Dejar documentado el riesgo residual al cierre de la fase

---

## Definition of Done de la fase 1

La fase 1 se considerara cerrada cuando:

- la sesion temporal deje de existir
- el middleware valide una sesion real de aplicacion
- exista un helper comun para autenticar rutas
- el primer lote de APIs criticas ya no sea accesible sin sesion valida
- el dashboard siga siendo usable con el flujo de login vigente

---

## Checklist previo a implementacion

- [x] Restriccion de arquitectura confirmada: sin Firebase Admin
- [x] Restriccion de archivos confirmada: UploadThing como principal
- [x] Orden de remediacion definido
- [x] Contrato de cookie de sesion aprobado
- [x] Primer lote exacto de rutas aprobado
- [x] Estrategia de compatibilidad UI validada

---

## Resultado de esta sesion

En esta sesion se deja lista la fase 1 a nivel de plan y decision tecnica. No se hicieron cambios de codigo funcional. El objetivo fue asegurar que la ejecucion comience con contexto persistente, un orden correcto y sin improvisacion.

Adicionalmente, ya quedaron cerradas y documentadas estas decisiones:

- identidad canonica inicial basada en `uid`
- cookie propia `sigce_session`
- validacion local de sesion en middleware
- guard reutilizable para APIs
- primer lote exacto de rutas administrativas a blindar

---

## Siguiente paso recomendado

Iniciar la implementacion de la fase 1 con este orden:

1. contrato de sesion
2. login real de sesion
3. middleware
4. helper comun de autenticacion
5. blindaje del primer lote de APIs

**Fin del avance.**
