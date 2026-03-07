"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { getAccessRepository, getRoleRepository } from '@/lib/container';
import { Role, ScopeType, UserRole } from '@/lib/types/role';

interface AuthContextType {
  user: User | null;
  userRoles: string[]; // Códigos de los roles (legacy + nuevos)
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

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRoles: [],
  permissions: {
    menus: [],
    capabilities: [],
  },
  scope: {
    type: 'personal',
    campusIds: [],
    academicAreaIds: [],
    signerIds: [],
  },
  loading: true,
  logout: async () => {},
  hasRole: () => false,
  hasCapability: () => false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<{
    menus: string[];
    capabilities: string[];
  }>({ menus: [], capabilities: [] });
  const [scope, setScope] = useState<{
    type: ScopeType;
    campusIds: string[];
    academicAreaIds: string[];
    signerIds: string[];
  }>({
    type: 'personal',
    campusIds: [],
    academicAreaIds: [],
    signerIds: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      settled = true;
      setUser(authUser);
      
      if (authUser) {
        try {
          const idToken = await authUser.getIdToken();
          await fetch('/api/auth/session/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          const rolesSet = new Set<string>();
          const menusSet = new Set<string>();
          const capsSet = new Set<string>();
          const campusIdsSet = new Set<string>();
          const areaIdsSet = new Set<string>();
          const signerIdsSet = new Set<string>();
          let topScopeType: ScopeType = 'personal';

          const scopeOrder: Record<ScopeType, number> = {
            'global': 4,
            'campus': 3,
            'area': 2,
            'personal': 1
          };

          // 1. Validar si es administrador legacy
          const accessRepo = getAccessRepository();
          const hasAdmin = await accessRepo.hasAdminAccess(authUser.email);
          if (hasAdmin) {
            rolesSet.add('admin');
            rolesSet.add('administrator');
            topScopeType = 'global'; // Acceso total
          }

          // 2. Validar roles del nuevo sistema
          const roleRepo = getRoleRepository();
          const userRolesData = await roleRepo.getUserRoles(authUser.uid);
          
          for (const ur of userRolesData) {
            if (!ur.isActive) continue;

            const roleDetails = await roleRepo.findById(ur.roleId);
            if (roleDetails && roleDetails.isActive) {
              rolesSet.add(roleDetails.code);
              
              // Acumular menús y capacidades
              roleDetails.menuPermissions?.forEach(m => menusSet.add(m));
              roleDetails.capabilities?.forEach(c => capsSet.add(c));

              // Actualizar alcance máximo
              if (scopeOrder[roleDetails.scopeType] > scopeOrder[topScopeType]) {
                topScopeType = roleDetails.scopeType;
              }

              // Acumular IDs de alcance específicos de la asignación
              if (ur.campusId) campusIdsSet.add(ur.campusId);
              if (ur.academicAreaId) areaIdsSet.add(ur.academicAreaId);
              if (ur.signerId) signerIdsSet.add(ur.signerId);
            }
          }

          // Super Admin base
          if (rolesSet.size === 0 && authUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
             rolesSet.add('admin');
             rolesSet.add('administrator');
             topScopeType = 'global';
          }

          setUserRoles(Array.from(rolesSet));
          setPermissions({
            menus: Array.from(menusSet),
            capabilities: Array.from(capsSet)
          });
          setScope({
            type: topScopeType,
            campusIds: Array.from(campusIdsSet),
            academicAreaIds: Array.from(areaIdsSet),
            signerIds: Array.from(signerIdsSet)
          });

        } catch (error) {
          console.error('Error fetching user roles or session:', error);
          setUserRoles([]);
        }
      } else {
        setUserRoles([]);
        setPermissions({ menus: [], capabilities: [] });
        setScope({ type: 'personal', campusIds: [], academicAreaIds: [], signerIds: [] });
        try {
          await fetch('/api/auth/session/logout', { method: 'POST' });
        } catch (error) {
          console.error('Error clearing server session:', error);
        }
      }
      setLoading(false);
    });

    const timeout = setTimeout(() => {
      if (!settled) setLoading(false);
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
    if (Array.isArray(roleOrRoles)) return roleOrRoles.some(r => userRoles.includes(r));
    return userRoles.includes(roleOrRoles);
  };

  const hasCapability = (capability: string) => {
    if (userRoles.includes('admin') || userRoles.includes('administrator')) return true;
    return permissions.capabilities.includes(capability);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRoles, 
      permissions, 
      scope, 
      loading, 
      logout, 
      hasRole, 
      hasCapability 
    }}>
      {!loading ? (
        children
      ) : (
        <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </AuthContext.Provider>
  );
}
