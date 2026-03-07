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
  Copy,
  X
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
  const [showInactive, setShowInactive] = useState(false);
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
    if (!showInactive && template.isActive === false) return false;
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
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
          <label className="flex items-center gap-2 ml-4 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showInactive} 
              onChange={(e) => setShowInactive(e.target.checked)} 
              className="rounded text-primary"
            />
            <span className="text-sm text-gray-700">Mostrar Inactivas</span>
          </label>
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
                      <Link
                        href={`/dashboard/certificate-templates/${template.id}/edit`}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Editar
                      </Link>
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
              <Link
                href={`/dashboard/certificate-templates/${template.id}/edit`}
                className="flex-1 px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm flex items-center justify-center gap-1"
              >
                <Edit size={14} />
                Editar
              </Link>
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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 sm:p-6 md:p-10">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vista Previa: {template.name}</h2>
            <p className="text-sm text-gray-500">Visualización en tamaño real de la plantilla</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Cerrar"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 bg-gray-50 overflow-auto p-4 md:p-8 flex justify-center items-start">
          {template.htmlContent ? (
            <div 
              className="bg-white shadow-2xl transition-transform duration-300"
              style={{
                width: `${template.layout?.width || 297}mm`,
                height: `${template.layout?.height || 210}mm`,
                position: 'relative',
                overflow: 'hidden',
                // Escalado dinámico basado en un ancho máximo de visualización cómodo
                transform: `scale(${Math.min(1.2, 1000 / ((template.layout?.width || 297) * 3.78))})`,
                transformOrigin: 'top center',
                marginBottom: '4rem'
              }}
            >
              <iframe
                title="Vista Previa Real"
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <link rel="preconnect" href="https://fonts.googleapis.com">
                      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Pinyon+Script&display=swap" rel="stylesheet">
                      <style>
                        ${template.cssStyles}
                        body { margin: 0; padding: 0; }
                      </style>
                    </head>
                    <body>
                      ${template.htmlContent}
                    </body>
                  </html>
                `}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  margin: 0,
                  padding: 0
                }}
              />
            </div>
          ) : (
            /* Fallback para plantillas sin contenido HTML (legacy or incomplete) */
            <div 
              className="bg-white shadow-2xl relative"
              style={{
                width: `${template.layout?.width || 297}mm`,
                height: `${template.layout?.height || 210}mm`,
                transform: `scale(1)`,
                transformOrigin: 'top center',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header Mock */}
              <div 
                className="border-b-2 border-gray-800 flex items-center justify-center p-4"
                style={{ backgroundColor: '#1e40af', color: '#ffffff' }}
              >
                <h1 className="text-xl font-bold uppercase tracking-wider">Certificado Institucional</h1>
              </div>
              
              {/* Body Mock */}
              <div className="p-12 text-center flex-1 flex flex-col justify-center">
                <h2 className="text-4xl font-bold mb-8 text-blue-900 leading-tight">CERTIFICADO DE FINALIZACIÓN</h2>
                <p className="text-xl mb-4 italic text-gray-600">Se otorga con honor a:</p>
                <p className="text-5xl font-bold mb-10 text-gray-900 font-serif underline decoration-blue-200 underline-offset-8">[Nombre del Estudiante]</p>
                <p className="text-gray-600 mb-2 text-lg">Por haber completado satisfactoriamente el programa:</p>
                <p className="text-2xl font-bold text-blue-800">[Programa Académico]</p>
              </div>
              
              {/* Footer Mock */}
              <div className="mt-auto p-10 flex justify-between items-end bg-gray-50 border-t">
                <div className="text-left space-y-1">
                  <p className="text-sm font-bold text-gray-800 uppercase tracking-tighter">Folio Interno: <span className="text-blue-600">#000000</span></p>
                  <p className="text-sm text-gray-500">Fecha de Emisión: {new Date().toLocaleDateString()}</p>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <div className="w-40 h-1 bg-gray-400"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Firma Autorizada</span>
                </div>
              </div>
              
              {/* QR placeholder */}
              <div className="absolute top-6 right-6 w-20 h-20 bg-white border shadow-sm flex items-center justify-center rounded">
                <QrCode size={32} className="text-gray-300" />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Info Area */}
        <div className="bg-white p-6 border-t">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex-1">
              <h3 className="font-bold text-blue-900 text-xs uppercase tracking-widest mb-3">Especificaciones Técnicas:</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 text-sm">
                <div>
                  <span className="block text-blue-800 font-bold text-[10px] uppercase mb-1">Tipo</span>
                  <span className="text-gray-700 font-medium capitalize">{template.type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="block text-blue-800 font-bold text-[10px] uppercase mb-1">Formato</span>
                  <span className="text-gray-700 font-medium">{template.layout?.width}×{template.layout?.height}mm</span>
                </div>
                <div>
                  <span className="block text-blue-800 font-bold text-[10px] uppercase mb-1">Orientación</span>
                  <span className="text-gray-700 font-medium capitalize">{template.layout?.orientation}</span>
                </div>
                <div>
                  <span className="block text-blue-800 font-bold text-[10px] uppercase mb-1">Secciones</span>
                  <span className="text-gray-700 font-medium">{template.layout?.sections?.length || 0}</span>
                </div>
                <div>
                  <span className="block text-blue-800 font-bold text-[10px] uppercase mb-1">Variables</span>
                  <span className="text-gray-700 font-medium">{template.placeholders?.length || 0} detectadas</span>
                </div>
                <div>
                  <span className="block text-blue-800 font-bold text-[10px] uppercase mb-1">Estado</span>
                  <span className={`font-bold ${template.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {template.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Cerrar Vista Previa
              </button>
            </div>
          </div>
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
