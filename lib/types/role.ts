export type ScopeType = 'global' | 'campus' | 'area' | 'personal';
export type RoleValue = 'administrator' | 'signer' | 'verifier' | 'coordinator' | string;

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  menuPermissions: string[]; // Lista de IDs de menús (ej: '/dashboard', '/dashboard/certificates')
  capabilities: string[];    // Lista de acciones (ej: 'can_sign', 'can_verify')
  permissions?: Permission[]; // Compatible con middleware RBAC legacy
  scopeType: ScopeType;      // Define el alcance de la visión del rol
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | '*')[];
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  campusId?: string;
  academicAreaId?: string;
  signerId?: string;
  assignedAt: Date;
  assignedBy: string;
  isActive: boolean;
}

export interface CreateRoleRequest {
  name: string;
  code: string;
  description?: string;
  menuPermissions: string[];
  capabilities: string[];
  scopeType: ScopeType;
}

export interface UpdateRoleRequest {
  name?: string;
  code?: string;
  description?: string;
  menuPermissions?: string[];
  capabilities?: string[];
  scopeType?: ScopeType;
  isActive?: boolean;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
  campusId?: string;
  academicAreaId?: string;
  signerId?: string;
}
