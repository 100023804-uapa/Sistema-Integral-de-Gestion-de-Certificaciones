import { getAdminDb } from '@/lib/firebaseAdmin';
import type {
  CertificateNameMismatchAuditItem,
  OrphanCertificateAuditItem,
  PortalBlockedCertificateAuditItem,
  StudentCertificateAuditReport,
  StudentWithoutCertificateAuditItem,
} from '@/lib/types/studentCertificateAudit';

const STUDENTS_COLLECTION = 'students';
const CERTIFICATES_COLLECTION = 'certificates';

type StudentAuditRecord = {
  studentId: string;
  fullName: string;
  email: string | null;
  portalEnabled: boolean;
  portalStatus: string;
  authUid: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate();
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function buildFullName(firstName: unknown, lastName: unknown, fallbackId: string) {
  const first = typeof firstName === 'string' ? firstName.trim() : '';
  const last = typeof lastName === 'string' ? lastName.trim() : '';
  const fullName = `${first} ${last}`.trim();
  return fullName || fallbackId;
}

function getPortalStatus(value: unknown) {
  if (
    value === 'inactive' ||
    value === 'invited' ||
    value === 'active' ||
    value === 'disabled'
  ) {
    return value;
  }

  return 'inactive';
}

function sortByFolio<T extends { folio: string }>(items: T[]) {
  return [...items].sort((left, right) => left.folio.localeCompare(right.folio));
}

export async function buildStudentCertificateAuditReport(): Promise<StudentCertificateAuditReport> {
  const [studentsSnapshot, certificatesSnapshot] = await Promise.all([
    getAdminDb().collection(STUDENTS_COLLECTION).get(),
    getAdminDb().collection(CERTIFICATES_COLLECTION).get(),
  ]);

  const studentsById = new Map<string, StudentAuditRecord>();
  const referencedStudentIds = new Set<string>();
  let studentsMissingEmail = 0;
  let studentsWithPortalEnabled = 0;

  for (const studentDoc of studentsSnapshot.docs) {
    const data = studentDoc.data() as Record<string, unknown>;
    const portalAccess =
      data.portalAccess && typeof data.portalAccess === 'object'
        ? (data.portalAccess as Record<string, unknown>)
        : {};
    const email =
      typeof data.email === 'string' && data.email.trim()
        ? normalizeEmail(data.email)
        : null;
    const portalEnabled = portalAccess.enabled === true;
    const portalStatus = getPortalStatus(portalAccess.status);
    const authUid =
      typeof portalAccess.authUid === 'string' && portalAccess.authUid.trim()
        ? portalAccess.authUid.trim()
        : null;

    if (!email) {
      studentsMissingEmail += 1;
    }

    if (portalEnabled) {
      studentsWithPortalEnabled += 1;
    }

    studentsById.set(studentDoc.id, {
      studentId: studentDoc.id,
      fullName: buildFullName(data.firstName, data.lastName, studentDoc.id),
      email,
      portalEnabled,
      portalStatus,
      authUid,
    });
  }

  const orphanCertificates: OrphanCertificateAuditItem[] = [];
  const portalBlockedCertificates: PortalBlockedCertificateAuditItem[] = [];
  const certificateNameMismatches: CertificateNameMismatchAuditItem[] = [];

  let linkedCertificates = 0;
  let certificatesWithoutStudentId = 0;
  let certificatesReadyForPortal = 0;

  for (const certificateDoc of certificatesSnapshot.docs) {
    const data = certificateDoc.data() as Record<string, unknown>;
    const studentId =
      typeof data.studentId === 'string' ? data.studentId.trim() : '';
    const certificateStudentName =
      typeof data.studentName === 'string' ? data.studentName.trim() : '';
    const folio = typeof data.folio === 'string' ? data.folio : certificateDoc.id;
    const status = typeof data.status === 'string' ? data.status : 'unknown';
    const issueDate = toDate(data.issueDate)?.toISOString() ?? null;

    if (!studentId) {
      certificatesWithoutStudentId += 1;
      orphanCertificates.push({
        certificateId: certificateDoc.id,
        folio,
        studentId: '',
        studentName: certificateStudentName,
        status,
        issueDate,
        reason: 'El certificado no tiene studentId vinculado.',
      });
      continue;
    }

    referencedStudentIds.add(studentId);
    const student = studentsById.get(studentId);

    if (!student) {
      orphanCertificates.push({
        certificateId: certificateDoc.id,
        folio,
        studentId,
        studentName: certificateStudentName,
        status,
        issueDate,
        reason: 'No existe un participante con ese studentId en la colección students.',
      });
      continue;
    }

    linkedCertificates += 1;

    if (
      certificateStudentName &&
      normalizeName(certificateStudentName) !== normalizeName(student.fullName)
    ) {
      certificateNameMismatches.push({
        certificateId: certificateDoc.id,
        folio,
        studentId,
        certificateStudentName,
        studentFullName: student.fullName,
      });
    }

    const blockers: string[] = [];

    if (!student.email) {
      blockers.push('Participante sin correo registrado.');
    }

    if (!student.portalEnabled) {
      blockers.push('Acceso al portal no habilitado.');
    } else {
      if (!student.authUid) {
        blockers.push('Acceso habilitado sin authUid vinculado.');
      }

      if (student.portalStatus === 'disabled') {
        blockers.push('Acceso al portal deshabilitado.');
      }
    }

    if (blockers.length === 0) {
      certificatesReadyForPortal += 1;
    } else {
      portalBlockedCertificates.push({
        certificateId: certificateDoc.id,
        folio,
        studentId,
        certificateStudentName,
        studentFullName: student.fullName,
        studentEmail: student.email,
        portalStatus: student.portalStatus,
        blockers,
      });
    }
  }

  const studentsWithoutCertificates: StudentWithoutCertificateAuditItem[] = [];
  const studentsWithPortalEnabledWithoutCertificates: StudentWithoutCertificateAuditItem[] = [];
  let studentsWithCertificates = 0;

  for (const student of studentsById.values()) {
    const hasCertificates = referencedStudentIds.has(student.studentId);

    if (hasCertificates) {
      studentsWithCertificates += 1;
      continue;
    }

    const item: StudentWithoutCertificateAuditItem = {
      studentId: student.studentId,
      studentFullName: student.fullName,
      email: student.email,
      portalStatus: student.portalStatus,
      portalEnabled: student.portalEnabled,
    };

    studentsWithoutCertificates.push(item);

    if (student.portalEnabled) {
      studentsWithPortalEnabledWithoutCertificates.push(item);
    }
  }

  return {
    summary: {
      generatedAt: new Date().toISOString(),
      totalCertificates: certificatesSnapshot.size,
      totalStudents: studentsSnapshot.size,
      linkedCertificates,
      orphanCertificates: orphanCertificates.length,
      certificatesWithoutStudentId,
      certificatesReadyForPortal,
      certificatesBlockedForPortal: portalBlockedCertificates.length,
      certificatesWithNameMismatch: certificateNameMismatches.length,
      studentsWithCertificates,
      studentsWithoutCertificates: studentsWithoutCertificates.length,
      studentsMissingEmail,
      studentsWithPortalEnabled,
      studentsWithPortalEnabledWithoutCertificates:
        studentsWithPortalEnabledWithoutCertificates.length,
    },
    orphanCertificates: sortByFolio(orphanCertificates),
    portalBlockedCertificates: sortByFolio(portalBlockedCertificates),
    certificateNameMismatches: sortByFolio(certificateNameMismatches),
    studentsWithoutCertificates: [...studentsWithoutCertificates].sort((left, right) =>
      left.studentId.localeCompare(right.studentId)
    ),
    studentsWithPortalEnabledWithoutCertificates: [
      ...studentsWithPortalEnabledWithoutCertificates,
    ].sort((left, right) => left.studentId.localeCompare(right.studentId)),
  };
}
