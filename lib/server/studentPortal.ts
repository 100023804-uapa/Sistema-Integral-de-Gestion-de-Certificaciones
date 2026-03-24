import type { DecodedIdToken } from 'firebase-admin/auth';
import { hasInternalAccessClaim, getRoleFromClaims } from '@/lib/auth/claims';
import { verifySessionCookie } from '@/lib/auth/session';
import { getAdminDb } from '@/lib/firebaseAdmin';
import type { StudentPortalAccountStatus } from '@/lib/domain/entities/Student';
import type { CertificateRestrictionType } from '@/lib/types/certificateRestriction';
import { getRestrictionTypeLabel } from '@/lib/types/certificateRestriction';
import {
  canDownloadCertificate,
  getCertificateStatusLabel as getSharedCertificateStatusLabel,
  isCertificateBlocked,
  isCertificatePubliclyAvailable,
} from '@/lib/types/certificateStatus';

const STUDENTS_COLLECTION = 'students';
const CERTIFICATES_COLLECTION = 'certificates';
const LEGACY_ACCESS_USERS_COLLECTION = 'access_users';

export interface StudentPortalProfile {
  uid: string;
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  cedula?: string;
  phone?: string;
  career?: string;
  authUid?: string;
  portalAccessEnabled: boolean;
  portalAccessStatus: StudentPortalAccountStatus;
  mustChangePassword: boolean;
  activatedAt?: string;
  lastLoginAt?: string;
  lastPasswordChangeAt?: string;
}

export interface StudentPortalCertificateSummary {
  id: string;
  folio: string;
  programName: string;
  issueDate: string;
  status: string;
  statusLabel: string;
  verificationCode?: string;
  canDownload: boolean;
  availabilityMessage: string;
  restriction?: StudentPortalCertificateRestriction;
}

export interface StudentPortalCertificateDetail
  extends StudentPortalCertificateSummary {
  studentId: string;
  studentName: string;
  type?: string;
  qrCodeUrl: string;
  pdfUrl?: string;
  metadata: Record<string, unknown>;
}

export interface StudentPortalCertificateRestriction {
  active: boolean;
  type: CertificateRestrictionType;
  typeLabel: string;
  reason: string;
  blockedAt: string;
  releasedAt?: string;
}

export interface PublicCertificateValidation {
  id: string;
  folio: string;
  verificationCode?: string;
  issueDate: string;
  status: string;
  statusLabel: string;
  isValid: boolean;
  message: string;
}

export interface SessionAccessContext {
  uid: string;
  email: string | null;
  internalAccess: boolean;
  internalRole: string | null;
  studentAccess: boolean;
  student: StudentPortalProfile | null;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function buildFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function mapCertificateRestriction(
  value: unknown
): StudentPortalCertificateRestriction | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const source = value as Record<string, unknown>;
  const type =
    source.type === 'payment' ||
    source.type === 'documents' ||
    source.type === 'administrative'
      ? source.type
      : null;
  const reason = toOptionalString(source.reason);
  const blockedAt = toDate(source.blockedAt)?.toISOString();

  if (!type || !reason || !blockedAt) {
    return undefined;
  }

  return {
    active: source.active !== false,
    type,
    typeLabel: getRestrictionTypeLabel(type),
    reason,
    blockedAt,
    releasedAt: toDate(source.releasedAt)?.toISOString(),
  };
}

function normalizePortalStatus(value: unknown): StudentPortalAccountStatus {
  if (value === 'invited' || value === 'active' || value === 'disabled') {
    return value;
  }

  return 'inactive';
}

export function isCertificateCurrentlyValid(status: string) {
  return isCertificatePubliclyAvailable(status);
}

export function getCertificateStatusLabel(status: string) {
  return getSharedCertificateStatusLabel(status);
}

function mapStudentProfile(
  uid: string,
  studentId: string,
  data: Record<string, unknown>
): StudentPortalProfile {
  const firstName = typeof data.firstName === 'string' ? data.firstName : '';
  const lastName = typeof data.lastName === 'string' ? data.lastName : '';
  const email = typeof data.email === 'string' ? normalizeEmail(data.email) : '';
  const portalAccess =
    data.portalAccess && typeof data.portalAccess === 'object'
      ? (data.portalAccess as Record<string, unknown>)
      : {};
  const portalStatus = normalizePortalStatus(portalAccess.status);
  const portalAccessEnabled = portalAccess.enabled === true;
  const authUid = toOptionalString(portalAccess.authUid);
  const mustChangePassword = portalAccess.mustChangePassword === true;

  return {
    uid,
    studentId,
    email,
    firstName,
    lastName,
    fullName: buildFullName(firstName, lastName),
    cedula: toOptionalString(data.cedula),
    phone: toOptionalString(data.phone),
    career: toOptionalString(data.career),
    authUid,
    portalAccessEnabled,
    portalAccessStatus: portalStatus,
    mustChangePassword,
    activatedAt: toDate(portalAccess.activatedAt)?.toISOString(),
    lastLoginAt: toDate(portalAccess.lastLoginAt)?.toISOString(),
    lastPasswordChangeAt: toDate(portalAccess.lastPasswordChangeAt)?.toISOString(),
  };
}

function mapCertificateSummary(
  id: string,
  data: Record<string, unknown>
): StudentPortalCertificateSummary {
  const issueDate = toDate(data.issueDate) ?? new Date();
  const status = typeof data.status === 'string' ? data.status : 'draft';
  const pdfUrl = toOptionalString(data.pdfUrl);
  const restriction = mapCertificateRestriction(data.restriction);
  const canDownload = canDownloadCertificate(status, pdfUrl);
  let availabilityMessage = 'El certificado aun no esta habilitado para descarga.';

  if (restriction?.active && isCertificateBlocked(status)) {
    availabilityMessage = `Descarga temporalmente restringida por ${restriction.typeLabel}.`;
  } else if (canDownload) {
    availabilityMessage = 'Disponible para descarga dentro del portal autenticado.';
  } else if (isCertificatePubliclyAvailable(status) && !pdfUrl) {
    availabilityMessage = 'El documento existe, pero aun no tiene un PDF disponible.';
  }

  return {
    id,
    folio: typeof data.folio === 'string' ? data.folio : id,
    programName:
      typeof data.academicProgram === 'string'
        ? data.academicProgram
        : typeof data.programName === 'string'
          ? data.programName
          : 'Programa no disponible',
    issueDate: issueDate.toISOString(),
    status,
    statusLabel: getCertificateStatusLabel(status),
    verificationCode: toOptionalString(data.publicVerificationCode),
    canDownload,
    availabilityMessage,
    restriction,
  };
}

function mapCertificateDetail(
  id: string,
  data: Record<string, unknown>
): StudentPortalCertificateDetail {
  const summary = mapCertificateSummary(id, data);

  return {
    ...summary,
    studentId: typeof data.studentId === 'string' ? data.studentId : '',
    studentName: typeof data.studentName === 'string' ? data.studentName : '',
    type: toOptionalString(data.type),
    qrCodeUrl:
      toOptionalString(data.qrCodeUrl) ??
      `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'}/verify/${summary.verificationCode || summary.folio}`,
    pdfUrl: toOptionalString(data.pdfUrl),
    metadata:
      data.metadata && typeof data.metadata === 'object'
        ? (data.metadata as Record<string, unknown>)
        : {},
  };
}

async function findStudentByEmail(
  email: string,
  uid: string
): Promise<StudentPortalProfile | null> {
  const normalizedEmail = normalizeEmail(email);
  const students = getAdminDb().collection(STUDENTS_COLLECTION);

  let snapshot = await students.where('email', '==', normalizedEmail).limit(1).get();

  if (snapshot.empty && normalizedEmail !== email.trim()) {
    snapshot = await students.where('email', '==', email.trim()).limit(1).get();
  }

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return mapStudentProfile(uid, doc.id, doc.data() as Record<string, unknown>);
}

async function hasLegacyAdminAccess(email: string): Promise<boolean> {
  const doc = await getAdminDb()
    .collection(LEGACY_ACCESS_USERS_COLLECTION)
    .doc(normalizeEmail(email))
    .get();

  return (
    doc.exists &&
    doc.data()?.role === 'admin' &&
    doc.data()?.disabled !== true
  );
}

export async function resolveSessionAccessFromDecodedToken(
  decoded: DecodedIdToken
): Promise<SessionAccessContext> {
  const claims = decoded as unknown as Record<string, unknown>;
  const claimedRole = getRoleFromClaims(claims);
  let internalRole = claimedRole;
  const rawEmail = typeof decoded.email === 'string' ? decoded.email.trim() : null;
  const email = rawEmail ? normalizeEmail(rawEmail) : null;
  let internalAccess = hasInternalAccessClaim(claims) && claimedRole !== null;

  if (!internalAccess && rawEmail) {
    const bootstrapAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
    const isLegacyAdmin =
      (await hasLegacyAdminAccess(rawEmail)) || email === bootstrapAdminEmail;

    if (isLegacyAdmin) {
      internalAccess = true;
      internalRole = 'administrator';
    }
  }

  let student: StudentPortalProfile | null = null;
  if (!internalAccess && rawEmail) {
    student = await findStudentByEmail(rawEmail, decoded.uid);
  }

  const studentAccess =
    !internalAccess &&
    student !== null &&
    student.portalAccessEnabled &&
    student.authUid === decoded.uid &&
    student.portalAccessStatus !== 'disabled';

  return {
    uid: decoded.uid,
    email,
    internalAccess,
    internalRole,
    studentAccess,
    student,
  };
}

export async function resolveSessionAccessFromSessionCookie(sessionCookie: string) {
  const decoded = await verifySessionCookie(sessionCookie, true);
  return resolveSessionAccessFromDecodedToken(decoded);
}

export async function listStudentCertificates(
  studentId: string,
  searchTerm?: string
): Promise<StudentPortalCertificateSummary[]> {
  const snapshot = await getAdminDb()
    .collection(CERTIFICATES_COLLECTION)
    .where('studentId', '==', studentId)
    .get();

  const normalizedSearch = searchTerm?.trim().toLowerCase() ?? '';

  return snapshot.docs
    .map((doc) =>
      mapCertificateSummary(doc.id, doc.data() as Record<string, unknown>)
    )
    .filter((certificate) => {
      if (!normalizedSearch) return true;

      return (
        certificate.folio.toLowerCase().includes(normalizedSearch) ||
        certificate.programName.toLowerCase().includes(normalizedSearch) ||
        (certificate.verificationCode || '')
          .toLowerCase()
          .includes(normalizedSearch)
      );
    })
    .sort((left, right) => right.issueDate.localeCompare(left.issueDate));
}

async function findStudentCertificateDocument(
  studentId: string,
  idOrReference: string
) {
  const certificates = getAdminDb().collection(CERTIFICATES_COLLECTION);
  const directDoc = await certificates.doc(idOrReference).get();

  if (directDoc.exists && directDoc.data()?.studentId === studentId) {
    return directDoc;
  }

  const candidates = Array.from(
    new Set([idOrReference.trim(), idOrReference.trim().toUpperCase()])
  ).filter(Boolean);

  for (const candidate of candidates) {
    const byFolio = await certificates
      .where('studentId', '==', studentId)
      .where('folio', '==', candidate)
      .limit(1)
      .get();

    if (!byFolio.empty) {
      return byFolio.docs[0];
    }

    const byCode = await certificates
      .where('studentId', '==', studentId)
      .where('publicVerificationCode', '==', candidate)
      .limit(1)
      .get();

    if (!byCode.empty) {
      return byCode.docs[0];
    }
  }

  return null;
}

export async function getStudentCertificateDetail(
  studentId: string,
  idOrReference: string
): Promise<StudentPortalCertificateDetail | null> {
  const doc = await findStudentCertificateDocument(studentId, idOrReference);
  if (!doc || !doc.exists) {
    return null;
  }

  return mapCertificateDetail(doc.id, doc.data() as Record<string, unknown>);
}

async function findPublicCertificateDocument(reference: string) {
  const certificates = getAdminDb().collection(CERTIFICATES_COLLECTION);
  const directDoc = await certificates.doc(reference).get();

  if (directDoc.exists) {
    return directDoc;
  }

  const candidates = Array.from(new Set([reference.trim(), reference.trim().toUpperCase()]))
    .filter(Boolean);

  for (const candidate of candidates) {
    const byCode = await certificates
      .where('publicVerificationCode', '==', candidate)
      .limit(1)
      .get();

    if (!byCode.empty) {
      return byCode.docs[0];
    }

    const byFolio = await certificates.where('folio', '==', candidate).limit(1).get();
    if (!byFolio.empty) {
      return byFolio.docs[0];
    }
  }

  return null;
}

export async function findPublicCertificateValidation(
  reference: string
): Promise<PublicCertificateValidation | null> {
  const doc = await findPublicCertificateDocument(reference);
  if (!doc || !doc.exists) {
    return null;
  }

  const data = doc.data() as Record<string, unknown>;
  const summary = mapCertificateSummary(doc.id, data);
  const isValid = isCertificateCurrentlyValid(summary.status);
  const isBlocked = isCertificateBlocked(summary.status);
  const message = isValid
    ? 'El certificado existe en SIGCE y se encuentra vigente.'
    : isBlocked
      ? `El certificado existe en SIGCE, pero se encuentra ${summary.statusLabel.toLowerCase()}.`
      : 'El certificado existe en SIGCE, pero no se encuentra habilitado para uso publico.';

  return {
    id: summary.id,
    folio: summary.folio,
    verificationCode: summary.verificationCode,
    issueDate: summary.issueDate,
    status: summary.status,
    statusLabel: summary.statusLabel,
    isValid,
    message,
  };
}
