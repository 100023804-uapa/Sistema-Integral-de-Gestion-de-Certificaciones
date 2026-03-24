import { db } from "@/lib/firebase";
import { collection, getCountFromServer, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import {
    getCertificateStatusLabel,
    isCertificateBlocked,
} from "@/lib/types/certificateStatus";

export interface DashboardStats {
    totalIssued: number;
    pendingValidation: number;
    activePrograms: number;
    blockedCertificates: number;
    byType: { CAP: number; PROFUNDO: number };
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
            const applyScopeFilters = (baseQuery: any, isCertificate: boolean = true) => {
                if (!scope || scope.type === 'global') return baseQuery;

                let q = baseQuery;
                if (scope.type === 'campus' && scope.campusIds?.length) {
                    q = query(q, where("campusId", "in", scope.campusIds));
                } else if (scope.type === 'area' && scope.academicAreaIds?.length) {
                    q = query(q, where("academicAreaId", "in", scope.academicAreaIds));
                } else if (scope.type === 'personal' && isCertificate && scope.userId) {
                    q = query(q, where("createdBy", "==", scope.userId));
                }

                return q;
            };

            const issuedQuery = applyScopeFilters(
                query(certificatesRef, where("status", "in", ["issued", "available", "active"]))
            );
            const issuedSnapshot = await getCountFromServer(issuedQuery);

            const pendingQuery = applyScopeFilters(
                query(certificatesRef, where("status", "in", ["pending_review", "pending_signature"]))
            );
            const pendingSnapshot = await getCountFromServer(pendingQuery);

            const blockedQuery = applyScopeFilters(
                query(
                    certificatesRef,
                    where("status", "in", ["revoked", "cancelled", "blocked_payment", "blocked_documents", "blocked_administrative"])
                )
            );
            const blockedSnapshot = await getCountFromServer(blockedQuery);

            const capQuery = applyScopeFilters(query(certificatesRef, where("type", "==", "CAP")));
            const capSnapshot = await getCountFromServer(capQuery);

            const profundoQuery = applyScopeFilters(query(certificatesRef, where("type", "==", "PROFUNDO")));
            const profundoSnapshot = await getCountFromServer(profundoQuery);

            const recentQuery = applyScopeFilters(query(certificatesRef, orderBy("createdAt", "desc"), limit(50)));
            const recentDocs = await getDocs(recentQuery);

            const recentActivity: DashboardStats['recentActivity'] = recentDocs.docs.slice(0, 5).map((doc) => {
                const data = doc.data() as any;
                const statusLabel = getCertificateStatusLabel(data.status);
                const blocked = isCertificateBlocked(data.status);

                return {
                    id: doc.id,
                    type: blocked ? 'error' : 'success',
                    title: `Certificado ${statusLabel}`,
                    description: `${data.studentName || 'Estudiante'} - ${data.folio || ''}`,
                    time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'Reciente',
                    href: `/dashboard/certificates/${doc.id}`,
                };
            });

            const uniquePrograms = new Set(recentDocs.docs.map((doc) => (doc.data() as any).academicProgram).filter(Boolean));

            return {
                totalIssued: Number((issuedSnapshot.data() as any)?.count || 0),
                pendingValidation: Number((pendingSnapshot.data() as any)?.count || 0),
                activePrograms: uniquePrograms.size,
                blockedCertificates: Number((blockedSnapshot.data() as any)?.count || 0),
                byType: {
                    CAP: Number((capSnapshot.data() as any)?.count || 0),
                    PROFUNDO: Number((profundoSnapshot.data() as any)?.count || 0)
                },
                recentActivity,
            };
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            return {
                totalIssued: 0,
                pendingValidation: 0,
                activePrograms: 0,
                blockedCertificates: 0,
                byType: { CAP: 0, PROFUNDO: 0 },
                recentActivity: []
            };
        }
    }
}
