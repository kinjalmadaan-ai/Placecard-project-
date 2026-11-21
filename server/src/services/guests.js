import { db, Timestamp } from '../firebase.js';
import { config } from '../config.js';
import { httpError, newToken } from '../util.js';
import { validateRsvp } from '../validators.js';

// A guest, its invitation and its RSVP all share ONE document id (the "guest id").
// That makes duplicate RSVPs impossible: there is only one rsvps/{guestId} document per guest.
export const inviteLink = (token) => `${config.publicClientUrl}/invite/${token}`;
const DAY = 86400000;

export function effectiveStatus(inv = {}) {
  if (inv.status === 'revoked') return 'revoked';
  if (inv.status === 'pending' && inv.expiresAt && inv.expiresAt.toMillis() < Date.now()) return 'expired';
  return inv.status || 'pending';
}

export async function createGuest({ event, ownerId, name, email, phone, message, type }) {
  if (type === 'email') {
    const dup = await db.collection('guests').where('eventId', '==', event.id).where('email', '==', email).limit(1).get();
    if (!dup.empty) throw httpError(409, `${email} has already been invited to this event.`);
  }
  const ref = db.collection('guests').doc();
  const id = ref.id;
  const now = Timestamp.now();
  const batch = db.batch();
  batch.set(ref, {
    eventId: event.id, ownerId, name: name || '', email: email || null, phone: phone || '',
    userId: null, invitationId: id, createdAt: now, updatedAt: now,
  });
  batch.set(db.collection('invitations').doc(id), {
    eventId: event.id, ownerId, guestId: id, token: newToken(), type,
    guestName: name || '', guestEmail: email || null, message: message || '',
    status: 'pending', userId: null,
    expiresAt: Timestamp.fromMillis(Date.now() + 60 * DAY),
    lastSentAt: null, sendCount: 0, createdBy: ownerId, createdAt: now, updatedAt: now,
  });
  await batch.commit();
  return id;
}

export async function loadEventGuests(eventId) {
  const [g, i, r] = await Promise.all(
    ['guests', 'invitations', 'rsvps'].map((c) => db.collection(c).where('eventId', '==', eventId).get()),
  );
  const inv = new Map(i.docs.map((d) => [d.id, d.data()]));
  const rsvp = new Map(r.docs.map((d) => [d.id, d.data()]));
  return g.docs.map((d) => {
    const gd = d.data();
    const iv = inv.get(d.id) || {};
    const rv = rsvp.get(d.id) || null;
    return {
      id: d.id, name: gd.name, email: gd.email, phone: gd.phone, userId: gd.userId, createdAt: gd.createdAt,
      invitation: {
        type: iv.type, status: effectiveStatus(iv), token: iv.token, link: iv.token ? inviteLink(iv.token) : '',
        message: iv.message, lastSentAt: iv.lastSentAt, sendCount: iv.sendCount || 0, expiresAt: iv.expiresAt,
      },
      rsvp: rv && {
        status: rv.status, attendeeCount: rv.attendeeCount, additionalNames: rv.additionalNames || [],
        dietary: rv.dietary, accessibility: rv.accessibility, message: rv.message,
        submittedAt: rv.submittedAt, updatedAt: rv.updatedAt,
      },
      rsvpStatus: rv ? rv.status : 'pending',
    };
  });
}

// Creates or updates the single RSVP for a guest. Runs in a transaction so the event's
// attendee counter and the capacity check cannot be raced by two simultaneous submissions.
export async function saveRsvp({ guestId, body, uid, byAdmin = false }) {
  const input = validateRsvp(body);
  return db.runTransaction(async (tx) => {
    const gRef = db.collection('guests').doc(guestId);
    const g = await tx.get(gRef);
    if (!g.exists) throw httpError(404, 'Guest not found.');
    const guest = g.data();
    const eRef = db.collection('events').doc(guest.eventId);
    const rRef = db.collection('rsvps').doc(guestId);
    const [e, r, i] = await Promise.all([tx.get(eRef), tx.get(rRef), tx.get(db.collection('invitations').doc(guestId))]);
    if (!e.exists) throw httpError(404, 'Event not found.');
    const event = { id: e.id, ...e.data() };
    const inv = i.data() || {};

    if (!byAdmin) {
      if (guest.userId !== uid) throw httpError(403, 'This invitation belongs to a different account.');
      if (inv.status === 'revoked') throw httpError(410, 'This invitation has been withdrawn.');
      if (event.status !== 'published') throw httpError(403, 'This event is not currently accepting responses.');
      if (event.rsvpDeadline && event.rsvpDeadline.toMillis() < Date.now()) throw httpError(403, 'The RSVP deadline has passed. Please contact the organiser.');
    }

    const prev = r.exists ? r.data() : null;
    const prevCount = prev?.status === 'confirmed' ? prev.attendeeCount : 0;
    const newCount = input.status === 'confirmed' ? input.attendeeCount : 0;
    const current = event.attendingCount || 0;
    const next = current - prevCount + newCount;
    if (event.capacity > 0 && newCount > prevCount && next > event.capacity) {
      const left = Math.max(0, event.capacity - (current - prevCount));
      throw httpError(409, left === 0 ? 'Sorry, this event is full.' : `Only ${left} place${left === 1 ? '' : 's'} left for this event.`, 'CAPACITY');
    }

    const now = Timestamp.now();
    tx.set(rRef, {
      ...input, eventId: event.id, guestId, invitationId: guestId, ownerId: event.ownerId,
      userId: guest.userId || null, createdAt: prev?.createdAt || now, submittedAt: prev?.submittedAt || now,
      updatedAt: now, updatedBy: byAdmin ? 'admin' : 'guest',
    });
    tx.update(eRef, { attendingCount: next, updatedAt: now });
    return { created: !prev, event, guest, rsvp: input };
  });
}

export async function deleteGuest(guestId) {
  await db.runTransaction(async (tx) => {
    const gRef = db.collection('guests').doc(guestId);
    const rRef = db.collection('rsvps').doc(guestId);
    const g = await tx.get(gRef);
    if (!g.exists) return;
    const r = await tx.get(rRef);
    const eRef = db.collection('events').doc(g.data().eventId);
    const e = await tx.get(eRef);
    if (r.exists && r.data().status === 'confirmed' && e.exists) {
      tx.update(eRef, { attendingCount: Math.max(0, (e.data().attendingCount || 0) - r.data().attendeeCount) });
    }
    tx.delete(gRef); tx.delete(rRef); tx.delete(db.collection('invitations').doc(guestId));
  });
}

export async function deleteEventCascade(eventId) {
  const refs = [];
  for (const c of ['guests', 'invitations', 'rsvps']) {
    (await db.collection(c).where('eventId', '==', eventId).get()).docs.forEach((d) => refs.push(d.ref));
  }
  refs.push(db.collection('events').doc(eventId));
  for (let i = 0; i < refs.length; i += 400) {
    const batch = db.batch();
    refs.slice(i, i + 400).forEach((r) => batch.delete(r));
    await batch.commit();
  }
}
