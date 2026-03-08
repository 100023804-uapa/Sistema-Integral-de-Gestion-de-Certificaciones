'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  Clock3,
  Copy,
  Edit,
  Eye,
  FileText,
  LayoutTemplate,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';

import { CertificateTemplate } from '@/lib/types/certificateTemplate';
import { CertificateType } from '@/lib/types/certificateType';
import { Certificate } from '@/lib/domain/entities/Certificate';
import {
  renderCertificateTemplate,
  RenderedCertificateTemplate,
} from '@/lib/application/utils/certificate-template-renderer';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/AuthContext';

function getRenderMode(template: CertificateTemplate) {
  if (template.htmlContent?.trim()) return 'HTML';
  if (template.layout?.sections?.length) return 'LEGACY';
  return 'DEFAULT';
}

function getRenderModeClasses(mode: string) {
  if (mode === 'HTML') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (mode === 'LEGACY') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-700';
}

function getTemplateColor(type: string) {
  const colors = {
    horizontal: 'bg-blue-100 text-blue-800 border-blue-200',
    vertical: 'bg-green-100 text-green-800 border-green-200',
    institutional_macro: 'bg-slate-100 text-slate-800 border-slate-200',
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
}

function getDetectedVariables(template: CertificateTemplate) {
  const matches = [
    ...(template.htmlContent?.match(/\{\{([^{}]+)\}\}/g) || []),
    ...(template.cssStyles?.match(/\{\{([^{}]+)\}\}/g) || []),
  ];
  const ids = new Set([
    ...(template.placeholders || []).map((placeholder) => placeholder.id),
    ...matches.map((match) => match.replace(/[{}]/g, '').trim()),
  ]);
  return ids.size;
}

function buildPreviewCertificate(template: CertificateTemplate): Certificate {
  const now = new Date();
  return {
    id: 'preview-template',
    folio: 'SIGCE-2026-CAP-0001',
    studentId: '2024-0001',
    studentName: 'Ana M. Cepeda M.',
    studentEmail: 'ana@example.com',
    cedula: '001-1234567-8',
    type: 'CAP',
    academicProgram: 'MATEMATICA AVANZADA',
    issueDate: now,
    expirationDate: null,
    status: 'active',
    templateId: template.id,
    qrCodeUrl: 'https://sigce.app/verify/SIGCE-2026-CAP-0001',
    publicVerificationCode: 'SIGCE-2026-CAP-0001',
    pdfUrl: null,
    campusId: 'campus-principal',
    academicAreaId: 'matematicas',
    certificateTypeId: template.certificateTypeId,
    metadata: {
      campusName: 'Campus Principal',
      academicArea: 'Facultad de Matematicas',
      duration: '40 horas',
      grade: '95',
      description: 'Cohorte Marzo 2026',
      signer1_Name: 'Dra. Elena Ramirez',
      signer1_Title: 'Directora Academica',
      signer1_SignatureImage: '',
      signer2_Name: 'Lic. Samuel Torres',
      signer2_Title: 'Coordinador de Certificacion',
      signer2_SignatureImage: '',
    },
    createdAt: now,
    updatedAt: now,
  };
}

function TemplateRuntimePreview({
  template,
  maxWidth,
  maxHeight,
  watermarkText,
}: {
  template: CertificateTemplate;
  maxWidth: number;
  maxHeight: number;
  watermarkText?: string;
}) {
  const [rendered, setRendered] = useState<RenderedCertificateTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      setLoading(true);
      try {
        const preview = await renderCertificateTemplate(
          template,
          buildPreviewCertificate(template),
          { watermarkText }
        );
        if (active) setRendered(preview);
      } catch (error) {
        console.error('Error rendering template preview:', error);
        if (active) setRendered(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPreview();
    return () => {
      active = false;
    };
  }, [template, watermarkText]);

  const width = rendered?.width || template.layout?.width || 297;
  const height = rendered?.height || template.layout?.height || 210;
  const baseWidth = Math.max(1, width * 3.78);
  const baseHeight = Math.max(1, height * 3.78);
  const scale = Math.min(maxWidth / baseWidth, maxHeight / baseHeight, 1);

  if (loading) {
    return <div className="h-full w-full animate-pulse rounded-2xl bg-slate-100" />;
  }

  if (!rendered) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        No se pudo generar la vista previa
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-100 p-4">
      <div style={{ width: baseWidth * scale, height: baseHeight * scale }}>
        <iframe
          title={`preview-${template.id}`}
          srcDoc={rendered.documentHtml}
          style={{
            width: `${baseWidth}px`,
            height: `${baseHeight}px`,
            border: '0',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background: '#ffffff',
          }}
        />
      </div>
    </div>
  );
}

export default function CertificateTemplatesPage() {
  const { hasRole, user } = useAuth();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [certificateTypes, setCertificateTypes] = useState<CertificateType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<CertificateTemplate | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CertificateTemplate | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/certificate-templates');
      const data = await response.json();
      if (data.success) setTemplates(data.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetch('/api/admin/certificate-types')
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setCertificateTypes(data.data);
      })
      .catch((error) => console.error('Error fetching certificate types:', error));
  }, []);

  const filteredTemplates = templates.filter((template) => {
    if (!showInactive && template.isActive === false) return false;
    const matchesFilter = filter === 'all' || template.type === filter;
    const haystack = `${template.name} ${template.description || ''}`.toLowerCase();
    return matchesFilter && haystack.includes(searchTerm.toLowerCase());
  });

  const handleDuplicate = async (template: CertificateTemplate) => {
    try {
      const response = await fetch('/api/admin/certificate-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copia)`,
          description: template.description,
          type: template.type,
          certificateTypeId: template.certificateTypeId,
          htmlContent: template.htmlContent,
          cssStyles: template.cssStyles,
          layout: JSON.parse(JSON.stringify(template.layout)),
          placeholders: JSON.parse(JSON.stringify(template.placeholders || [])),
          createdBy: user?.uid || 'template-copy',
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchTemplates();
        return;
      }
      alert(`Error: ${data.error}`);
    } catch (error) {
      console.error('Error duplicating template:', error);
      alert('Error al duplicar plantilla');
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    try {
      const response = await fetch(`/api/admin/certificate-templates/${deleteCandidate.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setDeleteCandidate(null);
        fetchTemplates();
        return;
      }
      alert(`Error: ${data.error}`);
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error al eliminar plantilla');
    }
  };

  const getCertificateTypeName = (typeId: string) =>
    certificateTypes.find((type) => type.id === typeId)?.name || 'Desconocido';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-8 md:py-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <LayoutTemplate size={14} /> Fase 4
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-900">Plantillas de Certificado</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-500 md:text-base">
            El catálogo ahora expone mejor el modo real de render, conserva HTML/CSS al duplicar y muestra una vista previa más fiel.
          </p>
        </div>
        <Link href="/dashboard/certificate-templates/create" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90">
          <Plus size={18} /> Nueva Plantilla
        </Link>
      </div>

      <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none">
            <option value="all">Todos los tipos</option>
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="institutional_macro">Institucional Macro</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
            <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="rounded" />
            Mostrar inactivas
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {filteredTemplates.map((template) => {
          const renderMode = getRenderMode(template);
          return (
            <div key={template.id} className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]', getTemplateColor(template.type))}>{template.type}</span>
                  <span className={cn('rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]', getRenderModeClasses(renderMode))}>{renderMode}</span>
                  <span className={cn('rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]', template.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700')}>{template.isActive ? 'Activa' : 'Inactiva'}</span>
                </div>
                <div className="mt-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-black text-gray-900">{template.name}</h2>
                    <p className="mt-1 text-sm text-gray-500">{template.description || 'Sin descripción'}</p>
                  </div>
                  <button onClick={() => setSelectedTemplate(template)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    <Eye size={16} /> Vista
                  </button>
                </div>
              </div>

              <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="h-[220px] overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                  <TemplateRuntimePreview template={template} maxWidth={420} maxHeight={220} watermarkText="Preview" />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Certificado</div><div className="mt-2 font-semibold text-slate-900">{getCertificateTypeName(template.certificateTypeId)}</div></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Formato</div><div className="mt-2 font-semibold text-slate-900">{template.layout.width}x{template.layout.height}mm</div></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Orientación</div><div className="mt-2 font-semibold capitalize text-slate-900">{template.layout.orientation}</div></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Variables</div><div className="mt-2 font-semibold text-slate-900">{getDetectedVariables(template)}</div></div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {template.isActive ? <CheckCircle size={14} className="text-emerald-500" /> : <XCircle size={14} className="text-red-500" />}
                    <Clock3 size={14} />
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link href={`/dashboard/certificate-templates/${template.id}/edit`} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
                      <Edit size={14} /> Editar
                    </Link>
                    <button onClick={() => handleDuplicate(template)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                      <Copy size={14} /> Duplicar
                    </button>
                    {hasRole('administrator') && (
                      <button onClick={() => setDeleteCandidate(template)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100">
                        <Trash2 size={14} /> Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
          <FileText className="mx-auto mb-4 text-gray-300" size={46} />
          <h3 className="text-lg font-bold text-gray-900">No hay plantillas para este filtro</h3>
          <p className="mt-2 text-sm text-gray-500">Ajusta la búsqueda o crea una nueva plantilla.</p>
        </div>
      )}

      {selectedTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 p-4 md:p-8">
          <div className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-gray-900">{selectedTemplate.name}</h2>
                <p className="text-sm text-gray-500">Vista previa consistente con el motor real de render.</p>
              </div>
              <button onClick={() => setSelectedTemplate(null)} className="rounded-full p-2 hover:bg-gray-100">
                <X size={22} className="text-gray-500" />
              </button>
            </div>
            <div className="grid flex-1 gap-6 overflow-auto p-6 xl:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                <TemplateRuntimePreview template={selectedTemplate} maxWidth={960} maxHeight={700} watermarkText="Vista previa" />
              </div>
              <div className="space-y-4">
                <div className="rounded-[24px] border border-gray-100 bg-white p-5">
                  <h3 className="font-black text-gray-900">Resumen técnico</h3>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 p-4"><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Modo de render</span><div className="mt-2 font-semibold text-slate-900">{getRenderMode(selectedTemplate)}</div></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Formato</span><div className="mt-2 font-semibold text-slate-900">{selectedTemplate.layout.width}x{selectedTemplate.layout.height}mm</div></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Orientación</span><div className="mt-2 font-semibold capitalize text-slate-900">{selectedTemplate.layout.orientation}</div></div>
                    <div className="rounded-2xl bg-slate-50 p-4"><span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Variables detectadas</span><div className="mt-2 font-semibold text-slate-900">{getDetectedVariables(selectedTemplate)}</div></div>
                  </div>
                </div>
                <div className="rounded-[24px] border border-gray-100 bg-white p-5">
                  <h3 className="font-black text-gray-900">Compatibilidad</h3>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    <li>La vista previa usa el mismo render que el detalle del certificado.</li>
                    <li>Al duplicar se conservan `htmlContent`, `cssStyles`, `layout` y `placeholders`.</li>
                    <li>El catálogo muestra si la plantilla corre en modo HTML, legacy o default.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black text-gray-900">Eliminar plantilla</h2>
            <p className="mt-3 text-sm text-gray-600">
              ¿Seguro que deseas eliminar <strong>{deleteCandidate.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteCandidate(null)} className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleDelete} className="flex-1 rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
