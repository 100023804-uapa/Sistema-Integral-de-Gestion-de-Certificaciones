import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
        }

        const adminAuth = getAdminAuth();

        // Verificar el idToken y crear session cookie
        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
        });

        const response = NextResponse.json({ success: true });

        // Setear cookie httpOnly
        response.cookies.set(SESSION_COOKIE, sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_MAX_AGE_SECONDS,
        });

        return response;
    } catch (error) {
        console.error('Login session error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
