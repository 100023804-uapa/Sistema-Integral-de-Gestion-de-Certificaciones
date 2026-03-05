import { FirebaseCertificateTemplateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository';

export class DeleteTemplateUseCase {
  constructor(
    private templateRepository: FirebaseCertificateTemplateRepository
  ) {}

  async execute(id: string): Promise<void> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID de la plantilla es obligatorio');
    }

    // Verificar que la plantilla exista
    const existingTemplate = await this.templateRepository.findById(id);
    if (!existingTemplate) {
      throw new Error('La plantilla no existe');
    }

    // TODO: Verificar que no haya certificados generados con esta plantilla
    // Esto requerirá verificar en la colección de certificados generados

    await this.templateRepository.softDelete(id);
  }
}
