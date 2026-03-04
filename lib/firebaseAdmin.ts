import admin from 'firebase-admin';

function initAdmin() {
    if (admin.apps.length > 0) return admin.app();

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountJson) {
        throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY env var');
    }

    console.log('🔍 FIREBASE_SERVICE_ACCOUNT_KEY length:', serviceAccountJson.length);
    console.log('🔍 FIREBASE_SERVICE_ACCOUNT_KEY preview:', serviceAccountJson.substring(0, 100) + '...');

    let parsed;
    try {
        parsed = JSON.parse(serviceAccountJson);
    } catch (error) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', error);
        console.error('❌ Raw value preview:', serviceAccountJson.substring(0, 500));
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON');
    }

    // Validar que tenga los campos requeridos
    if (!parsed.private_key || !parsed.client_email) {
        console.error('❌ Missing required fields in service account');
        console.error('❌ Fields present:', Object.keys(parsed));
        throw new Error('Invalid service account: missing private_key or client_email');
    }

    console.log('✅ Service account parsed successfully');

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
