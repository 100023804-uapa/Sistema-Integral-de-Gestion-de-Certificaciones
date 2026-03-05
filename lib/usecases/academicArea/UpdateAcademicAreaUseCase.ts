import { AcademicArea, UpdateAcademicAreaRequest } from '@/lib/types/academicArea';
import { FirebaseAcademicAreaRepository } from '@/lib/infrastructure/repositories/FirebaseAcademicAreaRepository';
import { FirebaseCampusRepository } from '@/lib/infrastructure/repositories/FirebaseCampusRepository';

export class UpdateAcademicAreaUseCase {
  constructor(
    private academicAreaRepository: FirebaseAcademicAreaRepository,
    private campusRepository: FirebaseCampusRepository
  ) {}

  async execute(id: string, data: UpdateAcademicAreaRequest): Promise<AcademicArea> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID del área académica es obligatorio');
    }

    // Verificar que el área exista
    const existingArea = await this.academicAreaRepository.findById(id);
    if (!existingArea) {
      throw new Error('El área académica no existe');
    }

    // Si se actualiza el campusId, verificar que exista
    if (data.campusId) {
      const campus = await this.campusRepository.findById(data.campusId);
      if (!campus) {
        throw new Error('El recinto especificado no existe');
      }

      if (!campus.isActive) {
        throw new Error('El recinto especificado no está activo');
      }
    }

    // Si se actualiza el código, verificar que no exista en el mismo recinto
    if (data.code) {
      const campusId = data.campusId || existingArea.campusId;
      const areasInCampus = await this.academicAreaRepository.findByCampus(campusId);
      const codeExists = areasInCampus.some(
        area => area.id !== id && area.code.toLowerCase() === data.code!.toLowerCase()
      );

      if (codeExists) {
        throw new Error('Ya existe otra área académica con ese código en este recinto');
      }
    }

    return await this.academicAreaRepository.update(id, data);
  }
}
