"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChevronLeft, Send, CheckCircle, AlertCircle, ShieldQuestion } from 'lucide-react';
import Link from 'next/link';
import { sendAdminRequestEmail } from '@/app/actions/send-email';
import { Toaster, toast } from 'sonner';
import { getAccessRepository } from '@/lib/container';

export default function RequestAccessPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
        // 1. Guardar en Firestore (Persistencia Principal)
        const accessRepo = getAccessRepository();
        await accessRepo.createAccessRequest({ email, name, reason });

        // 2. Intentar notificar por correo
        const result = await sendAdminRequestEmail({ email, name, reason });
        
        if (result.success) {
            setSuccess(true);
            toast.success('Solicitud enviada correctamente');
        } else {
            // Éxito parcial: Se guardó en DB pero falló el email
            console.warn('Email failed but request saved:', result.error);
            setSuccess(true);
            toast.success('Solicitud guardada. El administrador la verá en el panel.');
            toast.warning('No se pudo enviar la notificación por correo.', { duration: 5000 });
        }
    } catch (error) {
        toast.error('Error al procesar la solicitud. Intente nuevamente.');
        console.error(error);
    } finally {
        setLoading(false);
    }
  };

  if (success) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Solicitud Enviada!</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    Hemos notificado a los administradores sobre tu solicitud. 
                    Si es aprobada, recibirás una confirmación o podrás ingresar con tu correo institucional próximamente.
                </p>
                <Link href="/login">
                    <Button className="w-full">Volver al Login</Button>
                </Link>
            </div>
        </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Solicitar Acceso Admin</h1>
            <p className="text-gray-500 mt-2 text-sm">
                Completa este formulario para solicitar permisos de administrador en SIGCE.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Nombre Completo</label>
                <Input 
                    required 
                    placeholder="Ej: Juan Pérez" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 rounded-xl"
                />
            </div>
            
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Correo Institucional</label>
                <Input 
                    required 
                    type="email" 
                    placeholder="nombre@uapa.edu.do"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)} 
                    className="h-12 rounded-xl"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Motivo / Departamento</label>
                <textarea 
                    required 
                    placeholder="Ej: Soy coordinador del área de tecnología..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full min-h-[100px] p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                />
            </div>

            <div className="pt-2">
                <Button type="submit" className="w-full h-12 text-base shadow-lg shadow-primary/20" disabled={loading}>
                    {loading ? 'Enviando...' : (
                        <>
                            Enviar Solicitud <Send size={18} className="ml-2" />
                        </>
                    )}
                </Button>
            </div>
            
            <p className="text-xs text-center text-gray-400 mt-4">
                
            </p>
        </form>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
