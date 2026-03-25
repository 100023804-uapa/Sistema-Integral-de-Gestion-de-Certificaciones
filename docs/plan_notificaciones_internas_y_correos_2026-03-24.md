# Plan de Notificaciones Internas y Correos

## Objetivo

Definir un sistema unificado de notificaciones internas y correo transaccional para SIGCE que:

- no dependa de datos hardcodeados;
- funcione por usuario y por rol;
- permita marcar como leidas, no leidas y eliminar;
- mantenga historial operativo;
- reutilice los eventos reales del sistema;
- separe claramente lo que es correo y lo que es notificacion interna.

## Estado actual

### Lo que ya existe

- El proveedor de correo operativo ya funciona por variables de entorno y soporta `resend` y `gmail`.
- Ya existen notificaciones por correo para estos eventos:
  - invitacion de usuario interno;
  - envio a verificacion;
  - devolucion a borrador;
  - solicitud de firma;
  - resultado de firma;
  - certificado emitido;
  - bloqueo de certificado;
  - liberacion de restriccion.

### Lo que esta mal o incompleto

- La campana del dashboard usa datos mock.
- No existe una coleccion real de notificaciones internas.
- No existe estado `read/unread/deleted` persistido por usuario.
- No existe API para listar notificaciones del usuario autenticado.
- No existe una relacion formal entre un evento de negocio y sus canales:
  - notificacion interna;
  - correo;
  - ambos.
- Hoy el fanout por rol solo existe en algunos correos, pero no en una capa centralizada.

## Diagnostico del problema

La necesidad del negocio no es solo “mandar correos”. El sistema necesita un modelo de eventos y entregas.

Si una notificacion depende solo del rol, no se puede marcar como leida o borrada de forma individual. Por eso el modelo correcto no es guardar una sola notificacion “para el rol verificador”, sino generar una copia por usuario destinatario.

## Principio de diseño

### Regla principal

Toda notificacion visible en la campana debe existir como un registro persistido para un destinatario concreto.

Eso implica:

- una notificacion se origina por un evento;
- el sistema resuelve destinatarios por usuario, por rol o por ambos;
- el sistema crea una entrada por destinatario;
- cada destinatario maneja su propio estado:
  - no leida;
  - leida;
  - eliminada.

## Modelo recomendado

### Opcion recomendada

Usar una coleccion superior `notifications` con una fila por destinatario.

### Estructura sugerida

```ts
notifications/{notificationId}
```

Campos:

```ts
{
  recipientUid: string,
  recipientType: 'internal' | 'student',
  recipientRoleSnapshot?: string,

  type: string,
  category: 'workflow' | 'signature' | 'restriction' | 'access' | 'system',
  priority: 'low' | 'medium' | 'high',

  title: string,
  body: string,
  ctaLabel?: string,
  ctaHref?: string,

  entityType?: 'certificate' | 'student' | 'internal_user' | 'signature_request' | 'program',
  entityId?: string,

  actorUid?: string,
  actorName?: string,

  readAt?: Timestamp | null,
  deletedAt?: Timestamp | null,

  createdAt: Timestamp,
  updatedAt: Timestamp,

  sourceEvent: {
    key: string,
    dedupeKey?: string,
  },

  delivery: {
    inApp: {
      created: boolean,
    },
    email?: {
      attempted: boolean,
      sent: boolean,
      provider?: string,
      messageId?: string,
      error?: string,
      sentAt?: Timestamp | null,
    }
  }
}
```

## Por que no guardar notificaciones “por rol”

Porque el usuario pidio estas capacidades:

- ver;
- dejar como no leida;
- marcar como leida;
- borrar individualmente.

Eso solo funciona bien si la notificacion ya esta materializada para ese usuario.

El rol debe servir para resolver destinatarios, no para ser la unidad de lectura.

## Flujos recomendados entre correos y notificaciones

## Regla general de canales

- Notificacion interna:
  - para trabajo pendiente dentro del sistema;
  - para recordatorios operativos;
  - para acciones que se resuelven entrando al panel.

- Correo:
  - para avisos externos o importantes;
  - para usuarios que pueden no estar conectados;
  - para acciones de activacion, firma o disponibilidad.

- Ambos:
  - cuando el evento es importante y ademas requiere seguimiento dentro del panel.

## Matriz sugerida

### 1. Usuario interno creado

- Destinatario: usuario interno creado.
- In-app: si ya puede iniciar sesion, si.
- Correo: si.
- Canal recomendado: ambos.
- Motivo: activacion y visibilidad de acceso.

### 2. Certificado enviado a verificacion

- Destinatarios:
  - verificadores activos;
  - administradores activos.
- In-app: si.
- Correo: si, pero configurable.
- Canal recomendado: ambos para verificador, opcional para admin.

### 3. Certificado devuelto a borrador

- Destinatario:
  - quien hizo el envio previo o responsable del certificado.
- In-app: si.
- Correo: si.
- Canal recomendado: ambos.

### 4. Solicitud de firma

- Destinatario:
  - firmante asignado.
- In-app: si.
- Correo: si.
- Canal recomendado: ambos.

### 5. Firma aprobada o rechazada

- Destinatario:
  - solicitante de la firma;
  - opcional administrador.
- In-app: si.
- Correo: si.
- Canal recomendado: ambos.

### 6. Certificado emitido

- Destinatario:
  - participante.
- In-app: si, en portal del participante.
- Correo: si.
- Canal recomendado: ambos.

### 7. Restriccion aplicada

- Destinatarios:
  - participante;
  - coordinadores y administradores relacionados.
- In-app: si.
- Correo: si.
- Canal recomendado: ambos.

### 8. Restriccion liberada

- Destinatarios:
  - participante;
  - coordinadores y administradores relacionados.
- In-app: si.
- Correo: si.
- Canal recomendado: ambos.

### 9. Reinicio de acceso del participante

- Destinatario:
  - participante.
- In-app: no necesariamente, porque puede no entrar aun.
- Correo: si.
- Canal recomendado: correo.

### 10. Hallazgos de integridad o alertas de sistema

- Destinatarios:
  - administradores;
  - opcional coordinadores.
- In-app: si.
- Correo: opcional, solo si es severo.
- Canal recomendado: in-app por defecto.

## Personalizacion por usuario y por rol

## Regla

El motor debe soportar 3 modos de resolucion:

### A. Destino explicito por usuario

Ejemplo:

- el coordinador que devolvio un certificado;
- el firmante asignado;
- el participante del certificado.

### B. Destino por rol

Ejemplo:

- todos los verificadores;
- todos los administradores.

### C. Destino por rol mas alcance

Esto es lo ideal a mediano plazo.

Ejemplo:

- solo verificadores del recinto X;
- solo coordinadores del area academica Y;
- solo firmantes asignados a cierto dominio.

## Recomendacion tecnica

El sistema debe resolver destinatarios con un servicio central:

```ts
resolveNotificationRecipients(event)
```

Ese servicio:

- recibe el evento;
- evalua destinatarios explicitos;
- evalua destinatarios por rol;
- evita duplicados;
- devuelve una lista final de usuarios concretos.

## Comportamiento esperado en UI

## Dropdown de campana

Debe mostrar:

- contador real de no leidas;
- ultimas 10 o 15 notificaciones;
- estado visual de no leida;
- boton para marcar como leida al abrir o al pulsar;
- boton para volver a dejar como no leida;
- boton de borrar al lado de cada item;
- accion `Marcar todas como leidas`.

## Pantalla completa

Conviene crear despues:

```txt
/dashboard/notifications
```

Con:

- filtro `Todas / No leidas / Leidas / Eliminadas`;
- filtro por categoria;
- busqueda;
- borrado individual;
- borrado multiple;
- paginacion.

## Semantica de estado

No recomiendo hard delete inmediato.

### Mejor opcion

- `readAt = null` => no leida
- `readAt != null` => leida
- `deletedAt != null` => eliminada

Ventajas:

- no pierdes trazabilidad;
- permite restaurar si luego hace falta;
- evita inconsistencias en auditoria.

## Eventos que deben disparar notificaciones

## Flujo de certificados

- `certificate.sent_to_review`
- `certificate.returned_to_draft`
- `certificate.verified`
- `certificate.signature_requested`
- `certificate.signature_signed`
- `certificate.signature_rejected`
- `certificate.issued`
- `certificate.available`
- `certificate.cancelled`

## Flujo de restricciones

- `certificate.restriction_applied`
- `certificate.restriction_released`

## Flujo de acceso interno

- `internal_user.invited`
- `internal_user.activated`
- `internal_user.role_changed`
- `internal_user.disabled`

## Flujo de participante

- `student.portal_access_enabled`
- `student.password_reset_temp_issued`
- `student.must_change_password`

## Flujo institucional

- `academic_program.created`
- `academic_program.updated`

Este ultimo grupo no debe notificar por correo por defecto.

## Arquitectura recomendada

## Capa 1: eventos de dominio

Cada flujo del sistema llama un servicio comun:

```ts
emitNotificationEvent({
  key: 'certificate.signature_requested',
  actorUid,
  entityId,
  payload,
})
```

## Capa 2: resolucion de destinatarios

```ts
resolveNotificationRecipients(event)
```

Salida:

```ts
[
  { uid: '...', roleCode: 'signer', email: '...' },
  { uid: '...', roleCode: 'administrator', email: '...' }
]
```

## Capa 3: fabricacion de contenido

```ts
buildNotificationContent(event, recipient)
```

Salida:

```ts
{
  title,
  body,
  ctaLabel,
  ctaHref,
  category,
  priority,
  sendEmail: true | false
}
```

## Capa 4: persistencia y entrega

- crear notificacion interna por destinatario;
- si aplica, enviar correo;
- guardar el resultado del correo dentro del mismo registro o en log separado.

## Integracion con lo que ya existe

## Lo que puede reutilizarse

- [lib/email/provider.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/email/provider.ts)
- [lib/server/certificateWorkflowNotifications.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/server/certificateWorkflowNotifications.ts)
- [lib/server/internalUsers.ts](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/lib/server/internalUsers.ts)

## Lo que debe cambiar

- [app/dashboard/page.tsx](C:/Users/LENOVO%20i7%207TH%20GAMERS/Documents/sigce/Sistema-Integral-de-Gestion-de-Certificaciones/app/dashboard/page.tsx)
  - quitar mock notifications;
  - consumir notificaciones reales;
  - agregar acciones `leer / no leida / borrar`.

- `certificateWorkflowNotifications.ts`
  - dejar de ser solo “servicio de correo”;
  - convertirlo en disparador de eventos y canales.

## Migracion recomendada

### Fase 1

- crear coleccion `notifications`;
- crear API de listado del usuario autenticado;
- reemplazar campana mock por feed real;
- soportar:
  - listar;
  - marcar una como leida;
  - marcar todas como leidas;
  - borrar.

### Fase 2

- conectar eventos reales de workflow:
  - verificacion;
  - borrador;
  - firma;
  - emision;
  - restriccion.

### Fase 3

- conectar participante;
- agregar preferencias por canal si luego se necesita;
- agregar vista completa `/dashboard/notifications`.

## Lo que no recomiendo

- No dejar notificaciones solo como correo.
- No guardar una sola notificacion por rol sin materializar destinatarios.
- No borrar fisicamente por defecto.
- No mezclar configuracion tecnica del correo con preferencias personales del usuario.

## Conclusion

El rediseño correcto no es “hacer que la campana funcione”. El rediseño correcto es:

1. centralizar eventos;
2. resolver destinatarios por usuario y rol;
3. persistir notificaciones por destinatario;
4. usar el correo como canal adicional, no como sustituto;
5. quitar completamente el mock del dashboard.

Con ese enfoque, SIGCE puede tener notificaciones reales, auditables, personalizadas y coherentes con los flujos del sistema.
