export type ScopeType = 'global' | 'campus' | 'area' | 'personal';
export type RoleValue = 'administrator' | 'signer' | 'verifier' | 'coordinator' | string;

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string;
  menuPermissions: string[]; // Visibilidad declarada de menus dentro del dashboard
  capabilities: string[];    // Capacidades declaradas para acciones de UI y apoyo operativo
  permissions?: Permission[]; // Compatible con integraciones o middleware legacy
  scopeType: ScopeType;      // Define el alcance de datos asociado al rol de catalogo
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
