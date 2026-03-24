import type { RoleValue } from '@/lib/types/role';

export type InternalUserStatus = 'invited' | 'active' | 'disabled';

export interface InternalUser {
  uid: string;
  email: string;
  displayName: string;
  roleCode: RoleValue;
  status: InternalUserStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy: string;
  updatedBy?: string;
  inviteSentAt?: Date | null;
  activatedAt?: Date | null;
  lastLoginAt?: Date | null;
}

export interface CreateInternalUserInput {
  email: string;
  displayName: string;
  roleCode: RoleValue;
}

export interface UpdateInternalUserInput {
  displayName?: string;
  roleCode?: RoleValue;
  status?: InternalUserStatus;
  resendInvite?: boolean;
}
