import {
  TemplateFontProfile,
  TemplateFontRef,
  TemplateLayout,
  TemplatePlaceholder,
  TemplateType,
} from '../../types/certificateTemplate';

export type CertificateStatus = 'active' | 'revoked' | 'expired';
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
  id: string; // UUID interno
  folio: string; // Código único visible (e.g., sigce-2026-CAP-0001)
  studentId: string; // Relación con Student
  studentName: string; // Desnormalizado para consultas rápidas
  studentEmail?: string | null; // Nuevo: Correo para notificaciones
  cedula?: string | null; // Nuevo: Cédula para el PDF
  type: CertificateType;
  academicProgram: string; // Nombre del curso/diplomado
  issueDate: Date;
  expirationDate?: Date | null; // Opcional
  status: CertificateStatus;
  templateId?: string | null; // ID de la plantilla utilizada
  qrCodeUrl: string; // URL pública de validación
  publicVerificationCode?: string; // Código hash único (US-13)
  pdfUrl?: string | null; // URL del archivo en Storage
  campusId: string; // ID del recinto (obligatorio)
  academicAreaId?: string | null; // ID del área académica (obligatorio en futuro)
  certificateTypeId?: string | null; // ID del tipo de certificado (opcional por ahora)
  templateSnapshot?: CertificateTemplateSnapshot | null; // Snapshot visual de la plantilla al emitir
  metadata: Record<string, any>; // Para datos extra flexibles
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
