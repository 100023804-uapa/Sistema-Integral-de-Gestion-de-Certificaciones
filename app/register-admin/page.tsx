"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getAccessRepository } from '@/lib/container';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, UserPlus, Lock } from 'lucide-react';

export default function RegisterAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // 1. Verify Whitelist
      const accessRepo = getAccessRepository();
      const isAllowed = await accessRepo.hasAdminAccess(email);

      if (!isAllowed) {
        toast.error('Error: Este correo no tiene permisos de administrador. Solicita acceso primero.');
        setLoading(false);
        return;
      }

      // 2. Create Auth User
      await createUserWithEmailAndPassword(auth, email, password);
      
      toast.success('Cuenta creada exitosamente. Redirigiendo...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Este correo ya está registrado. Intenta iniciar sesión.');
      } else {
        toast.error('Error al crear la cuenta: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Registro de Admin</h1>
            <p className="text-gray-500 mt-2 text-sm">
                Crea tu cuenta solo si has sido autorizado previamente.
            </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Correo Institucional</label>
                <div className="relative">
                    <Input 
                        required 
                        type="email" 
                        placeholder="nombre@uapa.edu.do"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                        className="h-12 rounded-xl pl-10"
                    />
                    <ShieldCheck className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>
            </div>
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Contraseña</label>
                <div className="relative">
                    <Input 
                        required 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 rounded-xl pl-10"
                    />
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Confirmar Contraseña</label>
                <div className="relative">
                    <Input 
                        required 
                        type="password" 
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-12 rounded-xl pl-10"
                    />
                    <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                </div>
            </div>

            <div className="pt-2">
                <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? 'Verificando y Creando...' : 'Crear Cuenta'}
                </Button>
            </div>
        </form>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
