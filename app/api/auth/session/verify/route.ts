import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieValue, verifySessionCookie } from '@/lib/auth/session';
import { resolveSessionAccessFromDecodedToken } from '@/lib/server/studentPortal';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = getSessionCookieValue(request);

        if (!sessionCookie) {
            return NextResponse.json(
                { valid: false, message: 'Sesión inválida' },
                { status: 401 }
            );
        }

        const decoded = await verifySessionCookie(sessionCookie, true);
        const access = await resolveSessionAccessFromDecodedToken(decoded);

        return NextResponse.json({
            valid: true,
            uid: decoded.uid,
            email: decoded.email ?? null,
            internalAccess: access.internalAccess,
            internalRole: access.internalRole,
            studentAccess: access.studentAccess,
            studentId: access.student?.studentId ?? null,
            studentStatus: access.student?.portalAccessStatus ?? null,
            mustChangePassword: access.student?.mustChangePassword === true,
        });

    } catch (error) {
        console.error('Verify session error:', error);
        return NextResponse.json(
            { valid: false, message: 'Error verificando sesión' },
            { status: 401 }
        );
    }
}
