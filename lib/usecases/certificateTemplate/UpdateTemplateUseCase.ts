import { CertificateTemplate } from '@/lib/types/certificateTemplate';
import { FirebaseCertificateTemplateRepository } from '@/lib/infrastructure/repositories/FirebaseCertificateTemplateRepository';
import { getListCertificateTypesUseCase } from '@/lib/container';

export class UpdateTemplateUseCase {
  constructor(
    private templateRepository: FirebaseCertificateTemplateRepository
  ) { }

  async execute(
    id: string,
    data: {
      name?: string;
      description?: string;
      htmlContent?: string;
      cssStyles?: string;
      layout?: any;
      placeholders?: any[];
      isActive?: boolean;
    }
  ): Promise<CertificateTemplate> {
    // Validaciones
    if (!id?.trim()) {
      throw new Error('El ID de la plantilla es obligatorio');
    }

    // Verificar que la plantilla exista
    const existingTemplate = await this.templateRepository.findById(id);
    if (!existingTemplate) {
      throw new Error('La plantilla no existe');
    }

    // Si se actualiza el nombre, verificar que no exista otra con el mismo nombre
    if (data.name) {
      const templates = await this.templateRepository.findByCertificateType(existingTemplate.certificateTypeId);
      const nameExists = templates.some(template =>
        template.name.toLowerCase() === data.name!.toLowerCase() &&
        template.id !== id &&
        template.isActive
      );

      if (nameExists) {
        throw new Error('Ya existe otra plantilla activa con ese nombre para este tipo de certificado');
      }
    }

    // Validar HTML y CSS si se proporcionan
    if (data.htmlContent) {
      this.validateHTML(data.htmlContent);
    }

    if (data.cssStyles) {
      this.validateCSS(data.cssStyles);
    }

    // Validar layout si se proporciona
    if (data.layout) {
      this.validateLayout(data.layout);
    }

    return await this.templateRepository.update(id, data);
  }

  private validateHTML(html: string): void {
    if (!html.trim()) {
      throw new Error('El contenido HTML no puede estar vacío');
    }

    // Validar que contenga placeholders básicos
    const requiredPlaceholders = ['{{studentName}}', '{{folio}}'];
    const missingBasic = requiredPlaceholders.filter(p => !html.includes(p));
    const hasProgram = html.includes('{{academicProgram}}') || html.includes('{{programName}}');

    if (missingBasic.length > 0 || !hasProgram) {
      const msg = [...missingBasic, !hasProgram ? '{{programName}}' : ''].filter(Boolean).join(', ');
      throw new Error(`El HTML debe contener los placeholders obligatorios: ${msg}`);
    }

    // Validar estructura básica de HTML
    if (!html.includes('<!DOCTYPE html>') || !html.includes('</html>')) {
      throw new Error('El HTML debe tener una estructura válida (DOCTYPE y etiquetas html)');
    }
  }

  private validateCSS(css: string): void {
    if (!css.trim()) {
      throw new Error('El contenido CSS no puede estar vacío');
    }

    // Validar que no contenga CSS peligroso
    const dangerousPatterns = [
      /javascript:/i,
      /@import/i,
      /expression\s*\(/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(css)) {
        throw new Error('El CSS contiene contenido no seguro');
      }
    }
  }

  private validateLayout(layout: any): void {
    if (!layout.width || !layout.height) {
      throw new Error('El layout debe especificar ancho y alto');
    }

    if (layout.width < 100 || layout.height < 100) {
      throw new Error('El tamaño mínimo del layout es 100mm x 100mm');
    }

    if (layout.width > 1000 || layout.height > 1000) {
      throw new Error('El tamaño máximo del layout es 1000mm x 1000mm');
    }

    if (!layout.sections || !Array.isArray(layout.sections)) {
      throw new Error('El layout debe contener secciones');
    }

    if (layout.sections.length === 0) {
      throw new Error('El layout debe contener al menos una sección');
    }

    // Validar cada sección
    for (const section of layout.sections) {
      if (!section.id || !section.type || !section.position) {
        throw new Error('Cada sección debe tener id, type y position');
      }

      const { x, y, width, height } = section.position;
      if (x < 0 || y < 0 || width <= 0 || height <= 0) {
        throw new Error('La posición y tamaño de las secciones deben ser válidos');
      }

      // Validar que la sección esté dentro del layout
      if (x + width > layout.width || y + height > layout.height) {
        throw new Error('Las secciones deben estar dentro del tamaño del layout');
      }
    }
  }
}
