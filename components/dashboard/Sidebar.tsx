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
  MapPin,
  Building,
  Type,
  Shield,
  Clock,
  PenTool,
  Palette,
  BarChart3,
  QrCode
} from 'lucide-react';

type MenuItem = {
  label: string;
  icon?: any;
  href?: string;
  text?: string;
};

const menuItems: MenuItem[] = [
  // 📊 Resumen General
  { label: 'Resumen', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Reportes', icon: BarChart3, href: '/dashboard/reports' },
  
  // 🏛️ Configuración Institucional
  { label: 'separator', text: 'Configuración Institucional' },
  { label: 'Recintos', icon: MapPin, href: '/dashboard/campuses' },
  { label: 'Áreas Académicas', icon: Building, href: '/dashboard/academic-areas' },
  { label: 'Tipos de Certificado', icon: Type, href: '/dashboard/certificate-types' },
  { label: 'Roles y Permisos', icon: Shield, href: '/dashboard/roles' },
  
  // 📚 Gestión Académica
  { label: 'separator', text: 'Gestión Académica' },
  { label: 'Programas', icon: GraduationCap, href: '/dashboard/programs' },
  { label: 'Participantes', icon: Users, href: '/dashboard/graduates' },
  
  // 📄 Gestión de Certificados
  { label: 'separator', text: 'Gestión de Certificados' },
  { label: 'Certificados', icon: FileText, href: '/dashboard/certificates' },
  { label: 'Validar QR', icon: QrCode, href: '/dashboard/validate' },
  { label: 'Estados', icon: Clock, href: '/dashboard/certificate-states' },
  { label: 'Firmas Digitales', icon: PenTool, href: '/dashboard/digital-signatures' },
  { label: 'Plantillas de Diseño', icon: Palette, href: '/dashboard/certificate-templates' },
  
  // ⚙️ Administración
  { label: 'separator', text: 'Administración' },
  { label: 'Usuarios del Sistema', icon: Users, href: '/dashboard/users' },
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
      <div className="hidden md:flex flex-col h-screen w-64 bg-primary text-white sticky top-0 border-r border-white/5 shadow-2xl shrink-0">
        <div className="p-8 flex items-center gap-3 shrink-0">
          <div className="bg-accent p-2 rounded-xl">
            <GraduationCap size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl leading-none">SIGCE</span>
            <span className="text-[10px] text-blue-200 uppercase tracking-widest mt-1">Admin Panel</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item, index) => {
            // Detectar si es un separador
            if (item.label === 'separator') {
              return (
                <div key={`separator-${index}`} className="pt-4">
                  <div className="px-4 py-2">
                    <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider opacity-70">
                      {item.text}
                    </div>
                  </div>
                </div>
              );
            }
            
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
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
