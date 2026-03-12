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

const auth = admin.auth();
const db = admin.firestore();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const displayName = process.argv[4] || "Administrador SIGCE";

  if (!email || !password) {
    throw new Error(
      "Uso: node scripts/create-admin.js correo@dominio.com Password123 \"Nombre Admin\""
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  let userRecord;

  try {
    userRecord = await auth.getUserByEmail(normalizedEmail);
    console.log(`Usuario ya existe en Auth: ${userRecord.uid}`);
  } catch (error) {
    userRecord = await auth.createUser({
      email: normalizedEmail,
      password,
      displayName,
      emailVerified: true,
      disabled: false,
    });
    console.log(`Usuario creado en Auth: ${userRecord.uid}`);
  }

  await db.collection("access_users").doc(normalizedEmail).set(
    {
      email: normalizedEmail,
      name: displayName,
      role: "admin",
      disabled: false,
      uid: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: "create-admin-script",
    },
    { merge: true }
  );

  console.log(`Admin creado/actualizado en access_users: ${normalizedEmail}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error creando admin:", error);
    process.exit(1);
  });