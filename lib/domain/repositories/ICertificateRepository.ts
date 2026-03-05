import { Certificate, CertificateType, CreateCertificateDTO } from '../entities/Certificate';

export interface ICertificateRepository {
    save(certificate: CreateCertificateDTO): Promise<Certificate>;
    create(certificate: CreateCertificateDTO): Promise<Certificate>;
    findById(id: string): Promise<Certificate | null>;
    findByFolio(folio: string): Promise<Certificate | null>;
    findByVerificationCode(code: string): Promise<Certificate | null>;
    countByYearAndType(year: number, type: CertificateType): Promise<number>;
    reserveNextSequence?(year: number, type: CertificateType, prefix?: string): Promise<number>;
    list(limit?: number): Promise<Certificate[]>;
    findAll(): Promise<Certificate[]>;
    findByStudentId(studentId: string): Promise<Certificate[]>;
    updateStatus(id: string, status: Certificate['status']): Promise<void>;
    
    // Métodos para el historial del estudiante (US-12)
    findByStudentConstraints(constraints: any[][]): Promise<any[]>;
    findByStudentIdPaginated(studentId: string, pageSize?: number, cursor?: any): Promise<{ data: any[]; hasMore: boolean; lastVisible?: any }>;
    getCertificateDetails(certificateId: string): Promise<any>;
}
