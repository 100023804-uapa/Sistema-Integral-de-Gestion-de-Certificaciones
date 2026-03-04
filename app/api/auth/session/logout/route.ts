import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

const SESSION_COOKIE = 'session';

export async function POST() {
    try {
        const adminAuth = getAdminAuth();
        
        // Opcional: revocar todos los tokens del usuario si se desea
        // await adminAuth.revokeRefreshTokens(uid);

        const response = NextResponse.json({ success: true });

        // Borrar cookie
        response.cookies.set(SESSION_COOKIE, '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });

        return response;
    } catch (error) {
        console.error('Logout session error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
