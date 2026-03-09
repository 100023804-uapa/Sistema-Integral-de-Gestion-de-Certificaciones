import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  Timestamp,
  DocumentData,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  CertificateTemplate,
  TemplateLayout,
  TemplateSection,
  TemplatePlaceholder,
  GeneratedCertificate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  GenerateCertificateRequest,
  TemplateType
} from '@/lib/types/certificateTemplate';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { buildTemplateFontProfile, normalizeTemplateFontRefs } from '@/lib/config/template-fonts';

export class FirebaseCertificateTemplateRepository {
  private readonly templatesCollection = 'certificateTemplates';
  private readonly generatedCollection = 'generatedCertificates';

  // Templates CRUD
  async create(template: CreateTemplateRequest, createdBy: string): Promise<CertificateTemplate> {
    try {
      const now = new Date();
      const layout = template.layout || {
        width: 297,
        height: 210,
        orientation: 'landscape',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        sections: []
      };
      const generatedTemplate = this.generateDefaultTemplate(template.type, layout);
      const htmlContent = template.htmlContent?.trim() || generatedTemplate.htmlContent;
      const cssStyles = template.cssStyles?.trim() || generatedTemplate.cssStyles;
      const fontRefs = normalizeTemplateFontRefs(template.fontRefs || []);

      // Simplificar la creación para evitar errores
      const templateData = {
        name: template.name,
        description: template.description || '',
        type: template.type,
        certificateTypeId: template.certificateTypeId,
        htmlContent,
        cssStyles,
        fontRefs,
        fontProfile: buildTemplateFontProfile(htmlContent, cssStyles, fontRefs),
        layout,
        placeholders: template.placeholders || [],
        isActive: true,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, this.templatesCollection), templateData);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Failed to create certificate template');
      }

      return this.mapToCertificateTemplate(docSnap);
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  // Compatibilidad con ITemplateRepository (Legacy)
  async save(template: any): Promise<CertificateTemplate> {
    return this.create({
      name: template.name,
      description: template.description || '',
      type: template.type || 'horizontal',
      certificateTypeId: template.certificateTypeId || '',
      htmlContent: template.htmlContent || '',
      cssStyles: template.cssStyles || '',
      fontRefs: template.fontRefs || [],
      layout: template.layout || {
        width: template.width || 297,
        height: template.height || 210,
        orientation: (template.width > template.height) ? 'landscape' : 'portrait',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        sections: []
      },
      placeholders: template.placeholders || []
    }, 'system-seed');
  }

  async list(activeOnly: boolean = false, certificateTypeId?: string): Promise<CertificateTemplate[]> {
    let q = query(
      collection(db, this.templatesCollection),
      orderBy('updatedAt', 'desc')
    );

    if (activeOnly) {
      q = query(q, where('isActive', '==', true));
    }

    if (certificateTypeId) {
      q = query(q, where('certificateTypeId', '==', certificateTypeId));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCertificateTemplate);
  }

  async findAll(): Promise<CertificateTemplate[]> {
    const q = query(
      collection(db, this.templatesCollection),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCertificateTemplate);
  }

  async findById(id: string): Promise<CertificateTemplate | null> {
    const docRef = doc(db, this.templatesCollection, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return this.mapToCertificateTemplate(docSnap);
  }

  async findByType(type: TemplateType): Promise<CertificateTemplate[]> {
    const q = query(
      collection(db, this.templatesCollection),
      where('type', '==', type),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCertificateTemplate);
  }

  async findByCertificateType(certificateTypeId: string): Promise<CertificateTemplate[]> {
    const q = query(
      collection(db, this.templatesCollection),
      where('certificateTypeId', '==', certificateTypeId),
      where('isActive', '==', true),
      orderBy('name', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToCertificateTemplate);
  }

  async update(id: string, data: UpdateTemplateRequest): Promise<CertificateTemplate> {
    const docRef = doc(db, this.templatesCollection, id);
    const currentTemplate = await this.findById(id);

    if (!currentTemplate) {
      throw new Error('Certificate template not found');
    }

    const htmlContent = data.htmlContent?.trim() || currentTemplate.htmlContent;
    const cssStyles = data.cssStyles?.trim() || currentTemplate.cssStyles;
    const fontRefs = data.fontRefs
      ? normalizeTemplateFontRefs(data.fontRefs)
      : currentTemplate.fontRefs;
    const updateData = {
      ...data,
      htmlContent,
      cssStyles,
      fontRefs,
      fontProfile: buildTemplateFontProfile(htmlContent, cssStyles, fontRefs),
      updatedAt: new Date()
    };

    await updateDoc(docRef, updateData);

    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Failed to update certificate template');
    }

    return this.mapToCertificateTemplate(updatedDoc);
  }

  async softDelete(id: string): Promise<void> {
    const docRef = doc(db, this.templatesCollection, id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: new Date()
    });
  }

  async delete(id: string): Promise<void> {
    return this.softDelete(id);
  }

  // Generated Certificates
  async saveGeneratedCertificate(data: {
    certificateId: string;
    templateId: string;
    pdfUrl: string;
    qrCodeUrl: string;
    generatedBy: string;
    metadata: {
      fileSize: number;
      pageCount: number;
      templateVersion: string;
    };
  }): Promise<GeneratedCertificate> {
    const now = new Date();

    const generatedData = {
      certificateId: data.certificateId,
      templateId: data.templateId,
      pdfUrl: data.pdfUrl,
      qrCodeUrl: data.qrCodeUrl,
      generatedAt: now,
      generatedBy: data.generatedBy,
      metadata: data.metadata
    };

    const docRef = await addDoc(collection(db, this.generatedCollection), generatedData);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Failed to save generated certificate');
    }

    return this.mapToGeneratedCertificate(docSnap);
  }

  async getGeneratedCertificate(certificateId: string): Promise<GeneratedCertificate | null> {
    const q = query(
      collection(db, this.generatedCollection),
      where('certificateId', '==', certificateId),
      orderBy('generatedAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    return this.mapToGeneratedCertificate(querySnapshot.docs[0]);
  }

  async getGeneratedCertificatesByUser(generatedBy: string): Promise<GeneratedCertificate[]> {
    const q = query(
      collection(db, this.generatedCollection),
      where('generatedBy', '==', generatedBy),
      orderBy('generatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToGeneratedCertificate);
  }

  // Métodos auxiliares
  private generateDefaultTemplate(type: TemplateType, layout: TemplateLayout): { htmlContent: string; cssStyles: string } {
    const htmlContent = this.generateDefaultHTML(type, layout);
    const cssStyles = this.generateDefaultCSS(type, layout);

    return { htmlContent, cssStyles };
  }

  private generateDefaultHTML(type: TemplateType, layout: TemplateLayout): string {
    const sections = layout.sections.map(section => {
      switch (section.type) {
        case 'header':
          return `
            <div class="header-section" style="${this.getSectionStyle(section)}">
              <div class="logo-placeholder">{{logo}}</div>
              <div class="institution-info">
                <h1>Universidad</h1>
                <p>Certificado de {{certificateType}}</p>
              </div>
            </div>
          `;
        case 'body':
          return `
            <div class="body-section" style="${this.getSectionStyle(section)}">
              <div class="student-info">
                <p class="certifies-text">Se certifica que</p>
                <h2 class="student-name">{{studentName}}</h2>
                <p class="program-text">ha completado satisfactoriamente el programa</p>
                <h3 class="program-name">{{academicProgram}}</h3>
                <p class="duration-text">con una duración de {{duration}}</p>
              </div>
              <div class="additional-info">
                <p><strong>Folio:</strong> {{folio}}</p>
                <p><strong>Fecha de emisión:</strong> {{issueDate}}</p>
                <p><strong>Recinto:</strong> {{campusName}}</p>
                {{#if academicAreaName}}
                <p><strong>Área académica:</strong> {{academicAreaName}}</p>
                {{/if}}
              </div>
            </div>
          `;
        case 'footer':
          return `
            <div class="footer-section" style="${this.getSectionStyle(section)}">
              <div class="signatures">
                <div class="signature-block">
                  <div class="signature-placeholder">{{digitalSignature}}</div>
                  <p class="signature-title">Firma Digital</p>
                  <p class="signature-date">{{signatureDate}}</p>
                </div>
                <div class="qr-block">
                  <div class="qr-placeholder">{{verificationQR}}</div>
                  <p class="qr-text">Escanear para verificar</p>
                </div>
              </div>
              <div class="seal-placeholder">{{seal}}</div>
            </div>
          `;
        default:
          return `<div class="${section.type}-section" style="${this.getSectionStyle(section)}">${section.content}</div>`;
      }
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificado</title>
        <style>{{cssStyles}}</style>
      </head>
      <body>
        <div class="certificate-container">
          ${sections}
        </div>
      </body>
      </html>
    `;
  }

  private generateDefaultCSS(type: TemplateType, layout: TemplateLayout): string {
    const { width, height } = layout;

    return `
      @page {
        size: ${width}mm ${height}mm;
        margin: 0;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Georgia', serif;
        background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
      }
      
      .certificate-container {
        width: ${width}mm;
        height: ${height}mm;
        background: white;
        border: 8px solid #1e40af;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        position: relative;
        overflow: hidden;
      }
      
      .certificate-container::before {
        content: '';
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        bottom: 10px;
        border: 2px solid #f59e0b;
        border-radius: 12px;
        pointer-events: none;
      }
      
      .header-section {
        text-align: center;
        padding: 20px;
        background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
        color: white;
      }
      
      .logo-placeholder {
        width: 60px;
        height: 60px;
        background: white;
        border-radius: 50%;
        margin: 0 auto 10px;
      }
      
      .institution-info h1 {
        font-size: 24px;
        margin-bottom: 5px;
      }
      
      .institution-info p {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .body-section {
        padding: 40px 30px;
        text-align: center;
      }
      
      .certifies-text {
        font-size: 16px;
        color: #64748b;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 2px;
      }
      
      .student-name {
        font-size: 32px;
        color: #1e40af;
        margin-bottom: 20px;
        font-weight: bold;
      }
      
      .program-text {
        font-size: 16px;
        color: #374151;
        margin-bottom: 10px;
      }
      
      .program-name {
        font-size: 20px;
        color: #1f2937;
        margin-bottom: 20px;
        font-weight: 600;
      }
      
      .duration-text {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 30px;
      }
      
      .additional-info {
        background: #f8fafc;
        padding: 20px;
        border-radius: 10px;
        margin-top: 20px;
        text-align: left;
      }
      
      .additional-info p {
        font-size: 12px;
        color: #374151;
        margin-bottom: 5px;
      }
      
      .footer-section {
        padding: 20px;
        background: #f8fafc;
        border-top: 1px solid #e5e7eb;
      }
      
      .signatures {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .signature-block {
        text-align: center;
      }
      
      .signature-placeholder {
        width: 120px;
        height: 60px;
        border: 1px dashed #9ca3af;
        margin: 0 auto 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: #9ca3af;
      }
      
      .signature-title {
        font-size: 12px;
        color: #374151;
        font-weight: 600;
      }
      
      .signature-date {
        font-size: 10px;
        color: #64748b;
      }
      
      .qr-block {
        text-align: center;
      }
      
      .qr-placeholder {
        width: 80px;
        height: 80px;
        border: 1px dashed #9ca3af;
        margin: 0 auto 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: #9ca3af;
      }
      
      .qr-text {
        font-size: 10px;
        color: #64748b;
      }
      
      .seal-placeholder {
        position: absolute;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border: 2px solid #f59e0b;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        color: #f59e0b;
        font-weight: bold;
      }
      
      @media print {
        body {
          background: white;
        }
        
        .certificate-container {
          box-shadow: none;
        }
      }
    `;
  }

  private getSectionStyle(section: TemplateSection): string {
    const styles: string[] = [];

    if (section.position) {
      styles.push(`position: absolute`);
      styles.push(`left: ${section.position.x}mm`);
      styles.push(`top: ${section.position.y}mm`);
      styles.push(`width: ${section.position.width}mm`);
      styles.push(`height: ${section.position.height}mm`);
    }

    if (section.style) {
      if (section.style.backgroundColor) {
        styles.push(`background-color: ${section.style.backgroundColor}`);
      }
      if (section.style.borderColor) {
        styles.push(`border: 1px solid ${section.style.borderColor}`);
      }
      if (section.style.borderWidth) {
        styles.push(`border-width: ${section.style.borderWidth}px`);
      }
      if (section.style.borderRadius) {
        styles.push(`border-radius: ${section.style.borderRadius}px`);
      }
      if (section.style.padding) {
        styles.push(`padding: ${section.style.padding}px`);
      }
      if (section.style.textAlign) {
        styles.push(`text-align: ${section.style.textAlign}`);
      }
      if (section.style.fontSize) {
        styles.push(`font-size: ${section.style.fontSize}px`);
      }
      if (section.style.fontWeight) {
        styles.push(`font-weight: ${section.style.fontWeight}`);
      }
      if (section.style.color) {
        styles.push(`color: ${section.style.color}`);
      }
    }

    return styles.join('; ');
  }

  // Mappers
  private mapToCertificateTemplate = (doc: QueryDocumentSnapshot<DocumentData>): CertificateTemplate => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      description: data.description,
      type: data.type || 'horizontal',
      certificateTypeId: data.certificateTypeId || '',
      htmlContent: data.htmlContent || '',
      cssStyles: data.cssStyles || '',
      fontRefs: normalizeTemplateFontRefs(data.fontRefs || []),
      fontProfile: data.fontProfile || buildTemplateFontProfile(
        data.htmlContent || '',
        data.cssStyles || '',
        data.fontRefs || []
      ),
      layout: data.layout || {
        width: 297,
        height: 210,
        orientation: 'landscape',
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        sections: []
      },
      placeholders: data.placeholders || [],
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  };

  private mapToGeneratedCertificate = (doc: QueryDocumentSnapshot<DocumentData>): GeneratedCertificate => {
    const data = doc.data();
    return {
      id: doc.id,
      certificateId: data.certificateId || '',
      templateId: data.templateId || '',
      pdfUrl: data.pdfUrl || '',
      qrCodeUrl: data.qrCodeUrl || '',
      generatedAt: data.generatedAt?.toDate() || new Date(),
      generatedBy: data.generatedBy || '',
      metadata: data.metadata || {
        fileSize: 0,
        pageCount: 1,
        templateVersion: '1.0'
      }
    };
  };
}
