import { getCertificateRepository } from '@/lib/container';
import { getEmailProvider } from '@/lib/email/provider';
import { getAdminDb } from '@/lib/firebaseAdmin';
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
  const provider = getEmailProvider();
  if (!provider) return;

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

  await provider.sendEmail({
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
}

export async function notifyReturnedToDraft(
  certificateId: string,
  recipientUid: string,
  comments?: string
): Promise<void> {
  const provider = getEmailProvider();
  if (!provider) return;

  const [certificate, recipient] = await Promise.all([
    getCertificateSummary(certificateId),
    getInternalUser(recipientUid),
  ]);

  if (!certificate || !recipient?.email) {
    return;
  }

  await provider.sendEmail({
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
}

export async function notifySignatureRequest(
  request: SignatureRequest
): Promise<void> {
  const provider = getEmailProvider();
  if (!provider || !request.requestedToEmail) return;

  await provider.sendEmail({
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
}

export async function notifySignatureOutcome(params: {
  request: SignatureRequest;
  approved: boolean;
  details?: string;
}): Promise<void> {
  const provider = getEmailProvider();
  if (!provider) return;

  let targetEmail = params.request.requestedByEmail;

  if (!targetEmail) {
    const requester = await getInternalUser(params.request.requestedBy);
    targetEmail = requester?.email;
  }

  if (!targetEmail) {
    return;
  }

  await provider.sendEmail({
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
}

export async function notifyCertificateBlocked(params: {
  certificateId: string;
  restrictionType: CertificateRestrictionType;
  reason: string;
  statusBefore: string;
}): Promise<void> {
  const provider = getEmailProvider();
  if (!provider) return;

  const certificate = await getCertificateRepository().findById(params.certificateId);
  if (!certificate) return;

  const restrictionLabel = getRestrictionTypeLabel(params.restrictionType);
  const studentEmail = await getStudentEmail(certificate.studentId);
  const internalRecipients = (await listInternalUsers())
    .filter(
      (user) =>
        user.status !== 'disabled' &&
        user.email &&
        (user.roleCode === 'administrator' || user.roleCode === 'coordinator')
    )
    .map((user) => user.email);

  const tasks: Promise<unknown>[] = [];

  if (studentEmail) {
    tasks.push(
      provider.sendEmail({
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
      })
    );
  }

  if (internalRecipients.length > 0) {
    tasks.push(
      provider.sendEmail({
        to: internalRecipients,
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
      })
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
  const provider = getEmailProvider();
  if (!provider) return;

  const certificate = await getCertificateRepository().findById(params.certificateId);
  if (!certificate) return;

  const restrictionLabel = getRestrictionTypeLabel(params.restrictionType);
  const studentEmail = await getStudentEmail(certificate.studentId);
  const internalRecipients = (await listInternalUsers())
    .filter(
      (user) =>
        user.status !== 'disabled' &&
        user.email &&
        (user.roleCode === 'administrator' || user.roleCode === 'coordinator')
    )
    .map((user) => user.email);

  const tasks: Promise<unknown>[] = [];

  if (studentEmail) {
    tasks.push(
      provider.sendEmail({
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
      })
    );
  }

  if (internalRecipients.length > 0) {
    tasks.push(
      provider.sendEmail({
        to: internalRecipients,
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
      })
    );
  }

  await Promise.all(tasks);
}

export async function notifyCertificateIssued(
  certificateId: string
): Promise<void> {
  const provider = getEmailProvider();
  if (!provider) return;

  const certificate = await getCertificateRepository().findById(certificateId);
  if (!certificate) return;

  const studentEmail = await getStudentEmail(certificate.studentId);
  if (!studentEmail) return;

  await provider.sendEmail({
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
}
