import { FirebaseRoleRepository } from '@/lib/infrastructure/repositories/FirebaseRoleRepository';
import { AssignRoleRequest } from '@/lib/types/role';

export class AssignRoleUseCase {
  constructor(private roleRepository: FirebaseRoleRepository) {}

  async execute(data: AssignRoleRequest, assignedBy: string): Promise<void> {
    // Validaciones
    if (!data.userId?.trim()) {
      throw new Error('El ID del usuario es obligatorio');
    }

    if (!data.roleId?.trim()) {
      throw new Error('El ID del rol es obligatorio');
    }

    // Verificar que el rol exista
    const role = await this.roleRepository.findById(data.roleId);
    if (!role) {
      throw new Error('El rol especificado no existe');
    }

    if (!role.isActive) {
      throw new Error('El rol especificado no está activo');
    }

    // Verificar si el usuario ya tiene este rol
    const userRoles = await this.roleRepository.getUserRoles(data.userId);
    const hasRole = userRoles.some(userRole => userRole.roleId === data.roleId && userRole.isActive);
    
    if (hasRole) {
      throw new Error('El usuario ya tiene asignado este rol');
    }

    await this.roleRepository.assignRole(data, assignedBy);
  }
}
