import { NextRequest, NextResponse } from 'next/server';
import {
    SESSION_COOKIE,
    createSessionCookie,
    getSessionCookieOptions,
    verifyIdToken,
} from '@/lib/auth/session';
import { hasInternalAccessClaim } from '@/lib/auth/claims';
import { markInternalUserLogin } from '@/lib/server/internalUsers';
import { resolveSessionAccessFromDecodedToken } from '@/lib/server/studentPortal';
import { markStudentPortalLogin } from '@/lib/server/studentAccounts';

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
        }

        const decodedToken = await verifyIdToken(idToken);
        const access = await resolveSessionAccessFromDecodedToken(decodedToken);
        if (hasInternalAccessClaim(decodedToken as unknown as Record<string, unknown>)) {
            await markInternalUserLogin(decodedToken.uid);
        }
        if (access.studentAccess && access.student) {
            await markStudentPortalLogin(access.student.studentId);
        }
        const sessionCookie = await createSessionCookie(idToken);

        const response = NextResponse.json({
            success: true,
            uid: decodedToken.uid,
            email: decodedToken.email ?? null,
            internalAccess: access.internalAccess,
            internalRole: access.internalRole,
            studentAccess: access.studentAccess,
            studentId: access.student?.studentId ?? null,
            studentStatus: access.student?.portalAccessStatus ?? null,
            mustChangePassword: access.student?.mustChangePassword === true,
        });

        response.cookies.set(SESSION_COOKIE, sessionCookie, getSessionCookieOptions());

        return response;

    } catch (error) {
        console.error('Login session error:', error);
        return NextResponse.json(
            { error: 'No fue posible crear la sesión. Inténtelo de nuevo.' },
            { status: 500 }
        );
    }
}
