"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Mail, Shield, UserPlus, RefreshCw, Power, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { InternalUser, InternalUserStatus } from '@/lib/types/internalUser';
import type { RoleValue } from '@/lib/types/role';

const ROLE_OPTIONS: { value: RoleValue; label: string; description: string }[] = [
  { value: 'administrator', label: 'Administrador', description: 'Acceso total al sistema' },
  { value: 'coordinator', label: 'Coordinador', description: 'Opera certificados y programas' },
  { value: 'verifier', label: 'Verificador', description: 'Valida información y revisa expedientes' },
  { value: 'signer', label: 'Firmante', description: 'Firma certificados pendientes' },
];

const DEFAULT_FORM = {
  displayName: '',
  email: '',
  roleCode: 'coordinator' as RoleValue,
};

function getStatusLabel(status: InternalUserStatus) {
  switch (status) {
    case 'active':
      return 'Activo';
    case 'disabled':
      return 'Deshabilitado';
    default:
      return 'Invitado';
  }
}

function getStatusClass(status: InternalUserStatus) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'disabled':
      return 'bg-gray-200 text-gray-700';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}

function formatDate(value?: Date | string | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString();
}

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/internal-users');
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No fue posible cargar los usuarios internos');
      }

      setUsers(payload.data || []);
    } catch (error) {
      console.error(error);
      toast.error('No fue posible cargar los usuarios internos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(DEFAULT_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (selectedUser: InternalUser) => {
    setEditingUser(selectedUser);
    setForm({
      displayName: selectedUser.displayName,
      email: selectedUser.email,
      roleCode: selectedUser.roleCode,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingUser(null);
    setForm(DEFAULT_FORM);
  };

  const saveUser = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const response = await fetch(
        editingUser ? `/api/admin/internal-users/${editingUser.uid}` : '/api/admin/internal-users',
        {
          method: editingUser ? 'PATCH' : 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(
            editingUser
              ? {
                  displayName: form.displayName,
                  roleCode: form.roleCode,
                }
              : {
                  displayName: form.displayName,
                  email: form.email,
                  roleCode: form.roleCode,
                }
          ),
        }
      );

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No fue posible guardar el usuario');
      }

      toast.success(
        editingUser
          ? `Usuario actualizado: ${payload.data.displayName}`
          : `Usuario creado: ${payload.data.email}`
      );
      closeModal();
      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'No fue posible guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (selectedUser: InternalUser, data: Record<string, unknown>, successMessage: string) => {
    setProcessingId(selectedUser.uid);

    try {
      const response = await fetch(`/api/admin/internal-users/${selectedUser.uid}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No fue posible actualizar el usuario');
      }

      toast.success(successMessage);
      await loadUsers();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'No fue posible actualizar el usuario');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Usuarios Internos</h2>
          <p className="text-gray-500 mt-1">
            Alta administrada, activación por correo y roles ligados a identidad estable.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => void loadUsers()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={openCreateModal}>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      <Card className="border border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-900">Flujo activo de acceso interno</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>1. El administrador crea el usuario interno desde este panel.</p>
          <p>2. El sistema envía un enlace seguro de activación y definición de contraseña.</p>
          <p>3. El usuario activa su acceso y queda habilitado según el rol asignado.</p>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-50 text-gray-900 font-bold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Invitación</th>
              <th className="px-6 py-4">Último Acceso</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((internalUser) => (
              <tr key={internalUser.uid} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900">{internalUser.displayName}</p>
                  <p className="text-xs text-gray-500">{internalUser.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Shield className="w-3 h-3" />
                    {ROLE_OPTIONS.find((role) => role.value === internalUser.roleCode)?.label || internalUser.roleCode}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                      getStatusClass(internalUser.status)
                    )}
                  >
                    {getStatusLabel(internalUser.status)}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  <div>Enviado: {formatDate(internalUser.inviteSentAt)}</div>
                  <div>Activado: {formatDate(internalUser.activatedAt)}</div>
                </td>
                <td className="px-6 py-4 text-xs text-gray-500">
                  {formatDate(internalUser.lastLoginAt)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-primary hover:bg-gray-100"
                      onClick={() => openEditModal(internalUser)}
                      disabled={processingId === internalUser.uid}
                    >
                      <PencilLine className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() =>
                        void updateUser(
                          internalUser,
                          { resendInvite: true },
                          `Invitación reenviada a ${internalUser.email}`
                        )
                      }
                      disabled={processingId === internalUser.uid}
                    >
                      {processingId === internalUser.uid ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        internalUser.status === 'disabled'
                          ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      )}
                      onClick={() =>
                        void updateUser(
                          internalUser,
                          { status: internalUser.status === 'disabled' ? 'active' : 'disabled' },
                          internalUser.status === 'disabled'
                            ? `Usuario habilitado: ${internalUser.email}`
                            : `Usuario deshabilitado: ${internalUser.email}`
                        )
                      }
                      disabled={processingId === internalUser.uid}
                    >
                      <Power className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  No hay usuarios internos creados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 mb-2">
              {editingUser ? 'Editar Usuario Interno' : 'Crear Usuario Interno'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {editingUser
                ? 'Actualiza nombre y rol del usuario. El acceso se mantiene ligado a su identidad.'
                : 'Se creará la cuenta interna y se enviará un enlace seguro de activación.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Nombre</label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Nombre completo"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Correo institucional</label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="usuario@uapa.edu.do"
                  type="email"
                  className="mt-2"
                  disabled={Boolean(editingUser)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase">Rol</label>
                <select
                  value={form.roleCode}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, roleCode: e.target.value as RoleValue }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 bg-white mt-2"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} - {role.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" className="flex-1" onClick={closeModal} disabled={saving}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={() => void saveUser()} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingUser ? 'Guardar Cambios' : 'Crear y Enviar Activación'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
