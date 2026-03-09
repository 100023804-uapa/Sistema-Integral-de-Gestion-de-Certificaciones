import { FontAssetFormat, FontAssetSourceType, FontAssetStyle } from '@/lib/types/fontAsset';

export type TemplateType = 'horizontal' | 'vertical' | 'institutional_macro';

export interface TemplateFontRef {
  assetId?: string;
  family: string;
  url: string;
  key?: string;
  format?: FontAssetFormat;
  weight?: string;
  style?: FontAssetStyle;
  sourceType?: FontAssetSourceType;
}

export type TemplateFontStatus =
  | 'managed'
  | 'safe'
  | 'mixed'
  | 'external'
  | 'unmanaged'
  | 'unstyled';

export interface TemplateFontProfile {
  status: TemplateFontStatus;
  managedFamilies: string[];
  safeFamilies: string[];
  unmanagedFamilies: string[];
  declaredFamilies: string[];
  externalSources: string[];
  riskIds: string[];
}

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  type: TemplateType;
  certificateTypeId: string;
  htmlContent: string;
  cssStyles: string;
  fontRefs: TemplateFontRef[];
  fontProfile: TemplateFontProfile;
  layout: TemplateLayout;
  placeholders: TemplatePlaceholder[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateLayout {
  width: number; // mm
  height: number; // mm
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  name: string;
  type: 'header' | 'body' | 'footer' | 'signature' | 'qr';
  position: {
    x: number; // mm from left
    y: number; // mm from top
    width: number; // mm
    height: number; // mm
  };
  style: {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    textAlign?: 'left' | 'center' | 'right';
    fontSize?: number;
    fontWeight?: string;
    color?: string;
  };
  content: string; // HTML content with placeholders
}

export interface TemplatePlaceholder {
  id: string;
  name: string;
  type: 'text' | 'date' | 'image' | 'qr' | 'signature';
  defaultValue?: string;
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export interface GeneratedCertificate {
  id: string;
  certificateId: string;
  templateId: string;
  pdfUrl: string;
  qrCodeUrl: string;
  generatedAt: Date;
  generatedBy: string;
  metadata: {
    fileSize: number;
    pageCount: number;
    templateVersion: string;
  };
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: TemplateType;
  certificateTypeId: string;
  htmlContent?: string;
  cssStyles?: string;
  fontRefs?: TemplateFontRef[];
  layout: TemplateLayout;
  placeholders: TemplatePlaceholder[];
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  htmlContent?: string;
  cssStyles?: string;
  fontRefs?: TemplateFontRef[];
  layout?: TemplateLayout;
  placeholders?: TemplatePlaceholder[];
  isActive?: boolean;
}

export interface GenerateCertificateRequest {
  certificateId: string;
  templateId: string;
  options: {
    includeQR?: boolean;
    includeSignature?: boolean;
    watermark?: boolean;
    quality?: 'low' | 'medium' | 'high';
  };
}

// Configuración de plantillas
export const TEMPLATE_CONFIG = {
  DEFAULT_SIZES: {
    horizontal: { width: 297, height: 210 }, // A4 landscape
    vertical: { width: 210, height: 297 },   // A4 portrait
    institutional_macro: { width: 420, height: 297 } // A3 landscape
  },
  DEFAULT_MARGINS: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  PLACEHOLDER_TYPES: {
    text: ['studentName', 'academicProgram', 'campusName', 'academicAreaName', 'foliage'],
    date: ['issueDate', 'completionDate'],
    image: ['logo', 'seal', 'signature'],
    qr: ['verificationQR'],
    signature: ['digitalSignature']
  },
  CSS_VARIABLES: {
    primaryColor: '#1e40af',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    textColor: '#1f2937',
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff'
  }
} as const;
