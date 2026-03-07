"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { BottomNav } from '@/components/dashboard/BottomNav';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { getAccessRepository } from '@/lib/container';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = React.useState(false);

  useEffect(() => {
    let isActive = true;

    const validateAccess = async () => {
      if (loading) return;

      if (!user) {
        router.push('/login');
        return;
      }

      try {
        const accessRepo = getAccessRepository();
        const hasAccess = await accessRepo.hasAdminAccess(user.email);

        if (!hasAccess) {
          await logout();
          if (isActive) router.push('/login');
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
  }, [user, loading, logout, router]);

  if (loading || (user && !authorized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
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
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
