import admin from 'firebase-admin';

function initAdmin() {
    if (admin.apps.length > 0) return admin.app();

    let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    
    if (serviceAccountJson) {
        serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf8');
    } else {
        serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    }

    if (!serviceAccountJson) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY env var');
    }

    let parsed;
    try {
        parsed = JSON.parse(serviceAccountJson);
    } catch (error) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON');
    }

    if (!parsed.private_key || !parsed.client_email) {
        throw new Error('Invalid service account: missing private_key or client_email');
    }

    return admin.initializeApp({
        credential: admin.credential.cert(parsed),
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
