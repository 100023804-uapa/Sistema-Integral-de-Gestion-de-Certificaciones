"use client";

import React from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield, Layout, Zap, Eye } from 'lucide-react';
import { dashboardMenuItems } from '@/components/dashboard/navigation';
import { ScopeType } from '@/lib/types/role';

interface PermissionsFormProps {
  selectedMenus: string[];
  selectedCapabilities: string[];
  scopeType: ScopeType;
  onMenuToggle: (menuId: string) => void;
  onCapabilityToggle: (capId: string) => void;
  onScopeChange: (scope: ScopeType) => void;
}

const CAPABILITIES = [
  { id: 'can_emit', label: 'Emisión', description: 'Crear nuevos certificados y registros.' },
  { id: 'can_edit', label: 'Modificación', description: 'Editar datos de registros existentes.' },
  { id: 'can_delete', label: 'Eliminación', description: 'Anular certificados o borrar registros.' },
  { id: 'can_sign', label: 'Firma Digital', description: 'Habilidad para firmar certificados (Bandeja de Firmas).' },
  { id: 'can_verify', label: 'Validación', description: 'Cambiar estados de certificados (Validar datos).' },
  { id: 'can_manage_templates', label: 'Gestión Técnica', description: 'Editar HTML/CSS de plantillas de diseño.' },
  { id: 'super_user', label: 'Super Usuario', description: 'Acceso total sin restricciones (Bypass).' },
];

const SCOPES: { value: ScopeType; label: string; description: string }[] = [
  { value: 'global', label: 'Global (Todo)', description: 'Acceso a nivel institucional completo.' },
  { value: 'campus', label: 'Por Recinto', description: 'Solo ve lo que pertenece a su campus asignado.' },
  { value: 'area', label: 'Por Área', description: 'Solo ve lo que pertenece a su área académica.' },
  { value: 'personal', label: 'Personal / Asignado', description: 'Solo ve lo que haya creado o tenga asignado directamente.' },
];

export function PermissionsForm({
  selectedMenus,
  selectedCapabilities,
  scopeType,
  onMenuToggle,
  onCapabilityToggle,
  onScopeChange
}: PermissionsFormProps) {
  
  // Filtrar solo los links de navegación reales (ignorar separadores)
  const navMenus = dashboardMenuItems.filter(item => item.kind === 'link');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* SECCIÓN DE ALCANCE */}
      <Card className="border-2 border-primary/5 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-primary">
            <Eye className="w-4 h-4" /> Alcance de Datos (Data Scope)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
          {SCOPES.map((scope) => (
            <div 
              key={scope.value}
              onClick={() => onScopeChange(scope.value)}
              className={`
                relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${scopeType === scope.value 
                  ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                  : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'}
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-bold text-sm ${scopeType === scope.value ? 'text-primary' : 'text-gray-700'}`}>
                  {scope.label}
                </span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${scopeType === scope.value ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                  {scopeType === scope.value && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </div>
              </div>
              <span className="text-xs text-gray-500 leading-tight">
                {scope.description}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* SECCIÓN DE MENÚS */}
        <Card className="shadow-sm border-gray-100 bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-gray-800">
              <Layout className="w-4 h-4 text-blue-500" /> Acceso a Menús
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 max-h-[400px] overflow-y-auto custom-scrollbar">
            <div className="grid gap-3">
              {navMenus.map((menu: any) => (
                <div 
                  key={menu.href} 
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer hover:bg-white
                    ${selectedMenus.includes(menu.href) ? 'border-blue-100 bg-blue-50/50' : 'border-transparent'}
                  `}
                  onClick={() => onMenuToggle(menu.href)}
                >
                  <Checkbox 
                    id={`menu-${menu.href}`}
                    checked={selectedMenus.includes(menu.href)}
                    onCheckedChange={() => onMenuToggle(menu.href)}
                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                  />
                  <div className="flex items-center gap-2">
                     <menu.icon className={`w-4 h-4 ${selectedMenus.includes(menu.href) ? 'text-blue-600' : 'text-gray-400'}`} />
                     <Label htmlFor={`menu-${menu.href}`} className="text-sm font-medium cursor-pointer">{menu.label}</Label>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* SECCIÓN DE CAPACIDADES */}
        <Card className="shadow-sm border-gray-100 bg-white/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-gray-50">
            <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-gray-800">
              <Zap className="w-4 h-4 text-orange-500" /> Capacidades Funcionales
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3">
              {CAPABILITIES.map((cap) => (
                <div 
                  key={cap.id} 
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:bg-white
                    ${selectedCapabilities.includes(cap.id) ? 'border-orange-100 bg-orange-50/50' : 'border-transparent'}
                  `}
                  onClick={() => onCapabilityToggle(cap.id)}
                >
                  <Checkbox 
                    id={`cap-${cap.id}`}
                    checked={selectedCapabilities.includes(cap.id)}
                    onCheckedChange={() => onCapabilityToggle(cap.id)}
                    className="mt-1 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                  />
                  <div className="grid gap-0.5">
                    <Label htmlFor={`cap-${cap.id}`} className="text-sm font-bold cursor-pointer">{cap.label}</Label>
                    <p className="text-xs text-gray-500 leading-tight leading-normal">{cap.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
