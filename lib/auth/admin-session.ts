import { NextRequest, NextResponse } from 'next/server';

import { getAccessRepository } from '@/lib/container';
import { SESSION_COOKIE_NAME, type AppSessionPayload, verifyAppSessionToken } from '@/lib/auth/app-session';

export interface SessionGuardSuccess {
  ok: true;
  session: AppSessionPayload;
}

export interface SessionGuardFailure {
  ok: false;
  response: NextResponse;
}

export type SessionGuardResult = SessionGuardSuccess | SessionGuardFailure;

function unauthorizedResponse(message = 'No autorizado', status = 401) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function requireAppSession(request: NextRequest): Promise<SessionGuardResult> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return { ok: false, response: unauthorizedResponse() };
  }

  const session = await verifyAppSessionToken(token);
  if (!session) {
    return {
      ok: false,
      response: unauthorizedResponse('Sesion invalida o expirada', 401),
    };
  }

  return {
    ok: true,
    session,
  };
}

export async function requireAdminSession(request: NextRequest): Promise<SessionGuardResult> {
  const sessionResult = await requireAppSession(request);
  if (!sessionResult.ok) {
    return sessionResult;
  }

  const accessRepository = getAccessRepository();
  const hasAdminAccess = await accessRepository.hasAdminAccess(sessionResult.session.email);

  if (!hasAdminAccess) {
    return {
      ok: false,
      response: unauthorizedResponse('No autorizado', 403),
    };
  }

  return sessionResult;
}
