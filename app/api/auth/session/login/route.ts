import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function POST(request: NextRequest) {
    try {
        const { idToken } = await request.json();

        if (!idToken) {
            return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
        }

        // TEMPORAL: Simular login exitoso sin Firebase Admin
        // TODO: Reimplementar cuando FIREBASE_SERVICE_ACCOUNT_KEY funcione en producción
        console.log('⚠️ Login temporal sin Firebase Admin - idToken recibido');

        const response = NextResponse.json({ success: true });

        // Setear cookie httpOnly simulada
        response.cookies.set(SESSION_COOKIE, 'temp-session', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 días
        });

        return response;

    } catch (error) {
        console.error('Login session error:', error);
        return NextResponse.json(
            { error: 'No fue posible crear la sesión. Inténtelo de nuevo.' },
            { status: 500 }
        );
    }
}
