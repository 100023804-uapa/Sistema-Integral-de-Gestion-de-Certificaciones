# Avance: Registro de indices Firestore y portabilidad operativa de Firebase

**Fecha:** 7 de Marzo de 2026  
**Estado:** Completado  
**Referencia Git:** Pendiente de asociar al commit de esta sesion

---

## Resumen Ejecutivo

Se versionaron los indices compuestos que el proyecto necesita hoy para sus consultas Firestore estables y se completo la plantilla de configuracion para que SIGCE pueda migrarse a otro proyecto Firebase sin depender de copiar enlaces manuales de la consola.

Ademas, se agrego una guia operativa dedicada para despliegue de reglas, despliegue de indices y configuracion de un proyecto Firebase destino.

---

## Problema Detectado

El repositorio seguia en un estado fragil para operar Firebase de forma repetible:

- `firestore.indexes.json` estaba vacio.
- `.env.example` no documentaba las variables reales que el codigo consume.
- La creacion de indices dependia de abrir enlaces ad-hoc de Firebase Console.
- No habia una guia operativa concreta para cambiar a otra cuenta o a otro proyecto Firebase.

Ese estado genera tres riesgos:

1. una migracion a otro proyecto rompe consultas por indices faltantes
2. un nuevo entorno no sabe exactamente que secretos y URLs necesita
3. la base de infraestructura queda parcialmente "tribal", dependiente de memoria o de mensajes sueltos

---

## Trabajo Realizado

### 1. Registro de indices compuestos

Se poblo `firestore.indexes.json` con indices compuestos para las consultas deterministas actuales que combinan filtros con ordenamientos o rangos.

Colecciones cubiertas:

- `academicAreas`
- `campuses`
- `certificateTypes`
- `roles`
- `userRoles`
- `certificateTemplates`
- `generatedCertificates`
- `certificateStates`
- `certificates`
- `templates`
- `signatureRequests`
- `digitalSignatures`
- `signatureTemplates`

Se mantuvo una decision deliberada:

- no sobre-indexar consultas simples por igualdad que Firestore ya puede resolver con indices automaticos
- no materializar una explosion combinatoria de indices para filtros dinamicos poco usados

### 2. Plantilla de entorno completada

Se amplio `.env.example` para reflejar las variables efectivamente consumidas por el proyecto:

- URLs publicas y server-side
- Firebase Web SDK
- Firebase Admin SDK
- bootstrap admin email
- correo SMTP/Gmail
- integracion Gemini

Con esto, un entorno nuevo ya no depende de inspeccionar el codigo para descubrir secretos o nombres de variables.

### 3. Guia de migracion y operacion

Se agrego `docs/firebase_operacion_y_migracion.md` con:

- activos versionados que deben viajar con el repo
- secretos que deben recrearse por proyecto
- pasos para apuntar Firebase CLI a otro proyecto
- comandos de despliegue de reglas e indices
- checklist de smoke test post-migracion
- notas sobre limites de indexacion para consultas dinamicas

---

## Criterio Tecnico Aplicado

No todas las consultas Firestore justifican un indice compuesto.

Se registraron solo los casos que hoy son razonablemente deterministas y repetibles:

- `where(...) + orderBy(...)`
- multiples filtros con `orderBy(...)`
- igualdad mas rango sobre otro campo

Se excluyeron de la version inicial:

- consultas simples por igualdad sin ordenamientos
- combinaciones dinamicas de historial estudiantil que podrian crecer de forma exponencial

Esto reduce write amplification innecesaria y mantiene controlado el costo de indexacion.

---

## Nota Importante sobre Historial de Estudiantes

El modulo de historial de certificados del estudiante admite filtros combinables de forma dinamica sobre la coleccion `certificates`.

Se dejo versionado el indice base que cubre el flujo estable:

- `studentId + issueDate desc`

Pero si en produccion se empieza a exigir una matriz mayor de filtros simultaneos, Firestore puede pedir indices adicionales. Eso no implica que la migracion este mal; implica que la consulta dinamica crecio mas alla del set fijo versionado.

Tambien se deja constancia de que la busqueda por `folio` sigue siendo una aproximacion basada en Firestore, no un buscador textual dedicado.

---

## Archivos Impactados

- `firestore.indexes.json`
- `.env.example`
- `docs/firebase_operacion_y_migracion.md`
- `docs/avances/2026-03-07_registro_indices_firestore_y_portabilidad_firebase.md`

---

## Validacion Realizada

Se realizo validacion estatica y de consistencia sobre:

- consultas Firestore existentes en repositorios
- colecciones efectivamente usadas por el codigo
- variables de entorno consumidas desde `process.env`
- referencia de `firebase.json` hacia reglas e indices

No se ejecuto despliegue Firebase en esta sesion. El objetivo de este avance fue dejar versionado y documentado lo necesario para que el despliegue sea repetible en cualquier proyecto Firebase destino.

---

## Resultado

SIGCE queda en un estado mucho mas portable desde el punto de vista operativo:

- los indices requeridos ya no dependen de clicks manuales
- el entorno minimo requerido queda documentado
- migrar a otra cuenta o proyecto Firebase tiene un procedimiento concreto
- el repositorio reduce el riesgo de fallar en runtime por configuracion ausente

---

## Siguiente Paso Recomendado

Ejecutar en el proyecto Firebase objetivo:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

y luego correr el smoke test descrito en `docs/firebase_operacion_y_migracion.md`.
