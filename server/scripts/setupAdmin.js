// One-time script: makes an existing Firebase user an administrator.
// Run from the /server folder:   npm run setup-admin -- you@example.com
import readline from 'readline';
import { auth, db, Timestamp } from '../src/firebase.js';

async function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a.trim()); }));
}

const email = (process.argv[2] || (await ask('Administrator email: '))).toLowerCase();
if (!email) { console.error('No email given.'); process.exit(1); }

try {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { ...(user.customClaims || {}), admin: true });
  const now = Timestamp.now();
  await db.collection('users').doc(user.uid).set({
    email, displayName: user.displayName || email.split('@')[0], role: 'admin', updatedAt: now, createdAt: now,
  }, { merge: true });
  console.log(`\nSuccess: ${email} (uid ${user.uid}) is now an administrator.`);
  console.log('Sign out and sign back in on the website so the new permission is picked up.\n');
  process.exit(0);
} catch (err) {
  if (err.code === 'auth/user-not-found') {
    console.error(`\nNo Firebase user found for ${email}. Register that account on the website first (Create account), then run this again.\n`);
  } else {
    console.error('\nSetup failed:', err.message, '\n');
  }
  process.exit(1);
}
