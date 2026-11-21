import { Router } from 'express';
import { db, Timestamp } from '../firebase.js';
import { auth } from '../firebase.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap, httpError, clean } from '../util.js';
import { effectiveStatus, saveRsvp } from '../services/guests.js';
import { sendRsvpEmail, sendReminders } from '../services/notify.js';
import { config } from '../config.js';

const r = Router();

const publicEvent = (e) => ({
  id: e.id, name: e.name, description: e.description, coverImage: e.coverImage, category: e.category,
  date: e.date, startTime: e.startTime, endTime: e.endTime, venueName: e.venueName, venueAddress: e.venueAddress,
  mapsLink: e.mapsLink, dressCode: e.dressCode, instructions: e.instructions, rsvpDeadline: e.rsvpDeadline,
  capacity: e.capacity, status: e.status, contactName: e.contactName, contactEmail: e.contactEmail, contactPhone: e.contactPhone,
  full: e.capacity > 0 && (e.attendingCount || 0) >= e.capacity,
});
const mask = (email) => { if (!email) return ''; const [u, d] = email.split('@'); return `${u.slice(0, 1)}${'•'.repeat(Math.max(2, u.length - 1))}@${d}`; };

async function findByToken(token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 64) throw httpError(404, 'This invitation link is not valid.');
  const q = await db.collection('invitations').where('token', '==', token).limit(1).get();
  if (q.empty) throw httpError(404, 'This invitation link is not valid.');
  return { ref: q.docs[0].ref, id: q.docs[0].id, ...q.docs[0].data() };
}
async function loadEvent(id) {
  const s = await db.collection('events').doc(id).get();
  return s.exists ? { id: s.id, ...s.data() } : null;
}

/* ---- Public invitation preview (no sign-in needed; reveals no private guest data) ---- */
r.get('/invitations/:token', wrap(async (req, res) => {
  const inv = await findByToken(req.params.token);
  const event = await loadEvent(inv.eventId);
  if (!event || event.status === 'draft') throw httpError(404, 'This event is not available yet.');
  res.json({
    invitation: { status: effectiveStatus(inv), type: inv.type, guestName: inv.type === 'email' ? inv.guestName : '', emailHint: mask(inv.guestEmail), message: inv.message, claimed: Boolean(inv.userId) },
    event: publicEvent(event),
  });
}));

/* ---- Profile: creates/updates users/{uid}. Role comes ONLY from the verified token claim. ---- */
r.post('/auth/profile', requireAuth, wrap(async (req, res) => {
  const ref = db.collection('users').doc(req.user.uid);
  const snap = await ref.get();
  const now = Timestamp.now();
  const displayName = clean(req.body?.name, 100) || snap.data()?.displayName || req.user.name || req.user.email.split('@')[0];
  const data = { email: req.user.email, displayName, photoURL: req.user.picture || '', provider: req.user.provider, role: req.user.admin ? 'admin' : 'guest', updatedAt: now };
  if (snap.exists) await ref.update(data); else await ref.set({ ...data, createdAt: now });
  res.json({ profile: { uid: req.user.uid, ...data, updatedAt: undefined }, isAdmin: req.user.admin });
}));

r.put('/me', requireAuth, wrap(async (req, res) => {
  const displayName = clean(req.body?.displayName, 100);
  if (!displayName) throw httpError(400, 'Please enter your name.');
  await db.collection('users').doc(req.user.uid).set({ displayName, updatedAt: Timestamp.now() }, { merge: true });
  try { await auth.updateUser(req.user.uid, { displayName }); } catch { /* non-fatal */ }
  res.json({ ok: true });
}));

/* ---- Claim an invitation after signing in ---- */
r.post('/invitations/:token/claim', requireAuth, wrap(async (req, res) => {
  const found = await findByToken(req.params.token);
  const { uid, email, emailVerified } = req.user;

  const result = await db.runTransaction(async (tx) => {
    const iSnap = await tx.get(found.ref);
    const inv = iSnap.data();
    const gRef = db.collection('guests').doc(found.id);
    const gSnap = await tx.get(gRef);
    const eventSnap = await tx.get(db.collection('events').doc(inv.eventId));
    if (!eventSnap.exists || eventSnap.data().status === 'draft') throw httpError(404, 'This event is not available yet.');
    const status = effectiveStatus(inv);
    if (status === 'revoked') throw httpError(410, 'This invitation has been withdrawn by the organiser.', 'REVOKED');
    if (inv.userId === uid) return { invitationId: found.id };            // already yours
    if (inv.userId) throw httpError(403, 'This invitation has already been claimed by another account.', 'CLAIMED');
    if (status === 'expired') throw httpError(410, 'This invitation has expired. Ask the organiser to resend it.', 'EXPIRED');

    if (inv.guestEmail) {                                                    // email-bound invitation
      if (inv.guestEmail !== email) throw httpError(403, `This invitation was sent to ${mask(inv.guestEmail)}. You are signed in as ${email}.`, 'EMAIL_MISMATCH');
      if (!emailVerified) throw httpError(403, 'Please verify your email address before opening this invitation.', 'EMAIL_NOT_VERIFIED');
    } else {                                                                 // shareable link: one account per link
      const mine = await tx.get(db.collection('guests').where('eventId', '==', inv.eventId).where('userId', '==', uid).limit(1));
      if (!mine.empty) return { invitationId: mine.docs[0].id };
    }
    const now = Timestamp.now();
    const gPatch = { userId: uid, updatedAt: now };
    if (!inv.guestEmail) {
      gPatch.email = email || null;
      gPatch.name = clean(req.user.name, 100) || (email || '').split('@')[0];
    }
    tx.update(gRef, gPatch);
    tx.update(found.ref, { userId: uid, status: 'accepted', acceptedAt: now, updatedAt: now });
    if (!gSnap.exists) throw httpError(404, 'Guest record missing.');
    return { invitationId: found.id };
  });
  res.json(result);
}));

/* ---- Guest portal ---- */
async function guestView(guestId, uid) {
  const [g, i, rv] = await Promise.all([db.collection('guests').doc(guestId).get(), db.collection('invitations').doc(guestId).get(), db.collection('rsvps').doc(guestId).get()]);
  if (!g.exists || g.data().userId !== uid) throw httpError(404, 'Invitation not found.');
  const event = await loadEvent(g.data().eventId);
  if (!event) throw httpError(404, 'Event not found.');
  const rsvp = rv.exists ? rv.data() : null;
  const deadlinePassed = Boolean(event.rsvpDeadline && event.rsvpDeadline.toMillis() < Date.now());
  const status = effectiveStatus(i.data());
  return {
    id: guestId, guestName: g.data().name, status,
    canRespond: status !== 'revoked' && event.status === 'published' && !deadlinePassed,
    event: publicEvent(event),
    rsvp: rsvp && { status: rsvp.status, attendeeCount: rsvp.attendeeCount, additionalNames: rsvp.additionalNames || [], dietary: rsvp.dietary, accessibility: rsvp.accessibility, message: rsvp.message, submittedAt: rsvp.submittedAt, updatedAt: rsvp.updatedAt },
  };
}

r.get('/me/invitations', requireAuth, wrap(async (req, res) => {
  const q = await db.collection('guests').where('userId', '==', req.user.uid).get();
  const items = (await Promise.all(q.docs.map((d) => guestView(d.id, req.user.uid).catch(() => null)))).filter((x) => x && x.event.status !== 'draft');
  items.sort((a, b) => a.event.date.localeCompare(b.event.date));
  res.json({ invitations: items });
}));

r.get('/me/invitations/:id', requireAuth, wrap(async (req, res) => {
  res.json({ invitation: await guestView(req.params.id, req.user.uid) });
}));

r.put('/me/invitations/:id/rsvp', requireAuth, wrap(async (req, res) => {
  const out = await saveRsvp({ guestId: req.params.id, body: req.body, uid: req.user.uid });
  let emailSent = true;
  try { await sendRsvpEmail({ event: out.event, guest: { ...out.guest, invitationId: req.params.id }, rsvp: out.rsvp, updated: !out.created }); } catch { emailSent = false; }
  res.json({ invitation: await guestView(req.params.id, req.user.uid), emailSent });
}));

/* ---- Optional scheduler hook (disabled unless CRON_SECRET is set) ---- */
r.post('/cron/reminders', wrap(async (req, res) => {
  if (!config.cronSecret || req.headers['x-cron-secret'] !== config.cronSecret) throw httpError(403, 'Not allowed.');
  const now = Date.now();
  const events = await db.collection('events').where('status', '==', 'published').get();
  const summary = [];
  for (const d of events.docs) {
    const e = { id: d.id, ...d.data() };
    const dl = e.rsvpDeadline?.toMillis();
    if (dl && dl > now && dl - now <= 3 * 86400000) summary.push({ event: e.name, ...(await sendReminders(e, 'pending', e.ownerId)) });
  }
  res.json({ ok: true, summary });
}));

export default r;
