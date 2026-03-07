# Plan Maestro de Remediacion de Seguridad y Control Operativo

**Fecha:** 2026-03-07  
**Estado:** En preparacion operativa  
**Alcance:** Seguridad, autenticacion, autorizacion, exposicion de datos, uploads y consistencia operativa  
**Restricciones confirmadas:**

- No usar Firebase Admin
- Mantener Firebase Auth en cliente
- Mantener Firestore como base principal
- Usar UploadThing como solucion principal de archivos
- Migrar de forma incremental sin romper las pantallas ni los flujos actuales

---

## 1. Proposito de este plan

Este documento define la estrategia de remediacion para corregir las irregularidades detectadas en la revision del sistema sin entrar en una reescritura total.

El objetivo no es "arreglar todo junto", sino restaurar la frontera de confianza del sistema por capas:

1. Autenticacion real
2. Proteccion real de APIs
3. RBAC coherente
4. Exposicion publica minima
5. Control correcto de uploads y archivos
6. Endurecimiento de flujos publicos

La prioridad es cerrar primero los puntos que hoy permiten acceso indebido o exposicion de datos.

---

## 2. Decision de arquitectura base

### 2.1 Decision principal

La remediacion se hara sin Firebase Admin.

En lugar de depender de `createSessionCookie()` o `verifySessionCookie()`, se seguira este modelo:

- El usuario inicia sesion con Firebase Auth en cliente
- El cliente obtiene un `idToken`
- El backend verifica ese `idToken` con una libreria JWT estandar y las claves publicas de Google
- El backend emite una cookie propia de aplicacion, `httpOnly`, firmada por el sistema
- El middleware y las APIs validan esa cookie propia

### 2.2 Ventajas de esta decision

- Evita service accounts y secretos operativos adicionales
- Reduce acoplamiento con Firebase Admin
- Mantiene el login actual de Firebase Auth
- Permite proteger middleware y APIs de forma real
- Hace posible una migracion gradual

### 2.3 Limites de esta decision

- Los custom claims de Firebase quedan fuera del centro del diseno
- El RBAC debe resolverse principalmente desde Firestore y sesion propia
- La autorizacion debe quedar explicita en backend y no delegada al cliente

---

## 3. Hallazgos que gobiernan el orden de trabajo

La priorizacion nace de estos hechos:

1. La sesion actual es temporal y no valida identidades reales
2. Muchas rutas `app/api/admin/**` no aplican validacion de sesion ni rol
3. El sistema descarga datos y luego filtra en cliente
4. Hay inconsistencias entre `uid` y `email` como identidad de permisos
5. Los certificados exponen mas informacion de la necesaria para verificacion publica
6. UploadThing aun no esta protegido por middleware por ruta
7. Todavia existe uso puntual de Firebase Storage en perfil de usuario

Por eso la remediacion debe comenzar por autenticacion y autorizacion, no por UI ni por refactors amplios.

---

## 4. Principios de implementacion

### P1. Seguridad primero

Ningun flujo administrativo debe depender de proteccion visual en React.

### P2. Migracion por compatibilidad

Se evitara romper contratos actuales de respuesta o rutas si no es estrictamente necesario.

### P3. Un solo punto de verdad por capa

- Sesion: cookie propia firmada
- Identidad: definir una identidad canonica
- Roles: Firestore
- Archivos: UploadThing

### P4. No mezclar remediacion con embellecimiento

La mejora funcional o visual no se mezcla con el cierre de vulnerabilidades.

### P5. Cambios medibles

Cada fase debe cerrar con checklist verificable y riesgo residual declarado.

---

## 5. Fases de remediacion

## Fase 1 - Autenticacion real y blindaje inicial de rutas

### Objetivo

Eliminar la sesion temporal, introducir una sesion valida de aplicacion y cerrar las rutas mas sensibles.

### Resultado esperado

- Ya no existe `temp-session`
- El middleware valida una sesion real
- Las rutas administrativas criticas exigen sesion valida
- Se introduce un guard reutilizable para futuras APIs

### Alcance

- Login de sesion
- Verificacion de sesion
- Middleware principal
- Guard base de autenticacion para rutas
- Primer lote de rutas `admin` criticas

### No incluye

- Refactor completo de RBAC
- Migracion de todos los repositorios
- Reestructuracion de datos publicos de certificados

---

## Fase 2 - Unificacion de identidad y RBAC operativo

### Objetivo

Eliminar el conflicto `uid` vs `email` y consolidar un modelo estable de roles y alcance.

### Resultado esperado

- Identidad canonica definida
- Lectura y escritura de roles coherente
- Dashboard y APIs usando el mismo criterio de autorizacion

### Alcance

- Repositorios de roles
- Contexto de autenticacion
- Pantalla de usuarios y asignacion de roles
- Helpers de alcance

---

## Fase 3 - Proteccion de datos y modelo publico minimo

### Objetivo

Separar el modelo interno del modelo publico de verificacion.

### Resultado esperado

- Los documentos internos dejan de ser publicos completos
- La verificacion publica funciona con una proyeccion minima
- Se reduce exposicion de datos personales

### Alcance

- Reglas de Firestore
- Ruta/pagina de verificacion
- Proyeccion publica de certificados

---

## Fase 4 - UploadThing, archivos y consistencia de medios

### Objetivo

Cerrar control de subida, ownership y borrado real de archivos.

### Resultado esperado

- UploadThing protegido por middleware
- Metadata consistente por archivo
- Eliminacion del archivo remoto al borrar catalogo
- Decision explicita sobre el flujo de perfil hoy atado a Firebase Storage

### Alcance

- `app/api/uploadthing/*`
- Media Center
- Firmas
- Perfil de usuario

---

## Fase 5 - Flujos publicos, anti abuso y endurecimiento final

### Objetivo

Reducir abuso en formularios publicos y cerrar endpoints auxiliares no seguros.

### Resultado esperado

- Solicitudes de acceso con control anti spam
- Registro administrativo mas seguro
- Endpoints de debug eliminados o cerrados

### Alcance

- `request-access`
- `register-admin`
- endpoints de debug
- reglas y validaciones complementarias

---

## 6. Orden exacto recomendado

1. Fase 1
2. Fase 2
3. Fase 3
4. Fase 4
5. Fase 5

Este orden minimiza ruptura porque primero establece la sesion y el control de entrada, luego ordena permisos, luego reduce exposicion de datos, y por ultimo cierra perifericos y abuso.

---

## 7. Riesgos de implementacion y como mitigarlos

### Riesgo 1 - Romper el login actual

**Mitigacion:** mantener Firebase Auth cliente intacto y cambiar solo el intercambio del token por cookie de aplicacion.

### Riesgo 2 - Dejar pantallas rotas por exigir auth demasiado pronto

**Mitigacion:** proteger primero las rutas mas sensibles y avanzar por lotes controlados.

### Riesgo 3 - Romper roles existentes por cambiar identidad

**Mitigacion:** migracion por compatibilidad temporal con doble lectura y backfill posterior.

### Riesgo 4 - Bloquear verificaciones publicas legitimas

**Mitigacion:** crear primero el modelo publico minimo antes de cerrar la lectura publica completa.

### Riesgo 5 - Perder archivos o referencias

**Mitigacion:** tratar Media Center y perfil como una fase especifica con inventario previo.

---

## 8. Criterios de exito del programa de remediacion

Se considerara exitosa la remediacion cuando se cumplan al menos estos puntos:

- No existe sesion temporal ni bypass trivial de dashboard
- Toda ruta administrativa sensible exige sesion valida
- Los roles se resuelven con una identidad coherente
- Los datos internos de certificados no estan expuestos publicamente
- UploadThing tiene control de acceso por ruta
- Los flujos publicos tienen defensas basicas contra abuso

---

## 9. Entregables documentales por fase

Cada fase debe dejar:

1. Un documento de estrategia o arranque
2. Un avance en `docs/avances`
3. Checklist de salida
4. Riesgos residuales
5. Verificacion ejecutada

Asi evitamos perder contexto y dejamos trazabilidad clara del por que, como y en que orden se hizo cada correccion.

---

## 10. Siguiente paso operativo

El siguiente paso es ejecutar la **Fase 1 - Autenticacion real y blindaje inicial de rutas**.

Antes de tocar codigo, debe quedar definido y aceptado:

- formato de la cookie de sesion propia
- fuente de identidad canonica inicial
- primer lote exacto de rutas a blindar
- criterio de compatibilidad para no romper el dashboard actual

---

## 11. Nota de alcance

Este plan no reemplaza el roadmap funcional historico del proyecto. Es un plan paralelo de remediacion y endurecimiento operativo para recuperar una base segura sobre la cual seguir construyendo.

**Fin del documento.**
