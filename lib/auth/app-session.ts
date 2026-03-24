const encoder = new TextEncoder();
const decoder = new TextDecoder();

export const SESSION_COOKIE_NAME = 'sigce_session';
export const LEGACY_SESSION_COOKIE_NAME = 'session';
export const APP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;
export const APP_SESSION_VERSION = 1;

export interface AppSessionPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  sessionVersion: number;
}

export class AppSessionConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppSessionConfigurationError';
  }
}

let cachedSigningKey: { secret: string; key: CryptoKey } | null = null;

function getSessionSecret(): string {
  const secret = process.env.APP_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new AppSessionConfigurationError(
      'APP_SESSION_SECRET is required and must be at least 32 characters long.'
    );
  }

  return secret;
}

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(base64Url: string): Uint8Array {
  const normalized = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (normalized.length % 4)) % 4;
  return fromBase64(`${normalized}${'='.repeat(padding)}`);
}

function encodeSegment(value: unknown): string {
  return toBase64Url(encoder.encode(JSON.stringify(value)));
}

function decodeSegment<T>(value: string): T {
  return JSON.parse(decoder.decode(fromBase64Url(value))) as T;
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = getSessionSecret();

  if (cachedSigningKey && cachedSigningKey.secret === secret) {
    return cachedSigningKey.key;
  }

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );

  cachedSigningKey = { secret, key };
  return key;
}

function isValidPayload(payload: unknown): payload is AppSessionPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<AppSessionPayload>;
  return (
    typeof candidate.sub === 'string' &&
    candidate.sub.length > 0 &&
    typeof candidate.email === 'string' &&
    candidate.email.length > 0 &&
    typeof candidate.iat === 'number' &&
    typeof candidate.exp === 'number' &&
    typeof candidate.sessionVersion === 'number'
  );
}

export async function createAppSessionToken(input: {
  uid: string;
  email: string;
}): Promise<{ token: string; payload: AppSessionPayload }> {
  const now = Math.floor(Date.now() / 1000);
  const payload: AppSessionPayload = {
    sub: input.uid,
    email: input.email.trim().toLowerCase(),
    iat: now,
    exp: now + APP_SESSION_MAX_AGE_SECONDS,
    sessionVersion: APP_SESSION_VERSION,
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = encodeSegment(header);
  const encodedPayload = encodeSegment(payload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));

  return {
    token: `${signingInput}.${toBase64Url(new Uint8Array(signature))}`,
    payload,
  };
}

export async function verifyAppSessionToken(token: string): Promise<AppSessionPayload | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null;
    }

    const header = decodeSegment<{ alg?: string; typ?: string }>(encodedHeader);
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      return null;
    }

    const payload = decodeSegment<unknown>(encodedPayload);
    if (!isValidPayload(payload)) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now || payload.iat > now + 60) {
      return null;
    }

    const key = await getSigningKey();
    const verified = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(encodedSignature) as any,
      encoder.encode(`${encodedHeader}.${encodedPayload}`) as any
    );

    if (!verified) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions(maxAge = APP_SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
