const fs = require('fs');

// Leer el archivo JSON del service account
const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
    console.error('Uso: node encode-firebase-key.js <ruta-al-archivo.json>');
    process.exit(1);
}

const serviceAccountJson = fs.readFileSync(serviceAccountPath, 'utf8');

// Convertir a Base64
const base64 = Buffer.from(serviceAccountJson).toString('base64');

console.log('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64=');
console.log(base64);
console.log('');
console.log('Para usar en Vercel, pega este valor en Environment Variables como FIREBASE_SERVICE_ACCOUNT_KEY_BASE64');
