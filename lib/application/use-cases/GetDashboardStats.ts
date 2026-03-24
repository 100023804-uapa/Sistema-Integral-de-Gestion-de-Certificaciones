import { db } from "@/lib/firebase";
import { collection, getCountFromServer, query, where, getDocs, orderBy, limit } from "firebase/firestore";
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
    }>;
}

export class GetDashboardStats {
    async execute(): Promise<DashboardStats> {
        try {
            const certificatesRef = collection(db, "certificates");
            // 1. Total Issued
            const issuedQuery = query(certificatesRef, where("status", "in", ["issued", "active"]));
            const issuedSnapshot = await getCountFromServer(issuedQuery);

            // 2. Pendientes de validación/firma sobre estado actual
            const pendingQuery = query(certificatesRef, where("status", "in", ["pending_review", "pending_signature"]));
            const pendingSnapshot = await getCountFromServer(pendingQuery);

            // 3. Bloqueados o cancelados
            const blockedQuery = query(certificatesRef, where("status", "in", ["revoked", "cancelled", "blocked_payment", "blocked_documents", "blocked_administrative"]));
            const blockedSnapshot = await getCountFromServer(blockedQuery);

            // 4. Breakdown by Type
            const capQuery = query(certificatesRef, where("type", "==", "CAP"));
            const capSnapshot = await getCountFromServer(capQuery);
            
            const profundoQuery = query(certificatesRef, where("type", "==", "PROFUNDO"));
            const profundoSnapshot = await getCountFromServer(profundoQuery);

            // 5. Recent Activity & Active Programs
            const recentQuery = query(certificatesRef, orderBy("createdAt", "desc"), limit(50));
            const recentDocs = await getDocs(recentQuery);

            const recentActivity = recentDocs.docs.slice(0, 5).map(doc => {
                const data = doc.data();
                const statusLabel = getCertificateStatusLabel(data.status);
                const blocked = isCertificateBlocked(data.status);
                const activityType: 'error' | 'success' = blocked ? 'error' : 'success';
                return {
                    id: doc.id,
                    type: activityType,
                    title: blocked ? `Certificado ${statusLabel}` : `Certificado ${statusLabel}`,
                    description: `${data.studentName || 'Estudiante'} - ${data.folio || ''}`,
                    time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'Reciente'
                };
            });

            const uniquePrograms = new Set(recentDocs.docs.map(doc => doc.data().academicProgram).filter(Boolean));

            return {
                totalIssued: issuedSnapshot.data().count,
                pendingValidation: pendingSnapshot.data().count,
                activePrograms: uniquePrograms.size,
                blockedCertificates: blockedSnapshot.data().count,
                byType: {
                    CAP: capSnapshot.data().count,
                    PROFUNDO: profundoSnapshot.data().count
                },
                recentActivity: recentActivity,
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
