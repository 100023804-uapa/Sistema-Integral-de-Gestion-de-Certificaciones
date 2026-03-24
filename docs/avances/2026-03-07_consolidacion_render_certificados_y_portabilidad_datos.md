# Avance: Consolidacion de render de certificados, metadatos operativos y portabilidad de datos

**Fecha:** 2026-03-07  
**Estado:** Completado  
**Fase:** Ajustes funcionales y estabilizacion operativa  
**Relacionado con:**

- `docs/architecture/portabilidad_y_estandar_datos.md`
- `docs/firebase_operacion_y_migracion.md`

---

## Resumen ejecutivo

Se consolido un bloque amplio de mejoras alrededor del flujo de certificados.

El objetivo principal fue corregir la desalineacion entre la plantilla seleccionada, la vista del certificado y la descarga PDF, al mismo tiempo que se enriquecieron los datos disponibles en la generacion para que las plantillas HTML puedan renderizar correctamente recinto, area academica, firmantes, correo y fechas opcionales.

Ademas, se dejaron documentados criterios de portabilidad y sanitizacion de datos para mantener consistencia al persistir documentos y facilitar futuras migraciones.

---

## Problemas que quedaron abordados

### 1. La plantilla seleccionada no se reflejaba de forma consistente

Antes existian caminos diferentes para:

- la plantilla diseñada
- la vista del certificado
- la descarga PDF

Eso hacia posible que el certificado indicara una plantilla en los detalles tecnicos, pero se renderizara con otro formato o con un esquema incompleto.

Ahora se incorporo un renderizador unificado que decide entre:

- modo `html`
- modo `legacy`
- modo `default`

y produce un documento HTML final consistente para vista y descarga.

### 2. El PDF podia salir en blanco o deformado

La exportacion PDF se ajusto para tomar el contenido imprimible del certificado y respetar la proporcion real de la plantilla renderizada.

Con esto se reduce el riesgo de:

- paginas en blanco
- cortes por paginacion del `body`
- escalado incorrecto del contenido diseñado

### 3. Faltaban datos reales para renderizar las variables de plantilla

El caso de uso de creacion de certificados ahora enriquece `metadata` con valores reales resueltos desde los catalogos:

- nombre del recinto
- nombre del area academica
- nombre del firmante 1
- cargo del firmante 1
- imagen de firma del firmante 1
- nombre del firmante 2
- cargo del firmante 2
- imagen de firma del firmante 2

Esto corrige el vacio funcional donde el formulario permitia elegir firmantes, pero la plantilla no recibia todas las variables necesarias para mostrar la firma real.

### 4. La vista del detalle estaba centrada en una maqueta de datos y no en el diseño real

La pantalla de detalle del certificado se rehizo para priorizar la plantilla renderizada:

- se elimino la `Vista de Datos`
- se dejo una `Vista de Diseño` unica
- se amplio el visor
- se reorganizo el panel secundario para liberar ancho util
- se incorporo el modo de render en los detalles tecnicos

### 5. La plantilla de referencia CAP necesitaba una composicion inferior mas limpia

La plantilla base `Certificado modelo curso taller` se reorganizo para:

- llevar el QR a la esquina inferior derecha
- centrar mejor el sello institucional
- equilibrar las dos firmas
- reservar espacio al pie para el bloque de registro y verificacion

---

## Cambios funcionales introducidos

### 1. Flujo de creacion de certificados mas rico

Archivos:

- `app/dashboard/certificates/create/page.tsx`
- `lib/application/use-cases/CreateCertificate.ts`
- `lib/container.ts`
- `lib/domain/entities/Certificate.ts`

Mejoras:

- seleccion de area academica dependiente del recinto
- autocompletado y persistencia del correo del participante
- soporte de fecha de expiracion opcional
- envio y persistencia de `signer1Id` y `signer2Id`
- enriquecimiento automatico de metadatos para plantillas y PDF
- inyeccion de repositorios necesarios al caso de uso

### 2. Render unificado de plantillas

Archivo nuevo:

- `lib/application/utils/certificate-template-renderer.ts`

Responsabilidad:

- construir el documento HTML final del certificado
- resolver placeholders visibles y de recursos
- generar QR como `data URL`
- soportar plantillas HTML nuevas
- mantener compatibilidad con plantillas legacy por secciones
- proveer un fallback por defecto cuando no existe plantilla valida

Variables resueltas de forma centralizada:

- `studentName`
- `studentId`
- `cedula`
- `programName`
- `academicProgram`
- `folio`
- `issueDate`
- `campusName`
- `academicArea`
- `duration`
- `grade`
- `description`
- `verificationUrl`
- `qrCode`
- `sealImage`
- `signer1_*`
- `signer2_*`

### 3. Rediseño del detalle del certificado

Archivo:

- `app/dashboard/certificates/[id]/page.tsx`

Cambios:

- carga y render de plantilla seleccionada
- visor mas amplio y centrado en el diseño real
- calculo dinamico de escala del preview
- separacion del panel QR y de detalles tecnicos para no quitar ancho al visor
- descarga PDF desde la misma fuente de render
- visualizacion del modo de render (`HTML`, `LEGACY`, `DEFAULT`)

### 4. Ajustes del generador PDF

Archivo:

- `lib/application/utils/pdf-generator.ts`

Cambios:

- uso del renderizador unificado
- captura del elemento imprimible correcto
- exportacion PDF basada en proporcion real del documento
- fallback a render legacy cuando aplique

### 5. Compatibilidad del repositorio de plantillas

Archivo:

- `lib/infrastructure/repositories/FirebaseCertificateTemplateRepository.ts`

Cambios:

- compatibilidad con contratos legacy mediante `save(...)`
- alias de `delete(...)` hacia borrado logico
- conservacion de HTML/CSS por defecto generados para nuevas plantillas

### 6. Sanitizacion de persistencia

Archivo:

- `lib/infrastructure/repositories/FirebaseCertificateStateRepository.ts`

Cambios:

- normalizacion de `previousState`, `comments` y `metadata` a `null` cuando no tengan valor

Esto mantiene consistencia frente a Firestore y respalda el estandar de portabilidad definido.

### 7. Consulta global de solicitudes de firma digital

Archivos:

- `app/api/admin/digital-signatures/route.ts`
- `lib/infrastructure/repositories/FirebaseDigitalSignatureRepository.ts`
- `lib/usecases/digitalSignature/GetSignatureRequestsUseCase.ts`

Cambios:

- incorporacion de `getAllSignatureRequests()`
- exposicion del metodo `getAllRequests()` en el caso de uso
- la ruta administrativa puede devolver todas las solicitudes cuando no se envian filtros

Esto deja disponible un camino consistente para listados administrativos completos de solicitudes de firma.

---

## Documentacion y arquitectura

### 1. Estandar de portabilidad

Archivo nuevo:

- `docs/architecture/portabilidad_y_estandar_datos.md`

Contenido:

- patron repositorio como desacople del proveedor
- criterio de sanitizacion para campos opcionales
- rol de `firestore.indexes.json` como mapa de optimizacion del sistema
- checklist conceptual para migraciones futuras

### 2. Enlace desde la guia operativa Firebase

Archivo:

- `docs/firebase_operacion_y_migracion.md`

Se agrego referencia directa al estandar de portabilidad para dejar conectado el plano operativo con el plano arquitectonico.

### 3. Indices versionados adicionales

Archivo:

- `firestore.indexes.json`

Cambios relevantes:

- nuevo indice para `academicPrograms` por `isActive + name`
- ajuste del orden del indice de `userRoles`

---

## Plantilla de referencia ajustada

Archivos:

- `certificados/Certificado modelo curso taller/index.html`
- `certificados/Certificado modelo curso taller/styless.css`

Cambios visuales:

- estructura inferior reorganizada
- QR en esquina inferior derecha
- sello central con caption
- bloque de firmas mas equilibrado
- pie de registro con espacio reservado para no chocar con QR

> Nota: estos archivos sirven como referencia local. La plantilla activa del sistema sigue dependiendo de lo almacenado en la base de datos y debe sincronizarse desde el editor de plantillas cuando se quiera reflejar el mismo diseño en produccion.

---

## Verificacion ejecutada

### 1. Typecheck

```bash
pnpm exec tsc --noEmit
```

**Resultado:** OK

### 2. ESLint focalizado

```bash
pnpm exec eslint lib/application/utils/certificate-template-renderer.ts "app/dashboard/certificates/[id]/page.tsx" lib/application/utils/pdf-generator.ts
```

**Resultado:** OK

---

## Resultado funcional esperado

Despues de este bloque:

- la creacion del certificado persiste mas contexto operativo
- las variables de plantilla reciben datos reales de recinto, area y firmantes
- el detalle del certificado muestra el diseño seleccionado y no una maqueta paralela
- la descarga PDF usa la misma base de render que la vista
- la plantilla CAP de referencia queda mejor preparada para una composicion institucional estable

---

## Riesgo residual

Todavia quedan puntos a vigilar:

1. la plantilla activa del sistema debe actualizarse desde el editor si se desea reflejar exactamente el HTML/CSS de referencia local
2. los recursos remotos como logos, sellos o firmas dependen de URLs validas y accesibles para vista y exportacion
3. las plantillas legacy siguen soportadas, por lo que el sistema convivira temporalmente con dos formatos

---

## Siguiente paso recomendado

El siguiente bloque natural despues de este avance es:

- validar y terminar de alinear la plantilla activa en base de datos con el nuevo layout de referencia
- cerrar la generacion masiva con el mismo pipeline unificado cuando aplique
- continuar con la siguiente fase del plan de remediacion sin perder esta mejora funcional del modulo de certificados

**Fin del avance.**
