import { ICertificateRepository } from '@/lib/domain/repositories/ICertificateRepository';

export class DownloadCertificateUseCase {
  constructor(private certificateRepository: ICertificateRepository) {}

  async execute(certificateId: string): Promise<string> {
    // Aquí iría la lógica de descarga
    // Por ahora retornamos la URL del PDF
    const certificate = await this.certificateRepository.findById(certificateId);
    return certificate?.pdfUrl || '';
  }
}
