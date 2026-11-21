import { useState } from 'react';
import { api } from '../api.js';
import { Modal, Field, Alert, Badge, Confirm } from './ui.jsx';
import RsvpForm from './RsvpForm.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { fmtDateTime } from '../lib.js';

// Invite someone by email, or create a shareable link.
export function AddGuestModal({ event, mode, onClose, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', email: '', phone: '', message: '', send: event.status === 'published' });
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'link') {
        const r = await api(`/admin/events/${event.id}/links`, { method: 'POST', body: { label: f.name, message: f.message } });
        setLink(r.link); onDone();
      } else {
        const r = await api(`/admin/events/${event.id}/guests`, { method: 'POST', body: f });
        if (r.emailError) toast.error(`Guest added, but the email failed: ${r.emailError}`); else toast.success(f.send ? 'Guest added and invitation sent' : 'Guest added');
        onDone(); onClose();
      }
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (link) return (
    <Modal title="Shareable link ready" onClose={onClose}>
      <p>Copy this link and send it on WhatsApp, text or email. The first person to open and sign in will claim it.</p>
      <div className="linkbox"><input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Invitation link" />
        <button className="btn primary" onClick={() => navigator.clipboard?.writeText(link).then(() => toast.success('Link copied'))}>Copy</button></div>
      <div className="row end"><button className="btn" onClick={onClose}>Done</button></div>
    </Modal>
  );

  return (
    <Modal title={mode === 'link' ? 'Generate a shareable link' : 'Invite a guest by email'} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        {mode === 'link' ? (
          <Field label="Label (optional)" hint="Only you see this, for example “Table 4 – Sam’s plus-one”."><input maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        ) : (
          <>
            <Field label="Guest name"><input required maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Guest email"><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Phone (optional)"><input maxLength={40} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          </>
        )}
        <Field label="Personal message (optional)"><textarea rows={3} maxLength={1000} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
        {mode !== 'link' && (
          <label className="check"><input type="checkbox" checked={f.send} disabled={event.status !== 'published'} onChange={(e) => setF({ ...f, send: e.target.checked })} /> Send the invitation email now{event.status !== 'published' && ' (publish the event first)'}</label>
        )}
        <Alert kind="error">{error}</Alert>
        <div className="row end"><button type="button" className="btn ghost" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Working…' : mode === 'link' ? 'Generate link' : f.send ? 'Add and send' : 'Add guest'}</button></div>
      </form>
    </Modal>
  );
}

// Detail view with edit, RSVP summary and removal.
export function GuestDetailModal({ guest, event, onClose, onChanged }) {
  const toast = useToast();
  const [f, setF] = useState({ name: guest.name || '', email: guest.email || '', phone: guest.phone || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const r = guest.rsvp;

  async function save(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { await api(`/admin/guests/${guest.id}`, { method: 'PUT', body: f }); toast.success('Guest updated'); onChanged(); onClose(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try { await api(`/admin/guests/${guest.id}`, { method: 'DELETE' }); toast.success('Guest removed'); onChanged(); onClose(); }
    catch (err) { setError(err.message); setConfirmDel(false); } finally { setBusy(false); }
  }
  const emailLocked = Boolean(guest.userId) || guest.invitation.type === 'link';

  return (
    <Modal title={guest.name || 'Guest'} onClose={onClose} wide>
      <div className="stack">
        <form className="form-grid" onSubmit={save}>
          <Field label="Name"><input required={Boolean(guest.email)} maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Email" hint={emailLocked ? 'Locked once the guest has signed in or when using a shared link.' : ''}><input type="email" disabled={emailLocked} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          <Field label="Phone"><input maxLength={40} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <div className="span2 row end" style={{ marginTop: 0 }}><button className="btn primary" disabled={busy}>Save changes</button></div>
        </form>
        <Alert kind="error">{error}</Alert>
        <dl className="kv">
          <dt>Invitation</dt><dd><Badge kind={guest.invitation.status} /> {guest.invitation.type === 'link' ? 'shareable link' : 'email'}{guest.invitation.sendCount > 0 && ` · sent ${guest.invitation.sendCount}×, last ${fmtDateTime(guest.invitation.lastSentAt)}`}</dd>
          <dt>RSVP</dt><dd><Badge kind={guest.rsvpStatus} />{r?.status === 'confirmed' && ` ${r.attendeeCount} attending`}</dd>
          {r?.additionalNames?.length > 0 && <><dt>Additional guests</dt><dd>{r.additionalNames.join(', ')}</dd></>}
          {r?.dietary && <><dt>Dietary</dt><dd className="prewrap">{r.dietary}</dd></>}
          {r?.accessibility && <><dt>Accessibility</dt><dd className="prewrap">{r.accessibility}</dd></>}
          {r?.message && <><dt>Message</dt><dd className="prewrap">{r.message}</dd></>}
          {r && <><dt>Submitted</dt><dd>{fmtDateTime(r.submittedAt)}{r.updatedAt !== r.submittedAt && ` (updated ${fmtDateTime(r.updatedAt)})`}</dd></>}
        </dl>
        <div className="row end"><button className="btn danger" onClick={() => setConfirmDel(true)}>Remove guest</button></div>
      </div>
      {confirmDel && <Confirm danger title="Remove this guest?" message="Their invitation link will stop working and their RSVP will be deleted. This cannot be undone." confirmLabel="Remove guest" busy={busy} onConfirm={remove} onClose={() => setConfirmDel(false)} />}
    </Modal>
  );
}

// Admin edits (or records) a response on behalf of a guest.
export function EditRsvpModal({ guest, onClose, onChanged }) {
  const toast = useToast();
  async function submit(body) {
    const r = await api(`/admin/guests/${guest.id}/rsvp`, { method: 'PUT', body });
    if (r.emailError) toast.error(`Saved, but the email failed: ${r.emailError}`); else toast.success('Response updated');
    onChanged(); onClose();
  }
  return (
    <Modal title={`Response for ${guest.name || 'guest'}`} onClose={onClose}>
      <RsvpForm adminMode initial={guest.rsvp} submitLabel="Save response" onSubmit={submit} onCancel={onClose} />
    </Modal>
  );
}
