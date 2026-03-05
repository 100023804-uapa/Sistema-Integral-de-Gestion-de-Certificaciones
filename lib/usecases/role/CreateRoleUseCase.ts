import { Role, CreateRoleRequest, RoleValue } from '@/lib/types/role';
import { FirebaseRoleRepository } from '@/lib/infrastructure/repositories/FirebaseRoleRepository';

export class CreateRoleUseCase {
  constructor(private roleRepository: FirebaseRoleRepository) {}

  async execute(data: CreateRoleRequest): Promise<Role> {
    // Validaciones de negocio
    if (!data.name?.trim()) {
      throw new Error('El nombre del rol es obligatorio');
    }

    if (!data.code) {
      throw new Error('El código del rol es obligatorio');
    }

    // Validar que el código sea uno de los valores permitidos
    const validCodes: RoleValue[] = ['coordinator', 'verifier', 'signer', 'administrator'];
    if (!validCodes.includes(data.code)) {
      throw new Error('El código debe ser: coordinator, verifier, signer, o administrator');
    }

    // Verificar que el código no exista
    const existingRole = await this.roleRepository.findByCode(data.code);
    if (existingRole) {
      throw new Error('Ya existe un rol con ese código');
    }

    return await this.roleRepository.create(data);
  }
}
