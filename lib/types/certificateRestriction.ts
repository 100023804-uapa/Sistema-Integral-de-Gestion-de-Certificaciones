import type { CertificateStatusValue } from '@/lib/types/certificateStatus';

export type CertificateRestrictionType =
  | 'payment'
  | 'documents'
  | 'administrative';

export interface CertificateRestriction {
  active: boolean;
  type: CertificateRestrictionType;
  reason: string;
  blockedAt: Date;
  blockedBy: string;
  previousStatus: CertificateStatusValue;
  releasedAt?: Date;
  releasedBy?: string;
  releaseReason?: string;
}

export function getBlockedStatusForRestrictionType(
  type: CertificateRestrictionType
): CertificateStatusValue {
  switch (type) {
    case 'payment':
      return 'blocked_payment';
    case 'documents':
      return 'blocked_documents';
    case 'administrative':
      return 'blocked_administrative';
    default:
      return 'blocked_administrative';
  }
}

export function getRestrictionTypeLabel(type: CertificateRestrictionType): string {
  switch (type) {
    case 'payment':
      return 'pago';
    case 'documents':
      return 'documentacion';
    case 'administrative':
      return 'administracion';
    default:
      return 'administracion';
  }
}
