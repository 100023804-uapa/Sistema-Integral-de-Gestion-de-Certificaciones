export interface CertificateMetadataSanitationTemplateSummary {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CertificateMetadataSanitationInternalUser {
  uid: string;
  email: string;
  displayName: string;
  roleCode: string;
  status: string;
}

export interface CertificateMetadataSanitationSignerSummary {
  id: string;
  name: string;
  title: string;
  isActive: boolean;
  allowedEmails: string[];
  authorizedInternalUsers: CertificateMetadataSanitationInternalUser[];
}

export interface CertificateMetadataSanitationCertificateItem {
  certificateId: string;
  folio: string;
  studentId: string;
  studentName: string;
  status: string;
  academicProgram: string;
  campusId: string | null;
  templateId: string | null;
  signer1Id: string | null;
  programId: string | null;
  matchedProgramId?: string | null;
  matchedProgramName?: string | null;
}

export interface CertificateMetadataSanitationStudentItem {
  studentId: string;
  studentName: string;
  email: string | null;
  programId: string | null;
  campusId: string | null;
  academicAreaId: string | null;
}

export interface CertificateMetadataSanitationSummary {
  generatedAt: string;
  totalCertificates: number;
  totalStudents: number;
  totalActiveSigners: number;
  certificatesMissingTemplate: number;
  certificatesMissingPrimarySigner: number;
  certificatesMissingProgramId: number;
  studentsMissingProgramId: number;
  studentsMissingCampusId: number;
  studentsMissingAcademicAreaId: number;
  studentsMissingEmail: number;
  signersWithoutAllowedEmails: number;
  signersWithoutAuthorizedInternalUsers: number;
}

export interface CertificateMetadataSanitationReport {
  summary: CertificateMetadataSanitationSummary;
  preferredTemplate: CertificateMetadataSanitationTemplateSummary | null;
  certificatesMissingTemplate: CertificateMetadataSanitationCertificateItem[];
  certificatesMissingPrimarySigner: CertificateMetadataSanitationCertificateItem[];
  certificatesMissingProgramId: CertificateMetadataSanitationCertificateItem[];
  studentsMissingCatalogLinks: CertificateMetadataSanitationStudentItem[];
  activeSigners: CertificateMetadataSanitationSignerSummary[];
  signingInternalUsers: CertificateMetadataSanitationInternalUser[];
}

export interface CertificateMetadataSanitationActionResult {
  action:
    | 'apply_preferred_template'
    | 'assign_primary_signer'
    | 'authorize_signer_email'
    | 'apply_program_matches';
  updatedCertificates: number;
  updatedSigners: number;
  skippedCertificates: number;
  skippedSigners: number;
  message: string;
}
