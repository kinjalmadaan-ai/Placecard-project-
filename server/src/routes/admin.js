import { Router } from 'express';
import { db, Timestamp } from '../firebase.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { wrap, httpError, clean, isEmail, normEmail } from '../util.js';
import { validateEvent, validateGuest } from '../validators.js';
import { createGuest, saveRsvp, deleteGuest, deleteEventCascade, loadEventGuests, inviteLink } from '../services/guests.js';
import { sendInvitation, sendRsvpEmail, notifyEvent, sendReminders, loadSettings } from '../services/notify.js';

const r = Router();
r.use(requireAuth, requireAdmin); // every route below needs a valid token AND the admin claim

async function ownedEvent(id, uid) {
  const s = await db.collection('events').doc(id).get();
  if (!s.exists || s.data().ownerId !== uid) throw httpError(404, 'Event not found.');
  return { id: s.id, ...s.data() };
}
async function ownedGuest(id, uid) {
  const s = await db.collection('guests').doc(id).get();
  if (!s.exists || s.data().ownerId !== uid) throw httpError(404, 'Guest not found.');
  return { id: s.id, ...s.data() };
}
const myEvents = async (uid) => (await db.collection('events').where('ownerId', '==', uid).get()).docs.map((d) => ({ id: d.id, ...d.data() }));

/* ---------------- Events ---------------- */
r.get('/events', wrap(async (req, res) => {
  const events = await myEvents(req.user.uid);
  events.sort((a, b) => b.date.localeCompare(a.date));
  res.json({ events });
}));

r.post('/events', wrap(async (req, res) => {
  const data = validateEvent(req.body);
  const now = Timestamp.now();
  const ref = db.collection('events').doc();
  await ref.set({ ...data, rsvpDeadline: data.rsvpDeadline && Timestamp.fromDate(data.rsvpDeadline), ownerId: req.user.uid, attendingCount: 0, createdAt: now, updatedAt: now });
  res.status(201).json({ event: { id: ref.id, ...(await ref.get()).data() } });
}));

r.get('/events/:id', wrap(async (req, res) => res.json({ event: await ownedEvent(req.params.id, req.user.uid) })));

r.put('/events/:id', wrap(async (req, res) => {
  const event = await ownedEvent(req.params.id, req.user.uid);
  const data = validateEvent(req.body);
  if (data.capacity > 0 && data.capacity < (event.attendingCount || 0)) {
    throw httpError(409, `Capacity cannot be lower than the ${event.attendingCount} guests already confirmed.`);
  }
  await db.collection('events').doc(event.id).update({ ...data, rsvpDeadline: data.rsvpDeadline && Timestamp.fromDate(data.rsvpDeadline), updatedAt: Timestamp.now() });
  res.json({ event: { id: event.id, ...(await db.collection('events').doc(event.id).get()).data() } });
}));

for (const [action, status] of [['publish', 'published'], ['unpublish', 'draft']]) {
  r.post(`/events/:id/${action}`, wrap(async (req, res) => {
    const event = await ownedEvent(req.params.id, req.user.uid);
    await db.collection('events').doc(event.id).update({ status, updatedAt: Timestamp.now() });
    res.json({ ok: true, status });
  }));
}

r.delete('/events/:id', wrap(async (req, res) => {
  const event = await ownedEvent(req.params.id, req.user.uid);
  await deleteEventCascade(event.id);
  res.json({ ok: true });
}));

/* ---------------- Guests & invitations ---------------- */
r.get('/events/:id/guests', wrap(async (req, res) => {
  const event = await ownedEvent(req.params.id, req.user.uid);
  res.json({ guests: await loadEventGuests(event.id), event });
}));

r.post('/events/:id/guests', wrap(async (req, res) => {
  const event = await ownedEvent(req.params.id, req.user.uid);
  const input = validateGuest(req.body);
  const id = await createGuest({ event, ownerId: req.user.uid, ...input, type: 'email' });
  let emailError = '';
  if (req.body.send) {
    try { await sendInvitation(id, req.user.uid); } catch (e) { emailError = e.message; }
  }
  res.status(201).json({ id, emailError });
}));

r.post('/events/:id/links', wrap(async (req, res) => {
  const event = await ownedEvent(req.params.id, req.user.uid);
  const id = await createGuest({ event, ownerId: req.user.uid, name: clean(req.body?.label, 100), email: '', phone: '', message: clean(req.body?.message, 1000, true), type: 'link' });
  const inv = (await db.collection('invitations').doc(id).get()).data();
  res.status(201).json({ id, link: inviteLink(inv.token) });
}));

r.put('/guests/:id', wrap(async (req, res) => {
  const guest = await ownedGuest(req.params.id, req.user.uid);
  const input = validateGuest(req.body, { requireEmail: false });
  if (!input.name && guest.email) throw httpError(400, 'Guest name is required.');
  const patch = { name: input.name, phone: input.phone, updatedAt: Timestamp.now() };
  const invPatch = { guestName: input.name, updatedAt: Timestamp.now() };
  if (input.email && input.email !== guest.email) {
    if (guest.userId) throw httpError(409, 'This guest has already signed in with their invitation, so their email cannot be changed.');
    const dup = await db.collection('guests').where('eventId', '==', guest.eventId).where('email', '==', input.email).limit(1).get();
    if (!dup.empty) throw httpError(409, `${input.email} is already on this guest list.`);
    patch.email = input.email; invPatch.guestEmail = input.email;
  }
  const batch = db.batch();
  batch.update(db.collection('guests').doc(guest.id), patch);
  batch.update(db.collection('invitations').doc(guest.id), invPatch);
  await batch.commit();
  res.json({ ok: true });
}));

r.delete('/guests/:id', wrap(async (req, res) => {
  await ownedGuest(req.params.id, req.user.uid);
  await deleteGuest(req.params.id);
  res.json({ ok: true });
}));

r.post('/guests/:id/send', wrap(async (req, res) => {
  await ownedGuest(req.params.id, req.user.uid);
  await sendInvitation(req.params.id, req.user.uid);
  res.json({ ok: true });
}));

r.post('/guests/:id/revoke', wrap(async (req, res) => {
  await ownedGuest(req.params.id, req.user.uid);
  await db.collection('invitations').doc(req.params.id).update({ status: 'revoked', revokedAt: Timestamp.now(), updatedAt: Timestamp.now() });
  res.json({ ok: true });
}));

r.post('/guests/:id/reinstate', wrap(async (req, res) => {
  const guest = await ownedGuest(req.params.id, req.user.uid);
  await db.collection('invitations').doc(guest.id).update({
    status: guest.userId ? 'accepted' : 'pending', revokedAt: null,
    expiresAt: Timestamp.fromMillis(Date.now() + 60 * 86400000), updatedAt: Timestamp.now(),
  });
  res.json({ ok: true });
}));

r.put('/guests/:id/rsvp', wrap(async (req, res) => {
  await ownedGuest(req.params.id, req.user.uid);
  const out = await saveRsvp({ guestId: req.params.id, body: req.body, uid: req.user.uid, byAdmin: true });
  let emailError = '';
  if (req.body.notify && out.guest.email) {
    try { await sendRsvpEmail({ event: out.event, guest: { ...out.guest, invitationId: req.params.id }, rsvp: out.rsvp, updated: true }); } catch (e) { emailError = e.message; }
  }
  res.json({ ok: true, emailError });
}));

/* ---------------- Email communications ---------------- */
r.post('/events/:id/notify', wrap(async (req, res) => {
  const event = await ownedEvent(req.params.id, req.user.uid);
  res.json(await notifyEvent(event, clean(req.body?.note, 1000, true), req.user.uid));
}));

r.post('/events/:id/reminders', wrap(async (req, res) => {
  const event = await ownedEvent(req.params.id, req.user.uid);
  const audience = ['pending', 'confirmed', 'all'].includes(req.body?.audience) ? req.body.audience : 'pending';
  res.json(await sendReminders(event, audience, req.user.uid));
}));

r.get('/email-logs', wrap(async (req, res) => {
  const q = await db.collection('emailLogs').where('ownerId', '==', req.user.uid).get();
  let logs = q.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (req.query.eventId) logs = logs.filter((l) => l.eventId === req.query.eventId);
  logs.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  res.json({ logs: logs.slice(0, 100) });
}));

/* ---------------- Settings ---------------- */
r.get('/settings', wrap(async (req, res) => res.json({ settings: await loadSettings(req.user.uid) })));
r.put('/settings', wrap(async (req, res) => {
  const replyTo = normEmail(req.body?.replyTo);
  if (replyTo && !isEmail(replyTo)) throw httpError(400, 'Reply-to email is not valid.');
  const settings = {
    organisationName: clean(req.body?.organisationName, 100), senderName: clean(req.body?.senderName, 60),
    replyTo, defaultMessage: clean(req.body?.defaultMessage, 1000, true), updatedAt: Timestamp.now(),
  };
  await db.collection('settings').doc(req.user.uid).set(settings, { merge: true });
  res.json({ settings });
}));

/* ---------------- Overview statistics ---------------- */
r.get('/stats', wrap(async (req, res) => {
  const events = await myEvents(req.user.uid);
  const perEvent = await Promise.all(events.map(async (e) => {
    const guests = (await loadEventGuests(e.id)).filter((g) => g.invitation.status !== 'revoked');
    const confirmed = guests.filter((g) => g.rsvpStatus === 'confirmed');
    return {
      id: e.id, name: e.name, date: e.date, status: e.status, capacity: e.capacity || 0,
      invited: guests.length, confirmed: confirmed.length, declined: guests.filter((g) => g.rsvpStatus === 'declined').length,
      pending: guests.filter((g) => g.rsvpStatus === 'pending').length,
      attendees: confirmed.reduce((n, g) => n + (g.rsvp.attendeeCount || 0), 0),
    };
  }));
  const sum = (k) => perEvent.reduce((n, e) => n + e[k], 0);
  const invited = sum('invited');
  const remaining = perEvent.filter((e) => e.capacity > 0).reduce((n, e) => n + Math.max(0, e.capacity - e.attendees), 0);
  res.json({
    totals: {
      events: events.length, invited, confirmed: sum('confirmed'), declined: sum('declined'), pending: sum('pending'),
      attendees: sum('attendees'), attendancePercent: invited ? Math.round((sum('confirmed') / invited) * 100) : 0,
      remainingCapacity: remaining, hasCapacityLimits: perEvent.some((e) => e.capacity > 0),
    },
    perEvent,
  });
}));

export default r;
