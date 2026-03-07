import { IStudentCertificateRepository } from '@/lib/domain/repositories/IStudentCertificateRepository';

export class GetCertificateDetailsUseCase {
  constructor(private certificateRepository: IStudentCertificateRepository) {}

  async execute(certificateId: string): Promise<any> {
    return await this.certificateRepository.getCertificateDetails(certificateId);
  }
}
