import { CertificateType, CreateCertificateTypeRequest, CertificateTypeValue } from '@/lib/types/certificateType';
import { FirebaseCertificateTypeRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTypeRepository';

export class CreateCertificateTypeUseCase {
  constructor(private certificateTypeRepository: FirebaseCertificateTypeRepository) {}

  async execute(data: CreateCertificateTypeRequest): Promise<CertificateType> {
    // Validaciones de negocio
    if (!data.name?.trim()) {
      throw new Error('El nombre del tipo de certificado es obligatorio');
    }

    if (!data.code) {
      throw new Error('El código del tipo de certificado es obligatorio');
    }

    // Validar que el código sea uno de los valores permitidos
    const validCodes: CertificateTypeValue[] = ['horizontal', 'vertical', 'institutional_macro'];
    if (!validCodes.includes(data.code)) {
      throw new Error('El código debe ser: horizontal, vertical, o institutional_macro');
    }

    // Verificar que el código no exista
    const existingType = await this.certificateTypeRepository.findByCode(data.code);
    if (existingType) {
      throw new Error('Ya existe un tipo de certificado con ese código');
    }

    // Validación específica para institutional_macro
    if (data.code === 'institutional_macro') {
      // Según requerimientos: "Certificado institucional macro solo genera estructura sin firma automática"
      data.requiresSignature = false;
    }

    return await this.certificateTypeRepository.create(data);
  }
}
