import { CertificateType } from '@/lib/types/certificateType';
import { FirebaseCertificateTypeRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTypeRepository';

export class ListCertificateTypesUseCase {
  constructor(private certificateTypeRepository: FirebaseCertificateTypeRepository) {}

  async execute(activeOnly: boolean = false): Promise<CertificateType[]> {
    if (activeOnly) {
      return await this.certificateTypeRepository.findActive();
    }
    
    return await this.certificateTypeRepository.findAll();
  }
}
