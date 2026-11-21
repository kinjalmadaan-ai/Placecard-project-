import { db, Timestamp } from '../firebase.js';
import { httpError } from '../util.js';
import { sendEmail, templates } from './email.js';
import { inviteLink, loadEventGuests } from './guests.js';

const DAY = 86400000;

export async function loadSettings(ownerId) {
  const s = await db.collection('settings').doc(ownerId).get();
  return { organisationName: '', senderName: '', replyTo: '', defaultMessage: '', ...(s.exists ? s.data() : {}) };
}
const mailOpts = (s) => ({ fromName: s.senderName || s.organisationName || 'Placecard', replyTo: s.replyTo || undefined });

// Sends (or resends) the invitation email for one guest.
export async function sendInvitation(guestId, ownerId) {
  const [gs, is] = await Promise.all([db.collection('guests').doc(guestId).get(), db.collection('invitations').doc(guestId).get()]);
  if (!gs.exists || !is.exists || gs.data().ownerId !== ownerId) throw httpError(404, 'Guest not found.');
  const guest = { id: gs.id, ...gs.data() };
  const inv = is.data();
  if (!guest.email) throw httpError(400, 'This guest has no email address. Share their invitation link instead.');
  if (inv.status === 'revoked') throw httpError(400, 'This invitation was revoked. Reinstate it before sending.');
  const es = await db.collection('events').doc(guest.eventId).get();
  const event = { id: es.id, ...es.data() };
  if (event.status !== 'published') throw httpError(400, 'Publish the event before sending invitations.');
  if (inv.lastSentAt && Date.now() - inv.lastSentAt.toMillis() < 60000) throw httpError(429, 'An invitation was sent to this guest less than a minute ago.');

  const settings = await loadSettings(ownerId);
  const tpl = templates.invitation({ event, guest, link: inviteLink(inv.token), message: inv.message || settings.defaultMessage, orgName: settings.organisationName });
  await sendEmail({ to: guest.email, ...tpl, type: inv.sendCount ? 'invitation-resend' : 'invitation', eventId: event.id, guestId, ownerId, ...mailOpts(settings) });

  const now = Timestamp.now();
  const patch = { lastSentAt: now, sendCount: (inv.sendCount || 0) + 1, updatedAt: now };
  if (inv.status === 'pending' && inv.expiresAt && inv.expiresAt.toMillis() < Date.now()) patch.expiresAt = Timestamp.fromMillis(Date.now() + 60 * DAY);
  await db.collection('invitations').doc(guestId).update(patch);
}

export async function sendRsvpEmail({ event, guest, rsvp, updated }) {
  if (!guest.email) return;
  const settings = await loadSettings(event.ownerId);
  const inv = (await db.collection('invitations').doc(guest.invitationId).get()).data();
  const tpl = templates.rsvp({ event, guest, rsvp, link: inviteLink(inv.token), updated });
  await sendEmail({ to: guest.email, ...tpl, type: updated ? 'rsvp-update' : 'rsvp-confirmation', eventId: event.id, guestId: guest.invitationId, ownerId: event.ownerId, ...mailOpts(settings) });
}

async function bulk(event, ownerId, guests, build, type, keyFn) {
  const settings = await loadSettings(ownerId);
  const result = { sent: 0, skipped: 0, failed: 0, errors: [] };
  for (const g of guests) {
    try {
      const tpl = build(g, settings);
      const r = await sendEmail({ to: g.email, ...tpl, type, eventId: event.id, guestId: g.id, ownerId, dedupeKey: keyFn?.(g), ...mailOpts(settings) });
      if (r.skipped) result.skipped++; else result.sent++;
    } catch (e) {
      result.failed++;
      if (result.errors.length < 3) result.errors.push(e.message);
      if (e.code === 'EMAIL_NOT_CONFIGURED') break;
    }
  }
  return result;
}

const reachable = (guests) => guests.filter((g) => g.email && g.invitation.status !== 'revoked');

export async function notifyEvent(event, note, ownerId) {
  if (event.status !== 'published') throw httpError(400, 'Only published events can send updates.');
  if (event.lastNotifiedAt && Date.now() - event.lastNotifiedAt.toMillis() < 5 * 60000) throw httpError(429, 'An update was already sent in the last 5 minutes.');
  const guests = reachable(await loadEventGuests(event.id));
  if (!guests.length) throw httpError(400, 'There are no guests with an email address to notify.');
  await db.collection('events').doc(event.id).update({ lastNotifiedAt: Timestamp.now() });
  return bulk(event, ownerId, guests, (g) => templates.update({ event, guest: g, link: g.invitation.link, note }), 'event-update');
}

// audience: 'pending' | 'confirmed' | 'all' (pending + confirmed). At most one reminder per guest per audience per day.
export async function sendReminders(event, audience, ownerId) {
  if (event.status !== 'published') throw httpError(400, 'Only published events can send reminders.');
  const today = new Date().toISOString().slice(0, 10);
  const guests = reachable(await loadEventGuests(event.id)).filter((g) =>
    audience === 'pending' ? g.rsvpStatus === 'pending' : audience === 'confirmed' ? g.rsvpStatus === 'confirmed' : g.rsvpStatus !== 'declined');
  return bulk(event, ownerId, guests,
    (g) => templates.reminder({ event, guest: g, link: g.invitation.link, pending: g.rsvpStatus === 'pending' }),
    'reminder', (g) => `reminder-${g.id}-${g.rsvpStatus}-${today}`);
}
