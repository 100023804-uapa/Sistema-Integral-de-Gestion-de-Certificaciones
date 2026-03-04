import { NextResponse } from 'next/server';

const SESSION_COOKIE = 'session';

export async function POST() {
    const response = NextResponse.json({ success: true });

    response.cookies.set({
        name: SESSION_COOKIE,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });

    return response;
}
