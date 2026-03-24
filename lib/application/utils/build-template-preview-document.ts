import { buildManagedTemplateFontFaceCss } from '@/lib/config/template-fonts';
import { TemplateFontRef } from '@/lib/types/certificateTemplate';

export function buildTemplatePreviewDocument(
  htmlContent: string,
  cssStyles: string,
  fontRefs: TemplateFontRef[] = []
): string {
  const managedFontCss = buildManagedTemplateFontFaceCss(fontRefs);

  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          ${managedFontCss}
          ${cssStyles}
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
    </html>
  `;
}
