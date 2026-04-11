'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { SESSION_COOKIE } from '@/lib/auth/constants';
import { resolveSessionAccessFromSessionCookie } from '@/lib/server/studentPortal';
import { getAdminDb } from '@/lib/firebaseAdmin';

export async function updateStudentProfilePicture(url: string) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;
    
    if (!sessionCookie) {
      throw new Error('Unauthorized - No session cookie');
    }

    const access = await resolveSessionAccessFromSessionCookie(sessionCookie);

    if (!access.studentAccess || !access.student) {
      throw new Error('Unauthorized - Not a student account');
    }

    const db = getAdminDb();
    const studentRef = db.collection('students').doc(access.student.studentId);
    
    const doc = await studentRef.get();
    if (!doc.exists) {
      throw new Error('Student not found');
    }

    await studentRef.update({
      profilePictureUrl: url,
      updatedAt: new Date(),
    });

    revalidatePath('/student');

    return { success: true };
  } catch (error) {
    console.error('Error updating student profile picture:', error);
    return { success: false, error: 'Ocurrió un error al actualizar la foto de perfil.' };
  }
}
