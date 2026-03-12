require("dotenv").config({ path: ".env.local" });

const admin = require("firebase-admin");

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

async function upsertDoc(collectionName, docId, data) {
  await db.collection(collectionName).doc(docId).set(data, { merge: true });
  console.log(`OK ${collectionName}/${docId}`);
}

async function seed() {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const currentYear = new Date().getFullYear();

  // Roles
  await upsertDoc("roles", "administrator", {
    name: "Administrador",
    code: "administrator",
    description: "Acceso total al sistema",
    permissions: [
      {
        resource: "certificates",
        actions: ["create", "read", "update", "delete"],
      },
      { resource: "students", actions: ["create", "read", "update", "delete"] },
      {
        resource: "templates",
        actions: ["create", "read", "update", "delete"],
      },
      { resource: "programs", actions: ["create", "read", "update", "delete"] },
      { resource: "users", actions: ["create", "read", "update", "delete"] },
    ],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await upsertDoc("roles", "coordinator", {
    name: "Coordinador",
    code: "coordinator",
    description: "Gestiona estudiantes y certificados",
    permissions: [
      { resource: "certificates", actions: ["create", "read", "update"] },
      { resource: "students", actions: ["create", "read", "update"] },
    ],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await upsertDoc("roles", "verifier", {
    name: "Verificador",
    code: "verifier",
    description: "Verifica solicitudes y certificados",
    permissions: [{ resource: "certificates", actions: ["read", "update"] }],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await upsertDoc("roles", "signer", {
    name: "Firmante",
    code: "signer",
    description: "Firma certificados",
    permissions: [{ resource: "certificates", actions: ["read", "update"] }],
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  // Tipos de certificado
  await upsertDoc("certificateTypes", "horizontal", {
    name: "Horizontal",
    code: "horizontal",
    description: "Certificado horizontal",
    requiresSignature: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await upsertDoc("certificateTypes", "vertical", {
    name: "Vertical",
    code: "vertical",
    description: "Certificado vertical",
    requiresSignature: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await upsertDoc("certificateTypes", "institutional_macro", {
    name: "Macro Institucional",
    code: "institutional_macro",
    description: "Plantilla institucional",
    requiresSignature: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  // Programas
  await upsertDoc("programs", "ingenieria-software", {
    name: "Ingeniería de Software",
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  await upsertDoc("programs", "derecho", {
    name: "Derecho",
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  // Configuración global
  await upsertDoc("system_config", "global_settings", {
    emailConfig: {
      provider: "resend",
      user: "",
      password: "",
      fromName: "SIGCE",
    },
    updatedAt: now,
    updatedBy: "seed-script",
  });

  // Contador de folios
  await upsertDoc("folio_counters", String(currentYear), {
    year: currentYear,
    lastNumber: 0,
    updatedAt: now,
  });

  console.log("Seed completado correctamente.");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error ejecutando seed:", error);
    process.exit(1);
  });
