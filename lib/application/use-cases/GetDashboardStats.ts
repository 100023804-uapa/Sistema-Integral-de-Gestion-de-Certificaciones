import { db } from "@/lib/firebase";
import { collection, getCountFromServer, query, where, getDocs, orderBy, limit } from "firebase/firestore";

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
            const statesRef = collection(db, "certificateStates");

            // Función auxiliar para aplicar filtros de alcance
            const applyScopeFilters = (baseQuery: any, isCertificate: boolean = true) => {
                if (!scope || scope.type === 'global') return baseQuery;

                let q = baseQuery;
                if (scope.type === 'campus' && scope.campusIds?.length) {
                    q = query(q, where("campusId", "in", scope.campusIds));
                } else if (scope.type === 'area' && scope.academicAreaIds?.length) {
                    q = query(q, where("academicAreaId", "in", scope.academicAreaIds));
                } else if (scope.type === 'personal') {
                    if (isCertificate) {
                        // Para certificados, el alcance personal incluye los creados por el usuario
                        q = query(q, where("createdBy", "==", scope.userId));
                    } else {
                        // Para estados (firmas), el alcance personal incluye los asignados al firmante
                        if (scope.signerIds?.length) {
                            q = query(q, where("signerId", "in", scope.signerIds));
                        }
                    }
                }
                return q;
            };

            // 1. Total Issued (Status: active)
            const issuedQuery = applyScopeFilters(query(certificatesRef, where("status", "==", "active")));
            const issuedSnapshot = await getCountFromServer(issuedQuery);

            // 2. Pending Validation / Signatures (Using States)
            const pendingQuery = applyScopeFilters(query(statesRef, where("currentState", "in", ["pending_review", "pending_signature"])), false);
            const pendingSnapshot = await getCountFromServer(pendingQuery);

            // 3. Blocked or Revoked
            const blockedQuery = applyScopeFilters(query(certificatesRef, where("status", "==", "revoked")));
            const blockedSnapshot = await getCountFromServer(blockedQuery);

            // 4. Breakdown by Type (CAP)
            const capQuery = applyScopeFilters(query(certificatesRef, where("type", "==", "CAP")));
            const capSnapshot = await getCountFromServer(capQuery);

            // Breakdown (PROFUNDO)
            const profundoQuery = applyScopeFilters(query(certificatesRef, where("type", "==", "PROFUNDO")));
            const profundoSnapshot = await getCountFromServer(profundoQuery);

            // 5. Recent Activity & Active Programs
            const recentQuery = applyScopeFilters(query(certificatesRef, orderBy("createdAt", "desc"), limit(50)));
            const recentDocs = await getDocs(recentQuery);

            const recentActivity: DashboardStats['recentActivity'] = recentDocs.docs.slice(0, 5).map(doc => {
                const data = doc.data() as any;
                return {
                    id: doc.id,
                    type: data.status === 'revoked' ? 'error' : 'success',
                    title: data.status === 'revoked' ? 'Certificado Revocado' : 'Nuevo Certificado',
                    description: `Emitido a ${data.studentName || 'Estudiante'} - ${data.folio || ''}`,
                    time: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'Reciente',
                    href: `/dashboard/certificates/${doc.id}`,
                };
            });

            const uniquePrograms = new Set(recentDocs.docs.map(doc => (doc.data() as any).academicProgram).filter(Boolean));

            return {
                totalIssued: Number((issuedSnapshot.data() as any)?.count || 0),
                pendingValidation: Number((pendingSnapshot.data() as any)?.count || 0),
                activePrograms: uniquePrograms.size,
                blockedCertificates: Number((blockedSnapshot.data() as any)?.count || 0),
                byType: {
                    CAP: Number((capSnapshot.data() as any)?.count || 0),
                    PROFUNDO: Number((profundoSnapshot.data() as any)?.count || 0)
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
