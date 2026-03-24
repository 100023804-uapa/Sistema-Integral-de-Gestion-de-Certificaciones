import { NextResponse, NextRequest } from 'next/server';
import {
    clearSessionCookie,
    getSessionCookieValue,
    revokeSession,
} from '@/lib/auth/session';

export async function POST(request: NextRequest) {
    try {
        const sessionCookie = getSessionCookieValue(request);
        await revokeSession(sessionCookie);

        const response = NextResponse.json({ success: true });
        return clearSessionCookie(response);

    } catch (error) {
        console.error('Logout session error:', error);
        return NextResponse.json(
            { error: 'No fue posible cerrar la sesión. Inténtelo de nuevo.' },
            { status: 500 }
        );
    }
}
