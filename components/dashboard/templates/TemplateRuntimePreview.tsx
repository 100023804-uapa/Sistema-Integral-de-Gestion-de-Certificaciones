"use client";

import { useEffect, useState } from 'react';

import {
  renderCertificateTemplate,
  RenderedCertificateTemplate,
} from '@/lib/application/utils/certificate-template-renderer';
import { buildTemplateFontProfile } from '@/lib/config/template-fonts';
import { Certificate } from '@/lib/domain/entities/Certificate';
import { CertificateTemplate } from '@/lib/types/certificateTemplate';

interface TemplateRuntimePreviewProps {
  template: CertificateTemplate;
  maxWidth: number;
  maxHeight: number;
  watermarkText?: string;
  title?: string;
}

interface RuntimePreviewTemplateInput
  extends Partial<Omit<CertificateTemplate, 'layout' | 'placeholders'>> {
  certificateTypeId: string;
  type: CertificateTemplate['type'];
  layout: {
    width: number;
    height: number;
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number };
    sections: Array<Record<string, unknown>>;
  };
  placeholders?: Array<Record<string, unknown>>;
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

export function buildRuntimePreviewTemplate(
  template: RuntimePreviewTemplateInput
): CertificateTemplate {
  const now = new Date();
  const htmlContent = template.htmlContent || '';
  const cssStyles = template.cssStyles || '';
  const fontRefs = template.fontRefs || [];

  return {
    id: template.id || 'draft-template',
    name: template.name || 'Vista previa',
    description: template.description || '',
    type: template.type,
    certificateTypeId: template.certificateTypeId || '',
    htmlContent,
    cssStyles,
    fontRefs,
    fontProfile:
      template.fontProfile || buildTemplateFontProfile(htmlContent, cssStyles, fontRefs),
    layout: template.layout as unknown as CertificateTemplate['layout'],
    placeholders: (template.placeholders || []) as unknown as CertificateTemplate['placeholders'],
    isActive: template.isActive ?? true,
    createdAt: template.createdAt || now,
    updatedAt: template.updatedAt || now,
  };
}

export function TemplateRuntimePreview({
  template,
  maxWidth,
  maxHeight,
  watermarkText,
  title,
}: TemplateRuntimePreviewProps) {
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

        if (active) {
          setRendered(preview);
        }
      } catch (error) {
        console.error('Error rendering template preview:', error);
        if (active) {
          setRendered(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
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
          title={title || `preview-${template.id}`}
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
