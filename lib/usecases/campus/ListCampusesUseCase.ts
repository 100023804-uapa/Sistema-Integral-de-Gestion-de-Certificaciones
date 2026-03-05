import { Campus } from '@/lib/types/campus';
import { FirebaseCampusRepository } from '@/lib/infrastructure/repositories/FirebaseCampusRepository';

export class ListCampusesUseCase {
  constructor(private campusRepository: FirebaseCampusRepository) {}

  async execute(activeOnly: boolean = false): Promise<Campus[]> {
    if (activeOnly) {
      return await this.campusRepository.findActive();
    }
    return await this.campusRepository.findAll();
  }
}
