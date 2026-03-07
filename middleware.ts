import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_COOKIE_NAME, verifyAppSessionToken } from '@/lib/auth/app-session';

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!cookieValue) {
    return false;
  }

  const session = await verifyAppSessionToken(cookieValue);
  return Boolean(session);
}

function isProtectedPageRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
}

function isProtectedApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/admin');
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = await hasValidSession(request);

  if (isProtectedApiRoute(pathname) && !hasSession) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
  }

  if (isProtectedPageRoute(pathname) && !hasSession) {
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
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/api/admin/:path*'],
};
