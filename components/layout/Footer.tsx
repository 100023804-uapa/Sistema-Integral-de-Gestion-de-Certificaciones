"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { GraduationCap, Mail, Phone, GitCommit } from 'lucide-react';
import { APP_VERSION } from '@/lib/config/changelog';
import { ChangelogModal } from '@/components/ui/ChangelogModal';

export function Footer() {
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  return (
    <>
      <footer className="bg-gray-900 text-white py-12 border-t border-gray-800">
        <div className="container px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="text-accent h-6 w-6" />
              <h3 className="text-xl font-bold">SIGCE</h3>
            </div>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
              Sistema Integral de Gestión de Certificaciones. Tecnología y educación unidas para la eficiencia.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-accent">Plataforma</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white transition-colors">Inicio</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">Sobre Nosotros</Link></li>
              <li><Link href="/verify" className="hover:text-white transition-colors">Validar Certificado</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Portal del Participante</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-accent">Contacto</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                soporte@sigce.edu.do
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                (XXX) XXX-XXXX
              </li>
            </ul>

            <div className="pt-4">
              <h4 className="text-sm font-bold uppercase tracking-wider text-accent mb-3">Versión</h4>
              <button 
                onClick={() => setIsChangelogOpen(true)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
              >
                <GitCommit size={16} className="group-hover:text-accent transition-colors" />
                <span className="font-mono">v{APP_VERSION}</span>
              </button>
            </div>
          </div>
        </div>
        <div className="container px-4 md:px-6 pt-8 mt-8 border-t border-gray-800 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">© 2026 SIGCE - Todos los derechos reservados.</p>
        </div>
      </footer>

      <ChangelogModal 
        isOpen={isChangelogOpen} 
        onClose={() => setIsChangelogOpen(false)} 
      />
    </>
  );
}
