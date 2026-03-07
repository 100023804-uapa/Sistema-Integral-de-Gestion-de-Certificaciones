import { StudentCertificate, StudentCertificateFilter, CertificateStatus } from '@/lib/domain/entities/StudentCertificate';
import { IStudentCertificateRepository } from '@/lib/domain/repositories/IStudentCertificateRepository';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  QueryDocumentSnapshot,
  DocumentData,
  getDocs,
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class FirebaseStudentCertificateRepository implements IStudentCertificateRepository {
  private readonly certificatesCollection = 'certificates';

  async findById(certificateId: string): Promise<{ pdfUrl?: string } | null> {
    const certificate = await this.getCertificateDetails(certificateId);
    if (!certificate) {
      return null;
    }

    return {
      pdfUrl: certificate.pdfUrl,
    };
  }

  async findByStudentConstraints(constraints: any[][]): Promise<StudentCertificate[]> {
    let q = query(
      collection(db, this.certificatesCollection),
      orderBy('issueDate', 'desc')
    );

    // Aplicar todos los filtros
    constraints.forEach(([field, operator, value]) => {
      q = query(q, where(field, operator as any, value));
    });

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(this.mapToStudentCertificate);
  }

  async findByStudentIdPaginated(
    studentId: string, 
    pageSize: number = 10,
    cursor?: QueryDocumentSnapshot
  ): Promise<{ data: StudentCertificate[]; hasMore: boolean; lastVisible?: QueryDocumentSnapshot }> {
    let q = query(
      collection(db, this.certificatesCollection),
      where('studentId', '==', studentId),
      orderBy('issueDate', 'desc'),
      limit(pageSize)
    );

    if (cursor) {
      q = query(q, startAfter(cursor));
    }

    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(this.mapToStudentCertificate);
    const hasMore = querySnapshot.docs.length === pageSize;
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    return { data, hasMore, lastVisible };
  }

  async getCertificateDetails(certificateId: string): Promise<StudentCertificate | null> {
    const q = query(
      collection(db, this.certificatesCollection),
      where('folio', '==', certificateId)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }

    return this.mapToStudentCertificate(querySnapshot.docs[0]);
  }

  private mapToStudentCertificate = (doc: QueryDocumentSnapshot<DocumentData>): StudentCertificate => {
    const data = doc.data();
    return {
      id: doc.id,
      studentId: data.studentId || '',
      studentName: data.studentName || '',
      studentEmail: data.studentEmail || '',
      certificateId: data.id || '',
      folio: data.folio || '',
      programName: data.programName || '',
      academicAreaName: data.academicAreaName || '',
      campusName: data.campusName || '',
      certificateTypeName: data.type || '',
      issueDate: data.issueDate?.toDate() || new Date(),
      expirationDate: data.expirationDate?.toDate() || undefined,
      status: data.status || CertificateStatus.BORRADOR,
      qrCodeUrl: data.qrCodeUrl || '',
      pdfUrl: data.pdfUrl || '',
      verificationUrl: data.verificationUrl || '',
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    };
  };
}
