import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

const SESSION_COOKIE = 'session';

export async function GET(request: NextRequest) {
    try {
        const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'No session cookie' }, { status: 401 });
        }

        const adminAuth = getAdminAuth();
        const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

        return NextResponse.json({ valid: true, uid: decodedClaims.uid });
    } catch (error) {
        console.error('Session verification error:', error);
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
}
