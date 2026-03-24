"use client";

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/contexts/AuthContext';

export function StudentLogoutButton() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <Button
      type="button"
      variant="secondary"
      className="gap-2"
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </Button>
  );
}
