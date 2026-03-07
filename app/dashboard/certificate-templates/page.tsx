"use client";

import { useState, useEffect } from 'react';
import { CertificateTemplate, CertificateType } from '@/lib/container';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Palette, 
  Layout, 
  Monitor, 
  File,
  FileText,
  Plus,
  Trash2,
  Settings,
  Grid3x3,
  Type,
  Image,
  QrCode,
  PenTool,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Copy
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function CertificateTemplatesPage() {
  const { hasRole } = useAuth();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActions, setShowActions] = useState<string | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/certificate-templates');
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data);
      } else {
        console.error('Error fetching templates:', data.error);
      }

    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificateTypes = async () => {
    try {
      const response = await fetch('/api/admin/certificate-types');
      const data = await response.json();
      
      if (data.success) {
        setCertificateTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching certificate types:', error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchCertificateTypes();
  }, []);

  const handleCreate = () => {
    setSelectedTemplate(null);
    setShowCreateModal(true);
  };

  const handleEdit = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    setShowEditModal(true);
  };

  const handlePreview = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleDelete = (template: CertificateTemplate) => {
    setSelectedTemplate(template);
    setShowDeleteModal(true);
  };

  const handleDuplicate = async (template: CertificateTemplate) => {
    try {
      const response = await fetch('/api/admin/certificate-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${template.name} (Copia)`,
          description: template.description,
          type: template.type,
          certificateTypeId: template.certificateTypeId,
          layout: template.layout,
          placeholders: template.placeholders,
          createdBy: 'current-user-id' // TODO: obtener de auth
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchTemplates();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Error al duplicar plantilla');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(`/api/admin/certificate-templates/${selectedTemplate.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchTemplates();
        setShowDeleteModal(false);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al eliminar plantilla');
    }
  };

  const getTemplateIcon = (type: string) => {
    const icons = {
      'horizontal': <Layout size={20} />,
      'vertical': <Monitor size={20} />,
      'institutional_macro': <File size={20} />
    };
    return icons[type as keyof typeof icons] || <FileText size={20} />;
  };

  const getTemplateColor = (type: string) => {
    const colors = {
      'horizontal': 'bg-blue-100 text-blue-800 border-blue-200',
      'vertical': 'bg-green-100 text-green-800 border-green-200',
      'institutional_macro': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getCertificateTypeName = (typeId: string) => {
    const type = certificateTypes.find(ct => ct.id === typeId);
    return type?.name || 'Desconocido';
  };

  const filteredTemplates = templates.filter(template => {
    const matchesFilter = filter === 'all' || template.type === filter;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Certificado</h1>
          <p className="text-gray-600">Diseña y gestiona las plantillas para generar certificados</p>
        </div>
        <Link
          href="/dashboard/certificate-templates/create"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Plantilla
        </Link>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Todos los tipos</option>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="institutional_macro">Institucional Macro</option>
          </select>
        </div>
      </div>

      {/* Grid de Plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow relative group"
          >
            {/* Header de la tarjeta */}
            <div className="p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getTemplateIcon(template.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <span className={cn("text-xs px-2 py-1 rounded-full border", getTemplateColor(template.type))}>
                      {template.type}
                    </span>
                  </div>
                </div>
                
                {/* Menú de acciones */}
                <div className="relative">
                  <button
                    onClick={() => setShowActions(showActions === template.id ? null : template.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <MoreVertical size={16} />
                  </button>
                  
                  {showActions === template.id && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border z-10">
                      <button
                        onClick={() => {
                          handleEdit(template);
                          setShowActions(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          handlePreview(template);
                          setShowActions(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Eye size={16} />
                        Vista Previa
                      </button>
                      <button
                        onClick={() => {
                          handleDuplicate(template);
                          setShowActions(null);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Copy size={16} />
                        Duplicar
                      </button>
                      {hasRole('administrator') && (
                        <button
                          onClick={() => {
                            handleDelete(template);
                            setShowActions(null);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contenido de la tarjeta */}
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-3">
                {template.description || 'Sin descripción'}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tipo de Certificado:</span>
                  <span className="font-medium">{getCertificateTypeName(template.certificateTypeId)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Dimensiones:</span>
                  <span className="font-medium">
                    {template.layout.width}×{template.layout.height}mm
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Orientación:</span>
                  <span className="font-medium capitalize">
                    {template.layout.orientation}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Secciones:</span>
                  <span className="font-medium">
                    {template.layout.sections?.length || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Placeholders:</span>
                  <span className="font-medium">
                    {template.placeholders?.length || 0}
                  </span>
                </div>
              </div>

              {/* Estado */}
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {template.isActive ? (
                    <>
                      <CheckCircle size={16} className="text-green-500" />
                      <span className="text-sm text-green-600">Activa</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-red-500" />
                      <span className="text-sm text-red-600">Inactiva</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock size={12} />
                  <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="p-4 border-t bg-gray-50 flex gap-2">
              <button
                onClick={() => handleEdit(template)}
                className="flex-1 px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm flex items-center justify-center gap-1"
              >
                <Edit size={14} />
                Editar
              </button>
              <button
                onClick={() => handlePreview(template)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm flex items-center justify-center gap-1"
              >
                <Eye size={14} />
                Vista
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay plantillas</h3>
          <p className="text-gray-600 mb-4">
            Crea tu primera plantilla para empezar a generar certificados
          </p>
          <Link
            href="/dashboard/certificate-templates/create"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Crear Plantilla
          </Link>
        </div>
      )}

      {/* Modal de Crear */}
      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchTemplates();
          }}
          certificateTypes={certificateTypes}
        />
      )}

      {/* Modal de Editar */}
      {showEditModal && selectedTemplate && (
        <EditTemplateModal
          template={selectedTemplate}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchTemplates();
          }}
          certificateTypes={certificateTypes}
        />
      )}

      {/* Modal de Vista Previa */}
      {showPreviewModal && selectedTemplate && (
        <PreviewTemplateModal
          template={selectedTemplate}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {/* Modal de Eliminar */}
      {showDeleteModal && selectedTemplate && (
        <DeleteTemplateModal
          template={selectedTemplate}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}

// Componentes de Modales (se implementarán en archivos separados para mantener el código limpio)
function CreateTemplateModal({ 
  onClose, 
  onSuccess, 
  certificateTypes 
}: { 
  onClose: () => void;
  onSuccess: () => void;
  certificateTypes: CertificateType[];
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'horizontal' as 'horizontal' | 'vertical' | 'institutional_macro',
    certificateTypeId: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/certificate-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          createdBy: 'current-user-id' // TODO: obtener de auth
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        onSuccess();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error al crear plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nueva Plantilla</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="horizontal">Horizontal (A4)</option>
              <option value="vertical">Vertical (A4)</option>
              <option value="institutional_macro">Institucional Macro (A3)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Certificado *
            </label>
            <select
              required
              value={formData.certificateTypeId}
              onChange={(e) => setFormData({ ...formData, certificateTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecciona un tipo</option>
              {certificateTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
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
              {loading ? 'Creando...' : 'Crear Plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Edición Completo
function EditTemplateModal({ template, onClose, onSuccess, certificateTypes }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: template.name || '',
    description: template.description || '',
    type: template.type || 'horizontal',
    certificateTypeId: template.certificateTypeId || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/certificate-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Error al actualizar plantilla');
      }
    } catch (error) {
      alert('Error al actualizar plantilla');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Editar Plantilla</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="institutional_macro">Institucional Macro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Certificado *
            </label>
            <select
              required
              value={formData.certificateTypeId}
              onChange={(e) => setFormData({ ...formData, certificateTypeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccionar...</option>
              {certificateTypes.map((type: any) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Actualizando...' : 'Actualizar Plantilla'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PreviewTemplateModal({ template, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Vista Previa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        
        <div className="bg-gray-100 rounded-lg p-4 min-h-[400px]">
          <div 
            className="bg-white shadow-lg mx-auto relative"
            style={{
              width: `${Math.min(template.layout?.width || 297, 600)}px`,
              height: `${Math.min(template.layout?.height || 210, 400)}px`,
              transform: `scale(${Math.min(600 / (template.layout?.width || 297), 400 / (template.layout?.height || 210))})`,
              transformOrigin: 'top center'
            }}
          >
            {/* Header */}
            <div 
              className="border-b-2 border-gray-800 flex items-center justify-center p-4"
              style={{ backgroundColor: '#1e40af', color: '#ffffff' }}
            >
              <h1 className="text-xl font-bold">CERTIFICADO</h1>
            </div>
            
            {/* Body */}
            <div className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">CERTIFICADO DE {template.type?.toUpperCase() || 'FINALIZACIÓN'}</h2>
              <p className="text-lg mb-2">Se otorga a:</p>
              <p className="text-xl font-semibold mb-4">[Nombre del Estudiante]</p>
              <p className="text-gray-600 mb-2">Por haber completado satisfactoriamente:</p>
              <p className="text-lg font-medium">[Programa Académico]</p>
            </div>
            
            {/* Footer */}
            <div className="border-t mt-auto p-4 flex justify-between items-center">
              <div className="text-left">
                <p className="text-sm text-gray-600">Folio: [FOLIO]</p>
                <p className="text-sm text-gray-600">Fecha: [FECHA]</p>
              </div>
              <div className="text-right">
                <div className="w-24 h-12 border-2 border-dashed border-gray-400 flex items-center justify-center">
                  <span className="text-xs text-gray-500">FIRMA</span>
                </div>
              </div>
            </div>
            
            {/* QR Code Placeholder */}
            <div className="absolute bottom-4 right-4 w-16 h-16 bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
              <QrCode size={24} className="text-gray-500" />
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Información de la Plantilla:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Nombre:</span> {template.name}
            </div>
            <div>
              <span className="font-medium">Tipo:</span> {template.type}
            </div>
            <div>
              <span className="font-medium">Dimensiones:</span> {template.layout?.width || 297}×{template.layout?.height || 210}mm
            </div>
            <div>
              <span className="font-medium">Orientación:</span> {template.layout?.orientation || 'landscape'}
            </div>
            <div>
              <span className="font-medium">Secciones:</span> {template.layout?.sections?.length || 0}
            </div>
            <div>
              <span className="font-medium">Placeholders:</span> {template.placeholders?.length || 0}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteTemplateModal({ template, onClose, onConfirm }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Eliminar Plantilla</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <p className="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar la plantilla &ldquo;{template.name}&rdquo;? Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
