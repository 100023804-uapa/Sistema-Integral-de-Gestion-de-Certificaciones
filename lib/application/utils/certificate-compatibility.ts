import { Certificate } from '@/lib/domain/entities/Certificate';
import { CertificateTemplate, TemplateFontProfile } from '@/lib/types/certificateTemplate';

export type CompatibilityLevel = 'modern' | 'transitional' | 'legacy';

export interface CompatibilitySignal {
  id: string;
  label: string;
  state: 'ok' | 'warning' | 'missing';
  detail: string;
}

export interface CertificateCompatibilityReport {
  level: CompatibilityLevel;
  label: string;
  summary: string;
  recommendation: string;
  fontProfile: TemplateFontProfile | null;
  signals: CompatibilitySignal[];
  warnings: string[];
}

export interface TemplateModernizationReport {
  level: CompatibilityLevel;
  label: string;
  summary: string;
  recommendation: string;
  shouldMigrate: boolean;
  usesLegacyLayout: boolean;
  warnings: string[];
}

function resolveTemplateFontProfile(
  certificate: Certificate,
  liveTemplate?: CertificateTemplate | null
): TemplateFontProfile | null {
  if (certificate.templateSnapshot?.fontProfile) {
    return certificate.templateSnapshot.fontProfile;
  }

  if (liveTemplate?.fontProfile) {
    return liveTemplate.fontProfile;
  }

  return null;
}

export function buildCertificateCompatibilityReport(
  certificate: Certificate,
  liveTemplate?: CertificateTemplate | null
): CertificateCompatibilityReport {
  const fontProfile = resolveTemplateFontProfile(certificate, liveTemplate);
  const hasSnapshot = Boolean(certificate.templateSnapshot);
  const hasPdf = Boolean(certificate.pdfUrl);
  const dependsOnLiveTemplate = !hasSnapshot && Boolean(certificate.templateId);
  const riskyFonts = Boolean(
    fontProfile &&
      (fontProfile.status === 'external' ||
        fontProfile.status === 'mixed' ||
        fontProfile.status === 'unmanaged' ||
        fontProfile.externalSources.length > 0 ||
        fontProfile.unmanagedFamilies.length > 0)
  );

  const signals: CompatibilitySignal[] = [
    {
      id: 'snapshot',
      label: 'Snapshot visual',
      state: hasSnapshot ? 'ok' : 'warning',
      detail: hasSnapshot
        ? 'El certificado ya no depende de la plantilla viva.'
        : 'Aun depende de la plantilla actual si esta cambia.',
    },
    {
      id: 'pdf',
      label: 'PDF definitivo',
      state: hasPdf ? 'ok' : 'warning',
      detail: hasPdf
        ? 'La descarga puede reutilizar un PDF ya persistido.'
        : 'Todavia puede regenerarse al descargar.',
    },
    {
      id: 'fonts',
      label: 'Tipografia',
      state: !fontProfile
        ? 'missing'
        : riskyFonts
          ? 'warning'
          : 'ok',
      detail: !fontProfile
        ? 'No hay perfil tipografico disponible para este documento.'
        : riskyFonts
          ? 'La plantilla usa fuentes externas o no gestionadas.'
          : 'La plantilla usa fuentes controladas por el sistema o seguras.',
    },
    {
      id: 'source',
      label: 'Dependencia de plantilla viva',
      state: dependsOnLiveTemplate ? 'warning' : 'ok',
      detail: dependsOnLiveTemplate
        ? 'Editar la plantilla original puede alterar este certificado.'
        : 'El documento ya no depende del template vivo.',
    },
  ];

  let level: CompatibilityLevel = 'transitional';
  if (hasSnapshot && hasPdf && !riskyFonts) {
    level = 'modern';
  } else if (!hasSnapshot && !hasPdf) {
    level = 'legacy';
  }

  const warnings = signals
    .filter((signal) => signal.state !== 'ok')
    .map((signal) => signal.detail);

  const label =
    level === 'modern'
      ? 'Modernizado'
      : level === 'legacy'
        ? 'Legado'
        : 'Transicion';

  const summary =
    level === 'modern'
      ? 'Snapshot, PDF persistido y tipografia estable.'
      : level === 'legacy'
        ? 'Documento antiguo sin snapshot ni PDF persistido.'
        : 'Documento parcialmente migrado; aun conserva dependencias viejas.';

  const recommendation =
    level === 'modern'
      ? 'No requiere migracion inmediata.'
      : level === 'legacy'
        ? 'Conviene reemitirlo o persistir su PDF y congelar plantilla.'
        : 'Completa la migracion pendiente para dejarlo inmutable.';

  return {
    level,
    label,
    summary,
    recommendation,
    fontProfile,
    signals,
    warnings,
  };
}

export function buildTemplateModernizationReport(
  template: CertificateTemplate
): TemplateModernizationReport {
  const fontProfile = template.fontProfile;
  const usesLegacyLayout = !template.htmlContent?.trim() && Boolean(template.layout?.sections?.length);
  const hasExternalFonts = fontProfile.externalSources.length > 0 || fontProfile.status === 'external';
  const hasUnmanagedFonts =
    fontProfile.unmanagedFamilies.length > 0 || fontProfile.status === 'unmanaged';
  const isMixed = fontProfile.status === 'mixed';

  let level: CompatibilityLevel = 'modern';
  if (hasExternalFonts || hasUnmanagedFonts) {
    level = 'legacy';
  } else if (usesLegacyLayout || isMixed || fontProfile.status === 'unstyled') {
    level = 'transitional';
  }

  const warnings: string[] = [];

  if (hasExternalFonts) {
    warnings.push('La plantilla aun depende de fuentes o estilos remotos.');
  }
  if (hasUnmanagedFonts) {
    warnings.push('Hay familias declaradas que todavia no estan en la biblioteca.');
  }
  if (usesLegacyLayout) {
    warnings.push('Sigue apoyandose en layout legacy y conviene migrarla a HTML/CSS.');
  }
  if (fontProfile.status === 'unstyled') {
    warnings.push('No declara reglas tipograficas explicitas.');
  }

  const label =
    level === 'modern'
      ? 'Lista'
      : level === 'legacy'
        ? 'Migracion alta'
        : 'Migracion media';

  const summary =
    level === 'modern'
      ? 'La plantilla ya esta alineada con el estandar nuevo.'
      : level === 'legacy'
        ? 'La plantilla conserva dependencias viejas y debe migrarse.'
        : 'La plantilla funciona, pero aun conserva componentes heredados.';

  const recommendation =
    level === 'modern'
      ? 'Puede seguir utilizandose como base segura.'
      : level === 'legacy'
        ? 'Importa las fuentes al sistema y elimina dependencias externas.'
        : 'Conviene terminar la migracion a runtime HTML y fuentes gestionadas.';

  return {
    level,
    label,
    summary,
    recommendation,
    shouldMigrate: level !== 'modern',
    usesLegacyLayout,
    warnings,
  };
}

export function getCompatibilityClasses(level: CompatibilityLevel): string {
  if (level === 'modern') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (level === 'legacy') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}
