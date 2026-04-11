import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { GraduationCap } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary transition-opacity hover:opacity-80">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent text-white shadow-sm">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="hidden sm:inline-block tracking-tight">SIGCE</span>
        </Link>
        
        {/* Centered Navigation for Desktop */}
        <div className="hidden md:flex items-center gap-8 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Inicio
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Sobre Nosotros
            </Link>
            <Link href="/verify" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Validar Certificado
            </Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                Portal del Participante
            </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-primary font-semibold hover:bg-gray-100">
              Ingresar
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
