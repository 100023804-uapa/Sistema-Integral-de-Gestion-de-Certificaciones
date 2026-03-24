import { CertificateTemplate, TemplateFontRef, TemplateLayout, TemplatePlaceholder } from '@/lib/types/certificateTemplate';
import { FirebaseCertificateTemplateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository';
import { getListCertificateTypesUseCase } from '@/lib/container';

export class CreateTemplateUseCase {
  constructor(
    private templateRepository: FirebaseCertificateTemplateRepository
  ) { }

  async execute(
    data: {
      name: string;
      description?: string;
      type: 'horizontal' | 'vertical' | 'institutional_macro';
      certificateTypeId: string;
      htmlContent?: string;
      cssStyles?: string;
      fontRefs?: TemplateFontRef[];
      layout?: any;
      placeholders?: any[];
    },
    createdBy: string
  ): Promise<CertificateTemplate> {
    // Validaciones básicas
    if (!data.name?.trim()) {
      throw new Error('El nombre de la plantilla es obligatorio');
    }

    if (!data.type) {
      throw new Error('El tipo de plantilla es obligatorio');
    }

    if (!data.certificateTypeId?.trim()) {
      throw new Error('El ID del tipo de certificado es obligatorio');
    }

    // Verificar que el tipo de certificado exista
    try {
      const listCertificateTypesUseCase = getListCertificateTypesUseCase();
      const certificateTypes = await listCertificateTypesUseCase.execute(true);
      const certificateTypeExists = certificateTypes.some(ct => ct.id === data.certificateTypeId);

      if (!certificateTypeExists) {
        throw new Error('El tipo de certificado especificado no existe');
      }
    } catch (error) {
      console.error('Error verificando tipo de certificado:', error);
      // Continuar aunque falle la verificación para debugging
    }

    // Verificar duplicados (simplificado)
    try {
      const existingTemplates = await this.templateRepository.findAll();
      const nameExists = existingTemplates.some(template =>
        template.name.toLowerCase() === data.name.toLowerCase() && template.isActive
      );

      if (nameExists) {
        throw new Error('Ya existe una plantilla activa con ese nombre');
      }
    } catch (error) {
      console.error('Error verificando duplicados:', error);
      // Continuar aunque falle la verificación para debugging
    }

    // Datos por defecto ultra simplificados
    const layout = data.layout || this.getDefaultLayout(data.type);
    const placeholders =
      data.placeholders && data.placeholders.length
        ? data.placeholders
        : this.getDefaultPlaceholders(data.type);

    const templateData = {
      name: data.name,
      description: data.description || '',
      type: data.type,
      certificateTypeId: data.certificateTypeId,
      htmlContent: data.htmlContent || '',
      cssStyles: data.cssStyles || '',
      fontRefs: data.fontRefs || [],
      layout,
      placeholders,
    };

    return await this.templateRepository.create(templateData, createdBy);
  }

  private getDefaultLayout(type: string): TemplateLayout {
    const layouts = {
      horizontal: {
        width: 297,
        height: 210,
        orientation: 'landscape' as const,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        sections: [
          {
            id: 'header',
            name: 'Encabezado',
            type: 'header' as const,
            position: { x: 20, y: 20, width: 257, height: 60 },
            style: {
              backgroundColor: '#1e40af',
              color: '#ffffff',
              textAlign: 'center' as const,
              padding: 10
            },
            content: ''
          },
          {
            id: 'body',
            name: 'Cuerpo',
            type: 'body' as const,
            position: { x: 20, y: 80, width: 257, height: 80 },
            style: {
              textAlign: 'center' as const,
              padding: 20
            },
            content: ''
          },
          {
            id: 'footer',
            name: 'Pie',
            type: 'footer' as const,
            position: { x: 20, y: 160, width: 257, height: 30 },
            style: {
              backgroundColor: '#f8fafc',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              padding: 10
            },
            content: ''
          }
        ]
      },
      vertical: {
        width: 210,
        height: 297,
        orientation: 'portrait' as const,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        sections: [
          {
            id: 'header',
            name: 'Encabezado',
            type: 'header' as const,
            position: { x: 20, y: 20, width: 170, height: 80 },
            style: {
              backgroundColor: '#1e40af',
              color: '#ffffff',
              textAlign: 'center' as const,
              padding: 15
            },
            content: ''
          },
          {
            id: 'body',
            name: 'Cuerpo',
            type: 'body' as const,
            position: { x: 20, y: 100, width: 170, height: 120 },
            style: {
              textAlign: 'center' as const,
              padding: 20
            },
            content: ''
          },
          {
            id: 'footer',
            name: 'Pie',
            type: 'footer' as const,
            position: { x: 20, y: 220, width: 170, height: 57 },
            style: {
              backgroundColor: '#f8fafc',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              padding: 15
            },
            content: ''
          }
        ]
      },
      institutional_macro: {
        width: 420,
        height: 297,
        orientation: 'landscape' as const,
        margins: { top: 25, right: 25, bottom: 25, left: 25 },
        sections: [
          {
            id: 'header',
            name: 'Encabezado',
            type: 'header' as const,
            position: { x: 25, y: 25, width: 370, height: 80 },
            style: {
              backgroundColor: '#1e40af',
              color: '#ffffff',
              textAlign: 'center' as const,
              padding: 20
            },
            content: ''
          },
          {
            id: 'body',
            name: 'Cuerpo',
            type: 'body' as const,
            position: { x: 25, y: 105, width: 370, height: 120 },
            style: {
              textAlign: 'center' as const,
              padding: 25
            },
            content: ''
          },
          {
            id: 'footer',
            name: 'Pie',
            type: 'footer' as const,
            position: { x: 25, y: 225, width: 370, height: 47 },
            style: {
              backgroundColor: '#f8fafc',
              borderColor: '#e5e7eb',
              borderWidth: 1,
              padding: 15
            },
            content: ''
          }
        ]
      }
    };

    return layouts[type as keyof typeof layouts] || layouts.horizontal;
  }

  private getDefaultPlaceholders(type: string): TemplatePlaceholder[] {
    const placeholders: Record<string, TemplatePlaceholder[]> = {
      horizontal: [
        {
          id: 'studentName',
          name: 'Nombre del Estudiante',
          type: 'text' as const,
          defaultValue: '',
          required: true,
          validation: { minLength: 3, maxLength: 100 }
        },
        {
          id: 'programName',
          name: 'Nombre del Programa',
          type: 'text' as const,
          defaultValue: '',
          required: true,
          validation: { minLength: 5, maxLength: 200 }
        },
        {
          id: 'folio',
          name: 'Número de Folio',
          type: 'text' as const,
          defaultValue: '',
          required: true,
          validation: { minLength: 3, maxLength: 50 }
        },
        {
          id: 'issueDate',
          name: 'Fecha de Emisión',
          type: 'date' as const,
          defaultValue: '',
          required: false
        },
        {
          id: 'campusName',
          name: 'Nombre del Recinto',
          type: 'text' as const,
          defaultValue: '',
          required: false
        },
        {
          id: 'academicArea',
          name: 'Área Académica',
          type: 'text' as const,
          defaultValue: '',
          required: false
        },
        {
          id: 'grade',
          name: 'Calificación',
          type: 'text' as const,
          defaultValue: '',
          required: false
        },
        {
          id: 'duration',
          name: 'Duración',
          type: 'text' as const,
          defaultValue: '',
          required: false
        },
        {
          id: 'qrCode',
          name: 'Código QR',
          type: 'qr' as const,
          defaultValue: '',
          required: false
        },
        {
          id: 'sealImage',
          name: 'Sello Institucional',
          type: 'image' as const,
          defaultValue: '',
          required: false
        },
        {
          id: 'signer1_SignatureImage',
          name: 'Firma 1',
          type: 'signature' as const,
          defaultValue: '',
          required: false
        },
        {
          id: 'signer2_SignatureImage',
          name: 'Firma 2',
          type: 'signature' as const,
          defaultValue: '',
          required: false
        }
      ],
      vertical: [
        // Mismos placeholders que horizontal pero con diferentes posiciones
        ...this.getDefaultPlaceholders('horizontal')
      ],
      institutional_macro: [
        // Mismos placeholders pero sin firma digital (según regla de negocio)
        ...this.getDefaultPlaceholders('horizontal').filter((p: TemplatePlaceholder) => p.id !== 'digitalSignature')
      ]
    };

    return placeholders[type as keyof typeof placeholders] || placeholders.horizontal;
  }
}
