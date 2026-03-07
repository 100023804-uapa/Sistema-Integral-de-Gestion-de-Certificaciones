import { StudentCertificate } from '../entities/StudentCertificate';

export interface IStudentCertificateRepository {
    findById(certificateId: string): Promise<{ pdfUrl?: string } | null>;
    findByStudentConstraints(constraints: any[][]): Promise<StudentCertificate[]>;
    findByStudentIdPaginated(
        studentId: string,
        pageSize?: number,
        cursor?: any
    ): Promise<{ data: StudentCertificate[]; hasMore: boolean; lastVisible?: any }>;
    getCertificateDetails(certificateId: string): Promise<StudentCertificate | null>;
}
