import { FirebaseAcademicAreaRepository } from '@/lib/infrastructure/repositories/FirebaseAcademicAreaRepository';

export class DeleteAcademicAreaUseCase {
  constructor(private academicAreaRepository: FirebaseAcademicAreaRepository) {}

  async execute(id: string): Promise<void> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID del área académica es obligatorio');
    }

    // Verificar que el área exista
    const existingArea = await this.academicAreaRepository.findById(id);
    if (!existingArea) {
      throw new Error('El área académica no existe');
    }

    // TODO: Verificar que no tenga certificados asociados
    // Esto requerirá inyectar el repositorio de certificados

    await this.academicAreaRepository.softDelete(id);
  }
}
