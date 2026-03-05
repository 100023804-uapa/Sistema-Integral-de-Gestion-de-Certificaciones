# Auditoría Arquitectónica y Revisión de Integración (Versión 1.0.0)

**Fecha:** 5 de Marzo de 2026
**Objetivo:** Analizar la arquitectura del sistema SIGCE tras la implementación de las Fases 1 a 4, verificar el nivel de desacoplamiento del antiguo sistema MVP (Legacy), y detectar deficiencias o áreas de mejora en la integración de módulos.

---

## 1. Nivel de Desacoplamiento (Frontend vs Infraestructura)
**Estado:** ✅ EXCELENTE

El mayor riesgo del sistema Legacy (MVP) era que la interfaz de usuario (`app/` y `components/`) estaba acoplada directamente a la base de datos (Firestore). Tras la revisión, se confirma que el refactor fue un éxito absoluto:
- **Ausencia de acoplamiento directo:** No existe ninguna llamada directa a `firebase/firestore` (ej. `getDocs`, `collection`) desde los componentes visuales o páginas de Next.js.
- **Inyección de Dependencias:** Todo el flujo de datos pasa obligatoriamente por el contenedor central (`lib/container.ts`), el cual provee Casos de Uso y Repositorios abstractos.
- **Ventaja a largo plazo:** Si la universidad decide migrar su base de datos de Firebase a SQL (PostgreSQL/MySQL), no será necesario tocar ni una sola línea de código de las pantallas de React; bastará con crear un nuevo Repositorio.

## 2. Integración de Módulos
**Estado:** ✅ MUY BUENO

Los módulos implementados durante las 4 fases se comunican correctamente en el backend:
- **Gobernanza Institucional:** La creación de certificados exige la presencia de un `campusId` (Recinto), relacionando firmemente el módulo de certificados con el módulo institucional.
- **Historial y Auditoría:** Los estados (Borrador, Verificado, Firmado) interactúan de forma nativa con la colección de historiales (`certificateStates`), logrando la trazabilidad requerida por la universidad.
- **Reportes Macro:** El Dashboard cruza eficientemente datos entre Tipos de Certificado, Recintos y Áreas Académicas para mostrar analíticas en tiempo real.

## 3. Restos del Sistema Legacy (Basura Técnica)
**Estado:** ⚠️ ATENCIÓN REQUERIDA

Se detectaron componentes obsoletos del MVP que no fueron eliminados al lanzar los nuevos módulos:
- **Duplicidad de Plantillas:** Existe un directorio huérfano en `app/dashboard/templates/` (Sistema Legacy de drag & drop obsoleto). La ruta correcta y funcional implementada en la Fase 3 es `app/dashboard/certificate-templates/`. Mantener ambos puede causar confusión o brechas de seguridad.

## 4. Deficiencias en la Navegación y UI (Menús Huérfanos)
**Estado:** ⚠️ ATENCIÓN REQUERIDA

El menú lateral (`Sidebar.tsx`) no ha evolucionado a la par que el sistema. Existen pantallas funcionales de alto valor que carecen de un acceso directo en el menú:
- **Gestión de Usuarios (`/dashboard/users`):** Indispensable para asignar roles (Administrador, Firmante, etc.). Actualmente solo es accesible desde un botón de "Acciones Rápidas" en el inicio.
- **Reportes (`/dashboard/reports`):** El módulo estrella de la Fase 4 no está en la barra lateral.
- **Validación de QR (`/dashboard/validate`):** Herramienta crucial para verificadores internos que no tiene menú dedicado.

## 5. Deficiencias Arquitectónicas y de Seguridad Lógica
**Estado:** 🚧 ÁREAS DE MEJORA (Recomendaciones)

Pensando en la escala institucional a futuro, se detectaron los siguientes puntos a optimizar:
- **Borrado Físico vs Borrado Lógico (Soft Deletes):** Algunos repositorios siguen utilizando comandos que destruyen la data físicamente (`deleteDoc()`). En sistemas universitarios, la información NUNCA debe borrarse permanentemente. Todo borrado debe ser un "Soft Delete" (marcar como `isActive: false`).
- **Renderizado Condicional basado en Roles (RBAC UI):** Aunque la seguridad del servidor es robusta (el servidor bloqueará acciones no permitidas), la interfaz gráfica no es consciente de los roles en tiempo real. Un usuario con rol de "Verificador" sigue viendo el botón "Crear Certificado". Ocultar opciones según el rol mejorará drásticamente la experiencia del usuario y evitará confusiones operativas.

---
**Conclusión:** La arquitectura base es sólida, segura y modular. Las deficiencias encontradas son en su mayoría restos estéticos del MVP y oportunidades de endurecimiento (Hardening) que deben ser abordadas en un plan de optimización post-lanzamiento.