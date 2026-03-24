import QRCode from 'qrcode';

import { buildManagedTemplateFontFaceCss } from '@/lib/config/template-fonts';
import { Certificate } from '@/lib/domain/entities/Certificate';
import {
  CertificateTemplate,
  TemplateLayout,
  TemplateSection,
} from '@/lib/types/certificateTemplate';

export type CertificateTemplateRenderMode = 'html' | 'legacy' | 'default';

export interface RenderedCertificateTemplate {
  mode: CertificateTemplateRenderMode;
  documentHtml: string;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
}

interface RenderCertificateTemplateOptions {
  verificationUrl?: string;
  qrCodeDataUrl?: string;
  watermarkText?: string;
}

type TemplateValueMap = Record<string, string>;

const DEFAULT_LAYOUT: TemplateLayout = {
  width: 297,
  height: 210,
  orientation: 'landscape',
  margins: { top: 0, right: 0, bottom: 0, left: 0 },
  sections: [],
};

export async function renderCertificateTemplate(
  template: CertificateTemplate | null | undefined,
  certificate: Certificate,
  options: RenderCertificateTemplateOptions = {}
): Promise<RenderedCertificateTemplate> {
  const layout = template?.layout || DEFAULT_LAYOUT;
  const verificationUrl =
    options.verificationUrl ||
    certificate.qrCodeUrl ||
    `https://sigce.uapa.edu.do/verify/${certificate.publicVerificationCode || certificate.folio}`;
  const qrCodeDataUrl = options.qrCodeDataUrl || (await generateQRCodeDataUrl(verificationUrl));
  const values = buildTemplateValueMap(certificate, verificationUrl, qrCodeDataUrl);

  if (template?.htmlContent?.trim()) {
    return {
      mode: 'html',
      documentHtml: buildHtmlTemplateDocument(template, values, options.watermarkText),
      width: layout.width || DEFAULT_LAYOUT.width,
      height: layout.height || DEFAULT_LAYOUT.height,
      orientation: layout.orientation || inferOrientation(layout.width, layout.height),
    };
  }

  if (template?.layout?.sections?.length) {
    return {
      mode: 'legacy',
      documentHtml: buildLegacyTemplateDocument(template, values, options.watermarkText),
      width: layout.width || DEFAULT_LAYOUT.width,
      height: layout.height || DEFAULT_LAYOUT.height,
      orientation: layout.orientation || inferOrientation(layout.width, layout.height),
    };
  }

  return {
    mode: 'default',
    documentHtml: buildDefaultTemplateDocument(template, values, layout, options.watermarkText),
    width: layout.width || DEFAULT_LAYOUT.width,
    height: layout.height || DEFAULT_LAYOUT.height,
    orientation: layout.orientation || inferOrientation(layout.width, layout.height),
  };
}

export function buildTemplateValueMap(
  certificate: Certificate,
  verificationUrl: string,
  qrCodeDataUrl: string
): TemplateValueMap {
  const issueDate = certificate.issueDate
    ? new Date(certificate.issueDate).toLocaleDateString('es-DO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const campusName = certificate.metadata?.campusName || certificate.campusId || '';
  const academicArea = certificate.metadata?.academicArea || certificate.academicAreaId || '';
  const duration = certificate.metadata?.duration || '';
  const grade = certificate.metadata?.grade || '';
  const description = certificate.metadata?.description || '';
  const certificateType = certificate.metadata?.certificateType || certificate.type || '';
  const logoUrl = certificate.metadata?.logo || certificate.metadata?.logoUrl || '';
  const sealUrl = certificate.metadata?.sealImage || certificate.metadata?.sealUrl || '';

  return {
    studentName: certificate.studentName || '',
    studentId: certificate.studentId || '',
    cedula: certificate.cedula || certificate.studentId || '',
    academicProgram: certificate.academicProgram || '',
    programName: certificate.academicProgram || '',
    folio: certificate.folio || '',
    issueDate,
    campusName,
    campus: campusName,
    academicArea,
    academicAreaName: academicArea,
    duration,
    grade,
    description,
    certificateType,
    verificationUrl,
    qrCode: qrCodeDataUrl || '',
    verificationQR: qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR" class="verification-qr" />` : '',
    qrCodeDataUrl,
    logo: logoUrl ? `<img src="${logoUrl}" alt="Logo" class="certificate-logo" />` : '',
    logoUrl,
    seal: sealUrl ? `<img src="${sealUrl}" alt="Sello" class="certificate-seal" />` : '',
    sealImage: sealUrl || '',
    sealUrl,
    digitalSignature: certificate.metadata?.digitalSignature || '',
    signatureDate: certificate.metadata?.signatureDate || '',
    signer1_Name: certificate.metadata?.signer1_Name || '',
    signer1_Title: certificate.metadata?.signer1_Title || '',
    signer1_SignatureImage: certificate.metadata?.signer1_SignatureImage || '',
    signer2_Name: certificate.metadata?.signer2_Name || '',
    signer2_Title: certificate.metadata?.signer2_Title || '',
    signer2_SignatureImage: certificate.metadata?.signer2_SignatureImage || '',
  };
}

export function replaceTemplatePlaceholders(content: string, values: TemplateValueMap): string {
  if (!content) return '';

  return content.replace(/\{\{([^{}]+)\}\}/g, (_, rawKey) => {
    const key = String(rawKey || '').trim();
    return values[key] ?? '';
  });
}

async function generateQRCodeDataUrl(verificationUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 180,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR for certificate template:', error);
    return '';
  }
}

function buildHtmlTemplateDocument(
  template: CertificateTemplate,
  values: TemplateValueMap,
  watermarkText?: string
): string {
  const managedFontCss = buildManagedTemplateFontFaceCss(template.fontRefs || []);
  const printStyles = buildSharedPrintStyles(template.layout || DEFAULT_LAYOUT, watermarkText);
  const cssStyles = replaceTemplatePlaceholders(template.cssStyles || '', values);
  const hadCssPlaceholder = template.htmlContent.includes('{{cssStyles}}');
  let processedHtml = replaceTemplatePlaceholders(template.htmlContent, values);
  processedHtml = processedHtml.replace(/\{\{cssStyles\}\}/g, cssStyles);

  return ensureHtmlDocument(
    processedHtml,
    hadCssPlaceholder ? `${managedFontCss}\n${printStyles}` : `${managedFontCss}\n${printStyles}\n${cssStyles}`
  );
}

function buildLegacyTemplateDocument(
  template: CertificateTemplate,
  values: TemplateValueMap,
  watermarkText?: string
): string {
  const layout = template.layout || DEFAULT_LAYOUT;
  const sectionsHtml = (layout.sections || [])
    .map((section) => renderLegacySection(section, values))
    .join('\n');
  const backgroundImageUrl = (template as { backgroundImageUrl?: string }).backgroundImageUrl;

  const css = `
    ${buildManagedTemplateFontFaceCss(template.fontRefs || [])}
    ${buildSharedPrintStyles(layout, watermarkText)}
    body {
      margin: 0;
      padding: 0;
      background: #eef2f7;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: Arial, sans-serif;
    }
    .certificate-container {
      position: relative;
      width: ${layout.width}mm;
      height: ${layout.height}mm;
      background: #ffffff;
      overflow: hidden;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
      background-image: ${backgroundImageUrl ? `url('${backgroundImageUrl}')` : 'none'};
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .legacy-section {
      position: absolute;
      box-sizing: border-box;
      white-space: pre-wrap;
      overflow: hidden;
    }
    .legacy-section img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      display: block;
      margin: 0 auto;
    }
    .verification-qr,
    .signature-image,
    .certificate-logo,
    .certificate-seal {
      display: block;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  `;

  return wrapHtmlDocument(`<div class="certificate-container">${sectionsHtml}</div>`, css);
}

function buildDefaultTemplateDocument(
  template: CertificateTemplate | null | undefined,
  values: TemplateValueMap,
  layout: TemplateLayout,
  watermarkText?: string
): string {
  const css = `
    ${template?.fontRefs ? buildManagedTemplateFontFaceCss(template.fontRefs) : ''}
    ${buildSharedPrintStyles(layout || DEFAULT_LAYOUT, watermarkText)}
    body {
      margin: 0;
      padding: 0;
      background: #eef2f7;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: 'Georgia', serif;
      color: #0f172a;
    }
    .certificate-container {
      width: ${(layout?.width || DEFAULT_LAYOUT.width)}mm;
      height: ${(layout?.height || DEFAULT_LAYOUT.height)}mm;
      background: #ffffff;
      border: 8px solid #0f2d63;
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
      padding: 24mm 22mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: center;
    }
    .certificate-title {
      font-size: 14mm;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin: 0 0 8mm;
    }
    .certificate-name {
      font-size: 12mm;
      font-style: italic;
      color: #0f2d63;
      margin: 0 0 4mm;
    }
    .certificate-program {
      font-size: 7mm;
      font-weight: bold;
      margin: 6mm 0;
      text-transform: uppercase;
    }
    .certificate-footer {
      display: flex;
      justify-content: space-between;
      gap: 8mm;
      font-size: 4mm;
      color: #475569;
      margin-top: 10mm;
    }
  `;

  const body = `
    <div class="certificate-container">
      <div>
        <p style="font-size:4mm; letter-spacing:0.25em; text-transform:uppercase; color:#64748b; margin:0 0 8mm;">Certificado generado</p>
        <h1 class="certificate-title">Certificado de Finalización</h1>
        <p style="margin:0 0 4mm; color:#475569;">Se otorga el presente a</p>
        <div class="certificate-name">${escapeHtml(values.studentName)}</div>
        <p style="margin:0; color:#94a3b8;">ID: ${escapeHtml(values.studentId)}</p>
      </div>
      <div>
        <p style="font-size:5mm; color:#334155; margin:0 0 4mm;">Por haber completado satisfactoriamente el programa:</p>
        <div class="certificate-program">${escapeHtml(values.programName)}</div>
      </div>
      <div class="certificate-footer">
        <div>
          <div style="text-transform:uppercase; letter-spacing:0.2em; font-size:3mm; margin-bottom:2mm;">Fecha de emisión</div>
          <strong style="color:#0f172a;">${escapeHtml(values.issueDate)}</strong>
        </div>
        <div style="text-align:right;">
          <div style="text-transform:uppercase; letter-spacing:0.2em; font-size:3mm; margin-bottom:2mm;">Folio único</div>
          <strong style="color:#0f172a;">${escapeHtml(values.folio)}</strong>
        </div>
      </div>
    </div>
  `;

  return wrapHtmlDocument(body, css);
}

function renderLegacySection(section: TemplateSection, values: TemplateValueMap): string {
  const style = section.style || {};
  const padding = style.padding ?? 0;
  const textAlign = style.textAlign || 'left';
  const content = replaceTemplatePlaceholders(section.content || '', values);
  const baseStyle = [
    `left:${section.position.x}mm`,
    `top:${section.position.y}mm`,
    `width:${section.position.width}mm`,
    `height:${section.position.height}mm`,
    style.backgroundColor ? `background:${style.backgroundColor}` : '',
    style.borderColor ? `border:${style.borderWidth || 1}px solid ${style.borderColor}` : '',
    `padding:${padding}mm`,
    `text-align:${textAlign}`,
    style.fontSize ? `font-size:${style.fontSize}mm` : '',
    style.fontWeight ? `font-weight:${style.fontWeight}` : '',
    style.color ? `color:${style.color}` : '',
    style.borderRadius ? `border-radius:${style.borderRadius}px` : '',
    'display:flex',
    textAlign === 'center'
      ? 'justify-content:center'
      : textAlign === 'right'
        ? 'justify-content:flex-end'
        : 'justify-content:flex-start',
    'align-items:center',
  ]
    .filter(Boolean)
    .join(';');

  if (section.type === 'qr') {
    return `<div class="legacy-section" style="${baseStyle}">${values.verificationQR || ''}</div>`;
  }

  if (section.type === 'signature') {
    const signatureHtml = isHtmlContent(content)
      ? content
      : content
        ? `<img src="${content}" alt="Firma" class="signature-image" />`
        : '';
    return `<div class="legacy-section" style="${baseStyle}">${signatureHtml}</div>`;
  }

  return `<div class="legacy-section" style="${baseStyle}">${formatTextContent(content)}</div>`;
}

function ensureHtmlDocument(htmlContent: string, injectedStyles: string): string {
  if (/<html[\s>]/i.test(htmlContent)) {
    const styleTag = `<style>${injectedStyles}</style>`;

    if (/<\/head>/i.test(htmlContent)) {
      return htmlContent.replace(/<\/head>/i, `${styleTag}</head>`);
    }

    if (/<body[\s>]/i.test(htmlContent)) {
      return htmlContent.replace(/<body([^>]*)>/i, `<head>${styleTag}</head><body$1>`);
    }

    return htmlContent.replace(/<html([^>]*)>/i, `<html$1><head>${styleTag}</head>`);
  }

  return wrapHtmlDocument(htmlContent, injectedStyles);
}

function wrapHtmlDocument(bodyContent: string, css: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>${css}</style>
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
}

function buildSharedPrintStyles(layout: TemplateLayout, watermarkText?: string): string {
  const width = layout?.width || DEFAULT_LAYOUT.width;
  const height = layout?.height || DEFAULT_LAYOUT.height;
  const orientation = layout?.orientation || inferOrientation(width, height);

  return `
    @page {
      size: ${width}mm ${height}mm;
      margin: 0;
    }
    html, body {
      width: ${width}mm;
      height: ${height}mm;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body::before {
      content: ${watermarkText ? `"${escapeCssContent(watermarkText)}"` : 'none'};
      position: fixed;
      inset: 0;
      display: ${watermarkText ? 'flex' : 'none'};
      align-items: center;
      justify-content: center;
      font-size: ${orientation === 'landscape' ? '26mm' : '20mm'};
      letter-spacing: 0.18em;
      color: rgba(15, 23, 42, 0.08);
      transform: rotate(-30deg);
      pointer-events: none;
      z-index: 9999;
      text-transform: uppercase;
      font-weight: 700;
    }
  `;
}

function inferOrientation(width?: number, height?: number): 'portrait' | 'landscape' {
  return (width || DEFAULT_LAYOUT.width) > (height || DEFAULT_LAYOUT.height) ? 'landscape' : 'portrait';
}

function escapeHtml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTextContent(content: string): string {
  if (!content) return '';
  if (isHtmlContent(content)) return content;
  return escapeHtml(content).replace(/\n/g, '<br />');
}

function isHtmlContent(content: string): boolean {
  return /<[^>]+>/.test(content);
}

function escapeCssContent(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
