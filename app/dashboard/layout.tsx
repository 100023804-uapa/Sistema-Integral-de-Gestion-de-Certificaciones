"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { DashboardTopActions } from '@/components/dashboard/DashboardTopActions';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getAllowedRolesForDashboardPath, hasAnyAllowedRole } from '@/lib/auth/permissions';
import { LoadingScreen } from '@/components/ui/LoadingScreen';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userRoles, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = React.useState(false);

  useEffect(() => {
    let isActive = true;

    const validateAccess = async () => {
      if (loading) return;

      if (isActive) {
        setAuthorized(false);
      }

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        if (userRoles.length === 0) {
          await logout();
          if (isActive) router.push('/login');
          return;
        }

        const allowedRoles = getAllowedRolesForDashboardPath(pathname);
        if (allowedRoles && !hasAnyAllowedRole(userRoles, allowedRoles)) {
          if (isActive) router.push('/dashboard');
          return;
        }

        if (isActive) setAuthorized(true);
      } catch (error) {
        console.error('Error validating dashboard access:', error);
        await logout();
        if (isActive) router.push('/login');
      }
    };

    void validateAccess();

    return () => {
      isActive = false;
    };
  }, [loading, logout, pathname, router, user, userRoles]);

  if (loading || (user && !authorized)) {
    return (
      <LoadingScreen
        title="Verificando acceso al panel"
        description="Estamos validando tu perfil y los permisos disponibles para esta sección."
      />
    );
  }

  if (!user) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-background)]">
      <Sidebar />
      <main className="flex-1 pb-28 md:pb-0">
        <div className="container max-w-7xl mx-auto">
          <div className="flex justify-end px-4 pt-6 md:px-8 md:pt-8">
            <DashboardTopActions />
          </div>
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
