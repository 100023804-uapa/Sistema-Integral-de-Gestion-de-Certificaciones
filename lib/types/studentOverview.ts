import type { StudentPortalAccountStatus } from '@/lib/domain/entities/Student';

export interface StudentOverviewItem {
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  cedula: string | null;
  career: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  certificateCount: number;
  lastIssuedAt: string | null;
  lastIssuedFolio: string | null;
  portalEnabled: boolean;
  portalStatus: StudentPortalAccountStatus;
}

export interface StudentOverviewSummary {
  totalStudents: number;
  totalWithCertificates: number;
  totalWithoutCertificates: number;
  totalPortalEnabled: number;
}

export interface StudentOverviewPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface StudentOverviewResponse {
  data: StudentOverviewItem[];
  summary: StudentOverviewSummary;
  pagination: StudentOverviewPagination;
}
