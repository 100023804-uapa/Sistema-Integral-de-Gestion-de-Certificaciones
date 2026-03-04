import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE = 'session';

async function hasValidSession(request: NextRequest): Promise<boolean> {
    const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
    if (!cookieValue) return false;

    try {
        const verifyUrl = new URL('/api/auth/session/verify', request.url);
        const res = await fetch(verifyUrl, {
            headers: {
                cookie: `${SESSION_COOKIE}=${cookieValue}`,
            },
        });

        return res.ok;
    } catch {
        return false;
    }
}

function isProtectedRoute(pathname: string): boolean {
    return pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
}

export async function middleware(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const hasSession = await hasValidSession(request);

    if (isProtectedRoute(pathname) && !hasSession) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('next', `${pathname}${search || ''}`);
        return NextResponse.redirect(loginUrl);
    }

    if (pathname === '/login' && hasSession) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};
