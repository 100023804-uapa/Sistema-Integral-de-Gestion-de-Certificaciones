"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { toast } from 'sonner';

import { getOperationalEmailStatus } from '@/app/actions/system-settings';
import { useAuth } from '@/lib/contexts/AuthContext';
import { auth, storage } from '@/lib/firebase';

type OperationalEmailStatus = {
  configured: boolean;
  source: 'deployment-env';
  provider: string | null;
  from: string | null;
  replyTo: string | null;
};

const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrador',
  coordinator: 'Coordinador',
  verifier: 'Verificador',
  signer: 'Firmante',
  admin: 'Administrador',
};

function formatRoleLabel(role: string) {
  return ROLE_LABELS[role] || role;
}

export default function SettingsPage() {
  const { user, userRoles } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [loadingEmailStatus, setLoadingEmailStatus] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [operationalEmailStatus, setOperationalEmailStatus] =
    useState<OperationalEmailStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  useEffect(() => {
    const loadOperationalEmailStatus = async () => {
      try {
        setLoadingEmailStatus(true);
        const result = await getOperationalEmailStatus();

        if (result.success && result.data) {
          setOperationalEmailStatus(result.data);
        } else {
          setOperationalEmailStatus(null);
        }
      } catch (error) {
        console.error('Error loading operational email status:', error);
        setOperationalEmailStatus(null);
      } finally {
        setLoadingEmailStatus(false);
      }
    };

    void loadOperationalEmailStatus();
  }, []);

  const visibleRoles = Array.from(
    new Set(userRoles.filter((role) => role !== 'admin'))
  );

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      if (!user) throw new Error('No user logged in');

      const storageRef = ref(storage, `profile_images/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      await updateProfile(user, { photoURL });
      toast.success('Foto de perfil actualizada correctamente');
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile picture:', error);
      toast.error('Error al actualizar la foto de perfil');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await updateProfile(user, { displayName });
      toast.success('Perfil actualizado correctamente');
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error('La cuenta actual no tiene correo disponible para restablecimiento.');
      return;
    }

    try {
      setSendingResetEmail(true);
      auth.languageCode = 'es';
      await sendPasswordResetEmail(auth, user.email);
      toast.success('Se envió un correo para definir una nueva contraseña.');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      toast.error('No fue posible enviar el correo de restablecimiento.');
    } finally {
      setSendingResetEmail(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 px-4 py-8 md:px-8 md:py-12">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-primary">
          Perfil y Operacion
        </h1>
        <p className="text-gray-500">
          Administra tu perfil, revisa tu acceso y consulta el estado operativo del correo del sistema.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-800">
            <User size={20} className="text-primary" /> Perfil de Usuario
          </h2>

          <div className="flex flex-col items-start gap-8 md:flex-row">
            <div className="flex flex-col items-center gap-3">
              <div
                className="group relative cursor-pointer"
                onClick={handleImageClick}
              >
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-gray-100 transition-all group-hover:border-primary/20">
                  {uploading ? (
                    <div className="flex h-full w-full items-center justify-center bg-gray-50">
                      <Loader2 className="animate-spin text-primary" />
                    </div>
                  ) : (
                    <img
                      src={
                        previewUrl ||
                        user?.photoURL ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100'
                      }
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="text-white" size={24} />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-400">Clic para cambiar</p>
            </div>

            <div className="grid w-full flex-1 grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Ej: Juan Perez"
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Correo Electronico
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500"
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-800">
            <ShieldCheck size={20} className="text-primary" /> Acceso Actual
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Correo autenticado
              </p>
              <p className="mt-2 font-medium text-gray-900">{user?.email || 'No disponible'}</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Roles internos
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {visibleRoles.length > 0 ? (
                  visibleRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800"
                    >
                      {formatRoleLabel(role)}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">Sin roles declarados</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Identidad Firebase
              </p>
              <p className="mt-2 break-all font-mono text-xs text-gray-700">
                {user?.uid || 'No disponible'}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-100 p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-800">
            <Lock size={20} className="text-primary" /> Seguridad
          </h2>

          <div className="space-y-4">
            <p className="max-w-2xl text-sm text-gray-600">
              El cambio de contrasena administrativa se gestiona mediante Firebase Auth. Desde aqui puedes
              solicitar un correo seguro de restablecimiento a tu cuenta autenticada.
            </p>
            <button
              onClick={handlePasswordReset}
              disabled={sendingResetEmail || !user?.email}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sendingResetEmail ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Enviando enlace...
                </>
              ) : (
                <>
                  <KeyRound size={18} />
                  Enviar correo para cambiar contrasena
                </>
              )}
            </button>
          </div>
        </div>

        <div className="border-b border-gray-100 p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-800">
            <Mail size={20} className="text-primary" /> Correo Operativo
          </h2>

          <p className="mb-6 max-w-2xl text-sm text-gray-600">
            El proveedor transaccional vigente se configura a nivel de despliegue mediante variables de entorno.
            Esta pantalla muestra el estado operativo actual y evita mezclar credenciales tecnicas con ajustes
            personales del usuario.
          </p>

          {loadingEmailStatus ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              Consultando estado operativo del correo...
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Proveedor activo
                </p>
                <p className="mt-2 font-medium capitalize text-gray-900">
                  {operationalEmailStatus?.provider || 'No configurado'}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Fuente
                </p>
                <p className="mt-2 font-medium text-gray-900">
                  {operationalEmailStatus?.source === 'deployment-env'
                    ? 'Variables de entorno del despliegue'
                    : 'No disponible'}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Remitente
                </p>
                <p className="mt-2 font-medium text-gray-900">
                  {operationalEmailStatus?.from || 'No configurado'}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Reply-To
                </p>
                <p className="mt-2 font-medium text-gray-900">
                  {operationalEmailStatus?.replyTo || 'No configurado'}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Estado
                </p>
                <p className="mt-2 font-medium text-gray-900">
                  {operationalEmailStatus?.configured
                    ? 'Listo para enviar notificaciones transaccionales.'
                    : 'Falta configuracion operativa en variables de entorno.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 bg-gray-50 p-8">
          <button
            onClick={handleSaveProfile}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
          >
            <Save size={20} /> Guardar Cambios del Perfil
          </button>
        </div>
      </div>
    </div>
  );
}
