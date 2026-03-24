"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';

export default function RequestAccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Link 
        href="/login" 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-full shadow-sm"
      >
        <ChevronLeft size={20} />
        <span className="text-sm font-medium">Volver</span>
      </Link>

        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
          <div className="text-center mb-8">
              <div className="inline-flex justify-center items-center p-3 rounded-2xl bg-orange-50 text-orange-600 mb-4">
                  <ShieldQuestion size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Acceso gestionado internamente</h1>
              <p className="text-gray-500 mt-2 text-sm">
                  Este flujo público quedó deshabilitado en la Fase 1.
              </p>
          </div>

          <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>
              A partir de ahora, un administrador de SIGCE debe crear tu cuenta interna, asignarte rol y enviarte el enlace de activación.
            </p>
            <p>
              Si necesitas acceso, solicita al área responsable que te registren desde el módulo <strong>Usuarios del Sistema</strong>.
            </p>
            <Link href="/login" className="block pt-2">
              <Button className="w-full h-12 text-base shadow-lg shadow-primary/20">
                Volver al Login
              </Button>
            </Link>
          </div>
      </div>
    </div>
  );
}
