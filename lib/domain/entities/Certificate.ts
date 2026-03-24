import type { CertificateRestriction } from '@/lib/types/certificateRestriction';
import type { CertificateStatusValue } from '@/lib/types/certificateStatus';
import type {
  TemplateFontProfile,
  TemplateFontRef,
  TemplateLayout,
  TemplatePlaceholder,
  TemplateType,
} from '@/lib/types/certificateTemplate';

export type CertificateStatus = CertificateStatusValue;
export type CertificateType = 'CAP' | 'PROFUNDO';

export interface CertificateTemplateSnapshot {
  templateId?: string | null;
  name: string;
  description?: string;
  type: TemplateType;
  certificateTypeId: string;
  htmlContent: string;
  cssStyles: string;
  fontRefs: TemplateFontRef[];
  fontProfile?: TemplateFontProfile | null;
  layout: TemplateLayout;
  placeholders: TemplatePlaceholder[];
  capturedAt: Date;
}

export interface Certificate {
  id: string;
  folio: string;
  studentId: string;
  studentName: string;
  studentEmail?: string | null;
  cedula?: string | null;
  type: CertificateType;
  academicProgram: string;
  issueDate: Date;
  expirationDate?: Date | null;
  status: CertificateStatus;
  templateId?: string | null;
  qrCodeUrl: string;
  publicVerificationCode?: string;
  pdfUrl?: string | null;
  campusId: string;
  academicAreaId?: string | null;
  certificateTypeId?: string | null;
  templateSnapshot?: CertificateTemplateSnapshot | null;
  metadata: Record<string, any>;
  previousStatus?: CertificateStatus;
  stateChangedAt?: Date;
  stateChangedBy?: string;
  lastStateComment?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
  signedAt?: Date;
  signedBy?: string;
  issuedAt?: Date;
  issuedBy?: string;
  restriction?: CertificateRestriction;
  createdAt: Date;
  updatedAt: Date;
  history?: CertificateHistoryItem[];
}

export interface CertificateHistoryItem {
  date: Date;
  action: string;
  performedBy: string;
  details?: string;
}

export type CreateCertificateDTO = Omit<
  Certificate,
  'id' | 'createdAt' | 'updatedAt' | 'qrCodeUrl' | 'pdfUrl' | 'publicVerificationCode'
>;
