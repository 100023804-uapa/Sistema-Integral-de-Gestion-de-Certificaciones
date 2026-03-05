import { Role } from '@/lib/types/role';
import { FirebaseRoleRepository } from '@/lib/infrastructure/repositories/FirebaseRoleRepository';

export class ListRolesUseCase {
  constructor(private roleRepository: FirebaseRoleRepository) {}

  async execute(activeOnly: boolean = false): Promise<Role[]> {
    if (activeOnly) {
      return await this.roleRepository.findActive();
    }
    
    return await this.roleRepository.findAll();
  }
}
