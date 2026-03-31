'use server';

import { getServerAccessRepository } from '@/lib/server-container';

export async function getMasterAdmins() {
  try {
    const repo = getServerAccessRepository();
    const admins = await repo.listAdmins();
    return { success: true, data: admins };
  } catch (error) {
    console.error('Error fetching master admins:', error);
    return { success: false, error: 'Failed to fetch master admins' };
  }
}

export async function addMasterAdmin(email: string, actorId: string = 'system') {
  try {
    const repo = getServerAccessRepository();
    await repo.upsertAdmin(email.trim().toLowerCase(), actorId);
    return { success: true };
  } catch (error) {
    console.error('Error adding master admin:', error);
    return { success: false, error: 'Failed to add master admin' };
  }
}

export async function toggleMasterAdminStatus(email: string, enabled: boolean) {
  try {
    const repo = getServerAccessRepository();
    if (enabled) {
      await repo.enableAdmin(email);
    } else {
      await repo.removeAdmin(email);
    }
    return { success: true };
  } catch (error) {
    console.error('Error toggling master admin status:', error);
    return { success: false, error: 'Failed to toggle master admin status' };
  }
}
