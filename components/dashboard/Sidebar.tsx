"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/lib/config/changelog';
import { ChangelogModal } from '@/components/ui/ChangelogModal';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  GraduationCap,
  LayoutTemplate,
  MapPin,
  Building,
  Type
} from 'lucide-react';

const menuItems = [
  { label: 'Resumen', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Certificados', icon: FileText, href: '/dashboard/certificates' },
  { label: 'Programas', icon: GraduationCap, href: '/dashboard/programs' },
  { label: 'Plantillas', icon: LayoutTemplate, href: '/dashboard/templates' },
  { label: 'Participantes', icon: Users, href: '/dashboard/graduates' },
  { label: 'Recintos', icon: MapPin, href: '/dashboard/campuses' },
  { label: 'Áreas Académicas', icon: Building, href: '/dashboard/academic-areas' },
  { label: 'Tipos de Certificado', icon: Type, href: '/dashboard/certificate-types' },
  { label: 'Usuarios', icon: Users, href: '/dashboard/users' },
  { label: 'Configuración', icon: Settings, href: '/dashboard/settings' },
];

import { useAuth } from '@/lib/contexts/AuthContext';

export function Sidebar() {
  const pathname = usePathname();
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col h-screen w-64 bg-primary text-white sticky top-0 border-r border-white/5 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-accent p-2 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-none">SIGCE</span>
            <span className="text-[10px] text-blue-200 uppercase tracking-widest mt-1">Admin Panel</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-accent text-white shadow-lg shadow-orange-500/20" 
                    : "text-blue-100 hover:bg-white/5"
                )}
              >
                <Icon size={20} className={cn(
                  "transition-colors",
                  isActive ? "text-white" : "group-hover:text-accent"
                )} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-blue-200 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
          
          <button 
            onClick={() => setIsChangelogOpen(true)}
            className="w-full text-center py-2 text-[10px] text-blue-300/50 hover:text-blue-200 hover:bg-white/5 rounded-lg transition-all"
          >
              v{APP_VERSION}
          </button>
        </div>
      </div>

      <ChangelogModal 
        isOpen={isChangelogOpen} 
        onClose={() => setIsChangelogOpen(false)} 
      />
    </>
  );
}
