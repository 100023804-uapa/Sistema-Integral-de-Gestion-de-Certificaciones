"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { getAccessRepository, getRoleRepository } from '@/lib/container';

interface AuthContextType {
  user: User | null;
  userRoles: string[];
  loading: boolean;
  logout: () => Promise<void>;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRoles: [],
  loading: true,
  logout: async () => {},
  hasRole: () => false,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      settled = true;
      setUser(authUser);
      
      if (authUser) {
        try {
          // Obtener token para la sesión del servidor
          const idToken = await authUser.getIdToken();
          await fetch('/api/auth/session/login', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });

          // Obtener roles del usuario
          const roles = new Set<string>();
          
          // 1. Validar si es administrador legacy (access_users)
          const accessRepo = getAccessRepository();
          const hasAdmin = await accessRepo.hasAdminAccess(authUser.email);
          if (hasAdmin) {
            roles.add('admin');
            roles.add('administrator');
          }

          // 2. Validar roles del nuevo sistema (userRoles)
          const roleRepo = getRoleRepository();
          const userRolesData = await roleRepo.getUserRoles(authUser.uid);
          
          for (const ur of userRolesData) {
            const roleDetails = await roleRepo.findById(ur.roleId);
            if (roleDetails && roleDetails.code) {
               roles.add(roleDetails.code);
            }
          }

          // Si el usuario no tiene rol pero tiene email administrativo base:
          if (roles.size === 0 && authUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
             roles.add('admin');
             roles.add('administrator');
          }

          setUserRoles(Array.from(roles));

        } catch (error) {
          console.error('Error fetching user roles or session:', error);
          setUserRoles([]);
        }
      } else {
        setUserRoles([]);
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
    
    if (Array.isArray(roleOrRoles)) {
      return roleOrRoles.some(r => userRoles.includes(r));
    }
    return userRoles.includes(roleOrRoles);
  };

  return (
    <AuthContext.Provider value={{ user, userRoles, loading, logout, hasRole }}>
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
