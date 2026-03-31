"use client";

import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Camera,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Save,
  Send,
  ShieldCheck,
  User,
} from 'lucide-react';
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { toast } from 'sonner';

import {
  getOperationalEmailStatus,
  saveOperationalEmailDeliveryEnabled,
} from '@/app/actions/system-settings';
import { 
  getMasterAdmins, 
  addMasterAdmin, 
  toggleMasterAdminStatus 
} from '@/app/actions/access-users';
import { useAuth } from '@/lib/contexts/AuthContext';
import { auth, storage } from '@/lib/firebase';

interface MasterAdmin {
  id: string;
  email: string;
  disabled: boolean;
}

type OperationalEmailStatus = {
  configured: boolean;
  source: 'deployment-env';
  provider: string | null;
  from: string | null;
  replyTo: string | null;
  deliveryEnabled: boolean;
  canSend: boolean;
  reason: 'provider-missing' | 'delivery-paused' | 'settings-unavailable' | null;
};

const ROLE_LABELS: Record<string, string> = {
  administrator: 'Administrador',
  coordinator: 'Coordinador',
  verifier: 'Verificador',
  signer: 'Firmante',
  admin: 'Administrador',
};

function formatRoleLabel(role: string) {
  const label = ROLE_LABELS[role];
  if (label) return label;
  
  // Si no está en el mapa, formatear el slug (ej: verificador_2 -> Verificador 2)
  return role
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function SettingsPage() {
  const { user, userRoles, isLegacyAdmin } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [savingEmailControl, setSavingEmailControl] = useState(false);
  const [loadingEmailStatus, setLoadingEmailStatus] = useState(true);
  const [loadingMasterAdmins, setLoadingMasterAdmins] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [masterAdmins, setMasterAdmins] = useState<MasterAdmin[]>([]);
  const [operationalEmailStatus, setOperationalEmailStatus] =
    useState<OperationalEmailStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setTestEmail(user.email || '');
    }
  }, [user]);

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

  const loadMasterAdmins = async () => {
    if (!isLegacyAdmin) return;
    try {
      setLoadingMasterAdmins(true);
      const result = await getMasterAdmins();
      if (result.success && result.data) {
        setMasterAdmins(result.data as MasterAdmin[]);
      }
    } catch (error) {
      console.error('Error loading master admins:', error);
    } finally {
      setLoadingMasterAdmins(false);
    }
  };

  useEffect(() => {
    void loadOperationalEmailStatus();
    void loadMasterAdmins();
  }, [isLegacyAdmin]);

  const handleAddMasterAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    try {
      setLoadingMasterAdmins(true);
      const result = await addMasterAdmin(newAdminEmail, user?.uid || 'system');
      if (result.success) {
        toast.success(`Administrador ${newAdminEmail} agregado correctamente`);
        setNewAdminEmail('');
        await loadMasterAdmins();
      } else {
        toast.error(result.error || 'Error al agregar administrador');
      }
    } finally {
      setLoadingMasterAdmins(false);
    }
  };

  const handleToggleAdminStatus = async (email: string, currentDisabled: boolean) => {
    try {
      const result = await toggleMasterAdminStatus(email, currentDisabled);
      if (result.success) {
        toast.success(`Estado de ${email} actualizado`);
        await loadMasterAdmins();
      }
    } catch (error) {
      toast.error('Error al actualizar estado');
    }
  };

  const visibleRoles = Array.from(
    new Set(userRoles.filter((role) => role !== 'admin' && role !== 'administrator'))
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

  const handleSendOperationalTestEmail = async () => {
    try {
      if (!testEmail.trim()) {
        toast.error('Indica un correo destino para la prueba.');
        return;
      }

      setSendingTestEmail(true);
      const response = await fetch('/api/admin/notifications/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'No fue posible enviar el correo de prueba.');
      }

      const provider = payload.data?.provider ? ` via ${payload.data.provider}` : '';
      const messageId = payload.data?.messageId ? ` ID: ${payload.data.messageId}` : '';
      toast.success(`Correo de prueba enviado${provider}.${messageId}`);
    } catch (error) {
      console.error('Error sending operational test email:', error);
      toast.error(
        error instanceof Error ? error.message : 'No fue posible enviar el correo de prueba.'
      );
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleToggleOperationalEmail = async () => {
    if (!operationalEmailStatus) {
      toast.error('No fue posible cargar el estado operativo del correo.');
      return;
    }

    try {
      setSavingEmailControl(true);
      const nextValue = !operationalEmailStatus.deliveryEnabled;
      const result = await saveOperationalEmailDeliveryEnabled(nextValue);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'No fue posible actualizar la política de correo.');
      }

      setOperationalEmailStatus(result.data);
      toast.success(
        nextValue
          ? 'Los envíos de correo volvieron a quedar habilitados.'
          : 'Los envíos de correo quedaron pausados globalmente.'
      );
    } catch (error) {
      console.error('Error saving operational email policy:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'No fue posible actualizar la política de correo.'
      );
    } finally {
      setSavingEmailControl(false);
    }
  };

  const notificationFlows = [
    'Invitacion de usuario interno y activacion de acceso.',
    'Aviso a verificadores cuando un certificado entra en espera de verificacion.',
    'Aviso al responsable cuando el certificado vuelve a borrador para correccion.',
    'Solicitud de firma al firmante asignado.',
    'Resultado de firma aprobada o rechazada para el solicitante.',
    'Aviso al participante cuando el certificado fue emitido.',
    'Avisos de bloqueo y liberacion de restricciones a participante y equipo interno.',
  ];

  const operationalEmailStateLabel =
    operationalEmailStatus?.reason === 'delivery-paused'
      ? 'Los correos salientes están pausados desde Configuración.'
      : operationalEmailStatus?.reason === 'settings-unavailable'
        ? 'No fue posible leer la política operativa del correo.'
        : operationalEmailStatus?.configured
          ? 'Listo para enviar notificaciones transaccionales.'
          : 'Falta configuracion operativa en variables de entorno.';

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
                Estado de Acceso
              </p>
              <div className="mt-2 flex items-center gap-2">
                {isLegacyAdmin ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                    <ShieldCheck size={12} />
                    Administrador Maestro
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                    Acceso Estándar
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Roles dinámicos activos
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
                  <span className="text-sm text-gray-500">Sin roles asignados</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                ID de Usuario
              </p>
              <p className="mt-2 break-all font-mono text-xs text-gray-700">
                {user?.uid || 'No disponible'}
              </p>
            </div>
          </div>
        </div>

        {isLegacyAdmin && (
          <div className="border-b border-gray-100 p-8 bg-amber-50/30">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-amber-900">
              <ShieldCheck size={20} className="text-amber-600" /> Administradores Maestros (Whitelist)
            </h2>

            <div className="space-y-6">
              <div className="flex gap-3">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="nuevo-admin@correo.com"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  onClick={handleAddMasterAdmin}
                  disabled={loadingMasterAdmins || !newAdminEmail}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-amber-700 disabled:opacity-50"
                >
                  {loadingMasterAdmins ? <Loader2 className="animate-spin" size={18} /> : 'Agregar'}
                </button>
              </div>

              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white">
                {loadingMasterAdmins && masterAdmins.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Cargando lista...
                  </div>
                ) : masterAdmins.length > 0 ? (
                  masterAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${admin.disabled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                          {admin.email}
                        </span>
                        {admin.email === user?.email && (
                          <span className="text-[10px] text-amber-600 font-bold uppercase">Eres tú</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleToggleAdminStatus(admin.email, !!admin.disabled)}
                        className={`text-xs font-bold px-3 py-1 rounded-full transition-colors ${
                          admin.disabled 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                        disabled={admin.email === user?.email}
                      >
                        {admin.disabled ? 'Habilitar' : 'Deshabilitar'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-gray-400">
                    No hay administradores adicionales en la lista.
                  </div>
                )}
              </div>
              <p className="text-xs text-amber-700/70 italic">
                Nota: Los usuarios en esta lista tienen acceso total al sistema (bypass de roles dinámicos si no tienen uno asignado).
              </p>
            </div>
          </div>
        )}

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
                  {operationalEmailStateLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      Politica global de salida
                    </p>
                    <p className="mt-2 font-medium text-gray-900">
                      {operationalEmailStatus?.deliveryEnabled
                        ? 'Envio de correos habilitado'
                        : 'Envio de correos pausado'}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Esta llave solo afecta el canal de correo. Las notificaciones internas deben
                      seguir registrandose aunque el correo este pausado.
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      Los correos nativos de Firebase Auth, como el restablecimiento manual de tu
                      propia contrasena, siguen su flujo independiente.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleOperationalEmail}
                    disabled={savingEmailControl || !operationalEmailStatus}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingEmailControl ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Guardando politica...
                      </>
                    ) : operationalEmailStatus?.deliveryEnabled ? (
                      'Pausar envios'
                    ) : (
                      'Reactivar envios'
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 md:col-span-2">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
                  <div className="flex-1">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">
                      Correo de prueba
                    </label>
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(event) => setTestEmail(event.target.value)}
                      placeholder="destino@correo.com"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 focus:ring-2 focus:ring-primary/20"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Envía un correo real usando el proveedor configurado para confirmar que el circuito operativo funciona.
                    </p>
                  </div>
                  <button
                    onClick={handleSendOperationalTestEmail}
                    disabled={sendingTestEmail || !operationalEmailStatus?.canSend}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingTestEmail ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Enviando prueba...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Enviar prueba
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-b border-gray-100 p-8">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-800">
            <Bell size={20} className="text-primary" /> Notificaciones Activas
          </h2>

          <p className="mb-6 max-w-2xl text-sm text-gray-600">
            Estas son las notificaciones transaccionales que el sistema ya puede disparar cuando el
            canal de correo operativo esta habilitado.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {notificationFlows.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4 text-sm text-gray-700"
              >
                {item}
              </div>
            ))}
          </div>
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
