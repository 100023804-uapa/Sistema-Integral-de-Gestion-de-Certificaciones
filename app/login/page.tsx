"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, UserCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GraduationCap, Loader2, AlertCircle, User, ShieldCheck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { APP_VERSION } from '@/lib/config/changelog';
import { ChangelogModal } from '@/components/ui/ChangelogModal';
import { getAccessRepository } from '@/lib/container';

type LoginRole = 'admin' | 'student';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessRepo = getAccessRepository();
  const [role, setRole] = useState<LoginRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

  const setSessionCookie = () => {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `session=1; Path=/; Max-Age=43200; SameSite=Lax${secure}`;
  };

  const getRedirectPath = () => {
    const nextPath = searchParams.get('next');
    if (!nextPath || !nextPath.startsWith('/')) return '/dashboard';
    return nextPath;
  };

  const ensureAdminAccess = async (credential: UserCredential) => {
    const user = credential.user;
    const bootstrapped = await accessRepo.ensureBootstrapAdmin({ uid: user.uid, email: user.email });
    if (bootstrapped) return;

    const authorized = await accessRepo.hasAdminAccess(user.email);
    if (!authorized) {
      await signOut(auth);
      const authError = new Error('No autorizado');
      (authError as any).code = 'auth/not-authorized';
      throw authError;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (role === 'student') {
        // Para participantes, redirigimos a la consulta pÃºblica
        if (!email.trim()) {
           setError('Por favor ingrese una matrícula, cédula o folio válido.');
           setLoading(false);
           return;
        }
        router.push(`/verify?query=${encodeURIComponent(email)}`);
        return;
      }

      // Para administradores, procedemos con autenticaciÃ³n
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await ensureAdminAccess(credential);
      setSessionCookie();
      router.push(getRedirectPath());
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciales incorrectas. Verifique sus datos.');
      } else if (err.code === 'auth/not-authorized') {
        setError('Esta cuenta no tiene permisos administrativos.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espere unos minutos.');
      } else {
        setError('Error al iniciar sesión. Inténtelo de nuevo.');
      }
      setLoading(false);
    }
    // Nota: No poner setLoading(false) aquí para el caso de éxito de admin, 
    // ya que desmontará el componente o navegará.
    // Para student, la navegación ocurre y este estado es irrelevante, pero por si acaso falla algo antes.
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    
    try {
      const credential = await signInWithPopup(auth, provider);
      await ensureAdminAccess(credential);
      setSessionCookie();
      router.push(getRedirectPath());
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/not-authorized') {
        setError('Esta cuenta no tiene permisos administrativos.');
      } else {
        setError('No se pudo iniciar sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background with Brand Gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[var(--color-primary)] via-[#002b5c] to-[var(--color-primary)]">
        <div className="absolute inset-0 opacity-10" style={{ 
            backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', 
            backgroundSize: '24px 24px' 
        }}></div>
        {/* Decorative blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[var(--color-accent)] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Back Button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm"
      >
        <ChevronLeft size={20} />
        <span className="text-sm font-medium">Volver al Inicio</span>
      </Link>

      <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/20 transition-all duration-300 z-10 mx-4">
        
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex justify-center items-center p-3 rounded-2xl bg-primary/5 text-primary mb-2">
            <GraduationCap size={40} />
          </div>
          <h2 className="text-3xl font-black text-primary tracking-tight">
            Acceso SIGCE
          </h2>
          <p className="text-sm text-gray-500">
            Sistema Integral de Gestión de Certificaciones
          </p>
        </div>

        {/* Role Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setRole('student')}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200",
              role === 'student' 
                ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <User size={16} />
            Participante
          </button>
          <button
            onClick={() => setRole('admin')}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all duration-200",
              role === 'admin' 
                ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <ShieldCheck size={16} />
            Administrador
          </button>
        </div>

        {/* Error Message */}
        {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} />
                {error}
            </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-1 ml-1">
                {role === 'admin' ? 'Correo Institucional' : 'Matrícula o Cédula'}
              </label>
              <Input
                id="email"
                type={role === 'admin' ? 'email' : 'text'}
                placeholder={role === 'admin' ? "admin@sigce.edu.do" : "Ej: 2023-1234 o 402-..."}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            {role === 'admin' && (
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-1 ml-1">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-orange-500/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando...
              </>
            ) : (
                role === 'admin' ? 'Entrar como Admin' : 'Consultar Certificados'
            )}
          </Button>

          {role === 'admin' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-medium">
                  O continuar con
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full h-12 text-sm font-bold rounded-xl border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-gray-700"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </div>
          )}

          {role === 'admin' && (
            <p className="text-center text-xs text-gray-500 mt-6 px-4 animate-in fade-in slide-in-from-bottom-3">
              ¿No tienes cuenta? Para registrarte como administrador, <br/>
              <Link href="/request-access" className="font-medium text-primary hover:underline hover:text-orange-600 transition-colors">
                solicita acceso aquí.
              </Link>
              <br/>
              <span className="opacity-80 mt-1 block">
                ¿Ya fuiste aprobado? {' '}
                <Link href="/register-admin" className="font-medium text-primary hover:underline hover:text-orange-600 transition-colors">
                  Completa tu registro aquí.
                </Link>
              </span>
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 mt-8">
            <p>&copy; {new Date().getFullYear()} SIGCE - Todos los derechos reservados.</p>
            <button 
                onClick={() => setIsChangelogOpen(true)}
                className="text-gray-300 hover:text-primary transition-colors mt-2 inline-block hover:underline"
            >
                v{APP_VERSION}
            </button>
        </div>
      </div>
      
      <ChangelogModal 
        isOpen={isChangelogOpen} 
        onClose={() => setIsChangelogOpen(false)} 
      />
    </div>
  );
}

