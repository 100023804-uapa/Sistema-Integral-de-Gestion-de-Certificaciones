import { createVerify } from 'node:crypto';

const FIREBASE_PUBLIC_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

interface FirebaseIdTokenHeader {
  alg?: string;
  kid?: string;
  typ?: string;
}

interface FirebaseIdTokenClaims {
  aud?: string;
  iss?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  auth_time?: number;
  email?: string;
  email_verified?: boolean;
}

export interface VerifiedFirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

export class FirebaseTokenVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseTokenVerificationError';
  }
}

let cachedCertificates: {
  expiresAt: number;
  certificates: Record<string, string>;
} | null = null;

function parseJwtSegment<T>(segment: string): T {
  return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T;
}

function getFirebaseProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required to verify Firebase ID tokens.');
  }

  return projectId;
}

function getCacheExpiry(cacheControl: string | null): number {
  const match = cacheControl?.match(/max-age=(\d+)/i);
  const maxAgeSeconds = match ? Number.parseInt(match[1], 10) : 3600;
  return Date.now() + maxAgeSeconds * 1000;
}

async function getFirebaseCertificates(): Promise<Record<string, string>> {
  if (cachedCertificates && cachedCertificates.expiresAt > Date.now()) {
    return cachedCertificates.certificates;
  }

  const response = await fetch(FIREBASE_PUBLIC_CERTS_URL, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Unable to fetch Firebase public certificates.');
  }

  const certificates = (await response.json()) as Record<string, string>;
  cachedCertificates = {
    certificates,
    expiresAt: getCacheExpiry(response.headers.get('cache-control')),
  };

  return certificates;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseUser> {
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new FirebaseTokenVerificationError('Malformed Firebase ID token.');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJwtSegment<FirebaseIdTokenHeader>(encodedHeader);
  const payload = parseJwtSegment<FirebaseIdTokenClaims>(encodedPayload);

  if (header.alg !== 'RS256' || !header.kid) {
    throw new FirebaseTokenVerificationError('Unsupported Firebase ID token header.');
  }

  const projectId = getFirebaseProjectId();
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (payload.aud !== projectId || payload.iss !== expectedIssuer || !payload.sub) {
    throw new FirebaseTokenVerificationError('Firebase ID token was issued for a different project.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now) {
    throw new FirebaseTokenVerificationError('Firebase ID token has expired.');
  }

  if (payload.iat && payload.iat > now + 60) {
    throw new FirebaseTokenVerificationError('Firebase ID token is not yet valid.');
  }

  const certificates = await getFirebaseCertificates();
  const certificate = certificates[header.kid];
  if (!certificate) {
    throw new FirebaseTokenVerificationError('Firebase signing certificate was not found.');
  }

  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${encodedHeader}.${encodedPayload}`);
  verifier.end();

  const isValidSignature = verifier.verify(certificate, Buffer.from(encodedSignature, 'base64url'));
  if (!isValidSignature) {
    throw new FirebaseTokenVerificationError('Invalid Firebase ID token signature.');
  }

  return {
    uid: payload.sub,
    email: payload.email?.trim().toLowerCase() ?? null,
    emailVerified: payload.email_verified === true,
  };
}
