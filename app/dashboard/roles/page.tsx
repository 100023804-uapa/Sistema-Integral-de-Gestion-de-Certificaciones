"use client";

import { useState, useEffect, type ReactElement } from 'react';
import { Plus, Edit, Trash2, Shield, Users, Settings, Zap } from 'lucide-react';
import { PermissionsForm } from '@/components/dashboard/roles/PermissionsForm';
import { Role, ScopeType } from '@/lib/types/role';
import { cn } from '@/lib/utils';
import { useAlert } from '@/hooks/useAlert';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const { showConfirm, showAlert } = useAlert();

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/roles?activeOnly=true');
      const data = await response.json();
      
      if (data.success) {
        setRoles(data.data);
      } else {
        console.error('Error fetching roles:', data.error);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleDelete = async (role: Role) => {
    const ok = await showConfirm(
      '¿Estás seguro?',
      `Esta acción eliminará el rol "${role.name}" de forma permanente.`,
      { type: 'warning', confirmText: 'Sí, eliminar', cancelText: 'No, cancelar' }
    );
    if (!ok) return;

    try {
      const response = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchRoles();
      } else {
        showAlert('Error', 'No se pudo eliminar el rol: ' + data.error, 'error');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showAlert('Error', 'Ocurrió un error inesperado al eliminar el rol.', 'error');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRole(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRole(null);
    fetchRoles();
  };

  const getRoleDisplayName = (code: string) => {
    const roleNames: Record<string, string> = {
      'coordinator': 'Coordinador',
      'verifier': 'Verificador',
      'signer': 'Firmante',
      'administrator': 'Administrador'
    };
    return roleNames[code] || code;
  };

  const getRoleIcon = (code: string) => {
    const icons: Record<string, ReactElement> = {
      'coordinator': <Users size={20} />,
      'verifier': <Settings size={20} />,
      'signer': <Shield size={20} />,
      'administrator': <Shield size={20} />
    };
    return icons[code] || <Shield size={20} />;
  };

  const getRoleDescription = (role: Role) => {
    return role.description || `${role.menuPermissions?.length || 0} menús, ${role.capabilities?.length || 0} capacidades`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles del Sistema</h1>
          <p className="text-gray-600">Gestiona los roles y permisos del sistema</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Nuevo Rol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className={cn(
              "bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow",
              !role.isActive && "opacity-60"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="text-primary">
                  {getRoleIcon(role.code)}
                </div>
                <h3 className="font-semibold text-lg">{role.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(role)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(role)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Código:</span>
                <p className="font-medium">{getRoleDisplayName(role.code)}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Descripción:</span>
                <p className="text-sm text-gray-600">
                  {getRoleDescription(role)}
                </p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Capacidades:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {role.menuPermissions?.length > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {role.menuPermissions.length} Menús
                    </span>
                  )}
                  {role.capabilities?.map((cap, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                    >
                      {cap.replace('can_', '').replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    role.isActive
                       ? "bg-green-100 text-green-800"
                       : "bg-red-100 text-red-800"
                  )}
                >
                  {role.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-12">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay roles configurados</h3>
          <p className="text-gray-600 mb-4">
            Comienza agregando los roles del sistema
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Agregar Rol
          </button>
        </div>
      )}

      {showForm && (
        <RoleForm
          role={editingRole}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

// Componente de formulario
function RoleForm({ 
  role, 
  onClose, 
  onSuccess 
}: { 
  role: Role | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    code: role?.code || '',
    description: role?.description || '',
    isActive: role?.isActive ?? true,
    menuPermissions: role?.menuPermissions || [],
    capabilities: role?.capabilities || [],
    scopeType: role?.scopeType || 'global' as ScopeType,
  });
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();

  const handleMenuToggle = (menuId: string) => {
    setFormData(prev => ({
      ...prev,
      menuPermissions: prev.menuPermissions.includes(menuId)
        ? prev.menuPermissions.filter(id => id !== menuId)
        : [...prev.menuPermissions, menuId]
    }));
  };

  const handleCapabilityToggle = (capId: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(capId)
        ? prev.capabilities.filter(id => id !== capId)
        : [...prev.capabilities, capId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return showAlert("Error", "El nombre es requerido", "error");
    setLoading(true);

    try {
      const url = role 
        ? `/api/admin/roles/${role.id}`
        : '/api/admin/roles';
      
      const method = role ? 'PUT' : 'POST';
      
      // El código se genera del nombre si está vacío
      const submitData = {
        ...formData,
        code: formData.code || formData.name.toLowerCase().replace(/\s+/g, '_')
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        showAlert('Error', 'No se pudo guardar el rol: ' + data.error, 'error');
      }
    } catch (error) {
      console.error('Error saving role:', error);
      showAlert('Error', 'Ocurrió un error inesperado al guardar el rol.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4 md:p-8">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-primary p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black">
              {role ? 'Editar Rol' : 'Crear Nuevo Rol'}
            </h2>
            <p className="text-primary-foreground/80 text-sm">Configura accesos y capacidades del sistema.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Shield size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Nombre del Rol *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Auditor de Recinto"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">
                  Descripción
                </label>
                <textarea
                  placeholder="Explica qué funciones cumple este rol..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-primary/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-center">
               <div className="flex items-center gap-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-bold">{formData.isActive ? 'Rol Activo' : 'Rol Inactivo'}</span>
               </div>
               <p className="text-xs text-gray-500 mb-4">Un rol inactivo impedirá que cualquier usuario asignado acceda al sistema.</p>
               <button 
                 type="button"
                 onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                 className={`px-4 py-2 rounded-lg font-bold text-xs uppercase transition-all
                  ${formData.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}
                 `}
               >
                 {formData.isActive ? 'Desactivar Rol' : 'Activar Rol'}
               </button>
            </div>
          </div>

          <PermissionsForm 
            selectedMenus={formData.menuPermissions}
            selectedCapabilities={formData.capabilities}
            scopeType={formData.scopeType}
            onMenuToggle={handleMenuToggle}
            onCapabilityToggle={handleCapabilityToggle}
            onScopeChange={(scope) => setFormData({...formData, scopeType: scope})}
          />

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 rounded-2xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] px-6 py-4 bg-primary text-white rounded-2xl font-black text-lg hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Zap className="animate-spin w-5 h-5" /> Guardando...
                </span>
              ) : (role ? 'Actualizar Rol' : 'Crear Rol Maestro')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
