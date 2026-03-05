import { NextRequest, NextResponse } from 'next/server';
import { FirebaseRoleRepository } from '@/lib/infrastructure/repositories/FirebaseRoleRepository';
import { RoleValue } from '@/lib/types/role';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    roles?: RoleValue[];
  };
}

export class RBACMiddleware {
  private roleRepository: FirebaseRoleRepository;

  constructor() {
    this.roleRepository = new FirebaseRoleRepository();
  }

  async requireRole(allowedRoles: RoleValue[], handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (req: AuthenticatedRequest): Promise<NextResponse> => {
      try {
        // Obtener usuario del request (debería venir del auth middleware)
        const user = req.user;
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Usuario no autenticado' },
            { status: 401 }
          );
        }

        // Obtener roles del usuario
        const userRoles = await this.roleRepository.getUserRoles(user.id);
        const roleCodes = await Promise.all(
          userRoles.map(async (userRole) => {
            const role = await this.roleRepository.findById(userRole.roleId);
            return role?.code;
          })
        );

        const userRoleCodes = roleCodes.filter(Boolean) as RoleValue[];
        user.roles = userRoleCodes;

        // Verificar si tiene al menos uno de los roles permitidos
        const hasPermission = allowedRoles.some(role => userRoleCodes.includes(role));

        if (!hasPermission) {
          return NextResponse.json(
            { success: false, error: 'Permiso denegado' },
            { status: 403 }
          );
        }

        // Ejecutar el handler original
        return await handler(req);
      } catch (error) {
        console.error('RBAC Middleware error:', error);
        return NextResponse.json(
          { success: false, error: 'Error de autorización' },
          { status: 500 }
        );
      }
    };
  }

  async requirePermission(resource: string, action: string, handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
    return async (req: AuthenticatedRequest): Promise<NextResponse> => {
      try {
        const user = req.user;
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Usuario no autenticado' },
            { status: 401 }
          );
        }

        // Obtener roles y permisos del usuario
        const userRoles = await this.roleRepository.getUserRoles(user.id);
        const permissions = await Promise.all(
          userRoles.map(async (userRole) => {
            const role = await this.roleRepository.findById(userRole.roleId);
            return role?.permissions || [];
          })
        );

        const allPermissions = permissions.flat();

        // Verificar permiso específico
        const hasPermission = allPermissions.some(permission => {
          if (permission.resource === '*' && permission.actions.includes('*' as any)) {
            return true; // Administrador
          }
          return permission.resource === resource && permission.actions.includes(action as any);
        });

        if (!hasPermission) {
          return NextResponse.json(
            { success: false, error: 'Permiso denegado' },
            { status: 403 }
          );
        }

        return await handler(req);
      } catch (error) {
        console.error('RBAC Permission error:', error);
        return NextResponse.json(
          { success: false, error: 'Error de autorización' },
          { status: 500 }
        );
      }
    };
  }
}

// Helper functions para uso común
export const rbac = new RBACMiddleware();

export const requireAdmin = rbac.requireRole(['administrator']);
export const requireSigner = rbac.requireRole(['signer', 'administrator']);
export const requireVerifier = rbac.requireRole(['verifier', 'signer', 'administrator']);
export const requireCoordinator = rbac.requireRole(['coordinator', 'verifier', 'signer', 'administrator']);
