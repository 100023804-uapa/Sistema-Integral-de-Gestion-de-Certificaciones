import type { Certificate } from '@/lib/domain/entities/Certificate';
import { getCertificateRepository } from '@/lib/container';
import { getAdminDb } from '@/lib/firebaseAdmin';
import type {
  CertificateRestriction,
  CertificateRestrictionType,
} from '@/lib/types/certificateRestriction';
import {
  getBlockedStatusForRestrictionType,
  getRestrictionTypeLabel,
} from '@/lib/types/certificateRestriction';
import {
  getCertificateStatusLabel,
  isCertificateBlocked,
  normalizeCertificateStatus,
} from '@/lib/types/certificateStatus';
import {
  notifyCertificateBlocked,
  notifyCertificateRestrictionReleased,
} from '@/lib/server/certificateWorkflowNotifications';

const CERTIFICATES_COLLECTION = 'certificates';
const RESTRICTIONS_COLLECTION = 'certificateRestrictions';

const BLOCK_ELIGIBLE_STATUSES = new Set([
  'verified',
  'pending_signature',
  'signed',
  'issued',
  'available',
  'active',
]);

function serializeRestriction(restriction: CertificateRestriction) {
  return {
    active: restriction.active,
    type: restriction.type,
    reason: restriction.reason,
    blockedAt: restriction.blockedAt,
    blockedBy: restriction.blockedBy,
    previousStatus: restriction.previousStatus,
    releasedAt: restriction.releasedAt || null,
    releasedBy: restriction.releasedBy || null,
    releaseReason: restriction.releaseReason || null,
  };
}

async function getCertificateOrThrow(certificateId: string): Promise<Certificate> {
  const certificate = await getCertificateRepository().findById(certificateId);
  if (!certificate) {
    throw new Error('Certificado no encontrado');
  }

  return certificate;
}

function ensureRestrictionReason(reason: string) {
  const normalized = reason.trim();
  if (normalized.length < 6) {
    throw new Error('Debes indicar un motivo de al menos 6 caracteres');
  }

  return normalized;
}

function ensureReleaseReason(reason?: string) {
  const normalized = reason?.trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.length < 4) {
    throw new Error('El motivo de liberacion debe tener al menos 4 caracteres');
  }

  return normalized;
}

function resolveStatusToRestore(certificate: Certificate): Certificate['status'] {
  const restriction = certificate.restriction;

  if (restriction?.previousStatus && !isCertificateBlocked(restriction.previousStatus)) {
    return restriction.previousStatus;
  }

  if (certificate.previousStatus && !isCertificateBlocked(certificate.previousStatus)) {
    return certificate.previousStatus;
  }

  if (certificate.pdfUrl) {
    return 'issued';
  }

  return 'signed';
}

async function appendRestrictionAuditEntry(params: {
  certificate: Certificate;
  action: 'blocked' | 'released';
  restrictionType: CertificateRestrictionType;
  reason: string;
  actorId: string;
  actorRole: string;
  previousStatus: Certificate['status'];
  nextStatus: Certificate['status'];
}) {
  await getAdminDb().collection(RESTRICTIONS_COLLECTION).add({
    certificateId: params.certificate.id,
    folio: params.certificate.folio,
    studentId: params.certificate.studentId,
    studentName: params.certificate.studentName,
    action: params.action,
    restrictionType: params.restrictionType,
    reason: params.reason,
    actorId: params.actorId,
    actorRole: params.actorRole,
    previousStatus: params.previousStatus,
    nextStatus: params.nextStatus,
    createdAt: new Date(),
  });
}

export async function applyCertificateRestriction(params: {
  certificateId: string;
  actorId: string;
  actorRole: string;
  type: CertificateRestrictionType;
  reason: string;
}) {
  const certificate = await getCertificateOrThrow(params.certificateId);
  const currentStatus = normalizeCertificateStatus(certificate.status);

  if (isCertificateBlocked(currentStatus)) {
    throw new Error('El certificado ya tiene una restriccion activa');
  }

  if (!BLOCK_ELIGIBLE_STATUSES.has(currentStatus)) {
    throw new Error(
      `No se puede bloquear un certificado en estado ${getCertificateStatusLabel(currentStatus).toLowerCase()}`
    );
  }

  const reason = ensureRestrictionReason(params.reason);
  const nextStatus = getBlockedStatusForRestrictionType(params.type);
  const now = new Date();
  const restriction: CertificateRestriction = {
    active: true,
    type: params.type,
    reason,
    blockedAt: now,
    blockedBy: params.actorId,
    previousStatus: currentStatus,
  };

  await getAdminDb()
    .collection(CERTIFICATES_COLLECTION)
    .doc(certificate.id)
    .set(
      {
        status: nextStatus,
        updatedAt: now,
        previousStatus: currentStatus,
        stateChangedAt: now,
        stateChangedBy: params.actorId,
        lastStateComment: reason,
        restriction: serializeRestriction(restriction),
      },
      { merge: true }
    );

  await appendRestrictionAuditEntry({
    certificate,
    action: 'blocked',
    restrictionType: params.type,
    reason,
    actorId: params.actorId,
    actorRole: params.actorRole,
    previousStatus: currentStatus,
    nextStatus,
  });

  await notifyCertificateBlocked({
    certificateId: certificate.id,
    restrictionType: params.type,
    reason,
    statusBefore: currentStatus,
  });

  return {
    certificateId: certificate.id,
    folio: certificate.folio,
    status: nextStatus,
    statusLabel: getCertificateStatusLabel(nextStatus),
    restrictionLabel: getRestrictionTypeLabel(params.type),
  };
}

export async function releaseCertificateRestriction(params: {
  certificateId: string;
  actorId: string;
  actorRole: string;
  reason?: string;
}) {
  const certificate = await getCertificateOrThrow(params.certificateId);
  const currentStatus = normalizeCertificateStatus(certificate.status);

  if (!isCertificateBlocked(currentStatus)) {
    throw new Error('El certificado no tiene una restriccion activa');
  }

  const restriction = certificate.restriction;
  if (!restriction?.active) {
    throw new Error('No existe una restriccion activa para liberar');
  }

  const releaseReason = ensureReleaseReason(params.reason);
  const restoredStatus = resolveStatusToRestore(certificate);
  const now = new Date();
  const releasedRestriction: CertificateRestriction = {
    ...restriction,
    active: false,
    releasedAt: now,
    releasedBy: params.actorId,
    releaseReason,
  };
  const comment =
    releaseReason ||
    `Restriccion de ${getRestrictionTypeLabel(restriction.type)} liberada`;

  await getAdminDb()
    .collection(CERTIFICATES_COLLECTION)
    .doc(certificate.id)
    .set(
      {
        status: restoredStatus,
        updatedAt: now,
        previousStatus: currentStatus,
        stateChangedAt: now,
        stateChangedBy: params.actorId,
        lastStateComment: comment,
        restriction: serializeRestriction(releasedRestriction),
      },
      { merge: true }
    );

  await appendRestrictionAuditEntry({
    certificate,
    action: 'released',
    restrictionType: restriction.type,
    reason: comment,
    actorId: params.actorId,
    actorRole: params.actorRole,
    previousStatus: currentStatus,
    nextStatus: restoredStatus,
  });

  await notifyCertificateRestrictionReleased({
    certificateId: certificate.id,
    restrictionType: restriction.type,
    releaseReason,
    restoredStatus,
  });

  return {
    certificateId: certificate.id,
    folio: certificate.folio,
    status: restoredStatus,
    statusLabel: getCertificateStatusLabel(restoredStatus),
    restrictionLabel: getRestrictionTypeLabel(restriction.type),
  };
}
