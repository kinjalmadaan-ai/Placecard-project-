import crypto from 'crypto';
import { Timestamp } from './firebase.js';

export class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
export const httpError = (status, message, code) => new HttpError(status, message, code);
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Strips HTML tags and control characters, trims and caps length.
export function clean(value, max = 200, multiline = false) {
  if (typeof value !== 'string') return '';
  let s = value.replace(/<[^>]*>/g, '');
  s = multiline ? s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '') : s.replace(/[\u0000-\u001f\u007f]/g, ' ');
  return s.trim().slice(0, max);
}
export const normEmail = (e) => (typeof e === 'string' ? e.trim().toLowerCase() : '');
export const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
export const newToken = () => crypto.randomBytes(24).toString('base64url');
export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Converts Firestore Timestamps to ISO strings so they can be sent as JSON.
export function serialize(v) {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return v.map(serialize);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, serialize(x)]));
  return v;
}
