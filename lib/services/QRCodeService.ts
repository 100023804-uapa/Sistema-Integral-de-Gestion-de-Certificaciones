import { Buffer } from 'buffer';

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  type?: 'png' | 'jpeg' | 'svg';
  quality?: number;
}

export interface QRCodeData {
  text: string;
  url?: string;
  metadata?: Record<string, any>;
}

export class QRCodeService {
  private static instance: QRCodeService;

  static getInstance(): QRCodeService {
    if (!QRCodeService.instance) {
      QRCodeService.instance = new QRCodeService();
    }
    return QRCodeService.instance;
  }

  async generateQRCode(
    data: QRCodeData,
    options: QRCodeOptions = {}
  ): Promise<Buffer> {
    try {
      // Para desarrollo, simulamos la generación de QR
      // En producción, esto usaría librerías como qrcode, sharp o similar
      
      const qrBuffer = await this.simulateQRGeneration(data, options);
      
      return qrBuffer;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Error al generar código QR');
    }
  }

  private async simulateQRGeneration(data: QRCodeData, options: QRCodeOptions): Promise<Buffer> {
    // Simulación de generación de QR
    // En producción, esto sería:
    /*
    const QRCode = require('qrcode');
    const sharp = require('sharp');
    
    const qrOptions = {
      width: options.size || 200,
      margin: options.margin || 1,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF'
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M'
    };
    
    let qrBuffer;
    
    if (options.type === 'svg') {
      qrBuffer = await QRCode.toSVG(data.text || data.url, qrOptions);
    } else {
      qrBuffer = await QRCode.toBuffer(data.text || data.url, qrOptions);
      
      // Optimizar imagen si es necesario
      if (options.quality && options.quality < 100) {
        qrBuffer = await sharp(qrBuffer)
          .jpeg({ quality: options.quality })
          .toBuffer();
      }
    }
    
    return qrBuffer;
    */

    // Simulación para desarrollo
    const text = data.text || data.url || '';
    const size = options.size || 200;
    const type = options.type || 'png';
    
    // Generar SVG simple como simulación
    const svgContent = this.generateSimpleSVG(text, size, options);
    
    if (type === 'svg') {
      return Buffer.from(svgContent, 'utf-8');
    } else {
      // Simular conversión a imagen
      const imageBuffer = Buffer.from(svgContent, 'utf-8');
      return imageBuffer;
    }
  }

  private generateSimpleSVG(text: string, size: number, options: QRCodeOptions): string {
    const margin = options.margin || 1;
    const colorDark = options.color?.dark || '#000000';
    const colorLight = options.color?.light || '#FFFFFF';
    
    // Simulación de QR Code (patrón simple)
    const patterns = this.generateQRPattern(text);
    
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="${colorLight}"/>
        ${patterns.map((pattern, index) => `
          <rect 
            x="${pattern.x}" 
            y="${pattern.y}" 
            width="${pattern.size}" 
            height="${pattern.size}" 
            fill="${colorDark}"
          />
        `).join('')}
        <text 
          x="${size/2}" 
          y="${size/2}" 
          text-anchor="middle" 
          dominant-baseline="middle" 
          font-family="monospace" 
          font-size="${size/20}" 
          fill="${colorDark}"
        >
          QR: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}
        </text>
      </svg>
    `;
  }

  private generateQRPattern(text: string): Array<{x: number, y: number, size: number}> {
    // Simulación de patrón de QR basado en el texto
    const patterns = [];
    const hash = this.simpleHash(text);
    
    // Generar patrón de 20x20
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        if (hash[(i * 20 + j) % hash.length] % 3 === 0) {
          patterns.push({
            x: i * 10,
            y: j * 10,
            size: 8
          });
        }
      }
    }
    
    return patterns;
  }

  private simpleHash(str: string): number[] {
    let hash = 0;
    const result: number[] = [];
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
      result.push(Math.abs(hash));
    }
    
    return result;
  }

  async generateVerificationQRCode(
    certificateId: string,
    verificationUrl: string,
    options: QRCodeOptions = {}
  ): Promise<Buffer> {
    const data: QRCodeData = {
      text: `CERT-${certificateId}`,
      url: `${verificationUrl}/${certificateId}`,
      metadata: {
        certificateId,
        type: 'verification',
        generatedAt: new Date().toISOString()
      }
    };

    return await this.generateQRCode(data, options);
  }

  async generateBatchQRCodes(
    dataList: QRCodeData[],
    options: QRCodeOptions = {}
  ): Promise<Buffer[]> {
    try {
      const qrBuffers: Buffer[] = [];
      
      for (const data of dataList) {
        const qrBuffer = await this.generateQRCode(data, options);
        qrBuffers.push(qrBuffer);
      }
      
      return qrBuffers;
    } catch (error) {
      console.error('Error generating batch QR codes:', error);
      throw new Error('Error al generar códigos QR en lote');
    }
  }

  async validateQRCode(qrBuffer: Buffer): Promise<boolean> {
    try {
      // Validación básica del QR
      if (!qrBuffer || qrBuffer.length === 0) {
        return false;
      }

      // Verificar que sea un formato válido (SVG o imagen)
      const header = qrBuffer.slice(0, 10).toString();
      return header.includes('<svg') || header.includes('\x89PNG') || header.includes('\xFF\xD8\xFF');
    } catch (error) {
      console.error('Error validating QR code:', error);
      return false;
    }
  }

  async getQRCodeInfo(qrBuffer: Buffer): Promise<{
    size: number;
    format: string;
    metadata?: any;
  }> {
    try {
      // Para desarrollo, simulamos la obtención de información
      const header = qrBuffer.slice(0, 10).toString();
      const format = header.includes('<svg') ? 'SVG' : 
                    header.includes('\x89PNG') ? 'PNG' : 
                    header.includes('\xFF\xD8\xFF') ? 'JPEG' : 'Unknown';
      
      return {
        size: qrBuffer.length,
        format,
        metadata: {
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error getting QR code info:', error);
      return {
        size: qrBuffer.length,
        format: 'Unknown'
      };
    }
  }

  // Métodos de utilidad para diferentes tipos de QR
  async generateURLQRCode(
    url: string,
    options: QRCodeOptions = {}
  ): Promise<Buffer> {
    return await this.generateQRCode({ text: '', url }, options);
  }

  async generateTextQRCode(
    text: string,
    options: QRCodeOptions = {}
  ): Promise<Buffer> {
    return await this.generateQRCode({ text }, options);
  }

  async generateContactQRCode(
    contact: {
      name: string;
      phone?: string;
      email?: string;
      organization?: string;
    },
    options: QRCodeOptions = {}
  ): Promise<Buffer> {
    // Formato vCard
    const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
${contact.phone ? `TEL:${contact.phone}` : ''}
${contact.email ? `EMAIL:${contact.email}` : ''}
${contact.organization ? `ORG:${contact.organization}` : ''}
END:VCARD`;

    return await this.generateQRCode({ text: vCard }, options);
  }

  async generateWiFiQRCode(
    wifi: {
      ssid: string;
      password?: string;
      security?: 'WPA' | 'WEP' | 'nopass';
      hidden?: boolean;
    },
    options: QRCodeOptions = {}
  ): Promise<Buffer> {
    // Formato WiFi
    const security = wifi.security || 'nopass';
    const hidden = wifi.hidden ? 'true' : 'false';
    
    const wifiString = `WIFI:T:${security};S:${wifi.ssid};P:${wifi.password || ''};H:${hidden};`;
    
    return await this.generateQRCode({ text: wifiString }, options);
  }

  // Optimización y personalización
  async customizeQRCode(
    qrBuffer: Buffer,
    customizations: {
      logo?: Buffer;
      logoSize?: number;
      roundedCorners?: boolean;
      gradient?: {
        startColor: string;
        endColor: string;
        direction: 'horizontal' | 'vertical' | 'diagonal';
      };
    }
  ): Promise<Buffer> {
    try {
      // Para desarrollo, simulamos la personalización
      // En producción, esto usaría librerías de edición de imágenes
      
      let customizedBuffer = qrBuffer;
      
      // Simular personalización
      if (customizations.logo) {
        // Simular adición de logo
        console.log('Logo would be added to QR code');
      }
      
      if (customizations.roundedCorners) {
        // Simular esquinas redondeadas
        console.log('QR code would have rounded corners');
      }
      
      if (customizations.gradient) {
        // Simular gradiente
        console.log('QR code would have gradient colors');
      }
      
      return customizedBuffer;
    } catch (error) {
      console.error('Error customizing QR code:', error);
      throw new Error('Error al personalizar código QR');
    }
  }

  // Métodos de integración
  async generateQRCodeForCertificate(
    certificateData: {
      id: string;
      folio: string;
      studentName: string;
      issueDate: Date;
      verificationUrl: string;
    },
    options: QRCodeOptions = {}
  ): Promise<Buffer> {
    const qrData: QRCodeData = {
      text: `Certificado - Folio: ${certificateData.folio}`,
      url: `${certificateData.verificationUrl}/${certificateData.id}`,
      metadata: {
        certificateId: certificateData.id,
        folio: certificateData.folio,
        studentName: certificateData.studentName,
        issueDate: certificateData.issueDate.toISOString(),
        type: 'certificate'
      }
    };

    return await this.generateQRCode(qrData, options);
  }
}
