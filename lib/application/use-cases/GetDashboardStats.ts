import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import {
    getCertificateStatusLabel,
    isCertificateBlocked,
    isCertificateInWorkflow,
    isCertificatePublished,
} from "@/lib/types/certificateStatus";

export interface DashboardStats {
    totalCertificates: number;
    totalParticipants: number;
    inWorkflow: number;
    publishedCertificates: number;
    blockedCertificates: number;
    activePrograms: number;
    byType: { CAP: number; PROFUNDO: number };
    byStatus: Record<string, number>;
    recentActivity: Array<{
        id: string;
        type: 'success' | 'warning' | 'info' | 'error';
        title: string;
        description: string;
        time: string;
        href?: string;
    }>;
}

export class GetDashboardStats {
    async execute(scope?: { type: string; campusIds?: string[]; academicAreaIds?: string[]; signerIds?: string[]; userId?: string }): Promise<DashboardStats> {
        try {
            const certificatesRef = collection(db, "certificates");
            const studentsRef = collection(db, "students");
            type DashboardCertificateRecord = Record<string, any> & { id: string };
            type DashboardStudentRecord = Record<string, any> & { id: string };

            const matchesScope = (entity: Record<string, any>) => {
                if (!scope || scope.type === 'global') {
                    return true;
                }

                if (scope.type === 'campus' && scope.campusIds?.length) {
                    return scope.campusIds.includes(entity.campusId);
                }

                if (scope.type === 'area' && scope.academicAreaIds?.length) {
                    return (
                        scope.academicAreaIds.includes(entity.academicAreaId) ||
                        scope.campusIds?.includes(entity.campusId)
                    );
                }

                if (scope.type === 'personal') {
                    return (
                        entity.createdBy === scope.userId ||
                        (entity.signer1Id && scope.signerIds?.includes(entity.signer1Id)) ||
                        (entity.signer2Id && scope.signerIds?.includes(entity.signer2Id)) ||
                        (entity.signerId && scope.signerIds?.includes(entity.signerId))
                    );
                }

                return true;
            };

            const [certificateDocs, studentDocs] = await Promise.all([
                getDocs(query(certificatesRef, orderBy("createdAt", "desc"))),
                getDocs(studentsRef),
            ]);

            const certificates: DashboardCertificateRecord[] = certificateDocs.docs
                .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
                .filter(matchesScope);
            const students: DashboardStudentRecord[] = studentDocs.docs
                .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
                .filter(matchesScope);

            const recentActivity: DashboardStats['recentActivity'] = certificates.slice(0, 5).map((data) => {
                const statusLabel = getCertificateStatusLabel(data.status);
                const blocked = isCertificateBlocked(data.status);
                const published = isCertificatePublished(data.status);
                const inWorkflow = isCertificateInWorkflow(data.status);

                return {
                    id: data.id,
                    type: blocked ? 'error' : published ? 'success' : inWorkflow ? 'warning' : 'info',
                    title: `Certificado ${statusLabel}`,
                    description: `${data.studentName || 'Estudiante'} - ${data.folio || ''}`,
                    time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'Reciente',
                    href: `/dashboard/certificates/${data.id}`,
                };
            });

            const uniquePrograms = new Set(
                certificates
                    .map((item) => item.programId || item.academicProgram)
                    .filter(Boolean)
            );
            const byStatus = certificates.reduce<Record<string, number>>((acc, item) => {
                const status = typeof item.status === 'string' ? item.status : 'draft';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});

            return {
                totalCertificates: certificates.length,
                totalParticipants: students.length,
                inWorkflow: certificates.filter((item) => isCertificateInWorkflow(item.status)).length,
                publishedCertificates: certificates.filter((item) => isCertificatePublished(item.status)).length,
                blockedCertificates: certificates.filter((item) => isCertificateBlocked(item.status)).length,
                activePrograms: uniquePrograms.size,
                byType: {
                    CAP: certificates.filter((item) => item.type === 'CAP').length,
                    PROFUNDO: certificates.filter((item) => item.type === 'PROFUNDO').length
                },
                byStatus,
                recentActivity,
            };
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            return {
                totalCertificates: 0,
                totalParticipants: 0,
                inWorkflow: 0,
                publishedCertificates: 0,
                blockedCertificates: 0,
                activePrograms: 0,
                byType: { CAP: 0, PROFUNDO: 0 },
                byStatus: {},
                recentActivity: []
            };
        }
    }
}
