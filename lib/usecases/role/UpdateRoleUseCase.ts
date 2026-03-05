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

    // Si se actualiza el código, validar que sea uno de los valores permitidos
    if (data.code) {
      const validCodes: RoleValue[] = ['coordinator', 'verifier', 'signer', 'administrator'];
      if (!validCodes.includes(data.code)) {
        throw new Error('El código debe ser: coordinator, verifier, signer, o administrator');
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
