import admin from 'firebase-admin';

function initAdmin() {
    if (admin.apps.length > 0) return admin.app();

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountJson) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY env var');
    }

    const parsed = JSON.parse(serviceAccountJson);

    return admin.initializeApp({
        credential: admin.credential.cert(parsed),
    });
}

// Lazy initialization: solo se ejecuta en runtime, no en build
export function getAdminApp() {
    return initAdmin();
}

export function getAdminAuth() {
    return getAdminApp().auth();
}
