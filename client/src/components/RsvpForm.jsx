import { useState } from 'react';
import { Field, Alert } from './ui.jsx';

const MAX = 10;

// Shared by the guest RSVP page and the admin "edit response" dialog.
export default function RsvpForm({ initial, onSubmit, submitLabel = 'Send my response', adminMode = false, onCancel }) {
  const [attending, setAttending] = useState(initial ? initial.status === 'confirmed' : null);
  const [count, setCount] = useState(initial?.attendeeCount || 1);
  const [names, setNames] = useState(initial?.additionalNames || []);
  const [dietary, setDietary] = useState(initial?.dietary || '');
  const [access, setAccess] = useState(initial?.accessibility || '');
  const [message, setMessage] = useState(initial?.message || '');
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const extra = Math.max(0, count - 1);
  const setName = (i, v) => setNames((n) => { const c = [...n]; c[i] = v; return c; });

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (attending === null) return setError('Please choose whether you are attending.');
    if (attending && Array.from({ length: extra }, (_, i) => (names[i] || '').trim()).some((n) => !n)) return setError('Please enter the name of each additional guest.');
    setBusy(true);
    try {
      await onSubmit({ attending, attendeeCount: count, additionalNames: names.slice(0, extra), dietary, accessibility: access, message, notify });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="stack">
      <fieldset className="choice">
        <legend>Will {adminMode ? 'the guest' : 'you'} be attending?</legend>
        <label className={attending === true ? 'on' : ''}><input type="radio" name="att" checked={attending === true} onChange={() => setAttending(true)} /> Yes, attending</label>
        <label className={attending === false ? 'on' : ''}><input type="radio" name="att" checked={attending === false} onChange={() => setAttending(false)} /> No, unable to attend</label>
      </fieldset>

      {attending && (
        <>
          <Field label="Number of people attending" hint="Include yourself.">
            <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {Array.from({ length: MAX }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
          </Field>
          {Array.from({ length: extra }, (_, i) => (
            <Field key={i} label={`Name of additional guest ${i + 1}`}>
              <input value={names[i] || ''} maxLength={100} onChange={(e) => setName(i, e.target.value)} autoComplete="off" />
            </Field>
          ))}
          <Field label="Dietary requirements" hint="Allergies, vegetarian, halal, and so on. Optional."><textarea rows={2} maxLength={500} value={dietary} onChange={(e) => setDietary(e.target.value)} /></Field>
          <Field label="Accessibility requirements" hint="Anything we can do to make the event easier for you. Optional."><textarea rows={2} maxLength={500} value={access} onChange={(e) => setAccess(e.target.value)} /></Field>
        </>
      )}
      <Field label="Message to the organiser" hint="Optional."><textarea rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
      {adminMode && <label className="check"><input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email the guest to tell them about this change</label>}
      <Alert kind="error">{error}</Alert>
      <div className="row end">
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>}
        <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button>
      </div>
    </form>
  );
}
