import { FirebaseRoleRepository } from '@/lib/infrastructure/repositories/FirebaseRoleRepository';

export class DeleteRoleUseCase {
  constructor(private roleRepository: FirebaseRoleRepository) {}

  async execute(id: string): Promise<void> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID del rol es obligatorio');
    }

    // Verificar que el rol exista
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('El rol no existe');
    }

    // TODO: Verificar que no haya usuarios asignados a este rol
    // Esto requerirá inyectar el repositorio de userRoles

    await this.roleRepository.softDelete(id);
  }
}
