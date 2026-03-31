import { Role, UpdateRoleRequest, RoleValue } from '@/lib/types/role';
import { FirebaseRoleRepository } from '@/lib/infrastructure/repositories/FirebaseRoleRepository';

export class UpdateRoleUseCase {
  constructor(private roleRepository: FirebaseRoleRepository) {}

  async execute(id: string, data: UpdateRoleRequest): Promise<Role> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID del rol es obligatorio');
    }

    // Verificar que el rol exista
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('El rol no existe');
    }

    if (data.code) {
      // Relaxed validation: Allow any alphanumeric code (slug-style)
      if (!/^[a-z0-9_-]+$/.test(data.code)) {
        throw new Error('El código solo puede contener letras minúsculas, números, guiones y guiones bajos');
      }

      // Verificar que el código no exista (excepto el actual)
      const roleWithCode = await this.roleRepository.findByCode(data.code);
      if (roleWithCode && roleWithCode.id !== id) {
        throw new Error('Ya existe otro rol con ese código');
      }
    }

    return await this.roleRepository.update(id, data);
  }
}
