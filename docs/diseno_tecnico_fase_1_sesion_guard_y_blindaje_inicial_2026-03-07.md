# Diseno Tecnico Fase 1 - Sesion, Guard Reutilizable y Blindaje Inicial

**Fecha:** 2026-03-07  
**Estado:** Aprobado para implementacion  
**Relacionado con:**

- `docs/plan_remediacion_seguridad_y_control_operativo_2026-03-07.md`
- `docs/avances/2026-03-07_inicio_fase_1_remediacion_autenticacion_y_blindaje_api.md`

---

## 1. Objetivo de este documento

Este documento baja la fase 1 a decisiones tecnicas concretas para poder implementarla sin improvisacion.

Aqui se define:

- el contrato de la sesion de aplicacion
- la identidad canonica inicial
- el flujo exacto de login y logout
- el comportamiento del middleware
- el guard reutilizable para APIs
- el primer lote de rutas a blindar
- los criterios de compatibilidad para no romper el sistema actual

---

## 2. Decisiones aprobadas

### 2.1 Identidad canonica inicial

La identidad canonica del sistema sera:

- `uid` como identificador primario

Campos secundarios:

- `email`
- `displayName` opcional para trazabilidad ligera

### Motivo

- `uid` no cambia si el correo cambia
- `uid` representa la identidad real emitida por Firebase Auth
- reduce ambiguedad frente al modelo actual mezclado por email

### Regla de transicion

Durante la remediacion:

- lectura de permisos: `uid` primero, `email` como compatibilidad temporal
- escritura nueva: guardar `uid` y `email` si el modelo actual lo necesita
- objetivo final: dejar `uid` como clave principal de autorizacion

---

## 3. Contrato de sesion de aplicacion

### 3.1 Nombre de cookie

Se usara:

- `sigce_session`

Se evita reutilizar `session` para cortar claramente con la implementacion temporal actual.

### 3.2 Tipo de cookie

- `httpOnly`
- `secure` en produccion
- `sameSite=lax`
- `path=/`

### 3.3 Duracion

Duracion recomendada:

- 12 horas

Renovacion:

- no automatica en fase 1
- renovacion manual al hacer login nuevamente

Esto simplifica el cierre inicial y evita introducir refresco silencioso prematuro.

### 3.4 Payload minimo

La cookie debe representar una sesion propia de aplicacion, no un espejo completo del token Firebase.

Campos permitidos:

- `sub`: `uid`
- `email`
- `iat`
- `exp`
- `sessionVersion`

Campos evitados:

- roles
- scopes institucionales
- claims largos
- datos de UI

### 3.5 Formato

Se recomienda JWT firmado por la aplicacion.

Motivo:

- simple de validar en middleware y APIs
- portable
- no requiere lookup de sesion en base de datos para fase 1

### 3.6 Firma

Algoritmo recomendado:

- `HS256`

Secreto:

- `APP_SESSION_SECRET`

Requisito:

- longitud minima fuerte
- diferente por entorno
- nunca derivado de claves Firebase

---

## 4. Verificacion del Firebase ID token

### 4.1 Punto de entrada

El cliente continuara obteniendo `idToken` desde Firebase Auth y lo enviara al endpoint de login de sesion.

### 4.2 Validacion que debe hacer el backend

El backend debe verificar:

- firma valida del token
- `iss` correcto de Firebase
- `aud` igual al project id del proyecto
- `sub` presente
- `exp` vigente
- `auth_time` razonable cuando aplique
- `email` disponible si el sistema lo necesita para compatibilidad

### 4.3 Resultado esperado

Si el token es valido:

- se emite `sigce_session`

Si no es valido:

- se responde `401`
- no se setea cookie

### 4.4 Libreria recomendada para implementacion

Se recomienda una libreria compatible con runtime moderno y middleware de Next.

La recomendacion operativa es usar:

- `jose`

Motivo:

- funciona bien con JWT
- se adapta mejor al runtime del middleware que opciones orientadas solo a Node clasico

---

## 5. Flujo exacto de autenticacion

## 5.1 Login

1. El usuario inicia sesion con Firebase Auth desde cliente
2. El cliente obtiene `idToken`
3. El cliente llama `POST /api/auth/session/login`
4. El backend verifica el `idToken`
5. El backend emite `sigce_session`
6. El frontend navega a `/dashboard`

## 5.2 Verificacion de sesion

No se recomienda que el middleware dependa de un fetch a otro endpoint para validar sesion.

El middleware debe:

- leer la cookie
- validar firma y expiracion localmente
- decidir acceso

Esto reduce latencia, elimina dependencias internas innecesarias y evita repetir el defecto actual.

## 5.3 Logout

`POST /api/auth/session/logout` debe:

- invalidar la cookie
- devolver respuesta exitosa uniforme

En fase 1 no se implementara blacklist de sesiones.

---

## 6. Middleware objetivo

### 6.1 Responsabilidad

El middleware solo debe responder dos preguntas:

1. Hay sesion valida
2. La ruta requiere estar autenticado

### 6.2 No debe hacer

- consultas a Firestore
- resolucion de roles
- llamadas internas por fetch
- decisiones de negocio

### 6.3 Rutas protegidas en fase 1

- `/dashboard/:path*`
- `/admin/:path*`

### 6.4 Comportamiento esperado

- sin cookie valida: redirigir a `/login`
- con cookie valida y acceso a `/login`: redirigir a `/dashboard`
- con cookie valida en zona protegida: permitir continuar

---

## 7. Guard reutilizable para APIs

### 7.1 Objetivo

Evitar que cada ruta reimplemente auth de forma manual e inconsistente.

### 7.2 Responsabilidades del guard

El guard comun debe:

- leer `sigce_session`
- validar firma y expiracion
- devolver identidad base normalizada
- responder `401` si no hay sesion valida

Salida minima esperada:

- `uid`
- `email`
- `sessionVersion`

### 7.3 Segunda capa opcional

Sobre el guard base se debe montar despues una capa de autorizacion:

- `requireRole(...)`
- `requireAdmin(...)`
- `requireScope(...)`

Esa capa no es el centro de fase 1, pero el diseno debe dejarla preparada.

---

## 8. Primer lote exacto de rutas a blindar

El primer lote aprobado para implementacion es este:

1. `app/api/admin/users/**`
2. `app/api/admin/roles/**`
3. `app/api/admin/certificate-states/**`
4. `app/api/admin/digital-signatures/**`
5. `app/api/admin/students/search/route.ts`
6. `app/api/admin/certificate-templates/**`
7. `app/api/admin/campuses/**`
8. `app/api/admin/academic-areas/**`
9. `app/api/admin/academic-programs/**`
10. `app/api/admin/certificate-types/**`
11. `app/api/admin/signers/**`

### Criterio

Se priorizan rutas con al menos una de estas condiciones:

- exponen datos sensibles
- modifican catalogos maestros
- cambian estados del ciclo de vida
- afectan permisos o firmas

---

## 9. Criterios de compatibilidad para no romper el sistema

### 9.1 No cambiar contratos de respuesta si no es necesario

Se deben conservar:

- formas de JSON actuales
- codigos esperados por el frontend cuando ya existan consumidores

### 9.2 No cambiar rutas publicas del login

El frontend puede seguir llamando a la misma ruta de sesion mientras por dentro cambia la validacion real.

### 9.3 No introducir RBAC completo en la misma entrega

En fase 1:

- primero autenticar
- luego blindar acceso base

La autorizacion fina completa se deja a fase 2.

### 9.4 Soporte temporal a datos legacy

Si una ruta aun depende de email en vez de `uid`, no se rompe en fase 1. Se documenta como deuda controlada para fase 2.

---

## 10. Riesgos residuales aceptados al cerrar fase 1

Si fase 1 sale bien, aun quedaran pendientes:

- mezcla parcial `uid` y `email`
- autorizacion fina incompleta en algunas acciones
- modelo publico de certificados todavia amplio
- UploadThing sin cerrar del todo

Esto es aceptable si:

- ya no existe bypass trivial de sesion
- las APIs criticas ya no son publicas

---

## 11. Definition of Done ejecutable

La fase 1 se da por lista si se cumple:

1. `temp-session` desaparece completamente
2. existe `sigce_session`
3. middleware valida localmente la cookie
4. existe guard comun para rutas
5. el lote inicial ya exige sesion valida
6. login y logout siguen funcionando para usuarios reales
7. dashboard sigue entrando con el flujo actual de Firebase Auth

---

## 12. Implementacion posterior recomendada

La ejecucion tecnica debe hacerse en este orden:

1. utilidades de firma y verificacion de sesion
2. `POST /api/auth/session/login`
3. `POST /api/auth/session/logout`
4. middleware
5. guard comun reusable
6. blindaje del lote inicial de APIs
7. smoke test del dashboard y login

---

## 13. Nota final

Este documento fija la base de implementacion. Si durante la ejecucion aparece un obstaculo tecnico, se debe corregir el documento antes de abrir una segunda linea de cambios improvisados.

**Fin del documento.**
