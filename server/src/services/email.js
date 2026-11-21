import { Resend } from 'resend';
import { config } from '../config.js';
import { db, Timestamp } from '../firebase.js';
import { escapeHtml as h, httpError } from '../util.js';

const resend = config.resendKey ? new Resend(config.resendKey) : null;

/* ---------- Sending + logging ---------- */

// Sends one email through Resend and records the outcome in `emailLogs`.
// If `dedupeKey` is given, an email that was already sent with that key is skipped.
export async function sendEmail({ to, subject, html, type, eventId, guestId, ownerId, dedupeKey, replyTo, fromName }) {
  const logRef = dedupeKey ? db.collection('emailLogs').doc(dedupeKey) : db.collection('emailLogs').doc();
  if (dedupeKey) {
    const snap = await logRef.get();
    if (snap.exists && snap.data().status === 'sent') return { skipped: true };
  }
  const base = { to, subject, type, eventId: eventId || null, guestId: guestId || null, ownerId: ownerId || null, createdAt: Timestamp.now() };

  if (!resend || !config.emailFrom) {
    await logRef.set({ ...base, status: 'failed', error: 'Email is not configured (RESEND_API_KEY / EMAIL_FROM missing).' });
    throw httpError(503, 'Email is not configured on the server. Set RESEND_API_KEY and EMAIL_FROM.', 'EMAIL_NOT_CONFIGURED');
  }
  const safeName = (fromName || 'Placecard').replace(/[<>"\r\n]/g, '').slice(0, 60) || 'Placecard';
  try {
    const { data, error } = await resend.emails.send({
      from: `${safeName} <${config.emailFrom}>`, to: [to], subject, html, replyTo: replyTo || undefined,
    });
    if (error) throw new Error(error.message || 'Resend rejected the message');
    await logRef.set({ ...base, status: 'sent', providerId: data?.id || null });
    return { sent: true };
  } catch (err) {
    await logRef.set({ ...base, status: 'failed', error: String(err.message).slice(0, 300) });
    throw httpError(502, `Email could not be sent: ${err.message}`, 'EMAIL_FAILED');
  }
}

/* ---------- Formatting helpers ---------- */

const fmtDate = (d) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
};
const fmtDeadline = (ts) => ts
  ? ts.toDate().toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short', timeZone: config.timezone })
  : '';

/* ---------- HTML templates (inline styles for email-client compatibility) ---------- */

function layout({ preheader, heading, body, event, ctaUrl, ctaLabel, footer }) {
  const when = event ? `${fmtDate(event.date)}${event.startTime ? `, ${event.startTime}` : ''}${event.endTime ? ` – ${event.endTime}` : ''}` : '';
  const where = event ? [event.venueName, event.venueAddress].filter(Boolean).join(', ') : '';
  const deadline = event?.rsvpDeadline ? fmtDeadline(event.rsvpDeadline) : '';
  return `<!doctype html><html><body style="margin:0;padding:0;background:#FBF7EF;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${h(preheader || '')}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7EF;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFEFA;border:1px solid #E8E1D3;border-radius:16px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;color:#25222B;">
${event?.coverImage ? `<tr><td><img src="${h(event.coverImage)}" alt="" width="560" style="display:block;width:100%;height:auto;max-height:220px;object-fit:cover;"></td></tr>` : '<tr><td style="height:8px;background:#6F5FAA;"></td></tr>'}
<tr><td style="padding:32px 32px 8px;"><h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;line-height:1.25;font-weight:600;">${h(heading)}</h1>
<div style="font-size:15px;line-height:1.6;color:#4a4553;">${body}</div></td></tr>
${event ? `<tr><td style="padding:8px 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEE9F8;border-radius:12px;"><tr><td style="padding:16px 18px;font-size:14px;line-height:1.7;">
<strong style="font-size:16px;">${h(event.name)}</strong><br>${h(when)}${where ? `<br>${h(where)}` : ''}${event.dressCode ? `<br>Dress code: ${h(event.dressCode)}` : ''}${deadline ? `<br><strong>Please reply by ${h(deadline)}</strong>` : ''}
</td></tr></table></td></tr>` : ''}
${ctaUrl ? `<tr><td style="padding:20px 32px 8px;"><a href="${h(ctaUrl)}" style="display:inline-block;background:#6F5FAA;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 26px;border-radius:10px;">${h(ctaLabel)}</a>
<p style="font-size:12px;color:#6C6675;margin:14px 0 0;word-break:break-all;">Button not working? Copy this link: ${h(ctaUrl)}</p></td></tr>` : ''}
<tr><td style="padding:24px 32px 28px;font-size:12px;color:#6C6675;border-top:1px solid #E8E1D3;margin-top:16px;">${footer || 'You are receiving this because you were invited to an event.'}</td></tr>
</table></td></tr></table></body></html>`;
}

const hello = (name) => `<p style="margin:0 0 12px;">Hello ${h(name || 'there')},</p>`;
const contactLine = (e) => [e.contactName, e.contactEmail, e.contactPhone].filter(Boolean).length
  ? `Questions? Contact ${h([e.contactName, e.contactEmail, e.contactPhone].filter(Boolean).join(' · '))}.` : '';

export const templates = {
  invitation: ({ event, guest, link, message, orgName }) => ({
    subject: `You're invited: ${event.name}`,
    html: layout({
      preheader: `${orgName || 'You'} invited you to ${event.name}`, heading: `You're invited to ${event.name}`, event,
      body: `${hello(guest.name)}<p style="margin:0 0 12px;">${h(orgName || 'The organiser')} would love you to join.</p>${message ? `<p style="margin:0 0 12px;padding:12px 14px;border-left:3px solid #6F5FAA;background:#FBF7EF;white-space:pre-line;">${h(message)}</p>` : ''}<p style="margin:0;">Open your invitation to see the details and let us know if you can make it.</p>`,
      ctaUrl: link, ctaLabel: 'View invitation & RSVP', footer: contactLine(event),
    }),
  }),
  rsvp: ({ event, guest, rsvp, link, updated }) => ({
    subject: `${updated ? 'RSVP updated' : 'RSVP received'}: ${event.name}`,
    html: layout({
      preheader: 'Your response has been recorded', heading: updated ? 'Your RSVP has been updated' : 'Thank you for your RSVP', event,
      body: `${hello(guest.name)}<p style="margin:0 0 12px;">${rsvp.status === 'confirmed'
        ? `We have you down as <strong>attending with ${rsvp.attendeeCount} ${rsvp.attendeeCount === 1 ? 'person' : 'people'}</strong>.`
        : 'We have you down as <strong>unable to attend</strong>. Thank you for letting us know.'}</p><p style="margin:0;">You can change your response from your invitation until the RSVP deadline.</p>`,
      ctaUrl: link, ctaLabel: 'View or change my RSVP', footer: contactLine(event),
    }),
  }),
  update: ({ event, guest, link, note }) => ({
    subject: `Update: ${event.name}`,
    html: layout({
      preheader: 'There is an update about your event', heading: `An update about ${event.name}`, event,
      body: `${hello(guest.name)}<p style="margin:0 0 12px;">The organiser has updated the event details.</p>${note ? `<p style="margin:0 0 12px;padding:12px 14px;border-left:3px solid #6F5FAA;background:#FBF7EF;white-space:pre-line;">${h(note)}</p>` : ''}<p style="margin:0;">Please check the latest information below.</p>`,
      ctaUrl: link, ctaLabel: 'View latest details', footer: contactLine(event),
    }),
  }),
  reminder: ({ event, guest, link, pending }) => ({
    subject: pending ? `Reminder: please RSVP to ${event.name}` : `Reminder: ${event.name} is coming up`,
    html: layout({
      preheader: pending ? 'We have not received your RSVP yet' : 'A friendly reminder', heading: pending ? 'We still need your reply' : 'See you soon', event,
      body: `${hello(guest.name)}<p style="margin:0;">${pending ? 'We have not received your RSVP yet. It only takes a minute.' : 'This is a friendly reminder about the event you have confirmed.'}</p>`,
      ctaUrl: link, ctaLabel: pending ? 'RSVP now' : 'View event details', footer: contactLine(event),
    }),
  }),
};
