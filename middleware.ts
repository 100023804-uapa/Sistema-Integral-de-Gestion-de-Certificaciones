import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { SESSION_COOKIE } from '@/lib/auth/constants';

type SessionState = {
  valid: boolean;
  internalAccess: boolean;
  studentAccess: boolean;
  mustChangePassword: boolean;
};

async function getSessionState(request: NextRequest): Promise<SessionState> {
  const cookieValue = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookieValue) {
    return { valid: false, internalAccess: false, studentAccess: false, mustChangePassword: false };
  }

  try {
    const verifyUrl = new URL('/api/auth/session/verify', request.url);
    const response = await fetch(verifyUrl, {
      headers: {
        cookie: `${SESSION_COOKIE}=${cookieValue}`,
      },
    });

    if (!response.ok) {
      return { valid: false, internalAccess: false, studentAccess: false, mustChangePassword: false };
    }

    const payload = await response.json();

    return {
      valid: true,
      internalAccess: payload.internalAccess === true,
      studentAccess: payload.studentAccess === true,
      mustChangePassword: payload.mustChangePassword === true,
    };
  } catch {
    return { valid: false, internalAccess: false, studentAccess: false, mustChangePassword: false };
  }
}

function isProtectedInternalRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
}

function isProtectedAdminApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/admin');
}

function isProtectedStudentRoute(pathname: string): boolean {
  return pathname.startsWith('/student');
}

function isProtectedStudentApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api/student');
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionState = await getSessionState(request);
  const isStudentChangePasswordRoute = pathname === '/student/change-password';

  if (isProtectedAdminApiRoute(pathname) && !sessionState.valid) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  if (isProtectedAdminApiRoute(pathname) && !sessionState.internalAccess) {
    return NextResponse.json({ success: false, error: 'Permiso denegado' }, { status: 403 });
  }

  if (isProtectedInternalRoute(pathname) && !sessionState.valid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search || ''}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtectedInternalRoute(pathname) && !sessionState.internalAccess) {
    return NextResponse.redirect(new URL('/student', request.url));
  }

  if (isProtectedStudentApiRoute(pathname) && !sessionState.valid) {
    return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  }

  if (isProtectedStudentApiRoute(pathname) && sessionState.internalAccess) {
    return NextResponse.json(
      { success: false, error: 'Este acceso es solo para participantes' },
      { status: 403 }
    );
  }

  if (isProtectedStudentRoute(pathname) && !sessionState.valid) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search || ''}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith('/student') && sessionState.internalAccess) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (
    sessionState.valid &&
    sessionState.studentAccess &&
    sessionState.mustChangePassword &&
    isProtectedStudentRoute(pathname) &&
    !isStudentChangePasswordRoute
  ) {
    return NextResponse.redirect(new URL('/student/change-password', request.url));
  }

  if (
    isStudentChangePasswordRoute &&
    sessionState.valid &&
    sessionState.studentAccess &&
    !sessionState.mustChangePassword
  ) {
    return NextResponse.redirect(new URL('/student', request.url));
  }

  if (pathname === '/login' && sessionState.valid) {
    return NextResponse.redirect(
      new URL(
        sessionState.internalAccess
          ? '/dashboard'
          : sessionState.mustChangePassword
            ? '/student/change-password'
            : '/student',
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/student/:path*',
    '/api/admin/:path*',
    '/api/student/:path*',
    '/login',
  ],
};
