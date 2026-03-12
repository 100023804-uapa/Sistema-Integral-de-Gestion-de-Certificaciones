require("dotenv").config({ path: ".env.local" });

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

function loadServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (b64) {
    return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  }

  if (raw) {
    return JSON.parse(raw);
  }

  throw new Error(
    "Falta FIREBASE_SERVICE_ACCOUNT_KEY o FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 en .env.local"
  );
}

const serviceAccount = loadServiceAccount();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

function normalizeDocId(item, idField = "id") {
  if (item[idField]) return String(item[idField]);
  if (item.email) return String(item.email).toLowerCase();
  if (item.folio) return String(item.folio);
  return null;
}

async function importCollection(collectionName, items, idField = "id") {
  if (!Array.isArray(items) || items.length === 0) {
    console.log(`Sin datos para importar en ${collectionName}`);
    return;
  }

  for (const item of items) {
    const docId = normalizeDocId(item, idField);

    if (!docId) {
      console.warn(`Documento omitido en ${collectionName}: falta id`);
      continue;
    }

    await db.collection(collectionName).doc(docId).set(item, { merge: true });
    console.log(`Importado ${collectionName}/${docId}`);
  }
}

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    throw new Error("Uso: node scripts/import-data.js ./migration-data.json");
  }

  const fullPath = path.resolve(inputPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`No existe el archivo: ${fullPath}`);
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const data = JSON.parse(raw);

  if (Array.isArray(data.roles)) {
    await importCollection("roles", data.roles, "id");
  }

  if (Array.isArray(data.campuses)) {
    await importCollection("campuses", data.campuses, "id");
  }

  if (Array.isArray(data.academicAreas)) {
    await importCollection("academicAreas", data.academicAreas, "id");
  }

  if (Array.isArray(data.programs)) {
    await importCollection("programs", data.programs, "id");
  }

  if (Array.isArray(data.certificateTypes)) {
    await importCollection("certificateTypes", data.certificateTypes, "id");
  }

  if (Array.isArray(data.students)) {
    await importCollection("students", data.students, "id");
  }

  if (Array.isArray(data.certificates)) {
    await importCollection("certificates", data.certificates, "id");
  }

  if (Array.isArray(data.templates)) {
    await importCollection("templates", data.templates, "id");
  }

  if (Array.isArray(data.access_users)) {
    const normalizedUsers = data.access_users.map((u) => ({
      ...u,
      email: u.email ? String(u.email).toLowerCase() : u.email,
      id: u.email ? String(u.email).toLowerCase() : u.id,
    }));

    await importCollection("access_users", normalizedUsers, "id");
  }

  if (Array.isArray(data.access_requests)) {
    const normalizedRequests = data.access_requests.map((r) => ({
      ...r,
      email: r.email ? String(r.email).toLowerCase() : r.email,
      id: r.email ? String(r.email).toLowerCase() : r.id,
    }));

    await importCollection("access_requests", normalizedRequests, "id");
  }

  console.log("Importación completada.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error importando datos:", error);
    process.exit(1);
  });