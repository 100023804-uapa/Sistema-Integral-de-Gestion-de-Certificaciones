export type CertificateTypeValue = 'horizontal' | 'vertical' | 'institutional_macro';

export interface CertificateType {
  id: string;
  name: string;
  code: CertificateTypeValue;
  description?: string;
  defaultFolioPrefix?: string;
  requiresSignature: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCertificateTypeRequest {
  name: string;
  code: CertificateTypeValue;
  description?: string;
  defaultFolioPrefix?: string;
  requiresSignature?: boolean;
}

export interface UpdateCertificateTypeRequest {
  name?: string;
  code?: CertificateTypeValue;
  description?: string;
  defaultFolioPrefix?: string;
  requiresSignature?: boolean;
  isActive?: boolean;
}
