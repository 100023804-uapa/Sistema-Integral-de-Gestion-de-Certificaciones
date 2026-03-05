export interface StudentCertificate {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  certificateId: string;
  folio: string;
  programName: string;
  academicAreaName: string;
  campusName: string;
  certificateTypeName: string;
  issueDate: Date;
  expirationDate?: Date;
  status: CertificateStatus;
  qrCodeUrl: string;
  pdfUrl: string;
  verificationUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum CertificateStatus {
  BORRADOR = 'borrador',
  ESPERA_VERIFICACION = 'espera_verificacion',
  VERIFICADO = 'verificado',
  ESPERA_FIRMA = 'espera_firma',
  FIRMADO = 'firmado',
  EMITIDO = 'emitido',
  DISPONIBLE = 'disponible',
  RECHAZADO = 'rechazado',
  BLOQUEADO_PAGO = 'bloqueado_pago',
  BLOQUEADO_DOCUMENTACION = 'bloqueado_documentacion',
  BLOQUEADO_ADMINISTRATIVO = 'bloqueado_administrativo'
}

export interface StudentCertificateFilter {
  studentId?: string;
  academicAreaId?: string;
  campusId?: string;
  certificateTypeId?: string;
  status?: CertificateStatus;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
