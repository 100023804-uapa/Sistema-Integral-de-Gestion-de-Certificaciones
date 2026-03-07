# Firebase: Operacion, indices y migracion

## Objetivo

Este documento deja claro que parte del stack Firebase ya queda versionada en el repositorio y que parte sigue siendo configuracion secreta o manual del proyecto destino.

El objetivo es que SIGCE pueda:

- recrear sus indices y reglas sin depender de enlaces manuales de la consola
- mover el proyecto a otra cuenta o a otro proyecto Firebase con un checklist reproducible
- reducir el riesgo de que una consulta falle por falta de indice despues de una migracion

## Artefactos ya versionados

Estos archivos deben viajar siempre con el proyecto:

- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `firestore.indexes.json`
- `storage.rules`
- `.env.example`

## Variables de entorno necesarias

Tomar `.env.example` como plantilla base. Las variables relevantes hoy son:

- `NEXT_PUBLIC_APP_URL`
- `APP_URL`
- `VERIFICATION_URL`
- `NEXT_PUBLIC_ADMIN_EMAIL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `GEMINI_API_KEY`

## Que queda automatizado

- Reglas de Firestore por `firestore.rules`
- Indices compuestos por `firestore.indexes.json`
- Reglas de Storage por `storage.rules`
- Binding del proyecto CLI por `.firebaserc`
- Plantilla de secretos y URLs por `.env.example`

## Que NO queda automatizado del todo

Hay configuracion que sigue siendo propia del proyecto destino y no debe vivir con secretos reales en el repositorio:

- el Web App de Firebase y sus credenciales cliente reales
- la service account del Admin SDK
- los dominios autorizados de Authentication
- el proveedor Google Sign-In y su configuracion OAuth
- los secretos de correo y cualquier otro token externo

## Migracion a otro proyecto Firebase

### 1. Crear o seleccionar el proyecto destino

- Crear el nuevo proyecto en Firebase Console.
- Habilitar Firestore, Authentication y Storage.
- Verificar la region y quotas antes de poner trafico real.

### 2. Registrar la Web App

- Crear una Web App en el proyecto destino.
- Copiar las credenciales cliente del SDK web.
- Actualizar el `.env.local` o los secretos del entorno con:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

### 3. Configurar la service account del Admin SDK

- Crear una nueva service account en el proyecto destino.
- Descargar el JSON.
- Cargarlo preferiblemente como `FIREBASE_SERVICE_ACCOUNT_KEY_BASE64`.

Ejemplo en PowerShell para generar Base64:

```powershell
[Convert]::ToBase64String(
  [Text.Encoding]::UTF8.GetBytes((Get-Content .\service-account.json -Raw))
)
```

Alternativa:

- usar `FIREBASE_SERVICE_ACCOUNT_KEY` con el JSON en una sola linea y `\n` escapados

### 4. Ajustar URLs del entorno

- Definir `NEXT_PUBLIC_APP_URL`
- Definir `APP_URL`
- Definir `VERIFICATION_URL` si el endpoint publico de verificacion usara otro dominio
- Confirmar `NEXT_PUBLIC_ADMIN_EMAIL`

### 5. Apuntar Firebase CLI al nuevo proyecto

En local:

```bash
firebase use --add
```

Luego seleccionar el nuevo `projectId` y actualizar `.firebaserc` si ese binding debe quedar versionado.

### 6. Desplegar reglas e indices

Comandos recomendados:

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

O en una sola ejecucion:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Indices compuestos registrados

`firestore.indexes.json` ya incluye los indices compuestos necesarios para las consultas deterministas actuales de:

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

Importante:

- El enlace de error de Firestore suele incluir `__name__`, pero ese sufijo no se declara manualmente en `firestore.indexes.json`.
- El archivo versionado declara solo indices compuestos realmente necesarios para filtros con `orderBy` o rangos.
- Las consultas simples por igualdad siguen apoyandose en los indices automaticos de Firestore.

## Nota importante sobre historial de certificados del estudiante

El read-model de historial del estudiante permite combinaciones dinamicas de filtros sobre `certificates`.

Se dejo versionado el indice base para:

- `studentId + issueDate desc`

Eso cubre el listado paginado principal y los casos mas estables. Pero si en produccion se habilitan combinaciones nuevas como:

- `studentId + campusId + status + issueDate`
- `studentId + academicAreaId + type + issueDate`

Firestore podria pedir indices compuestos adicionales. Eso no es un fallo de migracion: es una consecuencia normal del diseno dinamico de consultas.

Ademas, el filtro de busqueda por `folio` no equivale a un motor de busqueda de texto completo. Si esa capacidad se vuelve central, conviene redisenar esa consulta o mover la busqueda textual a un servicio especializado.

## Smoke test recomendado despues de migrar

1. Iniciar sesion con el admin bootstrap.
2. Abrir CRUD de campus, areas academicas, tipos y roles.
3. Listar plantillas de certificados.
4. Crear y listar solicitudes de firma digital.
5. Generar un certificado y abrir su pagina de verificacion.
6. Probar Storage si se cargan o descargan PDFs reales.
7. Revisar en Firestore Console que no aparezcan nuevos enlaces de indices faltantes.

## Recomendacion operativa

- No copiar secretos reales a `.env.example`.
- No reutilizar service accounts entre proyectos.
- Si cambias de cuenta Firebase pero mantienes el mismo proyecto, rota igual la service account y revisa IAM.
- Si cambias de proyecto Firebase, considera la migracion de datos por separado; este documento cubre configuracion e infraestructura, no export/import de colecciones.
