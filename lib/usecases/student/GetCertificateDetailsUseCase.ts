import { ICertificateRepository } from '@/lib/domain/repositories/ICertificateRepository';

export class GetCertificateDetailsUseCase {
  constructor(private certificateRepository: ICertificateRepository) {}

  async execute(certificateId: string): Promise<any> {
    return await this.certificateRepository.getCertificateDetails(certificateId);
  }
}
