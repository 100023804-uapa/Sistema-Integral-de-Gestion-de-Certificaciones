import type { CertificateRestriction } from '@/lib/types/certificateRestriction';
import type { CertificateStatusValue } from '@/lib/types/certificateStatus';

export type CertificateStatus = CertificateStatusValue;
export type CertificateType = 'CAP' | 'PROFUNDO';

export interface Certificate {
  id: string; // UUID interno
  folio: string; // Código único visible (e.g., sigce-2026-CAP-0001)
  studentId: string; // Relación con Student
  studentName: string; // Desnormalizado para consultas rápidas
  type: CertificateType;
  academicProgram: string; // Nombre del curso/diplomado
  issueDate: Date;
  expirationDate?: Date; // Opcional
  status: CertificateStatus;
  templateId?: string; // ID de la plantilla utilizada
  qrCodeUrl: string; // URL pública de validación
  publicVerificationCode?: string; // Código hash único (US-13)
  pdfUrl?: string; // URL del archivo en Storage
  campusId: string; // ID del recinto (obligatorio)
  academicAreaId?: string; // ID del área académica (obligatorio en futuro)
  certificateTypeId?: string; // ID del tipo de certificado (opcional por ahora)
  metadata: Record<string, any>; // Para datos extra flexibles
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
  action: string; // 'created', 'updated', 'printed', 'delivered', 'revoked'
  performedBy: string; // User ID or Name
  details?: string;
}

export type CreateCertificateDTO = Omit<Certificate, 'id' | 'createdAt' | 'updatedAt' | 'qrCodeUrl' | 'pdfUrl' | 'publicVerificationCode'>;
