"use client";

import { useState, useEffect } from 'react';
import { Role } from '@/lib/container';
import { Plus, Edit, Trash2, Shield, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

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
    if (!confirm(`¿Estás seguro de eliminar el rol "${role.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/roles/${role.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchRoles();
      } else {
        alert('Error al eliminar rol: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert('Error al eliminar rol');
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
    const icons: Record<string, JSX.Element> = {
      'coordinator': <Users size={20} />,
      'verifier': <Settings size={20} />,
      'signer': <Shield size={20} />,
      'administrator': <Shield size={20} />
    };
    return icons[code] || <Shield size={20} />;
  };

  const getRoleDescription = (code: string) => {
    const descriptions: Record<string, string> = {
      'coordinator': 'Gestiona programas y participantes',
      'verifier': 'Verifica información de certificados',
      'signer': 'Firma digitalmente los certificados',
      'administrator': 'Acceso completo al sistema'
    };
    return descriptions[code] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
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
                  {role.description || getRoleDescription(role.code)}
                </p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Permisos:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {role.permissions.map((permission, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {permission.resource}
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
    code: role?.code || 'coordinator',
    description: role?.description || '',
    isActive: role?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = role 
        ? `/api/admin/roles/${role.id}`
        : '/api/admin/roles';
      
      const method = role ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving role:', error);
      alert('Error al guardar rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {role ? 'Editar Rol' : 'Nuevo Rol'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <select
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="coordinator">Coordinador</option>
              <option value="verifier">Verificador</option>
              <option value="signer">Firmante</option>
              <option value="administrator">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Activo
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : (role ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
