import {
  CertificateTemplateSnapshot,
} from '@/lib/domain/entities/Certificate';
import { buildTemplateFontProfile } from '@/lib/config/template-fonts';
import { CertificateTemplate } from '@/lib/types/certificateTemplate';

export function createCertificateTemplateSnapshot(
  template: CertificateTemplate
): CertificateTemplateSnapshot {
  return {
    templateId: template.id,
    name: template.name,
    description: template.description,
    type: template.type,
    certificateTypeId: template.certificateTypeId,
    htmlContent: template.htmlContent || '',
    cssStyles: template.cssStyles || '',
    fontRefs: template.fontRefs || [],
    fontProfile:
      template.fontProfile ||
      buildTemplateFontProfile(
        template.htmlContent || '',
        template.cssStyles || '',
        template.fontRefs || []
      ),
    layout: template.layout,
    placeholders: template.placeholders || [],
    capturedAt: new Date(),
  };
}

export function buildTemplateFromCertificateSnapshot(
  snapshot: CertificateTemplateSnapshot
): CertificateTemplate {
  const capturedAt = new Date(snapshot.capturedAt);

  return {
    id: snapshot.templateId || `snapshot-${capturedAt.getTime()}`,
    name: snapshot.name || 'Plantilla congelada',
    description: snapshot.description,
    type: snapshot.type,
    certificateTypeId: snapshot.certificateTypeId,
    htmlContent: snapshot.htmlContent || '',
    cssStyles: snapshot.cssStyles || '',
    fontRefs: snapshot.fontRefs || [],
    fontProfile:
      snapshot.fontProfile ||
      buildTemplateFontProfile(
        snapshot.htmlContent || '',
        snapshot.cssStyles || '',
        snapshot.fontRefs || []
      ),
    layout: snapshot.layout,
    placeholders: snapshot.placeholders || [],
    isActive: true,
    createdAt: capturedAt,
    updatedAt: capturedAt,
  };
}
