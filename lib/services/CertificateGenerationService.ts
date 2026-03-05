import { PDFGenerationService } from './PDFGenerationService';
import { QRCodeService } from './QRCodeService';
import { GeneratedCertificate, CertificateTemplate } from '@/lib/types/certificateTemplate';
import { getCertificateRepository } from '@/lib/container';

export interface CertificateGenerationOptions {
  includeQR?: boolean;
  includeSignature?: boolean;
  watermark?: boolean;
  quality?: 'low' | 'medium' | 'high';
  format?: 'pdf' | 'html';
  optimize?: boolean;
}

export interface CertificateData {
  id: string;
  folio: string;
  studentName: string;
  academicProgram: string;
  issueDate: Date;
  campusName: string;
  academicAreaName?: string;
  certificateType: string;
  duration?: string;
  digitalSignature?: string;
  signatureDate?: string;
}

export class CertificateGenerationService {
  private static instance: CertificateGenerationService;
  private pdfService: PDFGenerationService;
  private qrService: QRCodeService;

  static getInstance(): CertificateGenerationService {
    if (!CertificateGenerationService.instance) {
      CertificateGenerationService.instance = new CertificateGenerationService();
    }
    return CertificateGenerationService.instance;
  }

  constructor() {
    this.pdfService = PDFGenerationService.getInstance();
    this.qrService = QRCodeService.getInstance();
  }

  async generateCertificate(
    template: CertificateTemplate,
    data: CertificateData,
    options: CertificateGenerationOptions = {},
    generatedBy: string
  ): Promise<GeneratedCertificate> {
    try {
      // 1. Procesar plantilla con datos
      const processedHTML = this.processTemplate(template.htmlContent, data, options);

      // 2. Generar PDF
      const pdfBuffer = await this.pdfService.generatePDF(processedHTML, {
        format: this.getPDFFormat(template.type),
        orientation: template.layout.orientation,
        margin: this.getPDFMargins(template.layout.margins),
        quality: options.quality || 'medium',
        watermark: options.watermark,
        background: true
      });

      // 3. Generar código QR si es necesario
      let qrCodeUrl = '';
      if (options.includeQR !== false) {
        const verificationUrl = process.env.VERIFICATION_URL || 'https://certificados.uapa.edu/verify';
        const qrBuffer = await this.qrService.generateVerificationQRCode(
          data.id,
          verificationUrl,
          {
            size: 150,
            margin: 2,
            color: { dark: '#000000', light: '#FFFFFF' },
            type: 'png'
          }
        );
        
        // Simular subida del QR a storage
        qrCodeUrl = `${verificationUrl}/qr/${data.id}.png`;
      }

      // 4. Optimizar PDF si es necesario
      let optimizedPDF = pdfBuffer;
      if (options.optimize) {
        optimizedPDF = await this.pdfService.optimizePDF(pdfBuffer, { quality: options.quality });
      }

      // 5. Agregar metadata al PDF
      const finalPDF = await this.pdfService.addMetadata(optimizedPDF, {
        title: `Certificado - ${data.studentName}`,
        author: generatedBy,
        subject: `Certificado de ${data.certificateType}`,
        keywords: `${data.folio}, ${data.studentName}, ${data.academicProgram}`,
        creator: 'Sistema de Certificaciones UAPA',
        producer: 'Certificate Generation Service v1.0'
      });

      // 6. Subir PDF a storage (simulado)
      const pdfUrl = await this.uploadPDF(finalPDF, data.id, template.id);

      // 7. Crear registro del certificado generado
      const generatedCertificate: GeneratedCertificate = {
        id: '', // Se generaría en la base de datos
        certificateId: data.id,
        templateId: template.id,
        pdfUrl,
        qrCodeUrl,
        generatedAt: new Date(),
        generatedBy,
        metadata: {
        fileSize: finalPDF.length,
        pageCount: 1,
        templateVersion: '1.0'
      } as any
      };

      return generatedCertificate;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw new Error('Error al generar certificado');
    }
  }

  private processTemplate(htmlTemplate: string, data: CertificateData, options: CertificateGenerationOptions): string {
    let processedHTML = htmlTemplate;

    // Reemplazar placeholders con datos del certificado
    const placeholders = {
      '{{studentName}}': data.studentName || '',
      '{{academicProgram}}': data.academicProgram || '',
      '{{folio}}': data.folio || '',
      '{{issueDate}}': data.issueDate ? new Date(data.issueDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : '',
      '{{campusName}}': data.campusName || '',
      '{{academicAreaName}}': data.academicAreaName || '',
      '{{certificateType}}': data.certificateType || '',
      '{{duration}}': data.duration || '',
      '{{digitalSignature}}': options.includeSignature ? (data.digitalSignature || '<div class="signature-placeholder">Firma Digital</div>') : '',
      '{{signatureDate}}': data.signatureDate || new Date().toLocaleDateString('es-ES'),
      '{{verificationQR}}': options.includeQR ? '<img src="/qr-placeholder.png" alt="QR" class="qr-code" />' : '',
      '{{logo}}': '<img src="/logo-placeholder.png" alt="Logo" class="logo" />',
      '{{seal}}': '<div class="seal">SELO</div>'
    };

    // Reemplazar todos los placeholders
    for (const [placeholder, value] of Object.entries(placeholders)) {
      processedHTML = processedHTML.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    // Agregar estilos adicionales según opciones
    if (options.watermark) {
      processedHTML = this.addWatermark(processedHTML);
    }

    return processedHTML;
  }

  private addWatermark(htmlContent: string): string {
    const watermark = `
      <div class="watermark" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 120px;
        color: rgba(0, 0, 0, 0.08);
        pointer-events: none;
        z-index: 1000;
        font-weight: bold;
        text-transform: uppercase;
        opacity: 0.6;
      ">
        BORRADOR
      </div>
    `;

    if (htmlContent.includes('<body>')) {
      return htmlContent.replace('<body>', '<body>' + watermark);
    }

    return watermark + htmlContent;
  }

  private getPDFFormat(templateType: string): 'A4' | 'A3' | 'Letter' {
    const formats: Record<string, 'A4' | 'A3' | 'Letter'> = {
      'horizontal': 'A4',
      'vertical': 'A4',
      'institutional_macro': 'A3'
    };

    return formats[templateType] || 'A4';
  }

  private getPDFMargins(margins: any): {
    top: string;
    right: string;
    bottom: string;
    left: string;
  } {
    return {
      top: `${margins.top || 20}mm`,
      right: `${margins.right || 20}mm`,
      bottom: `${margins.bottom || 20}mm`,
      left: `${margins.left || 20}mm`
    };
  }

  private async uploadPDF(pdfBuffer: Buffer, certificateId: string, templateId: string): Promise<string> {
    // Simulación de subida a storage
    // En producción, esto usaría Firebase Storage, AWS S3, etc.
    
    const fileName = `certificates/${certificateId}/${templateId}.pdf`;
    const storageUrl = `https://storage.googleapis.com/certificates-bucket/${fileName}`;
    
    // Simulación de subida
    console.log(`PDF would be uploaded to: ${fileName}`);
    console.log(`PDF size: ${pdfBuffer.length} bytes`);
    
    return storageUrl;
  }

  async generateBatchCertificates(
    certificates: Array<{
      template: CertificateTemplate;
      data: CertificateData;
    }>,
    options: CertificateGenerationOptions = {},
    generatedBy: string
  ): Promise<GeneratedCertificate[]> {
    try {
      const generatedCertificates: GeneratedCertificate[] = [];

      for (const cert of certificates) {
        const generated = await this.generateCertificate(
          cert.template,
          cert.data,
          options,
          generatedBy
        );
        generatedCertificates.push(generated);
      }

      return generatedCertificates;
    } catch (error) {
      console.error('Error generating batch certificates:', error);
      throw new Error('Error al generar certificados en lote');
    }
  }

  async generateCertificatePreview(
    template: CertificateTemplate,
    sampleData: Partial<CertificateData>,
    options: CertificateGenerationOptions = {}
  ): Promise<string> {
    try {
      // Crear datos de muestra
      const data: CertificateData = {
        id: 'preview-' + Date.now(),
        folio: 'PREVIEW-001',
        studentName: sampleData.studentName || 'JUAN PÉREZ',
        academicProgram: sampleData.academicProgram || 'Programa de Ejemplo',
        issueDate: sampleData.issueDate || new Date(),
        campusName: sampleData.campusName || 'Campus Principal',
        academicAreaName: sampleData.academicAreaName || 'Área de Ejemplo',
        certificateType: sampleData.certificateType || 'Certificado',
        duration: sampleData.duration || '40 horas',
        digitalSignature: sampleData.digitalSignature,
        signatureDate: sampleData.signatureDate
      };

      // Procesar plantilla
      const processedHTML = this.processTemplate(template.htmlContent, data, {
        ...options,
        watermark: true // Siempre agregar watermark en preview
      });

      return processedHTML;
    } catch (error) {
      console.error('Error generating certificate preview:', error);
      throw new Error('Error al generar vista previa del certificado');
    }
  }

  async validateCertificateData(data: CertificateData): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validaciones obligatorias
    if (!data.studentName?.trim()) {
      errors.push('El nombre del estudiante es obligatorio');
    }

    if (!data.academicProgram?.trim()) {
      errors.push('El programa académico es obligatorio');
    }

    if (!data.folio?.trim()) {
      errors.push('El folio es obligatorio');
    }

    if (!data.issueDate) {
      errors.push('La fecha de emisión es obligatoria');
    }

    if (!data.campusName?.trim()) {
      errors.push('El nombre del recinto es obligatorio');
    }

    // Validaciones de formato
    if (data.studentName && data.studentName.length < 3) {
      errors.push('El nombre del estudiante debe tener al menos 3 caracteres');
    }

    if (data.studentName && data.studentName.length > 100) {
      errors.push('El nombre del estudiante no puede exceder 100 caracteres');
    }

    if (data.folio && !/^[A-Z0-9-]+$/.test(data.folio)) {
      errors.push('El folio solo puede contener letras mayúsculas, números y guiones');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Métodos de utilidad
  async getCertificateStatistics(
    generatedBy?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    total: number;
    byType: Record<string, number>;
    byDate: Record<string, number>;
    averageSize: number;
  }> {
    try {
      // Simulación de estadísticas
      // En producción, esto consultaría la base de datos
      
      return {
        total: 0,
        byType: {},
        byDate: {},
        averageSize: 0
      };
    } catch (error) {
      console.error('Error getting certificate statistics:', error);
      return {
        total: 0,
        byType: {},
        byDate: {},
        averageSize: 0
      };
    }
  }

  async downloadCertificate(
    certificateId: string,
    format: 'pdf' | 'html' = 'pdf'
  ): Promise<Buffer> {
    try {
      // Obtener datos del certificado
      const certificateRepository = getCertificateRepository();
      const certificate = await certificateRepository.findById(certificateId);
      
      if (!certificate) {
        throw new Error('Certificado no encontrado');
      }

      // Obtener plantilla y generar
      // Esto requeriría más implementación
      throw new Error('Función no implementada completamente');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      throw new Error('Error al descargar certificado');
    }
  }
}
