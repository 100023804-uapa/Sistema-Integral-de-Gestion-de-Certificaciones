import { FirebaseCertificateTypeRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTypeRepository';

export class DeleteCertificateTypeUseCase {
  constructor(private certificateTypeRepository: FirebaseCertificateTypeRepository) {}

  async execute(id: string): Promise<void> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID del tipo de certificado es obligatorio');
    }

    // Verificar que el tipo exista
    const existingType = await this.certificateTypeRepository.findById(id);
    if (!existingType) {
      throw new Error('El tipo de certificado no existe');
    }

    // TODO: Verificar que no haya certificados asociados
    // Esto requerirá inyectar el repositorio de certificados

    await this.certificateTypeRepository.softDelete(id);
  }
}
