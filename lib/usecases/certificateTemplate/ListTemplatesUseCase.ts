import { CertificateTemplate } from '@/lib/types/certificateTemplate';
import { FirebaseCertificateTemplateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository';

export class ListTemplatesUseCase {
  constructor(
    private templateRepository: FirebaseCertificateTemplateRepository
  ) {}

  async execute(activeOnly: boolean = false): Promise<CertificateTemplate[]> {
    if (activeOnly) {
      const templates = await this.templateRepository.findAll();
      return templates.filter(template => template.isActive);
    }
    
    return await this.templateRepository.findAll();
  }

  async findByType(type: 'horizontal' | 'vertical' | 'institutional_macro'): Promise<CertificateTemplate[]> {
    return await this.templateRepository.findByType(type);
  }

  async findByCertificateType(certificateTypeId: string): Promise<CertificateTemplate[]> {
    if (!certificateTypeId?.trim()) {
      throw new Error('El ID del tipo de certificado es obligatorio');
    }

    return await this.templateRepository.findByCertificateType(certificateTypeId);
  }

  async findById(id: string): Promise<CertificateTemplate | null> {
    if (!id?.trim()) {
      throw new Error('El ID de la plantilla es obligatorio');
    }

    return await this.templateRepository.findById(id);
  }
}
