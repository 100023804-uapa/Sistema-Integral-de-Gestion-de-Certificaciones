import { FirebaseCampusRepository } from '@/lib/infrastructure/repositories/FirebaseCampusRepository';

export class DeleteCampusUseCase {
  constructor(private campusRepository: FirebaseCampusRepository) {}

  async execute(id: string): Promise<void> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID del recinto es obligatorio');
    }

    // Verificar que el recinto exista
    const existingCampus = await this.campusRepository.findById(id);
    if (!existingCampus) {
      throw new Error('El recinto no existe');
    }

    // TODO: Verificar que no tenga certificados asociados
    // Esto requerirá inyectar el repositorio de certificados

    await this.campusRepository.softDelete(id);
  }
}
