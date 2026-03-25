import type { CertificateStatusValue } from '@/lib/types/certificateStatus';
import type { SignatureStatus } from '@/lib/types/digitalSignature';

export type WorkflowRecommendedState =
  | 'verified'
  | 'pending_signature'
  | 'signed'
  | 'available';

export interface CertificateWorkflowSanitationIssue {
  certificateId: string;
  folio: string;
  studentId: string;
  studentName: string;
  currentStatus: CertificateStatusValue;
  issueDate: string | null;
  signatureRequestStatus: SignatureStatus | null;
  hasSignedSignature: boolean;
  hasPdf: boolean;
  hasTemplate: boolean;
  findings: string[];
  recommendedState: WorkflowRecommendedState;
  cleanupActions: string[];
  severity: 'high' | 'medium';
}

export interface CertificateWorkflowPromotionCandidate {
  certificateId: string;
  folio: string;
  studentId: string;
  studentName: string;
  currentStatus: CertificateStatusValue;
  issueDate: string | null;
  notes: string[];
  targetState: 'available';
}

export interface CertificateWorkflowLegacyItem {
  certificateId: string;
  folio: string;
  studentId: string;
  studentName: string;
  currentStatus: CertificateStatusValue;
  issueDate: string | null;
  recommendation: string;
}

export interface CertificateWorkflowSanitationSummary {
  generatedAt: string;
  totalCertificates: number;
  publishedCertificates: number;
  sanitationCandidates: number;
  publishedWithoutSignature: number;
  publishedWithoutPdf: number;
  publishedWithoutTemplate: number;
  signedWithoutSignature: number;
  pendingSignatureWithoutRequest: number;
  readyForAvailable: number;
  legacyStatuses: number;
}

export interface CertificateWorkflowSanitationReport {
  summary: CertificateWorkflowSanitationSummary;
  sanitationCandidates: CertificateWorkflowSanitationIssue[];
  readyForAvailable: CertificateWorkflowPromotionCandidate[];
  legacyStatuses: CertificateWorkflowLegacyItem[];
}
