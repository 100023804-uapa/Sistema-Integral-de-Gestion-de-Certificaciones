import { Buffer } from 'buffer';

export interface PDFOptions {
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  quality?: 'low' | 'medium' | 'high';
  watermark?: boolean;
  background?: boolean;
}

export interface PDFFooter {
  height: string;
  contents: {
    default: {
      fontSize: number;
      color: string;
    };
  };
}

export interface PDFFooterTemplate {
  height: string;
  contents: {
    default: Array<{
      text: string;
      alignment: 'center' | 'left' | 'right';
      fontSize: number;
      color: string;
      margin: [number, number, number, number];
    }>;
  };
}

export class PDFGenerationService {
  private static instance: PDFGenerationService;

  static getInstance(): PDFGenerationService {
    if (!PDFGenerationService.instance) {
      PDFGenerationService.instance = new PDFGenerationService();
    }
    return PDFGenerationService.instance;
  }

  async generatePDF(
    htmlContent: string,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    try {
      // Para desarrollo, simulamos la generación de PDF
      // En producción, esto usaría Puppeteer, Playwright o similar
      
      const pdfBuffer = await this.simulatePDFGeneration(htmlContent, options);
      
      return pdfBuffer;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Error al generar PDF');
    }
  }

  private async simulatePDFGeneration(htmlContent: string, options: PDFOptions): Promise<Buffer> {
    // Simulación de generación de PDF
    // En producción, esto sería:
    /*
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      orientation: options.orientation || 'portrait',
      margin: options.margin || {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: options.background !== false,
      quality: options.quality === 'high' ? 100 : options.quality === 'medium' ? 80 : 60
    });
    
    await browser.close();
    return pdfBuffer;
    */

    // Simulación para desarrollo
    const htmlWithStyles = this.prepareHTMLForPDF(htmlContent, options);
    const pdfContent = Buffer.from(htmlWithStyles, 'utf-8');
    
    return pdfContent;
  }

  private prepareHTMLForPDF(htmlContent: string, options: PDFOptions): string {
    // Preparar HTML para impresión
    let preparedHTML = htmlContent;

    // Agregar estilos de impresión
    const printStyles = `
      <style>
        @media print {
          @page {
            size: ${options.format || 'A4'} ${options.orientation || 'portrait'};
            margin: ${options.margin?.top || '20mm'} ${options.margin?.right || '20mm'} ${options.margin?.bottom || '20mm'} ${options.margin?.left || '20mm'};
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .no-print {
            display: none !important;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          .avoid-break {
            page-break-inside: avoid;
          }
        }
        
        @media screen {
          body {
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
          }
          
          .certificate-container {
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            max-width: 100%;
            max-height: 100vh;
            overflow: auto;
          }
        }
      </style>
    `;

    // Insertar estilos antes de cerrar head
    if (preparedHTML.includes('</head>')) {
      preparedHTML = preparedHTML.replace('</head>', printStyles + '</head>');
    } else if (preparedHTML.includes('<head>')) {
      preparedHTML = preparedHTML.replace('<head>', '<head>' + printStyles);
    } else {
      preparedHTML = '<head>' + printStyles + '</head>' + preparedHTML;
    }

    // Agregar watermark si es necesario
    if (options.watermark) {
      const watermark = `
        <div class="watermark" style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          color: rgba(0, 0, 0, 0.1);
          pointer-events: none;
          z-index: 1000;
          font-weight: bold;
          text-transform: uppercase;
        ">
        BORRADOR
        </div>
      `;
      
      if (preparedHTML.includes('<body>')) {
        preparedHTML = preparedHTML.replace('<body>', '<body>' + watermark);
      }
    }

    return preparedHTML;
  }

  async generatePDFWithHeaderFooter(
    htmlContent: string,
    header?: string,
    footer?: string,
    options: PDFOptions = {}
  ): Promise<Buffer> {
    try {
      // Preparar HTML con header y footer
      let preparedHTML = htmlContent;

      if (header || footer) {
        const headerFooterHTML = this.addHeaderFooter(htmlContent, header, footer);
        preparedHTML = headerFooterHTML;
      }

      return await this.generatePDF(preparedHTML, options);
    } catch (error) {
      console.error('Error generating PDF with header/footer:', error);
      throw new Error('Error al generar PDF con encabezado y pie');
    }
  }

  private addHeaderFooter(htmlContent: string, header?: string, footer?: string): string {
    let preparedHTML = htmlContent;

    // Agregar header
    if (header) {
      const headerHTML = `
        <div class="pdf-header" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 50px;
          background: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #6c757d;
          z-index: 1000;
        ">
          ${header}
        </div>
      `;

      if (preparedHTML.includes('<body>')) {
        preparedHTML = preparedHTML.replace('<body>', '<body>' + headerHTML);
      }
    }

    // Agregar footer
    if (footer) {
      const footerHTML = `
        <div class="pdf-footer" style="
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 30px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #6c757d;
          z-index: 1000;
        ">
          ${footer}
        </div>
      `;

      if (preparedHTML.includes('</body>')) {
        preparedHTML = preparedHTML.replace('</body>', footerHTML + '</body>');
      }
    }

    // Ajustar el contenido principal para evitar que se solape con header/footer
    const adjustmentCSS = `
      <style>
        .pdf-header ~ .certificate-container {
          margin-top: 60px;
        }
        
        .pdf-footer ~ .certificate-container {
          margin-bottom: 40px;
        }
      </style>
    `;

    if (preparedHTML.includes('</head>')) {
      preparedHTML = preparedHTML.replace('</head>', adjustmentCSS + '</head>');
    }

    return preparedHTML;
  }

  async generateMultiplePages(htmlContents: string[], options: PDFOptions = {}): Promise<Buffer> {
    try {
      // Combinar múltiples HTMLs en un solo PDF
      const combinedHTML = htmlContents.map((html, index) => {
        const pageHTML = html.includes('<!DOCTYPE html>') ? html : `<!DOCTYPE html><html><head><title>Página ${index + 1}</title></head><body>${html}</body></html>`;
        
        // Agregar page break excepto en la última página
        if (index < htmlContents.length - 1) {
          return pageHTML.replace('</body>', '<div class="page-break"></div></body>');
        }
        
        return pageHTML;
      }).join('\n');

      return await this.generatePDF(combinedHTML, options);
    } catch (error) {
      console.error('Error generating multiple pages PDF:', error);
      throw new Error('Error al generar PDF de múltiples páginas');
    }
  }

  async optimizePDF(pdfBuffer: Buffer, options: { quality?: 'low' | 'medium' | 'high' } = {}): Promise<Buffer> {
    try {
      // Para desarrollo, simulamos la optimización
      // En producción, esto usaría librerías como pdf2pic o similar
      
      const quality = options.quality || 'medium';
      const optimizationFactor = quality === 'high' ? 0.9 : quality === 'medium' ? 0.7 : 0.5;
      
      // Simulación de optimización
      const optimizedSize = Math.floor(pdfBuffer.length * optimizationFactor);
      const optimizedBuffer = pdfBuffer.slice(0, optimizedSize);
      
      return optimizedBuffer;
    } catch (error) {
      console.error('Error optimizing PDF:', error);
      throw new Error('Error al optimizar PDF');
    }
  }

  async addMetadata(pdfBuffer: Buffer, metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
  }): Promise<Buffer> {
    try {
      // Para desarrollo, simulamos la adición de metadata
      // En producción, esto usaría librerías como pdf-lib
      
      const metadataString = JSON.stringify(metadata);
      const metadataBuffer = Buffer.from(metadataString, 'utf-8');
      
      // Simulación: agregar metadata al final del PDF
      return Buffer.concat([pdfBuffer, metadataBuffer]);
    } catch (error) {
      console.error('Error adding metadata to PDF:', error);
      throw new Error('Error al agregar metadata al PDF');
    }
  }

  // Métodos de utilidad
  getPDFInfo(pdfBuffer: Buffer): {
    size: number;
    pages: number;
    metadata?: any;
  } {
    try {
      // Para desarrollo, simulamos la obtención de información
      // En producción, esto analizaría el buffer PDF real
      
      return {
        size: pdfBuffer.length,
        pages: 1, // Simulación
        metadata: {
          title: 'Certificado',
          author: 'Sistema de Certificaciones'
        }
      };
    } catch (error) {
      console.error('Error getting PDF info:', error);
      return {
        size: pdfBuffer.length,
        pages: 1
      };
    }
  }

  validatePDF(pdfBuffer: Buffer): boolean {
    try {
      // Validación básica del PDF
      if (!pdfBuffer || pdfBuffer.length === 0) {
        return false;
      }

      // Verificar que comience con el header de PDF
      const header = pdfBuffer.slice(0, 5).toString();
      return header === '%PDF-';
    } catch (error) {
      console.error('Error validating PDF:', error);
      return false;
    }
  }
}
