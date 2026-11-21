import admin from 'firebase-admin';
import { config } from './config.js';

const { projectId, clientEmail, privateKey } = config.firebase;
if (!projectId || !clientEmail || !privateKey) {
  console.error('\nMissing Firebase Admin credentials. Fill FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in server/.env (see README step 11).\n');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}

export const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
export const auth = admin.auth();
export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;
