"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, FileText, Users, Settings, Search, LayoutTemplate } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { hasAnyAllowedRole } from '@/lib/auth/permissions';
import type { RoleValue } from '@/lib/types/role';

type BottomNavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  href: string;
  allowedRoles?: readonly RoleValue[];
};

const navItems: BottomNavItem[] = [
  { label: 'Inicio', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Certificados', icon: FileText, href: '/dashboard/certificates' },
  { label: 'Programas', icon: LayoutTemplate, href: '/dashboard/programs', allowedRoles: ['administrator', 'coordinator'] },
  { label: 'Graduados', icon: Users, href: '/dashboard/graduates', allowedRoles: ['administrator', 'coordinator', 'verifier'] },
  { label: 'Ajustes', icon: Settings, href: '/dashboard/settings', allowedRoles: ['administrator'] },
];

export function BottomNav() {
  const pathname = usePathname();
  const { userRoles } = useAuth();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-100 md:hidden flex items-center justify-around px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {navItems
        .filter((item) => hasAnyAllowedRole(userRoles, item.allowedRoles))
        .map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link 
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all duration-300",
              isActive ? "text-accent" : "text-gray-400 hover:text-primary"
            )}
          >
            <Icon size={20} className={cn(isActive && "drop-shadow-[0_0_8px_rgba(255,130,0,0.3)]")} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">
              {item.label}
            </span>
          </Link>
        );
      })}
      
      {/* Central Floating-like Search Button for Mobile */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2">
        <button className="h-16 w-16 bg-accent rounded-full flex items-center justify-center text-white shadow-xl shadow-orange-500/40 border-4 border-white active:scale-95 transition-transform duration-200">
          <Search size={28} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
