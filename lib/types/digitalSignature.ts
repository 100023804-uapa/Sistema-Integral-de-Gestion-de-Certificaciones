export type SignatureStatus = 'pending' | 'signed' | 'rejected' | 'expired';

export interface DigitalSignature {
  id: string;
  certificateId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signerRole: string;
  signatureData?: {
    signatureBase64: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  status: SignatureStatus;
  requestedAt: Date;
  signedAt?: Date;
  expiresAt?: Date;
  comments?: string;
  rejectionReason?: string;
  metadata?: Record<string, any>;
}

export interface SignatureRequest {
  id: string;
  certificateId: string;
  requestedBy: string;
  requestedByName?: string;
  requestedByEmail?: string;
  requestedTo: string; // ID del firmante
  requestedToName: string;
  requestedToEmail: string;
  requestedToRole: string;
  message?: string;
  status: SignatureStatus;
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
  rejectionReason?: string;
  certificateData: {
    folio: string;
    studentName: string;
    academicProgram: string;
    issueDate: Date;
    campusName: string;
    academicAreaName?: string;
  };
}

export interface SignatureTemplate {
  id: string;
  name: string;
  description?: string;
  signaturePosition: {
    x: number; // Posición X en el PDF (porcentaje)
    y: number; // Posición Y en el PDF (porcentaje)
    width: number; // Ancho de la firma (porcentaje)
    height: number; // Alto de la firma (porcentaje)
  };
  requiredFields: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSignatureRequest {
  certificateId: string;
  requestedTo: string;
  message?: string;
  expiresInHours?: number; // Por defecto 72 horas
}

export interface SignCertificateRequest {
  certificateId: string;
  signatureData: {
    signatureBase64: string;
    comments?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  signerId: string;
}

export interface RejectSignatureRequest {
  certificateId: string;
  rejectionReason: string;
  signerId: string;
}

// Configuración de firma digital
export const SIGNATURE_CONFIG = {
  DEFAULT_EXPIRY_HOURS: 72,
  MAX_SIGNATURE_SIZE: 1048576, // 1MB
  ALLOWED_FILE_TYPES: ['image/png', 'image/jpeg', 'image/webp'],
  SIGNATURE_STYLES: {
    width: 200,
    height: 80,
    strokeWidth: 2,
    strokeColor: '#000080',
    backgroundColor: '#ffffff'
  }
} as const;

// Estados de firma
export const SIGNATURE_STATUS_LABELS = {
  pending: 'Pendiente de Firma',
  signed: 'Firmado',
  rejected: 'Rechazado',
  expired: 'Expirado'
} as const;
