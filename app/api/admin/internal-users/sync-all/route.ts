import { NextRequest, NextResponse } from 'next/server';
import { requireInternalUserRole } from '@/lib/auth/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebaseAdmin';
import { buildInternalUserClaims } from '@/lib/auth/claims';

export async function POST(request: NextRequest) {
  const auth = await requireInternalUserRole(request, ['administrator']);
  if (auth.response) {
    return auth.response;
  }

  const db = getAdminDb();
  const firebaseAuth = getAdminAuth();
  const actorId = auth.user!.uid;

  try {
    const results = {
      total: 0,
      success: 0,
      errors: [] as string[],
    };

    // 1. Obtener todos los usuarios internos
    const usersSnap = await db.collection('internal_users').get();
    results.total = usersSnap.size;

    for (const doc of usersSnap.docs) {
      const userData = doc.data();
      const uid = doc.id;
      const roleCode =
        typeof userData.roleCode === 'string' ? userData.roleCode.trim() : '';

      try {
        if (!roleCode) {
          throw new Error('Usuario sin roleCode asignado en internal_users');
        }

        // A. Sincronizar Claims
        await firebaseAuth.setCustomUserClaims(uid, buildInternalUserClaims(roleCode));
        
        // B. Sincronizar userRoles
        const rolesCatalogSnap = await db.collection('roles')
          .where('code', '==', roleCode)
          .where('isActive', '==', true)
          .limit(1)
          .get();

        if (!rolesCatalogSnap.empty) {
          const roleId = rolesCatalogSnap.docs[0].id;
          
          // Desactivar previos
          const prevRolesSnap = await db.collection('userRoles')
            .where('userId', '==', uid)
            .where('isActive', '==', true)
            .get();

          const batch = db.batch();
          prevRolesSnap.forEach(d => {
            if (d.data().roleId !== roleId) {
              batch.update(d.ref, { isActive: false, deactivatedAt: new Date(), deactivatedBy: actorId });
            }
          });

          // Si no tiene el rol correcto, crearlo
          const hasCorrect = prevRolesSnap.docs.some(d => d.data().roleId === roleId);
          if (!hasCorrect) {
            const newRef = db.collection('userRoles').doc();
            batch.set(newRef, {
              userId: uid,
              roleId: roleId,
              campusId: null,
              academicAreaId: null,
              assignedAt: new Date(),
              isActive: true,
              assignedBy: actorId
            });
          }
          
          await batch.commit();
        }

        results.success++;
      } catch (e) {
        results.errors.push(`Error en ${userData.email}: ${e instanceof Error ? e.message : 'Unknown'}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        message: `Sincronización masiva completada. ${results.success}/${results.total} exitosos.`,
        details: results
      }
    });
  } catch (error) {
    console.error('Error in sync-all:', error);
    return NextResponse.json(
      { success: false, error: 'Fallo la sincronización masiva' },
      { status: 500 }
    );
  }
}
