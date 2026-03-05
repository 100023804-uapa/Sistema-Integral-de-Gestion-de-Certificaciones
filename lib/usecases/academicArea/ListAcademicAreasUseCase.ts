import { AcademicArea } from '@/lib/types/academicArea';
import { FirebaseAcademicAreaRepository } from '@/lib/infrastructure/repositories/FirebaseAcademicAreaRepository';

export class ListAcademicAreasUseCase {
  constructor(private academicAreaRepository: FirebaseAcademicAreaRepository) {}

  async execute(activeOnly: boolean = false, campusId?: string): Promise<AcademicArea[]> {
    if (campusId) {
      // Si se especifica campusId, filtrar por ese campus
      return await this.academicAreaRepository.findByCampus(campusId);
    }

    if (activeOnly) {
      return await this.academicAreaRepository.findActive();
    }
    
    return await this.academicAreaRepository.findAll();
  }
}
