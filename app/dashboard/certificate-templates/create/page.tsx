"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CertificateType } from '@/lib/container';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Palette, 
  Layout, 
  Monitor, 
  File,
  Plus,
  Trash2,
  Settings,
  Grid3x3,
  Type,
  Image,
  QrCode,
  PenTool
} from 'lucide-react';

export default function CreateTemplatePage() {
  const router = useRouter();
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'layout' | 'placeholders'>('basic');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'horizontal' as 'horizontal' | 'vertical' | 'institutional_macro',
    certificateTypeId: '',
    htmlContent: '',
    cssStyles: ''
  });

  const [layout, setLayout] = useState({
    width: 297,
    height: 210,
    orientation: 'landscape' as 'portrait' | 'landscape',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    sections: [
      {
        id: 'header',
        name: 'Encabezado',
        type: 'header',
        position: { x: 20, y: 20, width: 257, height: 60 },
        style: {
          backgroundColor: '#1e40af',
          color: '#ffffff',
          textAlign: 'center',
          padding: 10
        },
        content: ''
      },
      {
        id: 'body',
        name: 'Cuerpo',
        type: 'body',
        position: { x: 20, y: 80, width: 257, height: 80 },
        style: {
          textAlign: 'center',
          padding: 20
        },
        content: ''
      },
      {
        id: 'footer',
        name: 'Pie',
        type: 'footer',
        position: { x: 20, y: 160, width: 257, height: 30 },
        style: {
          backgroundColor: '#f8fafc',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          padding: 10
        },
        content: ''
      }
    ]
  });

  const [placeholders, setPlaceholders] = useState([
    { id: 'logo', name: 'Logo Institucional', type: 'image', required: true },
    { id: 'studentName', name: 'Nombre del Estudiante', type: 'text', required: true },
    { id: 'academicProgram', name: 'Programa Académico', type: 'text', required: true },
    { id: 'issueDate', name: 'Fecha de Emisión', type: 'date', required: true },
    { id: 'folio', name: 'Folio', type: 'text', required: true },
    { id: 'campusName', name: 'Nombre del Recinto', type: 'text', required: true },
    { id: 'verificationQR', name: 'Código QR de Verificación', type: 'qr', required: false },
    { id: 'digitalSignature', name: 'Firma Digital', type: 'signature', required: false }
  ]);

  useEffect(() => {
    fetchCertificateTypes();
  }, []);

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
          layout,
          placeholders,
          createdBy: 'current-user-id' // TODO: obtener de auth
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        router.push('/dashboard/certificate-templates');
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

  const updateLayoutDimensions = (type: string) => {
    const dimensions = {
      horizontal: { width: 297, height: 210, orientation: 'landscape' as const },
      vertical: { width: 210, height: 297, orientation: 'portrait' as const },
      institutional_macro: { width: 420, height: 297, orientation: 'landscape' as const }
    };

    const newDimensions = dimensions[type as keyof typeof dimensions];
    setLayout(prev => ({
      ...prev,
      ...newDimensions,
      sections: prev.sections.map(section => ({
        ...section,
        position: {
          ...section.position,
          width: newDimensions.width - 40, // Ajustar al nuevo ancho
        }
      }))
    }));
  };

  const addSection = () => {
    const newSection = {
      id: `section_${Date.now()}`,
      name: 'Nueva Sección',
      type: 'body',
      position: { x: 20, y: 100, width: layout.width - 40, height: 50 },
      style: {
        textAlign: 'left',
        padding: 10
      },
      content: ''
    };

    setLayout(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const removeSection = (sectionId: string) => {
    setLayout(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const updateSection = (sectionId: string, updates: any) => {
    setLayout(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  };

  const addPlaceholder = () => {
    const newPlaceholder = {
      id: `placeholder_${Date.now()}`,
      name: 'Nuevo Placeholder',
      type: 'text',
      required: false
    };

    setPlaceholders(prev => [...prev, newPlaceholder]);
  };

  const removePlaceholder = (placeholderId: string) => {
    setPlaceholders(prev => prev.filter(p => p.id !== placeholderId));
  };

  const updatePlaceholder = (placeholderId: string, updates: any) => {
    setPlaceholders(prev =>
      prev.map(p => p.id === placeholderId ? { ...p, ...updates } : p)
    );
  };

  const getPlaceholderIcon = (type: string) => {
    const icons = {
      'text': <Type size={16} />,
      'date': <Type size={16} />,
      'image': <Image size={16} />,
      'qr': <QrCode size={16} />,
      'signature': <PenTool size={16} />
    };
    return icons[type as keyof typeof icons] || <Type size={16} />;
  };

  const getTemplateIcon = (type: string) => {
    const icons = {
      'horizontal': <Layout size={20} />,
      'vertical': <Monitor size={20} />,
      'institutional_macro': <File size={20} />
    };
    return icons[type as keyof typeof icons] || <Layout size={20} />;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Crear Plantilla</h1>
            <p className="text-gray-600">Diseña una nueva plantilla de certificado</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Eye size={20} />
            Vista Previa
          </button>
          <button
            form="template-form"
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Guardando...' : 'Crear Plantilla'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'basic', label: 'Información Básica', icon: <Settings size={16} /> },
            { id: 'layout', label: 'Diseño y Layout', icon: <Grid3x3 size={16} /> },
            { id: 'placeholders', label: 'Placeholders', icon: <Type size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form id="template-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Tab: Información Básica */}
        {activeTab === 'basic' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings size={20} />
              Información Básica
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Plantilla *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Certificado de Finalización"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Plantilla *
                </label>
                <div className="flex items-center gap-2">
                  {getTemplateIcon(formData.type)}
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setFormData({ ...formData, type: newType });
                      updateLayoutDimensions(newType);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="horizontal">Horizontal (A4)</option>
                    <option value="vertical">Vertical (A4)</option>
                    <option value="institutional_macro">Institucional Macro (A3)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Describe el propósito y uso de esta plantilla..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab: Layout */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Grid3x3 size={20} />
                  Configuración del Layout
                </h2>
                <button
                  type="button"
                  onClick={addSection}
                  className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-1 text-sm"
                >
                  <Plus size={16} />
                  Agregar Sección
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Dimensiones</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ancho (mm)</label>
                      <input
                        type="number"
                        value={layout.width}
                        onChange={(e) => setLayout({ ...layout, width: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alto (mm)</label>
                      <input
                        type="number"
                        value={layout.height}
                        onChange={(e) => setLayout({ ...layout, height: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Márgenes (mm)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Superior</label>
                      <input
                        type="number"
                        value={layout.margins.top}
                        onChange={(e) => setLayout({
                          ...layout,
                          margins: { ...layout.margins, top: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inferior</label>
                      <input
                        type="number"
                        value={layout.margins.bottom}
                        onChange={(e) => setLayout({
                          ...layout,
                          margins: { ...layout.margins, bottom: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Izquierdo</label>
                      <input
                        type="number"
                        value={layout.margins.left}
                        onChange={(e) => setLayout({
                          ...layout,
                          margins: { ...layout.margins, left: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Derecho</label>
                      <input
                        type="number"
                        value={layout.margins.right}
                        onChange={(e) => setLayout({
                          ...layout,
                          margins: { ...layout.margins, right: parseInt(e.target.value) }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="font-medium text-gray-900 mb-4">Secciones</h3>
              <div className="space-y-4">
                {layout.sections.map((section, index) => (
                  <div key={section.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => updateSection(section.id, { name: e.target.value })}
                        className="font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:border-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                        <select
                          value={section.type}
                          onChange={(e) => updateSection(section.id, { type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        >
                          <option value="header">Encabezado</option>
                          <option value="body">Cuerpo</option>
                          <option value="footer">Pie</option>
                          <option value="signature">Firma</option>
                          <option value="qr">Código QR</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Posición X (mm)</label>
                        <input
                          type="number"
                          value={section.position.x}
                          onChange={(e) => updateSection(section.id, {
                            position: { ...section.position, x: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Posición Y (mm)</label>
                        <input
                          type="number"
                          value={section.position.y}
                          onChange={(e) => updateSection(section.id, {
                            position: { ...section.position, y: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Placeholders */}
        {activeTab === 'placeholders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Type size={20} />
                  Placeholders de Datos
                </h2>
                <button
                  type="button"
                  onClick={addPlaceholder}
                  className="px-3 py-1 bg-primary text-white rounded-md hover:bg-primary/90 flex items-center gap-1 text-sm"
                >
                  <Plus size={16} />
                  Agregar Placeholder
                </button>
              </div>

              <div className="space-y-3">
                {placeholders.map((placeholder) => (
                  <div key={placeholder.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600">
                      {getPlaceholderIcon(placeholder.type)}
                    </div>
                    
                    <div className="flex-1">
                      <input
                        type="text"
                        value={placeholder.name}
                        onChange={(e) => updatePlaceholder(placeholder.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Nombre del placeholder"
                      />
                    </div>
                    
                    <select
                      value={placeholder.type}
                      onChange={(e) => updatePlaceholder(placeholder.id, { type: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="text">Texto</option>
                      <option value="date">Fecha</option>
                      <option value="image">Imagen</option>
                      <option value="qr">Código QR</option>
                      <option value="signature">Firma</option>
                    </select>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={placeholder.required}
                        onChange={(e) => updatePlaceholder(placeholder.id, { required: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Obligatorio</span>
                    </label>
                    
                    <button
                      type="button"
                      onClick={() => removePlaceholder(placeholder.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Modal de Vista Previa */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Vista Previa</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="bg-gray-100 rounded-lg p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <Palette className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">Vista previa en desarrollo...</p>
                <p className="text-sm text-gray-500 mt-2">
                  {formData.name || 'Nueva Plantilla'} - {formData.type}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
