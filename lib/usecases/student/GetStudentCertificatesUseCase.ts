import { StudentCertificate, StudentCertificateFilter } from '@/lib/domain/entities/StudentCertificate';
import { ICertificateRepository } from '@/lib/domain/repositories/ICertificateRepository';

export class GetStudentCertificatesUseCase {
  constructor(private certificateRepository: ICertificateRepository) {}

  async execute(studentId: string, filter?: StudentCertificateFilter): Promise<StudentCertificate[]> {
    // Construir query base
    let constraints: any[] = [
      ['studentId', '==', studentId]
    ];

    // Agregar filtros opcionales
    if (filter?.academicAreaId) {
      constraints.push(['academicAreaId', '==', filter.academicAreaId]);
    }

    if (filter?.campusId) {
      constraints.push(['campusId', '==', filter.campusId]);
    }

    if (filter?.certificateTypeId) {
      constraints.push(['type', '==', filter.certificateTypeId]);
    }

    if (filter?.status) {
      constraints.push(['status', '==', filter.status]);
    }

    if (filter?.dateFrom) {
      constraints.push(['issueDate', '>=', filter.dateFrom]);
    }

    if (filter?.dateTo) {
      constraints.push(['issueDate', '<=', filter.dateTo]);
    }

    if (filter?.search) {
      constraints.push(['folio', '>=', filter.search]);
    }

    return await this.certificateRepository.findByStudentConstraints(constraints);
  }
}
