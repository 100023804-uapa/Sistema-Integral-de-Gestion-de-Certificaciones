import { getCertificateRepository } from '@/lib/container';
import { getAdminDb } from '@/lib/firebaseAdmin';
import {
  createNotificationFanoutWithEmailResult,
  resolveStudentNotificationTarget,
} from '@/lib/server/notifications';
import { sendOperationalEmail } from '@/lib/server/operationalEmail';
import type { SignatureRequest } from '@/lib/types/digitalSignature';
import { getInternalUser, listInternalUsers } from '@/lib/server/internalUsers';
import type { CertificateRestrictionType } from '@/lib/types/certificateRestriction';
import { getRestrictionTypeLabel } from '@/lib/types/certificateRestriction';
import { getCertificateStatusLabel } from '@/lib/types/certificateStatus';

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  );
}

async function getCertificateSummary(certificateId: string) {
  const certificate = await getCertificateRepository().findById(certificateId);
  if (!certificate) {
    return null;
  }

  return {
    id: certificate.id,
    folio: certificate.folio,
    studentName: certificate.studentName,
    academicProgram: certificate.academicProgram,
  };
}

async function getStudentEmail(studentId: string): Promise<string | null> {
  const doc = await getAdminDb().collection('students').doc(studentId).get();
  const email = doc.data()?.email;
  return typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
}

export async function notifyPendingReview(
  certificateId: string,
  comments?: string
): Promise<void> {
  const certificate = await getCertificateSummary(certificateId);
  if (!certificate) return;

  const recipients = (await listInternalUsers()).filter(
    (user) =>
      user.status !== 'disabled' &&
      (user.roleCode === 'verifier' || user.roleCode === 'administrator') &&
      user.email
  );

  if (recipients.length === 0) {
    return;
  }

  const emailResult = await sendOperationalEmail({
    to: recipients.map((recipient) => recipient.email),
    subject: `SIGCE: certificado ${certificate.folio} enviado a verificación`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #0f172a;">Certificado pendiente de verificación</h2>
        <p><strong>Folio:</strong> ${certificate.folio}</p>
        <p><strong>Participante:</strong> ${certificate.studentName}</p>
        <p><strong>Programa:</strong> ${certificate.academicProgram}</p>
        ${comments ? `<p><strong>Comentario:</strong> ${comments}</p>` : ''}
        <p style="margin-top: 24px;">
          <a href="${getBaseUrl()}/dashboard/certificate-states" style="background: #0f172a; color: white; text-decoration: none; padding: 12px 18px; border-radius: 6px;">
            Revisar pendientes
          </a>
        </p>
      </div>
    `,
  });

  await createNotificationFanoutWithEmailResult(
    {
      targets: recipients.map((recipient) => ({
        recipientType: 'internal',
        recipientId: recipient.uid,
        recipientRoleSnapshot: recipient.roleCode,
      })),
      type: 'certificate.pending_review',
      category: 'workflow',
      priority: 'high',
      title: `Certificado ${certificate.folio} en espera de verificación`,
      body: `${certificate.studentName} requiere revisión para el programa ${certificate.academicProgram}.`,
      ctaLabel: 'Revisar certificado',
      ctaHref: '/dashboard/certificate-states',
      entityType: 'certificate',
      entityId: certificate.id,
      sourceEvent: {
        key: `certificate.pending_review.${certificate.id}`,
      },
    },
    emailResult
  );
}

export async function notifyReturnedToDraft(
  certificateId: string,
  recipientUid: string,
  comments?: string,
  actorUid?: string
): Promise<void> {
  const [certificate, recipient] = await Promise.all([
    getCertificateSummary(certificateId),
    getInternalUser(recipientUid),
  ]);

  if (!certificate || !recipient?.email) {
    return;
  }

  const emailResult = await sendOperationalEmail({
    to: recipient.email,
    subject: `SIGCE: certificado ${certificate.folio} devuelto para corrección`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #991b1b;">Certificado devuelto a borrador</h2>
        <p><strong>Folio:</strong> ${certificate.folio}</p>
        <p><strong>Participante:</strong> ${certificate.studentName}</p>
        <p><strong>Programa:</strong> ${certificate.academicProgram}</p>
        ${comments ? `<p><strong>Motivo:</strong> ${comments}</p>` : ''}
        <p style="margin-top: 24px;">
          <a href="${getBaseUrl()}/dashboard/certificate-states" style="background: #991b1b; color: white; text-decoration: none; padding: 12px 18px; border-radius: 6px;">
            Corregir certificado
          </a>
        </p>
      </div>
    `,
  });

  await createNotificationFanoutWithEmailResult(
    {
      targets: [
        {
          recipientType: 'internal',
          recipientId: recipient.uid,
          recipientRoleSnapshot: recipient.roleCode,
        },
      ],
      type: 'certificate.returned_to_draft',
      category: 'workflow',
      priority: 'high',
      title: `Certificado ${certificate.folio} devuelto a borrador`,
      body:
        comments && comments.trim()
          ? comments.trim()
          : `El certificado de ${certificate.studentName} fue devuelto para corrección.`,
      ctaLabel: 'Corregir certificado',
      ctaHref: '/dashboard/certificate-states',
      entityType: 'certificate',
      entityId: certificate.id,
      actorUid,
      sourceEvent: {
        key: `certificate.returned_to_draft.${certificate.id}`,
      },
    },
    emailResult
  );
}

export async function notifySignatureRequest(
  request: SignatureRequest
): Promise<void> {
  if (!request.requestedToEmail) return;

  const emailResult = await sendOperationalEmail({
    to: request.requestedToEmail,
    subject: `SIGCE: firma pendiente para ${request.certificateData.folio}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #0f172a;">Tienes una firma pendiente</h2>
        <p><strong>Folio:</strong> ${request.certificateData.folio}</p>
        <p><strong>Participante:</strong> ${request.certificateData.studentName}</p>
        <p><strong>Programa:</strong> ${request.certificateData.academicProgram}</p>
        <p><strong>Solicitado por:</strong> ${request.requestedByName || request.requestedBy}</p>
        ${request.message ? `<p><strong>Mensaje:</strong> ${request.message}</p>` : ''}
        <p><strong>Vence:</strong> ${request.expiresAt.toLocaleString('es-DO')}</p>
        <p style="margin-top: 24px;">
          <a href="${getBaseUrl()}/dashboard/digital-signatures" style="background: #0f172a; color: white; text-decoration: none; padding: 12px 18px; border-radius: 6px;">
            Abrir módulo de firma
          </a>
        </p>
      </div>
    `,
  });

  await createNotificationFanoutWithEmailResult(
    {
      targets: [
        {
          recipientType: 'internal',
          recipientId: request.requestedTo,
          recipientRoleSnapshot: 'signer',
        },
      ],
      type: 'signature.requested',
      category: 'signature',
      priority: 'high',
      title: `Firma pendiente para ${request.certificateData.folio}`,
      body: `${request.certificateData.studentName} espera tu firma para ${request.certificateData.academicProgram}.`,
      ctaLabel: 'Abrir módulo de firma',
      ctaHref: '/dashboard/digital-signatures',
      entityType: 'signature_request',
      entityId: request.id,
      actorUid: request.requestedBy,
      actorName: request.requestedByName,
      sourceEvent: {
        key: `signature.requested.${request.id}`,
      },
    },
    emailResult
  );
}

export async function notifySignatureOutcome(params: {
  request: SignatureRequest;
  approved: boolean;
  details?: string;
}): Promise<void> {
  let targetEmail = params.request.requestedByEmail;

  if (!targetEmail) {
    const requester = await getInternalUser(params.request.requestedBy);
    targetEmail = requester?.email;
  }

  if (!targetEmail) {
    return;
  }

  const emailResult = await sendOperationalEmail({
    to: targetEmail,
    subject: params.approved
      ? `SIGCE: firma completada para ${params.request.certificateData.folio}`
      : `SIGCE: firma rechazada para ${params.request.certificateData.folio}`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: ${params.approved ? '#166534' : '#991b1b'};">
          ${params.approved ? 'Firma aprobada' : 'Firma rechazada'}
        </h2>
        <p><strong>Folio:</strong> ${params.request.certificateData.folio}</p>
        <p><strong>Participante:</strong> ${params.request.certificateData.studentName}</p>
        <p><strong>Firmante:</strong> ${params.request.requestedToName}</p>
        ${params.details ? `<p><strong>Detalle:</strong> ${params.details}</p>` : ''}
        <p style="margin-top: 24px;">
          <a href="${getBaseUrl()}/dashboard/certificate-states" style="background: ${params.approved ? '#166534' : '#991b1b'}; color: white; text-decoration: none; padding: 12px 18px; border-radius: 6px;">
            Ver flujo del certificado
          </a>
        </p>
      </div>
    `,
  });

  await createNotificationFanoutWithEmailResult(
    {
      targets: [
        {
          recipientType: 'internal',
          recipientId: params.request.requestedBy,
        },
      ],
      type: params.approved ? 'signature.approved' : 'signature.rejected',
      category: 'signature',
      priority: params.approved ? 'medium' : 'high',
      title: params.approved
        ? `Firma completada para ${params.request.certificateData.folio}`
        : `Firma rechazada para ${params.request.certificateData.folio}`,
      body: params.approved
        ? `${params.request.requestedToName} completó la firma del certificado.`
        : `${params.request.requestedToName} rechazó la firma del certificado.`,
      ctaLabel: 'Ver flujo del certificado',
      ctaHref: '/dashboard/certificate-states',
      entityType: 'signature_request',
      entityId: params.request.id,
      actorUid: params.request.requestedTo,
      actorName: params.request.requestedToName,
      sourceEvent: {
        key: `signature.outcome.${params.request.id}.${params.approved ? 'approved' : 'rejected'}`,
      },
    },
    emailResult
  );
}

export async function notifyCertificateBlocked(params: {
  certificateId: string;
  restrictionType: CertificateRestrictionType;
  reason: string;
  statusBefore: string;
}): Promise<void> {
  const certificate = await getCertificateRepository().findById(params.certificateId);
  if (!certificate) return;

  const restrictionLabel = getRestrictionTypeLabel(params.restrictionType);
  const studentEmail = await getStudentEmail(certificate.studentId);
  const internalRecipients = (await listInternalUsers()).filter(
    (user) =>
      user.status !== 'disabled' &&
      user.email &&
      (user.roleCode === 'administrator' || user.roleCode === 'coordinator')
  );

  const tasks: Promise<unknown>[] = [];
  const studentTarget = await resolveStudentNotificationTarget(certificate.studentId);

  if (studentEmail) {
    const studentEmailResult = await sendOperationalEmail({
      to: studentEmail,
      subject: `SIGCE: tu certificado ${certificate.folio} tiene una restriccion activa`,
      html: `
          <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
            <h2 style="color: #991b1b;">Certificado con restriccion temporal</h2>
            <p><strong>Folio:</strong> ${certificate.folio}</p>
            <p><strong>Programa:</strong> ${certificate.academicProgram}</p>
            <p><strong>Tipo de restriccion:</strong> ${restrictionLabel}</p>
            <p><strong>Motivo:</strong> ${params.reason}</p>
            <p>Mientras esta restriccion permanezca activa, la descarga y la disponibilidad publica del certificado quedaran suspendidas.</p>
            <p style="margin-top: 24px;">
              <a href="${getBaseUrl()}/login" style="background: #991b1b; color: white; text-decoration: none; padding: 12px 18px; border-radius: 6px;">
                Ingresar al portal
              </a>
            </p>
          </div>
        `,
    });

    tasks.push(
      studentTarget
        ? createNotificationFanoutWithEmailResult(
            {
              targets: [studentTarget],
              type: 'certificate.restriction.applied',
              category: 'restriction',
              priority: 'high',
              title: `Tu certificado ${certificate.folio} tiene una restricción activa`,
              body: `${restrictionLabel}: ${params.reason}`,
              ctaLabel: 'Abrir portal',
              ctaHref: `/student/certificates/${certificate.id}`,
              entityType: 'certificate',
              entityId: certificate.id,
              sourceEvent: {
                key: `certificate.restriction.applied.${certificate.id}`,
              },
            },
            studentEmailResult
          )
        : Promise.resolve()
    );
  }

  if (internalRecipients.length > 0) {
    const internalEmailResult = await sendOperationalEmail({
      to: internalRecipients.map((user) => user.email),
      subject: `SIGCE: certificado ${certificate.folio} bloqueado por ${restrictionLabel}`,
      html: `
          <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
            <h2 style="color: #991b1b;">Bloqueo administrativo aplicado</h2>
            <p><strong>Folio:</strong> ${certificate.folio}</p>
            <p><strong>Participante:</strong> ${certificate.studentName}</p>
            <p><strong>Programa:</strong> ${certificate.academicProgram}</p>
            <p><strong>Estado previo:</strong> ${getCertificateStatusLabel(params.statusBefore)}</p>
            <p><strong>Motivo:</strong> ${params.reason}</p>
            <p style="margin-top: 24px;">
              <a href="${getBaseUrl()}/dashboard/certificates/${certificate.id}" style="background: #0f172a; color: white; text-decoration: none; padding: 12px 18px; border-radius: 6px;">
                Revisar certificado
              </a>
            </p>
          </div>
        `,
    });

    tasks.push(
      createNotificationFanoutWithEmailResult(
        {
          targets: internalRecipients.map((recipient) => ({
            recipientType: 'internal',
            recipientId: recipient.uid,
            recipientRoleSnapshot: recipient.roleCode,
          })),
          type: 'certificate.restriction.applied.internal',
          category: 'restriction',
          priority: 'high',
          title: `Bloqueo administrativo en ${certificate.folio}`,
          body: `${certificate.studentName} quedó bloqueado por ${restrictionLabel.toLowerCase()}.`,
          ctaLabel: 'Revisar certificado',
          ctaHref: `/dashboard/certificates/${certificate.id}`,
          entityType: 'certificate',
          entityId: certificate.id,
          sourceEvent: {
            key: `certificate.restriction.applied.internal.${certificate.id}`,
          },
        },
        internalEmailResult
      )
    );
  }

  await Promise.all(tasks);
}

export async function notifyCertificateRestrictionReleased(params: {
  certificateId: string;
  restrictionType: CertificateRestrictionType;
  restoredStatus: string;
  releaseReason?: string;
}): Promise<void> {
  const certificate = await getCertificateRepository().findById(params.certificateId);
  if (!certificate) return;

  const restrictionLabel = getRestrictionTypeLabel(params.restrictionType);
  const studentEmail = await getStudentEmail(certificate.studentId);
  const internalRecipients = (await listInternalUsers()).filter(
    (user) =>
      user.status !== 'disabled' &&
      user.email &&
      (user.roleCode === 'administrator' || user.roleCode === 'coordinator')
  );

  const tasks: Promise<unknown>[] = [];
  const studentTarget = await resolveStudentNotificationTarget(certificate.studentId);

  if (studentEmail) {
    const studentEmailResult = await sendOperationalEmail({
      to: studentEmail,
      subject: `SIGCE: tu certificado ${certificate.folio} vuelve a estar disponible`,
      html: `
          <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
            <h2 style="color: #166534;">Restriccion liberada</h2>
            <p><strong>Folio:</strong> ${certificate.folio}</p>
            <p><strong>Programa:</strong> ${certificate.academicProgram}</p>
            <p><strong>Restriccion liberada:</strong> ${restrictionLabel}</p>
            <p><strong>Estado actual:</strong> ${getCertificateStatusLabel(params.restoredStatus)}</p>
            ${params.releaseReason ? `<p><strong>Detalle:</strong> ${params.releaseReason}</p>` : ''}
            <p style="margin-top: 24px;">
              <a href="${getBaseUrl()}/login" style="background: #166534; color: white; text-decoration: none; padding: 12px 18px; border-radius: 6px;">
                Abrir portal
              </a>
            </p>
          </div>
        `,
    });

    tasks.push(
      studentTarget
        ? createNotificationFanoutWithEmailResult(
            {
              targets: [studentTarget],
              type: 'certificate.restriction.released',
              category: 'restriction',
              priority: 'medium',
              title: `Tu certificado ${certificate.folio} vuelve a estar disponible`,
              body:
                params.releaseReason && params.releaseReason.trim()
                  ? params.releaseReason.trim()
                  : 'La restricción administrativa fue liberada.',
              ctaLabel: 'Abrir certificado',
              ctaHref: `/student/certificates/${certificate.id}`,
              entityType: 'certificate',
              entityId: certificate.id,
              sourceEvent: {
                key: `certificate.restriction.released.${certificate.id}`,
              },
            },
            studentEmailResult
          )
        : Promise.resolve()
    );
  }

  if (internalRecipients.length > 0) {
    const internalEmailResult = await sendOperationalEmail({
      to: internalRecipients.map((user) => user.email),
      subject: `SIGCE: certificado ${certificate.folio} desbloqueado`,
      html: `
          <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
            <h2 style="color: #166534;">Restriccion liberada</h2>
            <p><strong>Folio:</strong> ${certificate.folio}</p>
            <p><strong>Participante:</strong> ${certificate.studentName}</p>
            <p><strong>Restriccion:</strong> ${restrictionLabel}</p>
            <p><strong>Estado restaurado:</strong> ${getCertificateStatusLabel(params.restoredStatus)}</p>
            ${params.releaseReason ? `<p><strong>Detalle:</strong> ${params.releaseReason}</p>` : ''}
            <p style="margin-top: 24px;">
              <a href="${getBaseUrl()}/dashboard/certificates/${certificate.id}" style="background: #0f172a; color: white; text-decoration: none; padding: 12px 18px; border-radius: 6px;">
                Abrir certificado
              </a>
            </p>
          </div>
        `,
    });

    tasks.push(
      createNotificationFanoutWithEmailResult(
        {
          targets: internalRecipients.map((recipient) => ({
            recipientType: 'internal',
            recipientId: recipient.uid,
            recipientRoleSnapshot: recipient.roleCode,
          })),
          type: 'certificate.restriction.released.internal',
          category: 'restriction',
          priority: 'medium',
          title: `Restricción liberada en ${certificate.folio}`,
          body: `${certificate.studentName} vuelve al estado ${getCertificateStatusLabel(params.restoredStatus).toLowerCase()}.`,
          ctaLabel: 'Abrir certificado',
          ctaHref: `/dashboard/certificates/${certificate.id}`,
          entityType: 'certificate',
          entityId: certificate.id,
          sourceEvent: {
            key: `certificate.restriction.released.internal.${certificate.id}`,
          },
        },
        internalEmailResult
      )
    );
  }

  await Promise.all(tasks);
}

export async function notifyCertificateIssued(
  certificateId: string
): Promise<void> {
  const certificate = await getCertificateRepository().findById(certificateId);
  if (!certificate) return;

  const studentEmail = await getStudentEmail(certificate.studentId);
  if (!studentEmail) return;

  const emailResult = await sendOperationalEmail({
    to: studentEmail,
    subject: `SIGCE: tu certificado ${certificate.folio} ya esta disponible`,
    html: `
      <div style="font-family: sans-serif; max-width: 640px; margin: 0 auto; color: #1f2937;">
        <h2 style="color: #166534;">Certificado emitido</h2>
        <p><strong>Folio:</strong> ${certificate.folio}</p>
        <p><strong>Programa:</strong> ${certificate.academicProgram}</p>
        <p>Tu certificado fue emitido y ya se encuentra disponible dentro del portal autenticado del participante.</p>
        <p style="margin-top: 24px;">
          <a href="${getBaseUrl()}/login" style="background: #166534; color: white; text-decoration: none; padding: 12px 18px; border-radius: 6px;">
            Ingresar al portal
          </a>
        </p>
      </div>
    `,
  });

  const studentTarget = await resolveStudentNotificationTarget(certificate.studentId);
  if (!studentTarget) {
    return;
  }

  await createNotificationFanoutWithEmailResult(
    {
      targets: [studentTarget],
      type: 'certificate.issued',
      category: 'workflow',
      priority: 'high',
      title: `Tu certificado ${certificate.folio} ya está disponible`,
      body: `${certificate.academicProgram} quedó emitido y listo dentro de tu portal autenticado.`,
      ctaLabel: 'Abrir certificado',
      ctaHref: `/student/certificates/${certificate.id}`,
      entityType: 'certificate',
      entityId: certificate.id,
      sourceEvent: {
        key: `certificate.issued.${certificate.id}`,
      },
    },
    emailResult
  );
}
