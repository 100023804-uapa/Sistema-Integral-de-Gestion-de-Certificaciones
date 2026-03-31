/**
 * SCRIPT DE SINCRONIZACIÓN Y REPARACIÓN DE USUARIOS SIGCE
 * 
 * Este script realiza las siguientes acciones:
 * 1. Recorre todos los usuarios en 'internal_users'.
 * 2. Asegura que sus Custom Claims en Firebase Auth coincidan con el 'roleCode' del documento.
 * 3. Asegura que tengan una entrada activa en 'userRoles' vinculada al rol correcto del catálogo.
 * 4. Migra usuarios de la colección legacy 'access_users' a 'internal_users' si no existen.
 * 
 * MODO DE USO:
 * npx tsx scripts/sync-database.ts
 */

import { getAdminApp, getAdminAuth } from '../lib/firebaseAdmin';
import { buildInternalUserClaims } from '../lib/auth/claims';

async function syncDatabase() {
  console.log('🚀 Iniciando sincronización de base de datos...');
  
  const adminApp = getAdminApp();
  const db = adminApp.firestore();
  const auth = getAdminAuth();

  // --- 1. MIGRACIÓN DE LEGACY ACCESS_USERS ---
  console.log('\n--- Fase 1: Migración de Legacy access_users ---');
  const legacySnap = await db.collection('access_users').get();
  console.log(`Encontrados ${legacySnap.size} registros legacy.`);

  for (const doc of legacySnap.docs) {
    const data = doc.data();
    const email = (data.email || doc.id).toLowerCase().trim();
    
    try {
      const authUser = await auth.getUserByEmail(email);
      const internalDoc = await db.collection('internal_users').doc(authUser.uid).get();

      if (!internalDoc.exists) {
        console.log(`[MIGRACIÓN] Creando perfil interno para: ${email}`);
        await db.collection('internal_users').doc(authUser.uid).set({
          email: email,
          displayName: authUser.displayName || email.split('@')[0],
          roleCode: data.role === 'admin' ? 'administrator' : 'coordinator',
          status: data.disabled ? 'disabled' : 'active',
          createdAt: data.createdAt || new Date(),
          updatedAt: new Date(),
          createdBy: 'system-migration',
        });
      }
    } catch (error) {
       console.error(`[MIGRACIÓN ERROR] No se pudo migrar ${email}:`, error instanceof Error ? error.message : error);
    }
  }

  // --- 2. ALINEACIÓN DE USUARIOS INTERNOS ---
  console.log('\n--- Fase 2: Alineación de Usuarios Internos ---');
  const usersSnap = await db.collection('internal_users').get();
  console.log(`Procesando ${usersSnap.size} usuarios internos.`);

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const uid = userDoc.id;
    const roleCode = userData.roleCode || 'coordinator';

    console.log(`[SYNC] Procesando: ${userData.email} (Rol: ${roleCode})`);

    try {
      // A. Actualizar Custom Claims
      await auth.setCustomUserClaims(uid, buildInternalUserClaims(roleCode));
      await auth.revokeRefreshTokens(uid);
      console.log(`   ✅ Claims actualizados.`);

      // B. Sincronizar userRoles Collection
      const rolesCatalogSnap = await db.collection('roles')
        .where('code', '==', roleCode)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (rolesCatalogSnap.empty) {
        console.warn(`   ⚠️ Rol "${roleCode}" no encontrado en el catálogo. Saltando userRoles.`);
        continue;
      }

      const roleId = rolesCatalogSnap.docs[0].id;

      // Desactivar previos
      const prevRolesSnap = await db.collection('userRoles')
        .where('userId', '==', uid)
        .where('isActive', '==', true)
        .get();

      // Solo si no tiene ya el rol correcto activo
      const hasCorrectRole = prevRolesSnap.docs.some(d => d.data().roleId === roleId);

      if (!hasCorrectRole || prevRolesSnap.size > 1) {
        const batch = db.batch();
        prevRolesSnap.forEach(d => batch.update(d.ref, { isActive: false, deactivatedAt: new Date() }));
        
        const newRef = db.collection('userRoles').doc();
        batch.set(newRef, {
          userId: uid,
          roleId: roleId,
          campusId: null,
          academicAreaId: null,
          assignedAt: new Date(),
          isActive: true,
          assignedBy: 'system-repair'
        });
        
        await batch.commit();
        console.log(`   ✅ userRoles sincronizado.`);
      } else {
        console.log(`   ℹ️ userRoles ya estaba al día.`);
      }

    } catch (error) {
      console.error(`   ❌ Error procesando ${userData.email}:`, error);
    }
  }

  console.log('\n✨ Sincronización finalizada correctamente.');
}

syncDatabase()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
