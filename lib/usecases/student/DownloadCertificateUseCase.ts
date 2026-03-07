import { IStudentCertificateRepository } from '@/lib/domain/repositories/IStudentCertificateRepository';

export class DownloadCertificateUseCase {
  constructor(private certificateRepository: IStudentCertificateRepository) {}

  async execute(certificateId: string): Promise<string> {
    // Aquí iría la lógica de descarga
    // Por ahora retornamos la URL del PDF
    const certificate = await this.certificateRepository.findById(certificateId);
    return certificate?.pdfUrl || '';
  }
}
