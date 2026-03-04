import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebaseAdmin';

const SESSION_COOKIE = 'session';

export async function GET() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionCookie) {
        return NextResponse.json({ valid: false }, { status: 401 });
    }

    try {
        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        return NextResponse.json({ valid: true, uid: decoded.uid, email: decoded.email ?? null });
    } catch {
        return NextResponse.json({ valid: false }, { status: 401 });
    }
}
