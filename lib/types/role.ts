export type RoleValue = 'coordinator' | 'verifier' | 'signer' | 'administrator';

export interface Role {
  id: string;
  name: string;
  code: RoleValue;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  assignedAt: Date;
  assignedBy: string;
  isActive: boolean;
}

export interface CreateRoleRequest {
  name: string;
  code: RoleValue;
  description?: string;
  permissions?: Permission[];
}

export interface UpdateRoleRequest {
  name?: string;
  code?: RoleValue;
  description?: string;
  permissions?: Permission[];
  isActive?: boolean;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
}
