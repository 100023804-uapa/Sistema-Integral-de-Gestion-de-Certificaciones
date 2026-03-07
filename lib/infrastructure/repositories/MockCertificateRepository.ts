import { Certificate, CreateCertificateDTO, CertificateStatus } from '../../domain/entities/Certificate';
import { ICertificateRepository } from '../../domain/repositories/ICertificateRepository';

export class MockCertificateRepository implements ICertificateRepository {
  private certificates: Certificate[] = [
    {
      id: 'SIGCE-2023-8492',
      folio: 'SIGCE-2023-CAP-0001',
      studentId: '2021-0458',
      studentName: 'Juan Pérez Rodríguez',
      academicProgram: 'Diplomado en Ciberseguridad y Hacking Ético',
      issueDate: new Date('2023-10-15'),
      campusId: 'mock-campus',
      qrCodeUrl: '/mock-qr.png',
      pdfUrl: '/mock-certificate.pdf',
      status: 'active',
      type: 'CAP',
      metadata: {},
      createdAt: new Date('2023-10-15'),
      updatedAt: new Date('2023-10-15'),
      history: [
        {
          date: new Date('2023-10-15'),
          action: 'created',
          performedBy: 'System Admin',
          details: 'Certificado generado automáticamente'
        }
      ]
    },
    {
      id: 'SIGCE-2023-1102',
      folio: 'SIGCE-2023-PROFUNDO-0002',
      studentId: '2022-1102',
      studentName: 'Carlos Jiménez',
      academicProgram: 'Criminología Educativa y Prevención Escolar',
      issueDate: new Date('2023-10-08'),
      campusId: 'mock-campus',
      qrCodeUrl: '/mock-qr-2.png',
      pdfUrl: '/mock-certificate-2.pdf',
      status: 'active',
      type: 'PROFUNDO',
      metadata: {},
      createdAt: new Date('2023-10-08'),
      updatedAt: new Date('2023-10-08'),
      history: [
        {
          date: new Date('2023-10-08'),
          action: 'created',
          performedBy: 'System Admin'
        },
        {
          date: new Date('2023-10-09'),
          action: 'printed',
          performedBy: 'Coordinador Académico',
          details: 'Enviado a impresión física'
        }
      ]
    },
  ];

  async findById(id: string): Promise<Certificate | null> {
    return this.certificates.find((c) => c.id === id) || null;
  }

  async findByFolio(folio: string): Promise<Certificate | null> {
    return this.certificates.find((c) => c.folio === folio) || null;
  }

  async findByVerificationCode(code: string): Promise<Certificate | null> {
    return this.certificates.find((c) => c.publicVerificationCode === code || c.folio === code) || null;
  }

  async findByStudentId(studentId: string): Promise<Certificate[]> {
    return this.certificates.filter((c) => c.studentId === studentId);
  }

  async save(data: CreateCertificateDTO): Promise<Certificate> {
    return this.create(data);
  }

  async create(data: CreateCertificateDTO): Promise<Certificate> {
    const input = data as any;
    const newCertificate: Certificate = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      qrCodeUrl: input.qrCodeUrl || `https://mock.com/verify/${data.folio}`,
      pdfUrl: input.pdfUrl || undefined,
      history: [
        {
          date: new Date(),
          action: 'created',
          performedBy: 'Current User', // TODO: Get actual user
          details: 'Certificado creado'
        }
      ]
    };
    this.certificates.push(newCertificate);
    return newCertificate;
  }

  async updateStatus(id: string, status: CertificateStatus): Promise<void> {
    const index = this.certificates.findIndex(c => c.id === id);
    if (index !== -1) {
      this.certificates[index].status = status;
      this.certificates[index].updatedAt = new Date();
      if (!this.certificates[index].history) {
        this.certificates[index].history = [];
      }
      this.certificates[index].history!.push({
        date: new Date(),
        action: 'status_changed',
        performedBy: 'System',
        details: `Estado cambiado a ${status}`
      });
    }
  }

  async countByYearAndType(year: number, type: Certificate['type']): Promise<number> {
    return this.certificates.filter(c =>
      c.issueDate.getFullYear() === year && c.type === type
    ).length;
  }

  async findAll(): Promise<Certificate[]> {
    return this.certificates;
  }

  async list(limitCount: number = 20): Promise<Certificate[]> {
    return this.certificates.slice(0, limitCount);
  }
}
