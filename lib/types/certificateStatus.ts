import type { CertificateStateValue } from '@/lib/types/certificateState';

export type CertificateWorkflowStatus =
  | CertificateStateValue
  | 'available'
  | 'rejected'
  | 'blocked_payment'
  | 'blocked_documents'
  | 'blocked_administrative';

export type CertificateLegacyStatus = 'active' | 'revoked' | 'expired';

export type CertificateStatusValue =
  | CertificateWorkflowStatus
  | CertificateLegacyStatus;

const KNOWN_STATUSES: CertificateStatusValue[] = [
  'draft',
  'pending_review',
  'verified',
  'pending_signature',
  'signed',
  'issued',
  'cancelled',
  'available',
  'rejected',
  'blocked_payment',
  'blocked_documents',
  'blocked_administrative',
  'active',
  'revoked',
  'expired',
];

const STATUS_LABELS: Record<CertificateStatusValue, string> = {
  draft: 'Borrador',
  pending_review: 'En espera de verificación',
  verified: 'Verificado',
  pending_signature: 'En espera de firma',
  signed: 'Firmado',
  issued: 'Emitido',
  cancelled: 'Cancelado',
  available: 'Disponible',
  rejected: 'Rechazado',
  blocked_payment: 'Bloqueado por pago',
  blocked_documents: 'Bloqueado por documentación',
  blocked_administrative: 'Bloqueado administrativamente',
  active: 'Vigente',
  revoked: 'Revocado',
  expired: 'Expirado',
};

const STATUS_BADGE_CLASSES: Record<CertificateStatusValue, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  pending_review: 'bg-amber-100 text-amber-800 border-amber-200',
  verified: 'bg-blue-100 text-blue-800 border-blue-200',
  pending_signature: 'bg-violet-100 text-violet-800 border-violet-200',
  signed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  issued: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
  available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  blocked_payment: 'bg-red-100 text-red-700 border-red-200',
  blocked_documents: 'bg-orange-100 text-orange-700 border-orange-200',
  blocked_administrative: 'bg-slate-200 text-slate-800 border-slate-300',
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  revoked: 'bg-rose-100 text-rose-800 border-rose-200',
  expired: 'bg-gray-100 text-gray-700 border-gray-200',
};

const PUBLICLY_AVAILABLE_STATUSES = new Set<CertificateStatusValue>([
  'issued',
  'available',
  'active',
]);

const EMITTED_STATUSES = new Set<CertificateStatusValue>([
  'issued',
  'available',
  'active',
]);

export function isKnownCertificateStatus(
  value: unknown
): value is CertificateStatusValue {
  return typeof value === 'string' && KNOWN_STATUSES.includes(value as CertificateStatusValue);
}

export function normalizeCertificateStatus(
  value: unknown
): CertificateStatusValue {
  if (isKnownCertificateStatus(value)) {
    return value;
  }

  return 'draft';
}

export function getCertificateStatusLabel(value: unknown): string {
  const status = normalizeCertificateStatus(value);
  return STATUS_LABELS[status];
}

export function getCertificateStatusBadgeClass(value: unknown): string {
  const status = normalizeCertificateStatus(value);
  return STATUS_BADGE_CLASSES[status];
}

export function isCertificatePubliclyAvailable(value: unknown): boolean {
  return PUBLICLY_AVAILABLE_STATUSES.has(normalizeCertificateStatus(value));
}

export function isCertificateEmitted(value: unknown): boolean {
  return EMITTED_STATUSES.has(normalizeCertificateStatus(value));
}

export function canDownloadCertificate(
  value: unknown,
  pdfUrl?: string | null
): boolean {
  return (
    isCertificatePubliclyAvailable(value) &&
    typeof pdfUrl === 'string' &&
    pdfUrl.trim().length > 0
  );
}

export function isCertificateBlocked(value: unknown): boolean {
  const status = normalizeCertificateStatus(value);

  return (
    status === 'revoked' ||
    status === 'expired' ||
    status === 'cancelled' ||
    status === 'rejected' ||
    status === 'blocked_payment' ||
    status === 'blocked_documents' ||
    status === 'blocked_administrative'
  );
}
