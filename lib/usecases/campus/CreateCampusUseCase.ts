import { Campus, CreateCampusRequest } from '@/lib/types/campus';
import { FirebaseCampusRepository } from '@/lib/infrastructure/repositories/FirebaseCampusRepository';

export class CreateCampusUseCase {
  constructor(private campusRepository: FirebaseCampusRepository) {}

  async execute(data: CreateCampusRequest): Promise<Campus> {
    // Validaciones de negocio
    if (!data.name?.trim()) {
      throw new Error('El nombre del recinto es obligatorio');
    }

    if (!data.code?.trim()) {
      throw new Error('El código del recinto es obligatorio');
    }

    // Verificar que el código no exista
    const existingCampuses = await this.campusRepository.findAll();
    const codeExists = existingCampuses.some(
      campus => campus.code.toLowerCase() === data.code.toLowerCase()
    );

    if (codeExists) {
      throw new Error('Ya existe un recinto con ese código');
    }

    return await this.campusRepository.create(data);
  }
}
