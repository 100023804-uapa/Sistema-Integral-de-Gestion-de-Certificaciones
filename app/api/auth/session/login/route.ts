import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';

const SESSION_COOKIE = 'session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json();

        if (!idToken || typeof idToken !== 'string') {
            return NextResponse.json({ success: false, error: 'Missing idToken' }, { status: 400 });
        }

        const decoded = await adminAuth.verifyIdToken(idToken);
        if (!decoded?.uid) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
        }

        const sessionCookie = await adminAuth.createSessionCookie(idToken, {
            expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
        });

        const response = NextResponse.json({ success: true });

        response.cookies.set({
            name: SESSION_COOKIE,
            value: sessionCookie,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: SESSION_MAX_AGE_SECONDS,
        });

        return response;
    } catch (error) {
        console.error('Session login failed:', error);
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
}
