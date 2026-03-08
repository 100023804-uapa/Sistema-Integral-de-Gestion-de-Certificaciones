import jsPDF from 'jspdf';
import QRCode from 'qrcode';

import { Certificate } from '@/lib/domain/entities/Certificate';
import { CertificateTemplate } from '@/lib/types/certificateTemplate';
import {
  renderCertificateTemplate,
  replaceTemplatePlaceholders,
} from '@/lib/application/utils/certificate-template-renderer';

export const generateCertificatePDF = async (
  certificate: Certificate,
  template?: CertificateTemplate | null
): Promise<Blob> => {
  const renderedTemplate = await renderCertificateTemplate(template, certificate);

  try {
    return await generateHtmlBasedPDF(renderedTemplate.documentHtml, renderedTemplate.width, renderedTemplate.height);
  } catch (error) {
    console.error('Error rendering certificate from HTML, using fallback PDF renderer:', error);
    return generateLegacyCertificatePDF(certificate, template);
  }
};

async function generateHtmlBasedPDF(documentHtml: string, width: number, height: number): Promise<Blob> {
  let doc: jsPDF | null = null;
  let docWithHtml: (jsPDF & {
    html?: (
      source: HTMLElement,
      options: {
        callback: (pdf: jsPDF) => void;
        x?: number;
        y?: number;
        width?: number;
        windowWidth?: number;
        autoPaging?: 'text' | 'slice' | boolean;
        html2canvas?: {
          scale?: number;
          useCORS?: boolean;
          allowTaint?: boolean;
          backgroundColor?: string;
        };
      }
    ) => void;
  }) | null = null;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = `${Math.ceil(width * 3.78)}px`;
  iframe.style.height = `${Math.ceil(height * 3.78)}px`;
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  document.body.appendChild(iframe);

  try {
    await loadIframeDocument(iframe, documentHtml);

    const iframeDocument = iframe.contentDocument;
    if (!iframeDocument?.body) {
      throw new Error('The HTML preview document could not be loaded.');
    }

    await waitForDocumentAssets(iframeDocument);
    const printableElement = getPrintableElement(iframeDocument);
    const contentWidthPx = Math.max(printableElement.scrollWidth || printableElement.clientWidth, 1);
    const contentHeightPx = Math.max(printableElement.scrollHeight || printableElement.clientHeight, 1);
    const pageWidthMm = width;
    const pageHeightMm = Number(((contentHeightPx / contentWidthPx) * pageWidthMm).toFixed(2)) || height;
    const orientation = pageWidthMm >= pageHeightMm ? 'landscape' : 'portrait';

    doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
    });

    docWithHtml = doc as jsPDF & {
      html?: (
        source: HTMLElement,
        options: {
          callback: (pdf: jsPDF) => void;
          x?: number;
          y?: number;
          width?: number;
          windowWidth?: number;
          autoPaging?: 'text' | 'slice' | boolean;
          html2canvas?: {
            scale?: number;
            useCORS?: boolean;
            allowTaint?: boolean;
            backgroundColor?: string;
          };
        }
      ) => void;
    };

    if (typeof docWithHtml.html !== 'function') {
      throw new Error('jsPDF html renderer is not available in this environment.');
    }

    const htmlRenderer = docWithHtml.html;

    await new Promise<void>((resolve, reject) => {
      try {
        htmlRenderer(printableElement, {
          x: 0,
          y: 0,
          width: pageWidthMm,
          windowWidth: contentWidthPx,
          autoPaging: false,
          html2canvas: {
            scale: 1.6,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
          },
          callback: () => resolve(),
        });
      } catch (error) {
        reject(error);
      }
    });

    return doc.output('blob');
  } finally {
    document.body.removeChild(iframe);
  }
}

async function loadIframeDocument(iframe: HTMLIFrameElement, documentHtml: string): Promise<void> {
  await new Promise<void>((resolve) => {
    const done = () => {
      iframe.onload = null;
      resolve();
    };

    iframe.onload = done;
    iframe.srcdoc = documentHtml;
    window.setTimeout(done, 400);
  });
}

async function waitForDocumentAssets(iframeDocument: Document): Promise<void> {
  const images = Array.from(iframeDocument.images);
  if (!images.length) {
    await delay(80);
    return;
  }

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        })
    )
  );

  await delay(80);
}

function getPrintableElement(iframeDocument: Document): HTMLElement {
  return (
    (iframeDocument.querySelector('.certificate-container') as HTMLElement | null) ||
    (iframeDocument.querySelector('.certificate-wrapper') as HTMLElement | null) ||
    iframeDocument.body
  );
}

async function generateLegacyCertificatePDF(
  certificate: Certificate,
  template?: CertificateTemplate | null
): Promise<Blob> {
  const layout = template?.layout;
  const width = layout?.width || 297;
  const height = layout?.height || 210;
  const unit = width > 500 ? 'px' : 'mm';
  const orientation = width > height ? 'landscape' : 'portrait';

  const doc = new jsPDF({
    orientation,
    unit,
    format: [width, height],
  });

  if ((template as { backgroundImageUrl?: string } | undefined)?.backgroundImageUrl) {
    try {
      const img = await loadImage((template as { backgroundImageUrl?: string }).backgroundImageUrl!);
      doc.addImage(img, 'JPEG', 0, 0, width, height);
    } catch (error) {
      console.error('Error loading background image', error);
    }
  }

  if (template?.layout?.sections?.length) {
    for (const section of template.layout.sections) {
      const pos = section.position;
      const style = section.style || {};

      if (style.backgroundColor || style.borderColor) {
        if (style.backgroundColor) {
          doc.setFillColor(style.backgroundColor);
          doc.rect(pos.x, pos.y, pos.width, pos.height, 'F');
        }
        if (style.borderColor && (style.borderWidth || 1) > 0) {
          doc.setDrawColor(style.borderColor);
          doc.setLineWidth(style.borderWidth || 0.2);
          doc.rect(pos.x, pos.y, pos.width, pos.height, 'S');
        }
      }

      const value = resolveLegacyVariable(section.content, certificate);

      if (section.type === 'qr') {
        try {
          const qrDataUrl = await QRCode.toDataURL(
            certificate.qrCodeUrl || `https://sigce.uapa.edu.do/verify/${certificate.publicVerificationCode || certificate.folio}`
          );
          const size = Math.min(pos.width, pos.height);
          doc.addImage(qrDataUrl, 'PNG', pos.x + (pos.width - size) / 2, pos.y + (pos.height - size) / 2, size, size);
        } catch (error) {
          console.error('Error adding QR to template section', error);
        }
      } else if (section.type === 'signature') {
        try {
          if (value && value.startsWith('http')) {
            const img = await loadImage(value);
            doc.addImage(img, 'PNG', pos.x, pos.y, pos.width, pos.height);
          }
        } catch (error) {
          console.error('Error loading signature image in section', error);
        }
      } else {
        doc.setFontSize(style.fontSize || 12);
        doc.setTextColor(style.color || '#000000');
        doc.setFont('helvetica', style.fontWeight === 'bold' ? 'bold' : 'normal');

        const textAlign = style.textAlign || 'left';
        const padding = style.padding || 5;
        let textX = pos.x + padding;
        const textY = pos.y + pos.height / 2 + (style.fontSize || 12) / 4;

        if (textAlign === 'center') {
          textX = pos.x + pos.width / 2;
        } else if (textAlign === 'right') {
          textX = pos.x + pos.width - padding;
        }

        doc.text(value, textX, textY, {
          align: textAlign as 'left' | 'center' | 'right',
          maxWidth: pos.width - padding * 2,
        });
      }
    }

    return doc.output('blob');
  }

  await renderDefaultLayout(doc, certificate, width, height);
  return doc.output('blob');
}

function resolveLegacyVariable(content: string, cert: Certificate): string {
  return replaceTemplatePlaceholders(content, {
    studentName: cert.studentName || '',
    programName: cert.academicProgram || '',
    academicProgram: cert.academicProgram || '',
    folio: cert.folio || '',
    issueDate: cert.issueDate
      ? new Date(cert.issueDate).toLocaleDateString('es-DO', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '',
    campusName: cert.metadata?.campusName || cert.campusId || '',
    campus: cert.metadata?.campusName || cert.campusId || '',
    academicArea: cert.metadata?.academicArea || cert.academicAreaId || '',
    studentId: cert.studentId || '',
    cedula: cert.cedula || cert.studentId || '',
    grade: cert.metadata?.grade || '',
    duration: cert.metadata?.duration || '',
    verificationUrl:
      cert.qrCodeUrl || `https://sigce.uapa.edu.do/verify/${cert.publicVerificationCode || cert.folio}`,
    description: cert.metadata?.description || '',
    signer1_Name: cert.metadata?.signer1_Name || '',
    signer1_Title: cert.metadata?.signer1_Title || '',
    signer2_Name: cert.metadata?.signer2_Name || '',
    signer2_Title: cert.metadata?.signer2_Title || '',
    qrCode: cert.qrCodeUrl || '',
    sealImage: cert.metadata?.sealImage || cert.metadata?.sealUrl || '',
    signer1_SignatureImage: cert.metadata?.signer1_SignatureImage || '',
    signer2_SignatureImage: cert.metadata?.signer2_SignatureImage || '',
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}

async function renderDefaultLayout(doc: jsPDF, cert: Certificate, width: number, height: number): Promise<void> {
  try {
    const logoUrl = '/logo de la uapa.jpeg';
    const img = await loadImage(logoUrl);
    const logoWidth = 40;
    const logoHeight = 40;
    const x = (width - logoWidth) / 2;
    doc.addImage(img, 'JPEG', x, 20, logoWidth, logoHeight);
  } catch (error) {
    console.error('Error loading default logo for PDF', error);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text('CERTIFICADO DE RECONOCIMIENTO', width / 2, 70, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text('Se otorga el presente a:', width / 2, 90, { align: 'center' });

  doc.setFont('times', 'bolditalic');
  doc.setFontSize(40);
  doc.text(cert.studentName, width / 2, 105, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(16);
  doc.text('Por haber concluido satisfactoriamente el programa:', width / 2, 125, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  const splitTitle = doc.splitTextToSize(cert.academicProgram, width - 40);
  doc.text(splitTitle, width / 2, 140, { align: 'center' });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const yPos = 140 + splitTitle.length * 10;

  doc.text(
    `Fecha de emisión: ${new Date(cert.issueDate).toLocaleDateString('es-DO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    width / 2,
    yPos + 10,
    { align: 'center' }
  );
  doc.text(`Folio: ${cert.folio}`, width / 2, yPos + 16, { align: 'center' });

  try {
    const qrDataUrl = await QRCode.toDataURL(
      cert.qrCodeUrl || `https://sigce.uapa.edu.do/verify/${cert.publicVerificationCode || cert.folio}`
    );
    doc.addImage(qrDataUrl, 'PNG', width - 40, height - 40, 30, 30);
  } catch (error) {
    console.error('QR Error', error);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}
