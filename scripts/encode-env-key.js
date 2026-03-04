// Leer desde .env.local y codificar en Base64
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Extraer FIREBASE_SERVICE_ACCOUNT_KEY
const match = envContent.match(/FIREBASE_SERVICE_ACCOUNT_KEY=([^\\s\\n]+)/);
if (!match) {
    console.error('❌ No se encontró FIREBASE_SERVICE_ACCOUNT_KEY en .env.local');
    process.exit(1);
}

const serviceAccountJson = match[1];

// Convertir a Base64
const base64 = Buffer.from(serviceAccountJson).toString('base64');

console.log('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=');
console.log(base64);
console.log('');
console.log('✅ Copia este valor y pégalo en Vercel como FIREBASE_SERVICE_ACCOUNT_KEY_BASE64');
