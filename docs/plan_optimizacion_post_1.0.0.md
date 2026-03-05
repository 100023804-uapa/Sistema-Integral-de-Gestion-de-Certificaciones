# Plan de Optimización Post-Lanzamiento (v1.1.0)

**Fecha:** 5 de Marzo de 2026
**Objetivo:** Guiar la corrección de deficiencias detectadas en la Auditoría Arquitectónica de la v1.0.0, limpiar el sistema de código Legacy y endurecer las políticas de borrado e interfaz de usuario.

---

Este plan está dividido en **3 Fases de Optimización** secuenciales:

## Fase 1: Limpieza Estructural y de Navegación (Quick Wins)
**Objetivo:** Sincronizar la interfaz de usuario con la arquitectura real y eliminar riesgos heredados del MVP.

1. **Eliminación de Código Legacy:**
   - Borrar completamente el directorio `app/dashboard/templates/` (Reemplazado por `certificate-templates`).
   - Verificar si existen componentes asociados a ese viejo módulo que ya no se usen.
2. **Actualización de la Barra Lateral (`Sidebar.tsx`):**
   - Integrar un acceso directo a **Reportes** bajo la sección de "Resumen General".
   - Integrar un acceso directo a **Validar Código QR** en "Gestión de Certificados".
   - Integrar un acceso a **Usuarios y Permisos** bajo "Administración".

## Fase 2: Implementación Estricta de "Soft Deletes" (Borrados Lógicos)
**Objetivo:** Garantizar el cumplimiento normativo universitario evitando la destrucción permanente de registros en base de datos.

1. **Auditoría de Repositorios:**
   - Identificar todas las funciones que ejecutan `deleteDoc()` en la carpeta `lib/infrastructure/repositories/`.
2. **Refactorización de Borrados:**
   - Modificar las funciones `delete()` para que utilicen `updateDoc()` estableciendo una bandera `isActive: false` (o `deletedAt: Timestamp`).
   - Actualizar las consultas `list()` y `findAll()` en los repositorios para que por defecto filtren y solo devuelvan documentos donde `isActive: true`.
3. **Módulos Críticos a intervenir:**
   - Áreas Académicas.
   - Recintos.
   - Tipos de Certificados.

## Fase 3: Renderizado Condicional por Roles (RBAC Visual)
**Objetivo:** Mejorar la UX ocultando botones, formularios y accesos a los que el usuario logueado no tiene permisos.

1. **Expansión del Contexto de Autenticación (`AuthContext.tsx`):**
   - Asegurar que el contexto devuelva el rol o los permisos reales del usuario desde Firebase (ej. `user.role === 'verifier'`).
2. **Creación de Componentes de Autorización UI:**
   - Crear un componente envoltorio (ej. `<RequireRole allowedRoles={['admin', 'coordinator']}> ... </RequireRole>`).
3. **Aplicación en el Dashboard:**
   - **Sidebar:** Ocultar menús administrativos ("Usuarios", "Configuración Institucional") a roles operativos.
   - **Vistas:** Ocultar el botón "+ Nuevo Certificado" a Verificadores y Firmantes.
   - **Listados:** Ocultar el botón de "Eliminar" / "Papelera" a usuarios sin rol de Administrador.

---
**Criterio de Éxito Global:** Al finalizar este plan, el sistema no tendrá código inútil, los menús reflejarán el 100% de las características, ninguna data podrá ser destruida físicamente por accidente, y la interfaz se adaptará dinámicamente al cargo del usuario en la universidad.