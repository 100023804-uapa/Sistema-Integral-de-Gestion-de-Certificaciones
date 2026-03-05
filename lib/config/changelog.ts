export const APP_VERSION = "1.1.0";

export interface Release {
    version: string;
    date: string;
    title: string;
    description: string;
    details: {
        type: 'feature' | 'fix' | 'improvement';
        text: string;
    }[];
}

export const CHANGELOG: Release[] = [
    {
        version: "1.1.0",
        date: "2026-03-05",
        title: "Arquitectura de Correo Desacoplada y Asignación de Roles",
        description: "Se implementó un servidor de correos centralizado configurable por interfaz y se refinó la asignación dinámica de roles.",
        details: [
            { type: 'feature', text: 'Email Centralizado: Nuevo panel de configuración para credenciales de correo institucionales.' },
            { type: 'feature', text: 'Arquitectura Desacoplada: Creación del `IEmailService` para aislar Nodemailer del frontend.' },
            { type: 'improvement', text: 'Onboarding Dinámico: Modal interactivo para asignar cargos específicos (Ej: Verificador) durante la aprobación de usuarios.' },
            { type: 'improvement', text: 'Auditoría Total: Panel de usuarios expandido para mostrar a todos los usuarios activos y sus roles.' }
        ]
    },
    {
        version: "1.0.0",
        date: "2026-03-05",
        title: "Release Candidate 1 - Sistema Institucional Completo",
        description: "Lanzamiento oficial de la versión 1.0.0. Implementación exitosa de las fases 1 a la 4, incluyendo gobernanza, ciclo de vida, firmas digitales y analíticas avanzadas.",
        details: [
            { type: 'feature', text: 'Gobernanza Institucional (Fase 1): Gestión de recintos, áreas académicas y tipos de certificado.' },
            { type: 'feature', text: 'Ciclo de Vida (Fase 2): Sistema de estados, trazabilidad e integración de firma digital.' },
            { type: 'feature', text: 'Diseño y PDF (Fase 3): Editor de plantillas dinámicas y generación de certificados en alta calidad.' },
            { type: 'feature', text: 'Analíticas y Auditoría (Fase 4): Dashboard macro, métricas por recinto, reportes exportables a Excel/CSV.' },
            { type: 'feature', text: 'Seguridad (US-13): Implementación de Código Hash Público de 16 caracteres para validación irrefutable.' },
            { type: 'improvement', text: 'UI/UX Responsiva: Optimización de la interfaz en todas las pantallas (Scrollbars personalizados, Grids dinámicos).' },
            { type: 'fix', text: 'Core: Resolución de dependencias Node.js filtradas al cliente (error firebase-admin).' }
        ]
    },
    {
        version: "0.5.0",
        date: "2026-02-19",
        title: "Integración de Correo y PDFs Estables",
        description: "Implementación de envío de certificados por correo electrónico (Gmail) y solución definitiva a problemas de generación de PDF.",
        details: [
            { type: 'feature', text: 'Envío de Email: Envío real de certificados usando Gmail/Nodemailer.' },
            { type: 'fix', text: 'Corrección PDF: Solución a PDFs en blanco asegurando carga de recursos.' },
            { type: 'feature', text: 'Documentación: Guía de límites de recursos y estrategias de escalado (MVP).' },
            { type: 'improvement', text: 'UI: Ajustes en botones de acción y feedback visual de carga.' }
        ]
    },
    {
        version: "0.4.0",
        date: "2026-02-19",
        title: "Plantillas, PDF y Mejoras Visuales",
        description: "Integración completa de generación de PDFs con plantillas, mejoras significativas en la interfaz de usuario y corrección de errores de despliegue.",
        details: [
            { type: 'feature', text: 'Generación de PDF: Descarga de certificados con diseño dinámico (plantilla o defecto) y códigos QR.' },
            { type: 'feature', text: 'Gestión de Plantillas: Selección de diseño al crear nuevos certificados.' },
            { type: 'feature', text: 'Página "Sobre Nosotros": Nueva sección informativa del equipo.' },
            { type: 'improvement', text: 'Dashboard UI: Header rediseñado (Avatar y Notificaciones más grandes).' },
            { type: 'improvement', text: 'Perfil de Usuario: Carga y actualización de foto de perfil con feedback visual.' },
            { type: 'fix', text: 'Corrección de CORS en Firebase Storage para visualización de imágenes.' },
            { type: 'fix', text: 'Solución a error 404 en patrón de fondo (grid-pattern).' }
        ]
    },
    {
        version: "0.3.0",
        date: "2026-02-19",
        title: "Gestión Avanzada de Participantes y Consulta Pública",
        description: "Implementación completa de la consulta pública de certificados, gestión manual de participantes y herramientas de carga masiva.",
        details: [
            { type: 'feature', text: 'Consulta Pública: Nueva pantalla de búsqueda de certificados por Matrícula o Folio.' },
            { type: 'feature', text: 'Gestión de Participantes: Creación manual y edición de participantes.' },
            { type: 'feature', text: 'Plantillas de Carga Masiva: Descarga de plantillas Excel personalizadas para participantes y certificados.' },
            { type: 'improvement', text: 'Importación Inteligente: Detección automática de carga de certificados vs solo participantes.' },
            { type: 'improvement', text: 'UI Login: Rediseño enfocado en la consulta pública.' },
            { type: 'fix', text: 'Corrección en validación de tipos de usuario en login.' }
        ]
    },
    {
        version: "0.2.0",
        date: "2026-02-18",
        title: "Mejoras de UX y Correcciones",
        description: "Optimización del editor de plantillas, corrección de estilos y resolución de errores de compilación.",
        details: [
            { type: 'feature', text: 'Mejora en precisión Drag & Drop para editor de plantillas.' },
            { type: 'improvement', text: 'Estandarización de estilos en configuración de prefijos.' },
            { type: 'fix', text: 'Resolución de errores de compilación en Next.js 15 (Params y Tipos).' },
            { type: 'fix', text: 'Corrección en validación de certificados por folio.' },
            { type: 'improvement', text: 'Nueva modal de historial de cambios y versiones.' },
            { type: 'feature', text: 'Indicador de estado en botón "Nuevo Estudiante".' }
        ]
    },
    {
        version: "0.1.0",
        date: "2026-02-15",
        title: "Lanzamiento Inicial",
        description: "Versión inicial de la plataforma SIGCE para gestión de certificados.",
        details: [
            { type: 'feature', text: 'Gestión de Certificados (Crear, Listar).' },
            { type: 'feature', text: 'Base de datos de Graduados.' },
            { type: 'feature', text: 'Autenticación con Firebase y Roles.' },
            { type: 'feature', text: 'Dashboard con estadísticas en tiempo real.' },
        ]
    }
];
