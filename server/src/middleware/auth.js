import { auth } from '../firebase.js';
import { httpError } from '../util.js';

// Verifies the Firebase ID token sent by the browser and attaches the caller to req.user.
export async function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(httpError(401, 'Please sign in to continue.'));
  try {
    const d = await auth.verifyIdToken(token);
    req.user = {
      uid: d.uid,
      email: (d.email || '').toLowerCase(),
      emailVerified: d.email_verified === true,
      name: d.name || '',
      picture: d.picture || '',
      provider: d.firebase?.sign_in_provider || '',
      admin: d.admin === true, // custom claim, only settable by the server
    };
    next();
  } catch {
    next(httpError(401, 'Your session has expired. Please sign in again.'));
  }
}

// Server-side admin check. Based only on the signed custom claim, never on an email address.
export function requireAdmin(req, _res, next) {
  if (!req.user?.admin) return next(httpError(403, 'Administrator access is required.'));
  next();
}
