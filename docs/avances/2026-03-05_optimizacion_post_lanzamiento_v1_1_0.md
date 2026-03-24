# Avance: Optimización Post-Lanzamiento y Servidor de Correos Centralizado (v1.1.0)

**Fecha:** 5 de Marzo de 2026
**Estado:** ✅ Completado

## 🎯 Mejoras Implementadas

Tras la consolidación de la versión 1.0.0 y el análisis de flujos *End-to-End*, se detectaron oportunidades de mejora en la gestión de roles y la arquitectura de notificaciones. En esta sesión de trabajo, el sistema ha sido ascendido a la **versión 1.1.0** implementando las siguientes soluciones:

### 1. Servidor de Correos Centralizado (Desacoplamiento)
Se eliminó la dependencia directa (Hardcoded) de variables de entorno estáticas para el envío de correos, transicionando hacia un modelo de base de datos configurable en tiempo real.

- **`IEmailService`:** Se diseñó una interfaz en el dominio (`lib/domain/services/IEmailService.ts`) aislando al sistema de cualquier proveedor específico.
- **Implementación `Nodemailer`:** Se inyectó la lógica de envío bajo esta abstracción. Si a futuro la universidad migra a *Amazon SES* o *Resend*, el código de la interfaz de usuario no sufrirá cambios.
- **Configuración Gráfica:** Se añadió un formulario completo en `/dashboard/settings` exclusivo para Administradores. Permite configurar el usuario, contraseña de aplicación (App Password) y el Nombre del Remitente dinámicamente.

### 2. Asignación Dinámica de Roles (Onboarding Refinado)
El sistema arrastraba un defecto del MVP donde aprobar una solicitud de acceso convertía automáticamente al usuario en "Administrador total". Esto se corrigió drásticamente:

- **Modal de Aprobación:** Al hacer clic en "Evaluar" solicitud, el sistema despliega una ventana flotante (Modal).
- **Selector de Cargo:** El modal consulta los roles reales disponibles en la base de datos (Coordinador, Verificador, Firmante) y exige asignar un cargo antes de aprobar el acceso.
- **Listado Consolidado:** La tabla de "Usuarios" dejó de mostrar solo a los administradores; ahora lista a todo el personal institucional con su respectiva insignia de rol asignada en colores claros, e incluye un botón de **Edición Rápida** para cambios de cargo inmediatos.

---
**Conclusión Técnica:** La arquitectura del proyecto sigue robusteciéndose, cumpliendo con los estándares *Clean Architecture*. El sistema de notificación ahora es configurable y la gobernanza de usuarios es 100% granular y exacta.