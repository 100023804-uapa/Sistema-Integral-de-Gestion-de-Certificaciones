"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import { getAccessRepository, getRoleRepository } from '@/lib/container';
import { getRoleFromClaims, hasInternalAccessClaim } from '@/lib/auth/claims';
import { ScopeType } from '@/lib/types/role';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

interface AuthContextType {
  user: User | null;
  userRoles: string[];
  permissions: {
    menus: string[];
    capabilities: string[];
  };
  scope: {
    type: ScopeType;
    campusIds: string[];
    academicAreaIds: string[];
    signerIds: string[];
  };
  loading: boolean;
  logout: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
  hasCapability: (capability: string) => boolean;
}

const emptyPermissions: AuthContextType['permissions'] = { menus: [], capabilities: [] };
const emptyScope: AuthContextType['scope'] = {
  type: 'personal' as ScopeType,
  campusIds: [],
  academicAreaIds: [],
  signerIds: [],
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRoles: [],
  permissions: emptyPermissions,
  scope: emptyScope,
  loading: true,
  logout: async () => {},
  hasRole: () => false,
  hasCapability: () => false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState(emptyPermissions);
  const [scope, setScope] = useState(emptyScope);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState(
    'Validando la sesión y cargando tus permisos.'
  );

  useEffect(() => {
    let settled = false;

    const ensureServerSession = async (authUser: User) => {
      const verifyResponse = await fetch('/api/auth/session/verify', {
        method: 'GET',
        cache: 'no-store',
      });

      if (verifyResponse.ok) {
        return;
      }

      const idToken = await authUser.getIdToken();
      const sessionResponse = await fetch('/api/auth/session/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionResponse.ok) {
        const payload = (await sessionResponse.json().catch(() => null)) as
          | {
              code?: string;
              error?: string;
              detail?: string;
            }
          | null;
        const sessionError = new Error(
          typeof payload?.error === 'string'
            ? payload.error
            : 'No fue posible crear la sesión segura.'
        );
        (
          sessionError as Error & {
            status?: number;
            code?: string;
            detail?: string;
          }
        ).status = sessionResponse.status;
        (
          sessionError as Error & {
            status?: number;
            code?: string;
            detail?: string;
          }
        ).code = typeof payload?.code === 'string' ? payload.code : 'session-create-failed';
        (
          sessionError as Error & {
            status?: number;
            code?: string;
            detail?: string;
          }
        ).detail = typeof payload?.detail === 'string' ? payload.detail : undefined;
        throw sessionError;
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      settled = true;
      setUser(authUser);
      setLoading(true);

      if (authUser) {
        try {
          setLoadingMessage('Validando la sesión del usuario...');
          await ensureServerSession(authUser);
          setLoadingMessage('Cargando permisos y alcance de trabajo...');
          const idTokenResult = await authUser.getIdTokenResult();

          const rolesSet = new Set<string>();
          const menusSet = new Set<string>();
          const capsSet = new Set<string>();
          const campusIdsSet = new Set<string>();
          const areaIdsSet = new Set<string>();
          const signerIdsSet = new Set<string>();
          let topScopeType: ScopeType = 'personal';

          const scopeOrder: Record<ScopeType, number> = {
            global: 4,
            campus: 3,
            area: 2,
            personal: 1,
          };

          const roleFromClaims = getRoleFromClaims(idTokenResult.claims);
          if (hasInternalAccessClaim(idTokenResult.claims) && roleFromClaims) {
            rolesSet.add(roleFromClaims);
          }

          const accessRepo = getAccessRepository();
          const hasAdmin = await accessRepo.hasAdminAccess(authUser.email);
          if (hasAdmin) {
            rolesSet.add('admin');
            rolesSet.add('administrator');
            topScopeType = 'global';
          }

          const roleRepo = getRoleRepository();
          const userRolesData = await roleRepo.getUserRoles(authUser.uid);

          for (const assignment of userRolesData) {
            if (!assignment.isActive) continue;

            const roleDetails = await roleRepo.findById(assignment.roleId);
            if (!roleDetails || !roleDetails.isActive) continue;

            rolesSet.add(roleDetails.code);
            roleDetails.menuPermissions?.forEach((menu) => menusSet.add(menu));
            roleDetails.capabilities?.forEach((capability) => capsSet.add(capability));

            if (scopeOrder[roleDetails.scopeType] > scopeOrder[topScopeType]) {
              topScopeType = roleDetails.scopeType;
            }

            if (assignment.campusId) campusIdsSet.add(assignment.campusId);
            if (assignment.academicAreaId) areaIdsSet.add(assignment.academicAreaId);
            if (assignment.signerId) signerIdsSet.add(assignment.signerId);
          }

          const bootstrapAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.trim().toLowerCase();
          if (rolesSet.size === 0 && authUser.email?.trim().toLowerCase() === bootstrapAdminEmail) {
            rolesSet.add('admin');
            rolesSet.add('administrator');
            topScopeType = 'global';
          }

          setUserRoles(Array.from(rolesSet));
          setPermissions({
            menus: Array.from(menusSet),
            capabilities: Array.from(capsSet),
          });
          setScope({
            type: topScopeType,
            campusIds: Array.from(campusIdsSet),
            academicAreaIds: Array.from(areaIdsSet),
            signerIds: Array.from(signerIdsSet),
          });
        } catch (error) {
          console.error('Error fetching user roles or session:', error);
          const sessionError = error as Error & { status?: number };
          if (sessionError.status === 401 || sessionError.status === 403) {
            try {
              await signOut(auth);
            } catch (signOutError) {
              console.error('Error signing out after rejected server session:', signOutError);
            }
          }
          setUserRoles([]);
          setPermissions(emptyPermissions);
          setScope(emptyScope);
        }
      } else {
        setLoadingMessage('Cerrando sesión previa...');
        setUserRoles([]);
        setPermissions(emptyPermissions);
        setScope(emptyScope);
        try {
          await fetch('/api/auth/session/logout', { method: 'POST' });
        } catch (error) {
          console.error('Error clearing server session:', error);
        }
      }

      setLoading(false);
    });

    const timeout = setTimeout(() => {
      if (!settled) {
        setLoading(false);
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/session/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const hasRole = (roleOrRoles: string | string[]) => {
    if (userRoles.includes('admin') || userRoles.includes('administrator')) return true;
    if (Array.isArray(roleOrRoles)) return roleOrRoles.some((role) => userRoles.includes(role));
    return userRoles.includes(roleOrRoles);
  };

  const hasCapability = (capability: string) => {
    if (userRoles.includes('admin') || userRoles.includes('administrator')) return true;
    return permissions.capabilities.includes(capability);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRoles,
        permissions,
        scope,
        loading,
        logout,
        hasRole,
        hasCapability,
      }}
    >
      {!loading ? (
        children
      ) : (
        <LoadingScreen
          title="Preparando tu acceso"
          description={loadingMessage}
        />
      )}
    </AuthContext.Provider>
  );
}
