# Manual de Usuario Operativo SIGCE Desde Cero

Fecha: 2026-04-03

## Objetivo

Este manual describe el uso correcto de SIGCE desde una instalación sin datos operativos hasta el flujo completo de:

- configuración institucional;
- gestión académica;
- gestión de certificados;
- firma y emisión;
- disponibilidad para portal;
- validación pública;
- control administrativo y auditoría.

También deja identificados los desalineamientos actuales entre lo que la app hace hoy y lo que debería hacer para mantener un único flujo institucional sin errores.

## Alcance

Este manual está orientado principalmente al rol:

- `administrator`

Y en segundo nivel a:

- `coordinator`
- `verifier`
- `signer`
- `participant`

## Principio Operativo

SIGCE debe operar bajo esta secuencia:

1. Configurar catálogos institucionales.
2. Crear programas.
3. Crear o importar participantes.
4. Crear o importar certificados.
5. Validar el flujo documental.
6. Solicitar firma.
7. Emitir el documento final.
8. Publicarlo para portal y validación pública.

Nada que dependa de catálogos institucionales debería capturarse como texto libre si ya existe una tabla para seleccionarlo.

## Mapa Actual del Panel

### Configuración Institucional

- `Recintos`
- `Areas Academicas`
- `Tipos de Certificado`
- `Catalogo de Roles`
- `Firmantes Autorizados`
- `Gestor de Medios`

### Gestión Académica

- `Programas`
- `Participantes`

### Gestión de Certificados

- `Certificados`
- `Validar QR`
- `Estados`
- `Firmas Digitales`
- `Plantillas de Diseno`

### Administración

- `Usuarios del Sistema`
- `Integridad de Datos`
- `Perfil y Operacion`

## Flujo Operativo Correcto Desde App Vacía

## Fase 0. Acceso Inicial y Revisión Base

### Capturas

![Pantalla de login](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_login_2026-04-03.png)

![Panel principal](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_dashboard_2026-04-03.png)

### Qué debe hacer el administrador

1. Entrar con una cuenta administrativa válida.
2. Confirmar que el dashboard carga y que el menú completo está visible.
3. Revisar `Perfil y Operacion` para confirmar:
   - proveedor de correo;
   - remitente;
   - reply-to;
   - política global de salida.
4. Revisar `Usuarios del Sistema` para asegurar que existe al menos una cuenta administrativa estable.

### Qué debe quedar listo antes de seguir

- acceso administrativo funcional;
- proveedor de correo operativo o conscientemente pausado;
- reglas básicas de acceso internas funcionando.

### Hallazgo

- `Catalogo de Roles` hoy no es todavía la única fuente real del RBAC crítico. Sigue habiendo autorización efectiva en código. Por eso este módulo hoy debe tratarse más como catálogo operativo que como motor absoluto de permisos.

## Fase 1. Configuración Institucional

Esta fase debe completarse antes de crear participantes o certificados.

### 1. Recintos

Ruta:

- `/dashboard/campuses`

### Qué hacer

1. Crear todos los recintos institucionales.
2. Definir:
   - nombre;
   - código;
   - dirección si aplica;
   - teléfono;
   - email;
   - estado activo.

### Regla

Todo participante y todo certificado debe poder vincularse a un recinto.

![Módulo de recintos](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_campuses_2026-04-03.png)

### 2. Áreas Académicas

Ruta:

- `/dashboard/academic-areas`

### Qué hacer

1. Crear las áreas académicas.
2. Asociarlas al recinto correspondiente.
3. Mantener activas solo las vigentes.

### Regla

El área no debe escribirse manualmente después si ya existe aquí.

### 3. Tipos de Certificado

Ruta:

- `/dashboard/certificate-types`

### Qué hacer

1. Crear los tipos institucionales válidos.
2. Revisar que coincidan con lo que realmente se emitirá.

### Regla

No deberían seguir apareciendo tipos “inventados” fuera de este catálogo.

### 4. Catálogo de Roles

Ruta:

- `/dashboard/roles`

### Qué hacer

1. Registrar roles activos del sistema.
2. Mantener solo los que de verdad existen operativamente.

### Regla

Los formularios no deben inventar roles por defecto ni caer a valores inexistentes.

### 5. Firmantes Autorizados

Ruta:

- `/dashboard/signers`

### Qué hacer

1. Registrar cada autoridad institucional.
2. Definir:
   - nombre;
   - cargo;
   - departamento si aplica;
   - imagen de firma;
   - usuarios/correos autorizados para operar en su nombre si aplica.

### Regla

Este módulo define la autoridad que debe salir impresa en el certificado.

### Hallazgo

- Hoy existe una mezcla entre `Firmantes Autorizados` y `usuarios internos firmantes`. Eso debe aclararse porque no son exactamente la misma entidad.

![Módulo de firmantes autorizados](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_signers_2026-04-03.png)

### 6. Gestor de Medios

Ruta:

- `/dashboard/media`

### Qué hacer

1. Subir logos.
2. Subir imágenes institucionales.
3. Subir recursos visuales necesarios para plantillas.

### Regla

Toda plantilla debería depender de recursos guardados aquí y no de URLs improvisadas.

### 7. Plantillas de Diseño

Ruta:

- `/dashboard/certificate-templates`

### Qué hacer

1. Crear o ajustar las plantillas oficiales.
2. Verificar:
   - tipo de render;
   - variables detectadas;
   - compatibilidad;
   - estado activa/inactiva.
3. Definir cuál será la plantilla usada por cada flujo.

### Regla

No debería emitirse un certificado final sin plantilla definida.

### Hallazgo

- El sistema permite hoy que la creación manual de certificados nazca sin una disciplina fuerte de plantilla desde origen. Eso debe endurecerse.

![Módulo de plantillas](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_templates_2026-04-03.png)

## Fase 2. Gestión Académica

## 2.1 Programas

Ruta:

- `/dashboard/programs`

### Qué hacer

1. Crear el catálogo de programas.
2. Definir:
   - nombre;
   - código;
   - descripción;
   - duración;
   - estado.

### Regla

El programa debe ser referencia institucional para participantes y certificados.

![Módulo de programas](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_programs_2026-04-03.png)

## 2.2 Participantes Manuales

Ruta:

- `/dashboard/graduates`
- `/dashboard/graduates/create`

### Flujo correcto

1. Entrar a `Participantes`.
2. Pulsar `Nuevo Participante`.
3. Completar:
   - nombre;
   - apellidos;
   - correo;
   - cédula;
   - teléfono;
   - recinto desde selector;
   - área académica desde selector dependiente;
   - programa desde selector.
4. Guardar.
5. Revisar la ficha del participante.

### Regla

El participante ya no debería depender de `career` como texto libre. Debe quedar vinculado por catálogo.

### Estado actual

- Este flujo ya quedó alineado al modelo canónico de participantes.

![Listado de participantes](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_participants_2026-04-03.png)

## 2.3 Participantes Masivos

Ruta:

- `/dashboard/graduates/import`

### Flujo correcto

1. Definir el contexto institucional del lote:
   - recinto;
   - programa;
   - área académica opcional.
2. Subir el Excel.
3. Revisar la prevalidación del lote.
4. Ejecutar la importación.
5. Descargar o copiar el reporte final.

### Regla

El Excel no debe ser la fuente maestra para nombres institucionales como programa o recinto. Esos deben salir del catálogo.

### Estado actual

- Este flujo ya fue alineado para exigir recinto y programa del lote.

### Hallazgo

- Aún falta un backfill formal sobre participantes legacy para resolver todos los casos antiguos donde solo existe `career`.

![Importación masiva de participantes](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_participants_import_2026-04-03.png)

## Fase 3. Gestión de Certificados

Aquí es donde hoy existe la mayor desalineación funcional.

## 3.1 Certificados Manuales

Ruta:

- `/dashboard/certificates`
- `/dashboard/certificates/create`

### Flujo correcto esperado

1. Seleccionar participante existente.
2. Seleccionar recinto.
3. Seleccionar programa.
4. Seleccionar tipo de certificado.
5. Seleccionar plantilla.
6. Seleccionar firmante institucional 1.
7. Seleccionar firmante institucional 2 si aplica.
8. Definir fecha y metadatos.
9. Crear el certificado en `draft`.

### Estado actual

Hoy la creación manual todavía presenta debilidades:

- usa nombre del estudiante y matrícula como captura directa en vez de seleccionar participante existente;
- usa `academicProgram` como valor simple del formulario;
- no exige firmantes institucionales desde origen;
- no exige correo del participante;
- no fuerza un contrato idéntico al flujo masivo.

### Riesgo

Esto permite que manual y masivo no produzcan certificados con el mismo nivel de integridad.

![Listado de certificados](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_certificates_2026-04-03.png)

![Creación manual de certificados](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_certificates_create_2026-04-03.png)

## 3.2 Certificados Masivos

Ruta:

- `/dashboard/certificates/import`

### Flujo correcto

1. Configurar lote:
   - recinto;
   - área académica;
   - plantilla;
   - firmante 1;
   - firmante 2;
   - programa global opcional;
   - fecha de expiración global opcional.
2. Subir archivo Excel.
3. Revisar prevalidación.
4. Ejecutar el lote.
5. Revisar el reporte final.

### Estado actual

- Este flujo está más cerca del modelo correcto que el manual.
- Puede aplicar plantilla y firmantes desde el lote.

### Hallazgo

- Manual y masivo no siguen hoy el mismo contrato. Esto debe corregirse para que haya una sola manera lógica de crear certificados.

![Importación masiva de certificados](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_certificates_import_2026-04-03.png)

## Fase 4. Flujo de Estados

Ruta:

- `/dashboard/certificate-states`

### Flujo documental correcto

1. `draft`
2. `pending_review`
3. `verified`
4. `pending_signature`
5. `signed`
6. `issued`
7. `available`

### Semántica recomendada

- `draft`: creado, editable.
- `pending_review`: en espera de revisión.
- `verified`: validado documentalmente.
- `pending_signature`: enviado a firma.
- `signed`: firma digital completada.
- `issued`: PDF final generado.
- `available`: visible para portal y validación pública.

### Estado actual

La app hoy trabaja principalmente hasta `issued`.

### Hallazgos

1. El estado formal `available` todavía no está operando como fase final única.
2. El modal `Enviar a firma` usa usuarios internos firmantes, no el catálogo de `Firmantes Autorizados`.
3. El texto del modal induce a pensar que “firmante” es una sola cosa, cuando en realidad hoy hay:
   - autoridad firmante;
   - usuario interno que firma operativamente.

### Recomendación

Separar explícitamente:

- `Autoridad firmante impresa`
- `Usuario interno que ejecuta la firma digital`

![Módulo de estados de certificados](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_certificate_states_2026-04-03.png)

## Fase 5. Firmas Digitales

Ruta:

- `/dashboard/digital-signatures`

### Flujo correcto

1. El certificado verificado se envía a firma.
2. El usuario firmante autorizado entra al panel.
3. Revisa solicitudes pendientes.
4. Firma o rechaza.
5. El certificado pasa a `signed`.

### Regla

La firma digital operativa no sustituye la autoridad institucional que debe aparecer en el documento.

### Hallazgo

- Hoy el sistema resuelve la solicitud de firma por `internal_users`, mientras que la impresión del documento usa `signers` solo si el certificado trae `signer1Id` o `signer2Id`.

## Fase 6. Emisión y Publicación

### Flujo correcto

1. Tomar un certificado `signed`.
2. Emitirlo con una plantilla activa.
3. Generar PDF final.
4. Persistir QR y código de verificación.
5. Publicarlo como `available`.

### Regla

No debería existir un certificado disponible para participante si:

- no tiene PDF final;
- no tiene QR válido;
- no tiene código de verificación;
- no pasó por firma;
- no está realmente publicado.

### Hallazgo

- Existen certificados legacy `issued` que pueden no tener todos los elementos completos de firma o configuración institucional. Por eso el saneamiento del workflow sigue siendo necesario.

## Fase 7. Portal del Participante

Ruta:

- `/student`

### Flujo correcto

1. El participante debe existir como ficha real.
2. Debe tener correo válido.
3. Debe tener acceso al portal activado.
4. Debe entrar con contraseña temporal o ya renovada.
5. El portal debe mostrar solo certificados vinculados a su `studentId`.

### Qué ve el participante

- nombre;
- correo;
- matrícula;
- programa;
- recinto;
- lista de certificados disponibles;
- detalle y descarga si el certificado ya está habilitado.

### Regla

El portal no debe ser fuente de verdad. Solo consume certificados que ya pasaron el flujo documental completo.

### Hallazgo

- El portal ya resuelve correctamente por `studentId`, pero depende de que el dato previo esté bien construido.

## Fase 8. Validación Pública e Interna

### Validación pública

Ruta esperada:

- `/verify/...`

### Validación interna

Ruta:

- `/dashboard/validate`

### Flujo correcto

1. Buscar por folio, UUID o código de verificación.
2. Confirmar autenticidad.
3. Mostrar solo la información que corresponda según disponibilidad pública.

### Hallazgo

- Mientras no se formalice `available`, la disponibilidad pública puede seguir mezclándose con `issued` y estados legacy.

## Fase 9. Usuarios del Sistema

Ruta:

- `/dashboard/users`

### Flujo correcto

1. Crear usuario interno.
2. Seleccionar rol activo de forma explícita.
3. Enviar activación por correo.
4. Usuario activa cuenta y define contraseña.
5. Se habilita acceso según rol.

### Estado actual

- Ya se corrigió el problema del rol preseleccionado e inventado.

### Hallazgo

- El módulo funciona, pero el catálogo de roles aún no controla por sí solo todo el acceso del sistema.

![Usuarios internos](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/manual_assets/manual_users_2026-04-03.png)

## Fase 10. Integridad, Reportes y Operación

### Integridad de Datos

Ruta:

- `/dashboard/data-integrity`

### Qué debe hacer el administrador

1. Revisar vínculos participante-certificado.
2. Detectar certificados huérfanos o bloqueados para portal.
3. Revisar inconsistencias del workflow.

### Reportes

Ruta:

- `/dashboard/reports`

### Qué debe hacer el administrador

1. Verificar consistencia global.
2. Confirmar que lo emitido corresponda con el estado real.

### Perfil y Operación

Ruta:

- `/dashboard/settings`

### Qué debe hacer el administrador

1. Controlar la salida de correos.
2. Probar el proveedor de email.
3. Revisar configuración operativa.

## Orden Recomendado de Uso Diario

1. Revisar notificaciones internas y correo operativo.
2. Verificar pendientes en `Estados`.
3. Resolver solicitudes en `Firmas Digitales`.
4. Emitir certificados listos.
5. Auditar en `Integridad de Datos` y `Reportes`.

## Orden Recomendado de Implementación y Carga Inicial

1. `Recintos`
2. `Areas Academicas`
3. `Tipos de Certificado`
4. `Catalogo de Roles`
5. `Firmantes Autorizados`
6. `Gestor de Medios`
7. `Plantillas de Diseno`
8. `Programas`
9. `Participantes`
10. `Certificados`
11. `Estados`
12. `Firmas Digitales`
13. `Portal`
14. `Validación`
15. `Reportes`
16. `Integridad de Datos`

## Hallazgos Consolidados de Funcionamiento

1. `Certificados` manuales y masivos aún no siguen el mismo contrato.
2. La creación manual de certificados todavía permite demasiados campos libres.
3. `Firmantes Autorizados` y `usuarios firmantes internos` no están resueltos con una relación clara en toda la app.
4. El flujo documental todavía no cerró formalmente `available` como estado final de publicación.
5. Existen datos legacy que requieren saneamiento antes de declarar el flujo como totalmente coherente.
6. `Catalogo de Roles` todavía no es la única fuente de RBAC.
7. Existen participantes reales con ficha incompleta (`sin programa`, `sin recinto`, `sin correo`) y hoy el sistema los muestra sin bloquear suficientemente los flujos que dependen de esos datos.
8. La creación manual de certificados todavía no obliga a seleccionar participante existente ni firmantes institucionales desde origen.
9. La importación masiva de certificados aún conserva lenguaje y columnas legacy como `Curso o ProgramaGlobal`, lo que indica que la unificación semántica todavía no está cerrada.

## Hallazgos Consolidados de UX/UI

1. Hay menús que conceptualmente pertenecen juntos pero aún están separados de forma operativamente confusa.
2. Algunos módulos todavía permiten escribir datos que deberían seleccionarse.
3. El lenguaje de “firmante” no distingue bien entre autoridad institucional y usuario interno.
4. El sistema todavía enseña más de una ruta mental para llegar al mismo resultado en certificados.
5. Varias pantallas dependen de cargas asíncronas largas y quedan en estados intermedios sin suficiente contexto operativo si la data tarda.
6. `Usuarios del Sistema` muestra señales de identidad duplicada o poco normalizada, lo que puede confundir alta, activación y auditoría.
7. `Participantes` mezcla muy bien la vista de resumen, pero deja demasiado visible el dato incompleto en producción en vez de guiar una corrección inmediata.

## Estado de Capturas

### Ya capturado e incorporado

- login;
- dashboard;
- recintos;
- firmantes autorizados;
- plantillas;
- programas;
- participantes;
- importación de participantes;
- listado de certificados;
- creación manual de certificados;
- importación masiva de certificados;
- estados;
- usuarios internos.

### Pendiente de segunda pasada

- integridad de datos;
- firmas digitales;
- portal del participante.

### Ya es viable capturar

- pantallas públicas;
- pantallas visibles en una sesión autenticada activa en el escritorio.

### Limitación actual de este entorno

La captura autenticada sí fue posible con automatización Playwright local usando una cuenta administrativa válida.

Lo que sigue inestable es la segunda pasada sobre algunas rutas pesadas o el recambio rápido de sesiones, por lo que todavía faltan `Integridad de Datos`, `Firmas Digitales` y `Portal` como bloque final.

### Recomendación

Completar las capturas del manual en una pasada guiada de estas rutas:

1. `/dashboard`
2. `/dashboard/campuses`
3. `/dashboard/signers`
4. `/dashboard/certificate-templates`
5. `/dashboard/programs`
6. `/dashboard/graduates`
7. `/dashboard/graduates/create`
8. `/dashboard/graduates/import`
9. `/dashboard/certificates`
10. `/dashboard/certificates/create`
11. `/dashboard/certificates/import`
12. `/dashboard/certificate-states`
13. `/dashboard/digital-signatures`
14. `/student`
15. `/dashboard/data-integrity`

## Próximo Paso Recomendado

Después de este manual, el siguiente frente correcto no es corregir todo al mismo tiempo.

Ver paquete priorizado:

- [paquete_hallazgos_priorizados_y_orden_de_correccion_2026-04-03.md](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/docs/paquete_hallazgos_priorizados_y_orden_de_correccion_2026-04-03.md)

El orden con más lógica es:

1. cerrar Tramo 3 de certificados;
2. unificar plantilla, participante y firmantes desde origen;
3. corregir firma vs autoridad firmante;
4. formalizar `available`;
5. luego revisar hallazgos UX/UI al final como paquete.
