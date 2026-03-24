"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, UserPlus } from 'lucide-react';

export default function RegisterAdminPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <Link 
        href="/login" 
        className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-full shadow-sm"
      >
        <ChevronLeft size={20} />
        <span className="text-sm font-medium">Volver al Login</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
            <div className="inline-flex justify-center items-center p-3 rounded-2xl bg-blue-50 text-blue-600 mb-4">
                <UserPlus size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Registro público deshabilitado</h1>
            <p className="text-gray-500 mt-2 text-sm">
                La creación de cuentas internas ahora solo se realiza desde administración.
            </p>
        </div>

        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
            <p>
              Un administrador debe crear tu usuario, asignarte rol y enviarte el enlace de activación o restablecimiento.
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 shrink-0 text-blue-600" size={18} />
              <span>Si ya recibiste el correo de activación, vuelve al login y entra con tus credenciales actualizadas.</span>
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
