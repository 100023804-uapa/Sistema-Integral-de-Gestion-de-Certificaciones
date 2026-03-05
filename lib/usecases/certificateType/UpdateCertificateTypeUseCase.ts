import { CertificateType, UpdateCertificateTypeRequest, CertificateTypeValue } from '@/lib/types/certificateType';
import { FirebaseCertificateTypeRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTypeRepository';

export class UpdateCertificateTypeUseCase {
  constructor(private certificateTypeRepository: FirebaseCertificateTypeRepository) {}

  async execute(id: string, data: UpdateCertificateTypeRequest): Promise<CertificateType> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID del tipo de certificado es obligatorio');
    }

    // Verificar que el tipo exista
    const existingType = await this.certificateTypeRepository.findById(id);
    if (!existingType) {
      throw new Error('El tipo de certificado no existe');
    }

    // Si se actualiza el código, validar que sea uno de los valores permitidos
    if (data.code) {
      const validCodes: CertificateTypeValue[] = ['horizontal', 'vertical', 'institutional_macro'];
      if (!validCodes.includes(data.code)) {
        throw new Error('El código debe ser: horizontal, vertical, o institutional_macro');
      }

      // Verificar que el código no exista (excepto el actual)
      const typeWithCode = await this.certificateTypeRepository.findByCode(data.code);
      if (typeWithCode && typeWithCode.id !== id) {
        throw new Error('Ya existe otro tipo de certificado con ese código');
      }
    }

    // Validación específica para institutional_macro
    if (data.code === 'institutional_macro' || (data.code === undefined && existingType.code === 'institutional_macro')) {
      // Según requerimientos: "Certificado institucional macro solo genera estructura sin firma automática"
      data.requiresSignature = false;
    }

    return await this.certificateTypeRepository.update(id, data);
  }
}
