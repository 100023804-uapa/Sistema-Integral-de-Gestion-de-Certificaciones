"use client";

import { useState, useEffect } from 'react';
import { CertificateType } from '@/lib/container';
import { Plus, Edit, Trash2, FileText, Shield, ShieldOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CertificateTypesPage() {
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCertificateType, setEditingCertificateType] = useState<CertificateType | null>(null);

  const fetchCertificateTypes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/certificate-types?activeOnly=true');
      const data = await response.json();
      
      if (data.success) {
        setCertificateTypes(data.data);
      } else {
        console.error('Error fetching certificate types:', data.error);
      }
    } catch (error) {
      console.error('Error fetching certificate types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificateTypes();
  }, []);

  const handleEdit = (certificateType: CertificateType) => {
    setEditingCertificateType(certificateType);
    setShowForm(true);
  };

  const handleDelete = async (certificateType: CertificateType) => {
    if (!confirm(`¿Estás seguro de eliminar el tipo de certificado "${certificateType.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/certificate-types/${certificateType.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchCertificateTypes();
      } else {
        alert('Error al eliminar tipo de certificado: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting certificate type:', error);
      alert('Error al eliminar tipo de certificado');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCertificateType(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCertificateType(null);
    fetchCertificateTypes();
  };

  const getTypeDisplayName = (code: string) => {
    const typeNames: Record<string, string> = {
      'horizontal': 'Horizontal',
      'vertical': 'Vertical',
      'institutional_macro': 'Institucional Macro'
    };
    return typeNames[code] || code;
  };

  const getTypeDescription = (code: string) => {
    const descriptions: Record<string, string> = {
      'horizontal': 'Formato horizontal tradicional',
      'vertical': 'Formato vertical apaisado',
      'institutional_macro': 'Certificado institucional sin firma automática'
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
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tipos de Certificado</h1>
          <p className="text-gray-600">Gestiona las tipologías de certificados disponibles</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Nuevo Tipo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {certificateTypes.map((certificateType) => (
          <div
            key={certificateType.id}
            className={cn(
              "bg-white rounded-lg shadow-md border p-6 hover:shadow-lg transition-shadow",
              !certificateType.isActive && "opacity-60"
            )}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <FileText className="text-primary" size={20} />
                <h3 className="font-semibold text-lg">{certificateType.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(certificateType)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(certificateType)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Código:</span>
                <p className="font-medium">{getTypeDisplayName(certificateType.code)}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Descripción:</span>
                <p className="text-sm text-gray-600">
                  {certificateType.description || getTypeDescription(certificateType.code)}
                </p>
              </div>

              {certificateType.defaultFolioPrefix && (
                <div>
                  <span className="text-sm text-gray-500">Prefijo Folio:</span>
                  <p className="font-medium bg-gray-100 px-2 py-0.5 rounded text-sm inline-block ml-2">{certificateType.defaultFolioPrefix}</p>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Requiere firma:</span>
                {certificateType.requiresSignature ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Shield size={16} />
                    <span className="text-sm">Sí</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-orange-600">
                    <ShieldOff size={16} />
                    <span className="text-sm">No</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    certificateType.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  )}
                >
                  {certificateType.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {certificateTypes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tipos de certificado</h3>
          <p className="text-gray-600 mb-4">
            Comienza agregando los tipos de certificado disponibles
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Agregar Tipo
          </button>
        </div>
      )}

      {showForm && (
        <CertificateTypeForm
          certificateType={editingCertificateType}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}

// Componente de formulario
function CertificateTypeForm({ 
  certificateType, 
  onClose, 
  onSuccess 
}: { 
  certificateType: CertificateType | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: certificateType?.name || '',
    code: certificateType?.code || 'horizontal',
    description: certificateType?.description || '',
    defaultFolioPrefix: certificateType?.defaultFolioPrefix || '',
    requiresSignature: certificateType?.requiresSignature ?? true,
    isActive: certificateType?.isActive ?? true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = certificateType 
        ? `/api/admin/certificate-types/${certificateType.id}`
        : '/api/admin/certificate-types';
      
      const method = certificateType ? 'PUT' : 'POST';
      
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
      console.error('Error saving certificate type:', error);
      alert('Error al guardar tipo de certificado');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    setFormData({ ...formData, code: value as any });
    
    // Auto-adjust requiresSignature for institutional_macro
    if (value === 'institutional_macro') {
      setFormData(prev => ({ ...prev, code: value as any, requiresSignature: false }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {certificateType ? 'Editar Tipo de Certificado' : 'Nuevo Tipo de Certificado'}
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
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="institutional_macro">Institucional Macro</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.code === 'institutional_macro' && 
                'Este tipo no requiere firma automática según los requerimientos'
              }
            </p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prefijo Folio por Defecto (Opcional)
            </label>
            <input
              type="text"
              value={formData.defaultFolioPrefix}
              onChange={(e) => setFormData({ ...formData, defaultFolioPrefix: e.target.value })}
              placeholder="Ej. CAP, SIGCE, DP"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se autocompletará en el formulario al crear un certificado.
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiresSignature"
              checked={formData.requiresSignature}
              onChange={(e) => setFormData({ ...formData, requiresSignature: e.target.checked })}
              disabled={formData.code === 'institutional_macro'}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:opacity-50"
            />
            <label htmlFor="requiresSignature" className="ml-2 block text-sm text-gray-700">
              Requiere firma digital
            </label>
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
              {loading ? 'Guardando...' : (certificateType ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
