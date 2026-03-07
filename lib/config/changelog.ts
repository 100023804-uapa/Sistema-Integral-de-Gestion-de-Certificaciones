export const APP_VERSION = "1.2.1";

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
        version: "1.2.1",
        date: "2026-03-07",
        title: "Potenciador del Editor de Plantillas",
        description: "Se mejoro significativamente la experiencia de diseno y vista previa de certificados.",
        details: [
            { type: 'improvement', text: 'Nueva Vista Previa Inmersiva: el modal ahora ocupa el 95% de la pantalla para una visualizacion real.' },
            { type: 'improvement', text: 'Sincronizacion de Vista Previa: la lista de plantillas ahora muestra el contenido real en lugar de bocetos.' },
            { type: 'improvement', text: 'Placeholders Dinamicos: se estandarizo el uso de {{variable}} y se agregaron nuevos campos como Sello e Imagen de Firma.' },
            { type: 'improvement', text: 'Interfaz Limpia: se eliminaron bordes grises y distracciones en el modo de previsualizacion.' },
            { type: 'fix', text: 'Correccion de iconos y navegacion en las pantallas de creacion y edicion de plantillas.' }
        ]
    },
    {
        version: "1.2.0",
        date: "2026-03-07",
        title: "Mejoras operativas y experiencia movil",
        description: "Se agilizo el trabajo diario con nuevos apoyos para certificados, participantes y navegacion del panel.",
        details: [
            { type: 'feature', text: 'Nueva busqueda de participantes para completar certificados mas rapido y con menos errores.' },
            { type: 'feature', text: 'Ahora se puede anular un certificado y abrir una correccion con los datos ya precargados.' },
            { type: 'feature', text: 'Los participantes ya cuentan con vista y formulario de edicion desde su perfil.' },
            { type: 'improvement', text: 'La navegacion movil quedo mas clara, con accesos rapidos y un menu adicional para el resto de opciones.' },
            { type: 'improvement', text: 'Se mejoro el espaciado y la organizacion visual en varias pantallas administrativas.' },
            { type: 'improvement', text: 'Los tipos de certificado y los programas academicos ayudan a completar formularios de forma mas guiada.' },
            { type: 'feature', text: 'La gestion de usuarios ahora permite habilitar o deshabilitar accesos de forma mas clara.' }
        ]
    },
    {
        version: "1.1.0",
        date: "2026-03-05",
        title: "Correo institucional y gestion de usuarios",
        description: "Se mejoro la administracion de usuarios y la configuracion del correo del sistema desde la propia interfaz.",
        details: [
            { type: 'feature', text: 'Nuevo panel para definir el correo emisor que usa el sistema en sus notificaciones.' },
            { type: 'feature', text: 'Las solicitudes de acceso ahora pueden aprobarse con asignacion directa del rol correspondiente.' },
            { type: 'improvement', text: 'La vista de usuarios muestra mejor el estado actual de cada acceso y sus roles.' },
            { type: 'improvement', text: 'El flujo de alta de usuarios quedo mas claro para administradores y responsables.' }
        ]
    },
    {
        version: "1.0.0",
        date: "2026-03-05",
        title: "Version institucional completa",
        description: "La plataforma ya cubre el flujo principal de emision, validacion y seguimiento de certificados.",
        details: [
            { type: 'feature', text: 'Gestion completa de recintos, areas academicas y tipos de certificado.' },
            { type: 'feature', text: 'Seguimiento del estado de cada certificado durante su proceso.' },
            { type: 'feature', text: 'Plantillas visuales para generar certificados con mejor presentacion.' },
            { type: 'feature', text: 'Panel general con reportes y resumen de actividad.' },
            { type: 'feature', text: 'Validacion publica mas confiable para confirmar la autenticidad del documento.' },
            { type: 'improvement', text: 'Mejor experiencia de uso en distintas pantallas y resoluciones.' }
        ]
    },
    {
        version: "0.5.0",
        date: "2026-02-19",
        title: "Envio de certificados y documentos mas estables",
        description: "Se facilito la entrega de certificados y se mejoro la consistencia al generar los documentos.",
        details: [
            { type: 'feature', text: 'Envio de certificados por correo directamente desde el sistema.' },
            { type: 'fix', text: 'Se corrigieron fallos que afectaban la generacion correcta del documento final.' },
            { type: 'improvement', text: 'Mejor retroalimentacion visual en acciones de descarga y envio.' },
            { type: 'improvement', text: 'Se reforzo la estabilidad general del flujo de emision.' }
        ]
    },
    {
        version: "0.4.0",
        date: "2026-02-19",
        title: "Plantillas y mejoras visuales",
        description: "Se fortalecio la presentacion de los certificados y se mejoro la apariencia general del sistema.",
        details: [
            { type: 'feature', text: 'Descarga de certificados con plantilla visual y codigo QR.' },
            { type: 'feature', text: 'Seleccion de diseno al crear nuevos certificados.' },
            { type: 'feature', text: 'Nueva pagina informativa sobre el proyecto y el equipo.' },
            { type: 'improvement', text: 'Dashboard y perfil de usuario con una presentacion mas cuidada.' },
            { type: 'fix', text: 'Se corrigieron problemas visuales que afectaban imagenes y fondos.' }
        ]
    },
    {
        version: "0.3.0",
        date: "2026-02-19",
        title: "Participantes y consulta publica",
        description: "Se amplio el control sobre participantes y se hizo mas util la consulta publica de certificados.",
        details: [
            { type: 'feature', text: 'Consulta publica de certificados por matricula o folio.' },
            { type: 'feature', text: 'Creacion y edicion manual de participantes.' },
            { type: 'feature', text: 'Descarga de plantillas para cargas masivas de participantes y certificados.' },
            { type: 'improvement', text: 'Importacion mas flexible para distintos tipos de carga.' },
            { type: 'improvement', text: 'Pantalla de acceso mas clara y orientada a la consulta publica.' }
        ]
    },
    {
        version: "0.2.0",
        date: "2026-02-18",
        title: "Mejoras de uso y correcciones",
        description: "Se pulieron flujos existentes para que el sistema fuera mas comodo y confiable desde el dia a dia.",
        details: [
            { type: 'improvement', text: 'Mayor precision al mover elementos dentro del editor de plantillas.' },
            { type: 'improvement', text: 'Presentacion mas consistente en formularios y opciones de configuracion.' },
            { type: 'fix', text: 'Correcciones en validaciones y comportamientos del sistema.' },
            { type: 'improvement', text: 'Nuevo historial de cambios visible desde la interfaz.' },
            { type: 'feature', text: 'Indicadores mas claros en acciones relacionadas con participantes.' }
        ]
    },
    {
        version: "0.1.0",
        date: "2026-02-15",
        title: "Lanzamiento inicial",
        description: "Primera version funcional de SIGCE para administrar certificados y participantes desde un mismo panel.",
        details: [
            { type: 'feature', text: 'Creacion y consulta de certificados.' },
            { type: 'feature', text: 'Base de participantes centralizada.' },
            { type: 'feature', text: 'Acceso de usuarios con distintos permisos.' },
            { type: 'feature', text: 'Panel inicial con informacion general del sistema.' }
        ]
    }
];
