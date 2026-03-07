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
  const [activeTab, setActiveTab] = useState<'basic' | 'layout' | 'placeholders' | 'code'>('basic');
  
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
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
            { id: 'placeholders', label: 'Placeholders', icon: <Type size={16} /> },
            { id: 'code', label: 'Código HTML/CSS', icon: <File size={16} /> }
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

        {/* Tab de Código HTML/CSS */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <File size={20} />
                Editor de Código HTML/CSS
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-2">Placeholders Disponibles:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}studentName{'}{'}'}</code>
                    <span className="text-gray-700">Nombre completo del estudiante</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}programName{'}{'}'}</code>
                    <span className="text-gray-700">Nombre del programa académico</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}folio{'}{'}'}</code>
                    <span className="text-gray-700">Número de folio del certificado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}issueDate{'}{'}'}</code>
                    <span className="text-gray-700">Fecha de emisión</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}expirationDate{'}{'}'}</code>
                    <span className="text-gray-700">Fecha de vencimiento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}description{'}{'}'}</code>
                    <span className="text-gray-700">Descripción adicional</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}campusName{'}{'}'}</code>
                    <span className="text-gray-700">Nombre del campus</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}academicArea{'}{'}'}</code>
                    <span className="text-gray-700">Área académica</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}signerName{'}{'}'}</code>
                    <span className="text-gray-700">Nombre del firmante</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}signerTitle{'}{'}'}</code>
                    <span className="text-gray-700">Título del firmante</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}qrCode{'}{'}'}</code>
                    <span className="text-gray-700">Código QR de verificación</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}certificateType{'}{'}'}</code>
                    <span className="text-gray-700">Tipo de certificado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}grade{'}{'}'}</code>
                    <span className="text-gray-700">Calificación o nivel</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}duration{'}{'}'}</code>
                    <span className="text-gray-700">Duración del programa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded border border-blue-300 font-mono">{'{'}{'}verificationUrl{'}{'}'}</code>
                    <span className="text-gray-700">URL de verificación</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Usa estos placeholders en tu código HTML. Se reemplazarán automáticamente con los datos del certificado al generar.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Editor HTML */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código HTML
                </label>
                <textarea
                  value={formData.htmlContent}
                  onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                  placeholder={`<!DOCTYPE html>
<html>
<head>
  <title>Certificado</title>
</head>
<body>
  <div class="certificate">
    <h1>CERTIFICADO</h1>
    <p>Se otorga a: <strong>{{studentName}}</strong></p>
    <p>Por haber completado: <strong>{{programName}}</strong></p>
    <div class="footer">
      <p>Folio: {{folio}}</p>
      <p>Fecha: {{issueDate}}</p>
    </div>
  </div>
</body>
</html>`}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  spellCheck={false}
                />
              </div>

              {/* Editor CSS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código CSS
                </label>
                <textarea
                  value={formData.cssStyles}
                  onChange={(e) => setFormData({ ...formData, cssStyles: e.target.value })}
                  placeholder={`body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
}

.certificate {
  width: 297mm;
  height: 210mm;
  border: 2px solid #333;
  padding: 20px;
  text-align: center;
}

h1 {
  color: #1e40af;
  font-size: 24px;
  margin-bottom: 30px;
}

.footer {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  text-align: left;
  font-size: 12px;
  color: #666;
}`}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* Plantillas Predefinidas */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Plantillas Predefinidas</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <title>Certificado Horizontal</title>
</head>
<body>
  <div class="certificate">
    <header class="header">
      <h1>CERTIFICADO DE FINALIZACIÓN</h1>
    </header>
    <main class="content">
      <p>Se otorga a:</p>
      <h2 class="student-name">{{studentName}}</h2>
      <p>Por haber completado satisfactoriamente:</p>
      <h3 class="program-name">{{programName}}</h3>
      <p class="description">{{description}}</p>
    </main>
    <footer class="footer">
      <div class="info">
        <p>Folio: {{folio}}</p>
        <p>Fecha: {{issueDate}}</p>
      </div>
      <div class="signature">
        <div class="signature-line"></div>
        <p>{{signerName}}</p>
        <p>{{signerTitle}}</p>
      </div>
    </footer>
  </div>
</body>
</html>`,
                      cssStyles: `body {
  margin: 0;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

.certificate {
  width: 297mm;
  height: 210mm;
  border: 3px solid #1e40af;
  padding: 30px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  color: #1e40af;
  font-size: 28px;
  font-weight: bold;
  margin: 0;
}

.content {
  text-align: center;
  margin-bottom: 40px;
}

.student-name {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
  margin: 20px 0;
}

.program-name {
  font-size: 20px;
  color: #374151;
  margin: 15px 0;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 40px;
}

.info p {
  font-size: 12px;
  color: #6b7280;
  margin: 5px 0;
}

.signature {
  text-align: center;
}

.signature-line {
  width: 150px;
  height: 2px;
  border-bottom: 2px solid #374151;
  margin-bottom: 5px;
}`
                    });
                  }}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <h5 className="font-medium text-gray-900">Horizontal Azul</h5>
                  <p className="text-sm text-gray-600">Diseño horizontal con gradientes</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <title>Certificado Vertical</title>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1>CERTIFICADO</h1>
      <div class="logo"></div>
    </div>
    <div class="content">
      <h2>DE {{certificateType}}</h2>
      <p class="recipient">A nombre de:</p>
      <h3 class="name">{{studentName}}</h3>
      <p class="program">{{programName}}</p>
      <p class="date">{{issueDate}}</p>
    </div>
    <div class="footer">
      <div class="qr-placeholder"></div>
      <div class="signatures">
        <div class="signature">
          <div class="line"></div>
          <p>{{signerName}}</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
                      cssStyles: `body {
  margin: 0;
  padding: 20px;
  font-family: 'Georgia', serif;
}

.certificate {
  width: 210mm;
  height: 297mm;
  border: 2px solid #d4af37;
  padding: 40px;
  box-sizing: border-box;
  background: #fff;
  position: relative;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #d4af37;
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.content {
  text-align: center;
  margin: 40px 0;
}

.name {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937;
  margin: 20px 0;
  border-bottom: 2px solid #d4af37;
  display: inline-block;
  padding-bottom: 10px;
}

.footer {
  position: absolute;
  bottom: 40px;
  left: 40px;
  right: 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.qr-placeholder {
  width: 60px;
  height: 60px;
  border: 2px dashed #d4af37;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #d4af37;
  font-size: 10px;
  text-align: center;
}`
                    });
                  }}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <h5 className="font-medium text-gray-900">Vertical Dorado</h5>
                  <p className="text-sm text-gray-600">Diseño vertical elegante</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      htmlContent: `<!DOCTYPE html>
<html>
<head>
  <title>Certificado Institucional</title>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="institution">
        <h1>UNIVERSIDAD AUTÓNOMA DE PUEBLA</h1>
        <h2>SISTEMA INTEGRAL DE GESTIÓN DE CERTIFICADOS</h2>
      </div>
    </div>
    <div class="content">
      <h3>CERTIFICADO</h3>
      <p>Que el suscrito Rector de la Universidad Autónoma de Puebla,</p>
      <h4 class="name">{{studentName}}</h4>
      <p>ha completado satisfactoriamente:</p>
      <h5 class="program">{{programName}}</h5>
      <p class="details">{{description}}</p>
      <p class="date">Expedido en {{campusName}}, a los {{issueDate}}</p>
    </div>
    <div class="footer">
      <div class="seal">
        <div class="seal-circle"></div>
        <p>SELLO INSTITUCIONAL</p>
      </div>
      <div class="signatures">
        <div class="signature">
          <div class="line"></div>
          <p>{{rectorName}}</p>
          <p>Rector</p>
        </div>
        <div class="signature">
          <div class="line"></div>
          <p>{{secretaryName}}</p>
          <p>Secretario Académico</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
                      cssStyles: `body {
  margin: 0;
  padding: 20px;
  font-family: 'Times New Roman', serif;
}

.certificate {
  width: 420mm;
  height: 297mm;
  border: 5px solid #8b0000;
  padding: 50px;
  box-sizing: border-box;
  background: #fafafa;
  position: relative;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  border-bottom: 3px solid #8b0000;
  padding-bottom: 20px;
}

.institution h1 {
  color: #8b0000;
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.institution h2 {
  color: #1f2937;
  font-size: 16px;
  margin: 10px 0 0 0;
}

.content {
  text-align: center;
  margin: 40px 0;
}

.content h3 {
  color: #8b0000;
  font-size: 36px;
  font-weight: bold;
  margin: 0 0 30px 0;
}

.name {
  font-size: 32px;
  font-weight: bold;
  color: #1f2937;
  margin: 25px 0;
  text-transform: uppercase;
}

.footer {
  position: absolute;
  bottom: 50px;
  left: 50px;
  right: 50px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.seal {
  text-align: center;
}

.seal-circle {
  width: 80px;
  height: 80px;
  border: 3px solid #8b0000;
  border-radius: 50%;
  margin: 0 auto 10px;
}

.signatures {
  display: flex;
  gap: 40px;
}

.signature {
  text-align: center;
}

.signature .line {
  width: 200px;
  height: 2px;
  border-bottom: 2px solid #1f2937;
  margin-bottom: 5px;
}`
                    });
                  }}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
                >
                  <h5 className="font-medium text-gray-900">Institucional Macro</h5>
                  <p className="text-sm text-gray-600">Formato oficial A3</p>
                </button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    htmlContent: '',
                    cssStyles: ''
                  });
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Limpiar Código
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Vista Previa del Código
              </button>
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
            
            <div className="bg-gray-100 rounded-lg p-4 min-h-[400px]">
              <div 
                className="bg-white shadow-lg mx-auto relative"
                style={{
                  width: `${Math.min(layout.width, 600)}px`,
                  height: `${Math.min(layout.height, 400)}px`,
                  transform: `scale(${Math.min(600 / layout.width, 400 / layout.height)})`,
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
                  <h2 className="text-2xl font-bold mb-4">CERTIFICADO DE {formData.type?.toUpperCase() || 'FINALIZACIÓN'}</h2>
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
              <h3 className="font-semibold text-blue-900 mb-2">Configuración Actual:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span> {formData.name || 'Sin nombre'}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span> {formData.type}
                </div>
                <div>
                  <span className="font-medium">Dimensiones:</span> {layout.width}×{layout.height}mm
                </div>
                <div>
                  <span className="font-medium">Orientación:</span> {layout.orientation}
                </div>
                <div>
                  <span className="font-medium">Secciones:</span> {layout.sections?.length || 0}
                </div>
                <div>
                  <span className="font-medium">Placeholders:</span> {placeholders.length}
                </div>
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
