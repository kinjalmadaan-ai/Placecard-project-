import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAdmin } from '../../context/AdminContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Field, Alert, PageHead, Spinner } from '../../components/ui.jsx';
import { toLocalInput, fromLocalInput } from '../../lib.js';

const CATEGORIES = ['Wedding', 'Birthday party', 'Corporate event', 'Conference', 'Private party', 'Social gathering', 'Other'];
const BLANK = { name: '', description: '', coverImage: '', category: 'Social gathering', date: '', startTime: '', endTime: '', venueName: '', venueAddress: '', mapsLink: '', dressCode: '', instructions: '', rsvpDeadline: '', capacity: 0, status: 'draft', contactName: '', contactEmail: '', contactPhone: '' };

export default function EventEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { reload, setSelectedId } = useAdmin();
  const [f, setF] = useState(BLANK);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  useEffect(() => {
    if (!id) return;
    api(`/admin/events/${id}`).then(({ event }) => setF({ ...BLANK, ...event, rsvpDeadline: toLocalInput(event.rsvpDeadline) })).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const body = { ...f, rsvpDeadline: fromLocalInput(f.rsvpDeadline), capacity: Number(f.capacity) || 0 };
      const res = id ? await api(`/admin/events/${id}`, { method: 'PUT', body }) : await api('/admin/events', { method: 'POST', body });
      toast.success(id ? 'Event saved' : 'Event created');
      await reload(); setSelectedId(res.event.id);
      nav(`/admin/events/${res.event.id}`);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  if (loading) return <Spinner />;
  return (
    <>
      <PageHead title={id ? 'Edit event' : 'Create event'} sub="Guests see these details on their invitation."><Link className="btn" to="/admin/events">Cancel</Link></PageHead>
      <form className="card stack" onSubmit={submit}>
        <div className="form-grid">
          <Field label="Event name" className="span2"><input required maxLength={120} value={f.name} onChange={set('name')} /></Field>
          <Field label="Category"><select value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Status" hint="Guests can only open published events."><select value={f.status} onChange={set('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select></Field>
          <Field label="Description" className="span2"><textarea rows={4} maxLength={3000} value={f.description} onChange={set('description')} /></Field>
          <Field label="Cover image link" hint="Paste the web address of an image (https://…). Optional." className="span2">
            <input type="url" value={f.coverImage} onChange={set('coverImage')} placeholder="https://" />
            {f.coverImage && <img className="preview" src={f.coverImage} alt="Cover preview" onError={(e) => { e.currentTarget.style.display = 'none'; }} onLoad={(e) => { e.currentTarget.style.display = 'block'; }} />}
          </Field>
          <Field label="Date"><input type="date" required value={f.date} onChange={set('date')} /></Field>
          <div className="form-grid" style={{ gap: '.6rem' }}>
            <Field label="Starts"><input type="time" value={f.startTime} onChange={set('startTime')} /></Field>
            <Field label="Ends"><input type="time" value={f.endTime} onChange={set('endTime')} /></Field>
          </div>
          <Field label="Venue name"><input maxLength={150} value={f.venueName} onChange={set('venueName')} /></Field>
          <Field label="Google Maps link" hint="Optional."><input type="url" value={f.mapsLink} onChange={set('mapsLink')} placeholder="https://maps.google.com/…" /></Field>
          <Field label="Full venue address" className="span2"><input maxLength={300} value={f.venueAddress} onChange={set('venueAddress')} /></Field>
          <Field label="Dress code"><input maxLength={150} value={f.dressCode} onChange={set('dressCode')} /></Field>
          <Field label="Maximum guests" hint="Total attendees. Use 0 for no limit."><input type="number" min="0" max="100000" value={f.capacity} onChange={set('capacity')} /></Field>
          <Field label="RSVP deadline" hint="In your local time. Leave empty for no deadline."><input type="datetime-local" value={f.rsvpDeadline} onChange={set('rsvpDeadline')} /></Field>
          <span />
          <Field label="Additional instructions" className="span2"><textarea rows={3} maxLength={2000} value={f.instructions} onChange={set('instructions')} placeholder="Parking, arrival time, gifts…" /></Field>
          <Field label="Contact name"><input maxLength={100} value={f.contactName} onChange={set('contactName')} /></Field>
          <Field label="Contact email"><input type="email" value={f.contactEmail} onChange={set('contactEmail')} /></Field>
          <Field label="Contact phone"><input maxLength={40} value={f.contactPhone} onChange={set('contactPhone')} /></Field>
        </div>
        <Alert kind="error">{error}</Alert>
        <div className="row end"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : id ? 'Save changes' : 'Create event'}</button></div>
      </form>
    </>
  );
}
