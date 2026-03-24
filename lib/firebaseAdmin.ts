import admin from 'firebase-admin';

export class FirebaseAdminConfigurationError extends Error {
  constructor(
    public readonly code:
      | 'firebase-admin-missing-credentials'
      | 'firebase-admin-invalid-credentials'
      | 'firebase-admin-project-mismatch',
    message: string
  ) {
    super(message);
    this.name = 'FirebaseAdminConfigurationError';
  }
}

type CredentialLoadResult =
  | {
      source: string;
      serviceAccount: admin.ServiceAccount;
    }
  | {
      source: string;
      error: string;
    };

function normalizeEnvString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  let normalized = value.trim();
  if (normalized.length === 0) {
    return null;
  }

  const hasDoubleQuotes =
    normalized.startsWith('"') && normalized.endsWith('"');
  const hasSingleQuotes =
    normalized.startsWith("'") && normalized.endsWith("'");

  if ((hasDoubleQuotes || hasSingleQuotes) && normalized.length >= 2) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized.length > 0 ? normalized : null;
}

function normalizePrivateKey(value: unknown): string | null {
  const normalized = normalizeEnvString(value);
  if (!normalized) {
    return null;
  }

  return normalized.replace(/\\n/g, '\n');
}

function buildServiceAccount(
  raw: Record<string, unknown>,
  source: string
): CredentialLoadResult {
  const projectId =
    typeof raw.project_id === 'string'
      ? normalizeEnvString(raw.project_id)
      : typeof raw.projectId === 'string'
        ? normalizeEnvString(raw.projectId)
        : null;
  const clientEmail =
    typeof raw.client_email === 'string'
      ? normalizeEnvString(raw.client_email)
      : typeof raw.clientEmail === 'string'
        ? normalizeEnvString(raw.clientEmail)
        : null;
  const privateKey = normalizePrivateKey(
    typeof raw.private_key === 'string'
      ? raw.private_key
      : typeof raw.privateKey === 'string'
        ? raw.privateKey
        : null
  );

  if (!projectId || !clientEmail || !privateKey) {
    return {
      source,
      error: 'missing project_id, client_email, or private_key',
    };
  }

  return {
    source,
    serviceAccount: {
      projectId,
      clientEmail,
      privateKey,
    },
  };
}

function loadFromSplitEnv(): CredentialLoadResult | null {
  const projectId = normalizeEnvString(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = normalizeEnvString(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (!projectId && !clientEmail && !privateKey) {
    return null;
  }

  if (!projectId || !clientEmail || !privateKey) {
    return {
      source: 'split-env',
      error: 'FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY must all be set together',
    };
  }

  return {
    source: 'split-env',
    serviceAccount: {
      projectId,
      clientEmail,
      privateKey,
    },
  };
}

function parseServiceAccountJson(
  serviceAccountJson: string,
  source: string
): CredentialLoadResult {
  try {
    const parsed = JSON.parse(normalizeEnvString(serviceAccountJson) ?? '') as Record<string, unknown>;
    return buildServiceAccount(parsed, source);
  } catch (error) {
    return {
      source,
      error: error instanceof Error ? error.message : 'invalid JSON',
    };
  }
}

function loadFromBase64Env(): CredentialLoadResult | null {
  const base64Value = normalizeEnvString(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64);

  if (!base64Value) {
    return null;
  }

  try {
    const decoded = Buffer.from(base64Value, 'base64').toString('utf8');
    return parseServiceAccountJson(decoded, 'base64-env');
  } catch (error) {
    return {
      source: 'base64-env',
      error: error instanceof Error ? error.message : 'invalid base64 value',
    };
  }
}

function loadFromJsonEnv(): CredentialLoadResult | null {
  const jsonValue = normalizeEnvString(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  if (!jsonValue) {
    return null;
  }

  return parseServiceAccountJson(jsonValue, 'json-env');
}

function resolveFirebaseAdminCredential(): {
  source: string;
  serviceAccount: admin.ServiceAccount;
} {
  const attempts = [loadFromSplitEnv(), loadFromBase64Env(), loadFromJsonEnv()].filter(
    (attempt): attempt is CredentialLoadResult => attempt !== null
  );

  for (const attempt of attempts) {
    if ('serviceAccount' in attempt) {
      const publicProjectId = normalizeEnvString(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
      if (
        publicProjectId &&
        attempt.serviceAccount.projectId &&
        attempt.serviceAccount.projectId !== publicProjectId
      ) {
        throw new FirebaseAdminConfigurationError(
          'firebase-admin-project-mismatch',
          `Firebase Admin usa ${attempt.serviceAccount.projectId}, pero NEXT_PUBLIC_FIREBASE_PROJECT_ID usa ${publicProjectId}.`
        );
      }

      return attempt;
    }
  }

  if (attempts.length === 0) {
    throw new FirebaseAdminConfigurationError(
      'firebase-admin-missing-credentials',
      'Missing Firebase Admin credentials. Configure split vars, FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, or FIREBASE_SERVICE_ACCOUNT_KEY.'
    );
  }

  const reasons = attempts
    .filter((attempt): attempt is Extract<CredentialLoadResult, { error: string }> => 'error' in attempt)
    .map((attempt) => `${attempt.source}: ${attempt.error}`)
    .join(' | ');

  throw new FirebaseAdminConfigurationError(
    'firebase-admin-invalid-credentials',
    `Invalid Firebase Admin credentials. ${reasons}`
  );
}

function initAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const { source, serviceAccount } = resolveFirebaseAdminCredential();

  if (process.env.NODE_ENV !== 'production') {
    console.info(`Firebase Admin initialized using ${source}.`);
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export function getAdminApp() {
  return initAdmin();
}

export function getAdminAuth() {
  return getAdminApp().auth();
}

export function getAdminDb() {
  return getAdminApp().firestore();
}
