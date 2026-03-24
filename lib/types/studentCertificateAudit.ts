export interface StudentCertificateAuditSummary {
  generatedAt: string;
  totalCertificates: number;
  totalStudents: number;
  linkedCertificates: number;
  orphanCertificates: number;
  certificatesWithoutStudentId: number;
  certificatesReadyForPortal: number;
  certificatesBlockedForPortal: number;
  certificatesWithNameMismatch: number;
  studentsWithCertificates: number;
  studentsWithoutCertificates: number;
  studentsMissingEmail: number;
  studentsWithPortalEnabled: number;
  studentsWithPortalEnabledWithoutCertificates: number;
}

export interface OrphanCertificateAuditItem {
  certificateId: string;
  folio: string;
  studentId: string;
  studentName: string;
  status: string;
  issueDate: string | null;
  reason: string;
}

export interface PortalBlockedCertificateAuditItem {
  certificateId: string;
  folio: string;
  studentId: string;
  certificateStudentName: string;
  studentFullName: string;
  studentEmail: string | null;
  portalStatus: string;
  blockers: string[];
}

export interface CertificateNameMismatchAuditItem {
  certificateId: string;
  folio: string;
  studentId: string;
  certificateStudentName: string;
  studentFullName: string;
}

export interface StudentWithoutCertificateAuditItem {
  studentId: string;
  studentFullName: string;
  email: string | null;
  portalStatus: string;
  portalEnabled: boolean;
}

export interface StudentCertificateAuditReport {
  summary: StudentCertificateAuditSummary;
  orphanCertificates: OrphanCertificateAuditItem[];
  portalBlockedCertificates: PortalBlockedCertificateAuditItem[];
  certificateNameMismatches: CertificateNameMismatchAuditItem[];
  studentsWithoutCertificates: StudentWithoutCertificateAuditItem[];
  studentsWithPortalEnabledWithoutCertificates: StudentWithoutCertificateAuditItem[];
}
