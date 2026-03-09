import { FontAsset, FontAssetFormat, FontAssetStyle } from '@/lib/types/fontAsset';
import {
  TemplateFontProfile,
  TemplateFontRef,
  TemplateFontStatus,
} from '@/lib/types/certificateTemplate';

export interface SafeTemplateFontOption {
  id: string;
  label: string;
  sampleFamily: string;
  cssSnippet: string;
  stability: 'muy_estable' | 'estable';
  notes: string;
}

export interface TemplateFontRisk {
  id: string;
  severity: 'warning' | 'info';
  title: string;
  detail: string;
}

export const SAFE_TEMPLATE_FONTS: SafeTemplateFontOption[] = [
  {
    id: 'arial',
    label: 'Arial',
    sampleFamily: 'Arial, sans-serif',
    cssSnippet: 'font-family: Arial, sans-serif;',
    stability: 'muy_estable',
    notes: 'Sans-serif segura para cuerpo y datos operativos.',
  },
  {
    id: 'georgia',
    label: 'Georgia',
    sampleFamily: "Georgia, 'Times New Roman', serif",
    cssSnippet: "font-family: Georgia, 'Times New Roman', serif;",
    stability: 'muy_estable',
    notes: 'Serif elegante y confiable para certificados tradicionales.',
  },
  {
    id: 'times-new-roman',
    label: 'Times New Roman',
    sampleFamily: "'Times New Roman', Times, serif",
    cssSnippet: "font-family: 'Times New Roman', Times, serif;",
    stability: 'muy_estable',
    notes: 'Clasica y disponible en casi todos los entornos.',
  },
  {
    id: 'verdana',
    label: 'Verdana',
    sampleFamily: 'Verdana, Geneva, sans-serif',
    cssSnippet: 'font-family: Verdana, Geneva, sans-serif;',
    stability: 'estable',
    notes: 'Muy legible en tamanos pequenos.',
  },
  {
    id: 'tahoma',
    label: 'Tahoma',
    sampleFamily: 'Tahoma, Geneva, sans-serif',
    cssSnippet: 'font-family: Tahoma, Geneva, sans-serif;',
    stability: 'estable',
    notes: 'Buena alternativa compacta para etiquetas y metadatos.',
  },
  {
    id: 'trebuchet-ms',
    label: 'Trebuchet MS',
    sampleFamily: "'Trebuchet MS', Helvetica, sans-serif",
    cssSnippet: "font-family: 'Trebuchet MS', Helvetica, sans-serif;",
    stability: 'estable',
    notes: 'Mas expresiva sin dejar de ser segura.',
  },
  {
    id: 'courier-new',
    label: 'Courier New',
    sampleFamily: "'Courier New', Courier, monospace",
    cssSnippet: "font-family: 'Courier New', Courier, monospace;",
    stability: 'estable',
    notes: 'Util para folios, codigos o bloques monoespaciados.',
  },
  {
    id: 'system-ui',
    label: 'system-ui',
    sampleFamily: 'system-ui, sans-serif',
    cssSnippet: 'font-family: system-ui, sans-serif;',
    stability: 'muy_estable',
    notes: 'Usa la tipografia del sistema operativo.',
  },
];

const FAMILY_WEIGHT_HINTS: Array<{ pattern: RegExp; weight: string }> = [
  { pattern: /thin/i, weight: '100' },
  { pattern: /extralight|ultralight/i, weight: '200' },
  { pattern: /light/i, weight: '300' },
  { pattern: /regular|normal|book/i, weight: '400' },
  { pattern: /medium/i, weight: '500' },
  { pattern: /semibold|demibold/i, weight: '600' },
  { pattern: /bold/i, weight: '700' },
  { pattern: /extrabold|ultrabold/i, weight: '800' },
  { pattern: /black|heavy/i, weight: '900' },
];

const FAMILY_STYLE_HINTS: Array<{ pattern: RegExp; style: FontAssetStyle }> = [
  { pattern: /italic|oblique/i, style: 'italic' },
];

const FORMAT_TO_CSS: Record<Exclude<FontAssetFormat, 'unknown'>, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
};

const SAFE_FONT_ALIASES = new Set([
  'arial',
  'helvetica',
  'georgia',
  'times new roman',
  'times',
  'verdana',
  'geneva',
  'tahoma',
  'trebuchet ms',
  'courier new',
  'courier',
  'system-ui',
  'sans-serif',
  'serif',
  'monospace',
  'cursive',
  'fantasy',
]);

export function inferFontFormatFromFileName(fileName: string): FontAssetFormat {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'woff2') return 'woff2';
  if (extension === 'woff') return 'woff';
  if (extension === 'ttf') return 'ttf';
  if (extension === 'otf') return 'otf';
  return 'unknown';
}

export function isSupportedFontFormat(format: FontAssetFormat): boolean {
  return format !== 'unknown';
}

export function inferFontAssetMetadata(fileName: string): {
  family: string;
  weight: string;
  style: FontAssetStyle;
  format: FontAssetFormat;
} {
  const format = inferFontFormatFromFileName(fileName);
  const baseName = fileName.replace(/\.[^.]+$/, '');
  const normalizedName = baseName
    .replace(/[_-]+/g, ' ')
    .replace(/\b(regular|italic|oblique|bold|semibold|demibold|medium|light|thin|black|heavy|extrabold|ultrabold|extralight|ultralight)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const family =
    normalizedName
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ') || baseName;

  const weight =
    FAMILY_WEIGHT_HINTS.find((entry) => entry.pattern.test(baseName))?.weight || '400';
  const style =
    FAMILY_STYLE_HINTS.find((entry) => entry.pattern.test(baseName))?.style || 'normal';

  return { family, weight, style, format };
}

export function createTemplateFontRefFromAsset(asset: FontAsset): TemplateFontRef {
  return {
    assetId: asset.id,
    family: asset.family,
    url: asset.url,
    key: asset.key,
    format: asset.format,
    weight: asset.weight,
    style: asset.style,
    sourceType: asset.sourceType,
  };
}

export function normalizeTemplateFontRefs(fontRefs: TemplateFontRef[] = []): TemplateFontRef[] {
  const seen = new Set<string>();

  return fontRefs.filter((fontRef) => {
    const key = fontRef.assetId || `${fontRef.family}|${fontRef.url}|${fontRef.weight}|${fontRef.style}`;
    if (!fontRef.family || !fontRef.url) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildTemplateFontFamilySnippet(
  family: string,
  fallback: 'sans-serif' | 'serif' | 'monospace' | 'cursive' = 'sans-serif'
): string {
  return `font-family: '${family}', ${fallback};`;
}

export function inferTemplateFontFallback(
  family: string
): 'sans-serif' | 'serif' | 'monospace' | 'cursive' {
  const normalized = family.toLowerCase();

  if (normalized.includes('mono') || normalized.includes('code') || normalized.includes('courier')) {
    return 'monospace';
  }

  if (
    normalized.includes('serif') ||
    normalized.includes('times') ||
    normalized.includes('georgia') ||
    normalized.includes('garamond')
  ) {
    return 'serif';
  }

  if (
    normalized.includes('script') ||
    normalized.includes('hand') ||
    normalized.includes('cursive') ||
    normalized.includes('callig')
  ) {
    return 'cursive';
  }

  return 'sans-serif';
}

export function buildTemplateFontRuleSnippet(
  family: string,
  options: {
    selector?: string;
    weight?: string;
    style?: FontAssetStyle;
    fallback?: 'sans-serif' | 'serif' | 'monospace' | 'cursive';
  } = {}
): string {
  const selector = options.selector || '.selector';
  const fallback = options.fallback || inferTemplateFontFallback(family);

  return `${selector} {\n  ${buildTemplateFontFamilySnippet(family, fallback)}\n  font-weight: ${options.weight || '400'};\n  font-style: ${options.style || 'normal'};\n}`;
}

export function buildManagedTemplateFontFaceCss(fontRefs: TemplateFontRef[] = []): string {
  return normalizeTemplateFontRefs(fontRefs)
    .map((fontRef) => {
      const format =
        fontRef.format && fontRef.format !== 'unknown'
          ? FORMAT_TO_CSS[fontRef.format]
          : undefined;

      return `
        @font-face {
          font-family: '${escapeCssString(fontRef.family)}';
          src: url('${escapeCssUrl(fontRef.url)}')${format ? ` format('${format}')` : ''};
          font-weight: ${fontRef.weight || '400'};
          font-style: ${fontRef.style || 'normal'};
          font-display: block;
        }
      `;
    })
    .join('\n');
}

function escapeCssString(value: string): string {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeCssUrl(value: string): string {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "%27");
}

export function analyzeTemplateFontRisks(
  htmlContent = '',
  cssStyles = ''
): TemplateFontRisk[] {
  const source = `${htmlContent}\n${cssStyles}`;
  const risks: TemplateFontRisk[] = [];

  if (/fonts\.googleapis\.com|fonts\.gstatic\.com/i.test(source)) {
    risks.push({
      id: 'google-fonts',
      severity: 'warning',
      title: 'Google Fonts detectado',
      detail:
        'La plantilla aun depende de Google Fonts. Para acercar visor y PDF, conviene importar la fuente al sistema o usar una fuente segura.',
    });
  }

  if (/@import\s+url\((['"])?https?:\/\//i.test(source)) {
    risks.push({
      id: 'remote-import',
      severity: 'warning',
      title: '@import remoto detectado',
      detail:
        'El CSS contiene un @import remoto. Eso vuelve mas fragil la carga tipografica al generar certificados.',
    });
  }

  if (/<link[^>]+href=["']https?:\/\/[^"']+["'][^>]*>/i.test(htmlContent)) {
    risks.push({
      id: 'remote-link',
      severity: 'warning',
      title: 'Hoja de estilo remota detectada',
      detail:
        'El HTML referencia una hoja de estilos externa. Lo ideal es mover esa tipografia o ese estilo al sistema.',
    });
  }

  if (/@font-face[\s\S]*?src:\s*url\((['"])?https?:\/\//i.test(cssStyles)) {
    risks.push({
      id: 'remote-font-face',
      severity: 'warning',
      title: '@font-face remoto detectado',
      detail:
        'La plantilla declara una fuente remota dentro de @font-face. Funciona, pero no es la opcion mas confiable para un PDF consistente.',
    });
  }

  if (!/font-family\s*:/i.test(cssStyles)) {
    risks.push({
      id: 'no-font-family',
      severity: 'info',
      title: 'Sin reglas tipograficas explicitas',
      detail:
        'El CSS aun no define font-family. Puedes usar una fuente segura o insertar una fuente interna desde este panel.',
    });
  }

  return risks;
}

export function extractDeclaredFontFamilies(
  htmlContent = '',
  cssStyles = ''
): string[] {
  const source = `${htmlContent}\n${cssStyles}`;
  const matches = source.matchAll(/font-family\s*:\s*([^;}{]+)(?=[;}])/gi);
  const families = new Set<string>();

  for (const match of matches) {
    const declaration = match[1] || '';
    const parts = declaration
      .split(',')
      .map((part) => normalizeFontFamilyName(part))
      .filter(Boolean)
      .filter((part) => !part.startsWith('var('))
      .filter((part) => !['inherit', 'initial', 'unset', 'revert'].includes(part.toLowerCase()));

    for (const part of parts) {
      families.add(part);
    }
  }

  return Array.from(families);
}

export function extractRemoteFontSources(
  htmlContent = '',
  cssStyles = ''
): string[] {
  const sources = new Set<string>();
  const source = `${htmlContent}\n${cssStyles}`;

  const patterns = [
    /<link[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>/gi,
    /@import\s+url\((['"])?(https?:\/\/[^)'"]+)\1\)/gi,
    /@import\s+["'](https?:\/\/[^"']+)["']/gi,
    /src:\s*url\((['"])?(https?:\/\/[^)'"]+)\1\)/gi,
  ];

  for (const pattern of patterns) {
    const matches = source.matchAll(pattern);
    for (const match of matches) {
      const url = match[2] || match[1];
      if (url) sources.add(url);
    }
  }

  return Array.from(sources);
}

export function buildTemplateFontProfile(
  htmlContent = '',
  cssStyles = '',
  fontRefs: TemplateFontRef[] = []
): TemplateFontProfile {
  const normalizedFontRefs = normalizeTemplateFontRefs(fontRefs);
  const managedFamilies = uniqueCasePreserving(normalizedFontRefs.map((fontRef) => fontRef.family));
  const declaredFamilies = extractDeclaredFontFamilies(htmlContent, cssStyles);
  const externalSources = extractRemoteFontSources(htmlContent, cssStyles);
  const riskIds = analyzeTemplateFontRisks(htmlContent, cssStyles).map((risk) => risk.id);

  const safeFamilies = uniqueCasePreserving(
    declaredFamilies.filter((family) => isSafeFontFamily(family))
  );
  const unmanagedFamilies = uniqueCasePreserving(
    declaredFamilies.filter(
      (family) => !isSafeFontFamily(family) && !managedFamilies.some((managed) => sameFontFamily(managed, family))
    )
  );

  const status = resolveTemplateFontStatus({
    managedFamilies,
    safeFamilies,
    unmanagedFamilies,
    externalSources,
    declaredFamilies,
  });

  return {
    status,
    managedFamilies,
    safeFamilies,
    unmanagedFamilies,
    declaredFamilies,
    externalSources,
    riskIds,
  };
}

function resolveTemplateFontStatus(data: {
  managedFamilies: string[];
  safeFamilies: string[];
  unmanagedFamilies: string[];
  externalSources: string[];
  declaredFamilies: string[];
}): TemplateFontStatus {
  const { managedFamilies, safeFamilies, unmanagedFamilies, externalSources, declaredFamilies } = data;

  if (
    managedFamilies.length === 0 &&
    safeFamilies.length === 0 &&
    unmanagedFamilies.length === 0 &&
    externalSources.length === 0 &&
    declaredFamilies.length === 0
  ) {
    return 'unstyled';
  }

  if (
    externalSources.length > 0 &&
    managedFamilies.length === 0 &&
    unmanagedFamilies.length === 0
  ) {
    return 'external';
  }

  if (
    unmanagedFamilies.length > 0 &&
    managedFamilies.length === 0 &&
    externalSources.length === 0
  ) {
    return 'unmanaged';
  }

  if (
    managedFamilies.length > 0 &&
    externalSources.length === 0 &&
    unmanagedFamilies.length === 0
  ) {
    return 'managed';
  }

  if (
    managedFamilies.length === 0 &&
    safeFamilies.length > 0 &&
    externalSources.length === 0 &&
    unmanagedFamilies.length === 0
  ) {
    return 'safe';
  }

  return 'mixed';
}

function normalizeFontFamilyName(value: string): string {
  return String(value || '')
    .trim()
    .replace(/^['"]+|['"]+$/g, '')
    .replace(/\s{2,}/g, ' ');
}

function isSafeFontFamily(family: string): boolean {
  return SAFE_FONT_ALIASES.has(normalizeFontFamilyName(family).toLowerCase());
}

function sameFontFamily(a: string, b: string): boolean {
  return normalizeFontFamilyName(a).toLowerCase() === normalizeFontFamilyName(b).toLowerCase();
}

function uniqueCasePreserving(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeFontFamilyName(value);
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) continue;

    seen.add(key);
    result.push(normalized);
  }

  return result;
}
