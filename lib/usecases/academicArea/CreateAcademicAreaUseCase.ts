import { AcademicArea, CreateAcademicAreaRequest } from '@/lib/types/academicArea';
import { FirebaseAcademicAreaRepository } from '@/lib/infrastructure/repositories/FirebaseAcademicAreaRepository';
import { FirebaseCampusRepository } from '@/lib/infrastructure/repositories/FirebaseCampusRepository';

export class CreateAcademicAreaUseCase {
  constructor(
    private academicAreaRepository: FirebaseAcademicAreaRepository,
    private campusRepository: FirebaseCampusRepository
  ) {}

  async execute(data: CreateAcademicAreaRequest): Promise<AcademicArea> {
    // Validaciones de negocio
    if (!data.name?.trim()) {
      throw new Error('El nombre del área académica es obligatorio');
    }

    if (!data.code?.trim()) {
      throw new Error('El código del área académica es obligatorio');
    }

    if (!data.campusId?.trim()) {
      throw new Error('El ID del recinto es obligatorio');
    }

    // Verificar que el recinto exista y esté activo
    const campus = await this.campusRepository.findById(data.campusId);
    if (!campus) {
      throw new Error('El recinto especificado no existe');
    }

    if (!campus.isActive) {
      throw new Error('El recinto especificado no está activo');
    }

    // Verificar que el código no exista en el mismo recinto
    const existingAreas = await this.academicAreaRepository.findByCampus(data.campusId);
    const codeExists = existingAreas.some(
      area => area.code.toLowerCase() === data.code.toLowerCase()
    );

    if (codeExists) {
      throw new Error('Ya existe un área académica con ese código en este recinto');
    }

    return await this.academicAreaRepository.create(data);
  }
}
