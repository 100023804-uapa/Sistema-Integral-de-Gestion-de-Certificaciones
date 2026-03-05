import { Campus, UpdateCampusRequest } from '@/lib/types/campus';
import { FirebaseCampusRepository } from '@/lib/infrastructure/repositories/FirebaseCampusRepository';

export class UpdateCampusUseCase {
  constructor(private campusRepository: FirebaseCampusRepository) {}

  async execute(id: string, data: UpdateCampusRequest): Promise<Campus> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID del recinto es obligatorio');
    }

    // Verificar que el recinto exista
    const existingCampus = await this.campusRepository.findById(id);
    if (!existingCampus) {
      throw new Error('El recinto no existe');
    }

    // Si se actualiza el código, verificar que no exista en otro recinto
    if (data.code) {
      const allCampuses = await this.campusRepository.findAll();
      const codeExists = allCampuses.some(
        campus => campus.id !== id && campus.code.toLowerCase() === data.code!.toLowerCase()
      );

      if (codeExists) {
        throw new Error('Ya existe otro recinto con ese código');
      }
    }

    return await this.campusRepository.update(id, data);
  }
}
