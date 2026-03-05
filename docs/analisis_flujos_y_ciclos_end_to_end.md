# Flujos y Ciclos del Sistema SIGCE (Análisis End-to-End)

**Fecha:** 5 de Marzo de 2026
**Objetivo:** Mapear todos los procesos del sistema, desde la perspectiva de diferentes actores (Estudiantes, Coordinadores, Verificadores, Firmantes, Administradores), identificando los módulos que intervienen, evaluando la seguridad actual y proponiendo mejoras donde sea necesario.

---

## 1. Ciclo de Onboarding y Gobernanza (Administradores)
**Actor Principal:** Administrador del Sistema.
**Objetivo:** Configurar el sistema para que la universidad pueda operar y gestionar quién tiene acceso.

### Flujo Actual:
1. **Solicitud de Acceso:** Un trabajador llena el formulario público (`/request-access`). El sistema crea un registro "pendiente" en `access_requests` y envía un email.
2. **Evaluación:** El Administrador entra a `/dashboard/users`. Ve la solicitud, hace clic en "Evaluar" y selecciona un cargo (Coordinador, Verificador, Firmante) en el modal de asignación de roles.
3. **Persistencia:** El sistema actualiza el request a "aprobado", crea el usuario en `access_users` y guarda su cargo en `userRoles`.
4. **Configuración Base:** El administrador entra a "Recintos", "Áreas Académicas", "Tipos de Certificado" y "Plantillas" para poblar los catálogos. *(Todo con Soft Deletes para proteger la data).*

**✅ Estado General:** Robusto. Se eliminó el problema "Legacy" de que todos fueran administradores.
**🚧 Punto de Mejora / Vulnerabilidad Potencial:** 
- Al registrar la solicitud, el email se ingresa a mano. No hay verificación estricta de que el correo sea `@uapa.edu.do` en el frontend/backend (salvo la instrucción visual). *Mejora: Restringir por Regex en el backend que solo se acepten correos institucionales para solicitar acceso.*

---

## 2. Ciclo de Creación y Generación de Certificados
**Actor Principal:** Coordinador Académico.
**Módulos Involucrados:** Estudiantes, Recintos, Tipos, Plantillas, Certificados.

### Flujo Actual:
1. **Acceso a la UI:** El Coordinador entra a `/dashboard/certificates` y hace clic en "Nuevo Certificado" (El botón está oculto para otros roles gracias al RBAC visual).
2. **Formulario:** Selecciona un "Recinto" (Obligatorio), una "Plantilla" (Opcional), e ingresa los datos del participante y curso.
3. **Ejecución (Use Case):** El backend ejecuta `CreateCertificate`. Se verifica si el estudiante existe; si no, se crea automáticamente en la colección de estudiantes.
4. **Folio y Seguridad:** Se genera un número de Folio único y un "Código Hash" criptográfico inalterable (US-13).
5. **Estado Inicial:** El certificado nace en el módulo de `certificateStates` con el estado `draft` (Borrador).

**✅ Estado General:** Excelente desacoplamiento. El caso de uso centraliza la validación y relaciona limpiamente al estudiante con el recinto.
**🚧 Punto de Mejora / Vulnerabilidad Potencial:**
- Cuando el coordinador importa estudiantes masivamente mediante Excel (`/import`), el sistema procesa todo el lote. Si el Excel es gigantesco, la UI puede colgarse y exceder las cuotas de lectura/escritura de Firebase en una sola transacción. *Mejora: Implementar "Batch Processing" (Procesamiento por lotes) asíncrono o Cloud Functions para importaciones mayores a 100 registros.*

---

## 3. Ciclo de Vida y Auditoría (Estados)
**Actores Principales:** Verificador y Firmante.
**Módulos Involucrados:** CertificateStates, Certificados, Firmas Digitales.

### Flujo Actual:
1. **Envío a Revisión:** El Coordinador cambia el estado de `draft` a `pending_review`.
2. **Verificación:** El usuario con rol "Verificador" inicia sesión, ve su bandeja de pendientes. Revisa que los nombres y fechas cuadren con el registro universitario y lo pasa a `verified` (o lo rechaza).
3. **Solicitud de Firma:** El Coordinador toma el certificado "Verificado" y solicita una firma, pasándolo a `pending_signature` y enviándolo a un "Firmante" específico.
4. **Firma Digital:** El Firmante (ej. Rector/Director) entra a su panel (`/dashboard/digital-signatures`), evalúa la solicitud y "Firma". El sistema guarda su IP, Location, Timestamp y un código Base64.
5. **Emisión:** Finalmente, el certificado cambia a `issued` (Activo).

**✅ Estado General:** Flujo institucional completo y completamente auditable. La tabla `stateHistories` garantiza que se sepa quién, cuándo y por qué aprobó un documento.
**🚧 Punto de Mejora:** 
- Al rechazar un certificado o firma, el sistema pide un comentario, pero el sistema no notifica automáticamente al creador original (coordinador) por correo electrónico. Debe entrar a la plataforma a mirar el estado. *Mejora: Integrar notificaciones email/in-app automáticas en cada transición de estado.*

---

## 4. Ciclo de Consulta Pública (El Estudiante / Terceros)
**Actor Principal:** Estudiantes y Empleadores (Público general).
**Módulos Involucrados:** Consulta pública, Generador PDF, Verificación Hash.

### Flujo Actual:
1. **Acceso al Portal:** El estudiante o la empresa que lo va a contratar entra a la página pública y busca el certificado.
2. **Búsqueda Doble:** Puede buscar tecleando la Matrícula, el Folio del certificado, o utilizando el Hash de seguridad de 16 caracteres.
3. **Escaneo QR:** Si tiene el PDF impreso, al escanear el QR aterriza directamente en `/verify/[folio-o-hash]`.
4. **Restricción Administrativa:** Si el estado del certificado es `revoked` o `expired` (bloqueado por fraude, deudas de pago o falta de documentos), la UI lo muestra en alerta roja y bloquea la descarga del archivo PDF oficial.
5. **Descarga en Demanda:** Si está `active`, el sistema ensambla la Plantilla visual con los Datos del JSON y entrega un PDF de alta calidad firmado y sellado al instante.

**✅ Estado General:** Muy seguro. La lógica de generación en el momento (On-Demand) evita que personas descarguen PDFs de certificados revocados, y la doble validación por Hash impide falsificaciones de folios.
**🚧 Punto de Mejora:**
- El generador de PDFs (jsPDF) se ejecuta en el cliente (Navegador). Si la plantilla tiene muchas imágenes en alta resolución, la generación puede ser lenta en celulares antiguos. *Mejora: En un futuro de alta demanda, mover la generación de PDFs al backend (Serverless/Edge Functions).*

---

## Conclusión Ejecutiva del Análisis

**Nivel de Salud del Sistema:** 🌟 9/10 (Listo para Producción)
El proyecto ha transicionado exitosamente de un prototipo acoplado a una arquitectura de nivel empresarial (`Clean Architecture`). Todos los actores tienen su "carril" de trabajo, los datos cruzan validaciones antes de guardarse, y nunca se pierde la información gracias a los historiales y "Soft Deletes".

**Roadmap Estratégico (Lo que sigue para alcanzar el 10/10):**
1. Validación de correos institucionales en el registro.
2. Procesamiento de Excel en Lotes (Batch) para carga masiva sin riesgos.
3. Alertas por correo automatizadas en cambios de estado (Verificado/Rechazado).
4. Generación de PDF asíncrona en servidor para aligerar la carga móvil.