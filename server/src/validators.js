import { httpError, clean, isEmail, normEmail } from './util.js';

export const CATEGORIES = ['Wedding', 'Birthday party', 'Corporate event', 'Conference', 'Private party', 'Social gathering', 'Other'];
export const MAX_PARTY = 10;

const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const isTime = (s) => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);

function link(value, label) {
  const s = clean(value, 500);
  if (!s) return '';
  try {
    const u = new URL(s);
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error('bad protocol');
    return u.toString();
  } catch {
    throw httpError(400, `${label} must be a valid web link starting with http:// or https://`);
  }
}

export function validateEvent(b = {}) {
  const name = clean(b.name, 120);
  if (!name) throw httpError(400, 'Event name is required.');
  const date = clean(b.date, 10);
  if (!isDate(date)) throw httpError(400, 'Please choose a valid event date.');
  const startTime = clean(b.startTime, 5);
  const endTime = clean(b.endTime, 5);
  if (startTime && !isTime(startTime)) throw httpError(400, 'Start time is not valid.');
  if (endTime && !isTime(endTime)) throw httpError(400, 'End time is not valid.');
  let rsvpDeadline = null;
  if (b.rsvpDeadline) {
    const d = new Date(b.rsvpDeadline);
    if (Number.isNaN(d.getTime())) throw httpError(400, 'RSVP deadline is not valid.');
    rsvpDeadline = d;
  }
  const capacity = Number.parseInt(b.capacity, 10) || 0;
  if (capacity < 0 || capacity > 100000) throw httpError(400, 'Capacity must be between 0 and 100000 (0 means no limit).');
  const contactEmail = normEmail(b.contactEmail);
  if (contactEmail && !isEmail(contactEmail)) throw httpError(400, 'Contact email is not valid.');
  return {
    name,
    description: clean(b.description, 3000, true),
    coverImage: link(b.coverImage, 'Cover image'),
    category: CATEGORIES.includes(b.category) ? b.category : 'Other',
    date, startTime, endTime,
    venueName: clean(b.venueName, 150),
    venueAddress: clean(b.venueAddress, 300),
    mapsLink: link(b.mapsLink, 'Google Maps link'),
    dressCode: clean(b.dressCode, 150),
    instructions: clean(b.instructions, 2000, true),
    rsvpDeadline, capacity,
    status: ['draft', 'published', 'cancelled'].includes(b.status) ? b.status : 'draft',
    contactName: clean(b.contactName, 100),
    contactEmail,
    contactPhone: clean(b.contactPhone, 40),
  };
}

export function validateGuest(b = {}, { requireEmail = true } = {}) {
  const name = clean(b.name, 100);
  const email = normEmail(b.email);
  if (requireEmail && !name) throw httpError(400, 'Guest name is required.');
  if (requireEmail && !isEmail(email)) throw httpError(400, 'A valid guest email is required.');
  if (email && !isEmail(email)) throw httpError(400, 'Guest email is not valid.');
  return { name, email, phone: clean(b.phone, 40), message: clean(b.message, 1000, true) };
}

export function validateRsvp(b = {}) {
  const attending = b.attending === true || b.attending === 'yes';
  const declining = b.attending === false || b.attending === 'no';
  if (!attending && !declining) throw httpError(400, 'Please choose whether you are attending.');
  let attendeeCount = 0;
  let additionalNames = [];
  if (attending) {
    attendeeCount = Number.parseInt(b.attendeeCount, 10) || 1;
    if (attendeeCount < 1 || attendeeCount > MAX_PARTY) throw httpError(400, `Number of attendees must be between 1 and ${MAX_PARTY}.`);
    const names = Array.isArray(b.additionalNames) ? b.additionalNames : [];
    additionalNames = Array.from({ length: attendeeCount - 1 }, (_, i) => clean(names[i], 100));
    if (additionalNames.some((n) => !n)) throw httpError(400, 'Please enter the name of each additional attendee.');
  }
  return {
    status: attending ? 'confirmed' : 'declined',
    attendeeCount, additionalNames,
    dietary: clean(b.dietary, 500, true),
    accessibility: clean(b.accessibility, 500, true),
    message: clean(b.message, 1000, true),
  };
}
