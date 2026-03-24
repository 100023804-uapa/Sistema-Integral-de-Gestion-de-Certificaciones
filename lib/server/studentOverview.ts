import type { StudentPortalAccountStatus } from '@/lib/domain/entities/Student';
import { getAdminDb } from '@/lib/firebaseAdmin';
import type {
  StudentOverviewItem,
  StudentOverviewResponse,
} from '@/lib/types/studentOverview';

const STUDENTS_COLLECTION = 'students';
const CERTIFICATES_COLLECTION = 'certificates';

type StudentCertificateStats = {
  certificateCount: number;
  lastIssuedAt: Date | null;
  lastIssuedFolio: string | null;
};

type ListStudentOverviewOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
};

function normalizeText(value: string) {
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

function toOptionalString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizePortalStatus(value: unknown): StudentPortalAccountStatus {
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

function buildFullName(firstName: unknown, lastName: unknown, fallbackId: string) {
  const first = typeof firstName === 'string' ? firstName.trim() : '';
  const last = typeof lastName === 'string' ? lastName.trim() : '';
  const fullName = `${first} ${last}`.trim();
  return fullName || fallbackId;
}

function compareByMostRecent(left: StudentOverviewItem, right: StudentOverviewItem) {
  const leftCreatedAt = left.createdAt ? new Date(left.createdAt).getTime() : 0;
  const rightCreatedAt = right.createdAt ? new Date(right.createdAt).getTime() : 0;

  return rightCreatedAt - leftCreatedAt;
}

function matchesStudentQuery(student: StudentOverviewItem, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return true;
  }

  const fields = [
    student.fullName,
    student.studentId,
    student.email || '',
    student.cedula || '',
    student.career || '',
  ];

  return fields.some((field) => normalizeText(field).includes(normalizedQuery));
}

export async function listStudentOverview(
  options: ListStudentOverviewOptions = {}
): Promise<StudentOverviewResponse> {
  const pageSize = Math.max(1, Math.min(100, options.pageSize ?? 20));
  const requestedPage = Math.max(1, options.page ?? 1);
  const query = typeof options.query === 'string' ? options.query.trim() : '';

  const [studentsSnapshot, certificatesSnapshot] = await Promise.all([
    getAdminDb().collection(STUDENTS_COLLECTION).get(),
    getAdminDb().collection(CERTIFICATES_COLLECTION).get(),
  ]);

  const certificateStatsByStudentId = new Map<string, StudentCertificateStats>();

  for (const certificateDoc of certificatesSnapshot.docs) {
    const data = certificateDoc.data() as Record<string, unknown>;
    const studentId = toOptionalString(data.studentId);

    if (!studentId) {
      continue;
    }

    const nextIssuedAt = toDate(data.issueDate);
    const nextFolio = toOptionalString(data.folio);
    const current = certificateStatsByStudentId.get(studentId) ?? {
      certificateCount: 0,
      lastIssuedAt: null,
      lastIssuedFolio: null,
    };

    const shouldReplaceLatest =
      !!nextIssuedAt &&
      (!current.lastIssuedAt || nextIssuedAt.getTime() > current.lastIssuedAt.getTime());

    certificateStatsByStudentId.set(studentId, {
      certificateCount: current.certificateCount + 1,
      lastIssuedAt: shouldReplaceLatest ? nextIssuedAt : current.lastIssuedAt,
      lastIssuedFolio: shouldReplaceLatest ? nextFolio : current.lastIssuedFolio,
    });
  }

  const allStudents: StudentOverviewItem[] = studentsSnapshot.docs.map((studentDoc) => {
    const data = studentDoc.data() as Record<string, unknown>;
    const portalAccess =
      data.portalAccess && typeof data.portalAccess === "object"
        ? (data.portalAccess as Record<string, unknown>)
        : {};
    const fullName = buildFullName(data.firstName, data.lastName, studentDoc.id);
    const stats = certificateStatsByStudentId.get(studentDoc.id);

    return {
      studentId: studentDoc.id,
      firstName: toOptionalString(data.firstName) || '',
      lastName: toOptionalString(data.lastName) || '',
      fullName,
      email: toOptionalString(data.email),
      cedula: toOptionalString(data.cedula),
      career: toOptionalString(data.career),
      createdAt: toDate(data.createdAt)?.toISOString() ?? null,
      updatedAt: toDate(data.updatedAt)?.toISOString() ?? null,
      certificateCount: stats?.certificateCount ?? 0,
      lastIssuedAt: stats?.lastIssuedAt?.toISOString() ?? null,
      lastIssuedFolio: stats?.lastIssuedFolio ?? null,
      portalEnabled: portalAccess.enabled === true,
      portalStatus: normalizePortalStatus(portalAccess.status),
    };
  });

  const filteredStudents = allStudents
    .filter((student) => matchesStudentQuery(student, query))
    .sort(compareByMostRecent);

  const total = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, totalPages);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: filteredStudents.slice(startIndex, endIndex),
    summary: {
      totalStudents: allStudents.length,
      totalWithCertificates: allStudents.filter((student) => student.certificateCount > 0).length,
      totalWithoutCertificates: allStudents.filter((student) => student.certificateCount === 0)
        .length,
      totalPortalEnabled: allStudents.filter((student) => student.portalEnabled).length,
    },
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}
