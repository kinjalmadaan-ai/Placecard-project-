import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo, Loading, Alert, Icon } from '../components/ui.jsx';
import EventInfo from '../components/EventInfo.jsx';
import RsvpForm from '../components/RsvpForm.jsx';
import { fmtDateTime } from '../lib.js';

function Summary({ rsvp }) {
  return (
    <dl className="summary">
      <dt>Your response</dt><dd>{rsvp.status === 'confirmed' ? `Attending (${rsvp.attendeeCount} ${rsvp.attendeeCount === 1 ? 'person' : 'people'})` : 'Not attending'}</dd>
      {rsvp.additionalNames?.length > 0 && <><dt>Additional guests</dt><dd>{rsvp.additionalNames.join(', ')}</dd></>}
      {rsvp.dietary && <><dt>Dietary requirements</dt><dd className="prewrap">{rsvp.dietary}</dd></>}
      {rsvp.accessibility && <><dt>Accessibility</dt><dd className="prewrap">{rsvp.accessibility}</dd></>}
      {rsvp.message && <><dt>Your message</dt><dd className="prewrap">{rsvp.message}</dd></>}
      <dt>Last updated</dt><dd>{fmtDateTime(rsvp.updatedAt)}</dd>
    </dl>
  );
}

export default function RsvpPage() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const { data, loading, error, reload } = useLoad(() => api(`/me/invitations/${id}`).then((d) => d.invitation), [id]);
  const [inv, setInv] = useState(null);
  const [editing, setEditing] = useState(false);
  const [justSent, setJustSent] = useState(null);
  const current = inv || data;

  async function submit(body) {
    const res = await api(`/me/invitations/${id}/rsvp`, { method: 'PUT', body });
    setInv(res.invitation); setEditing(false); setJustSent({ emailSent: res.emailSent });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <header className="guest-head">
        <Logo to="/portal" />
        <div className="row"><Link className="btn sm" to="/portal">All invitations</Link><button className="btn sm ghost" onClick={logout}>Sign out</button></div>
      </header>
      <main className="narrow" style={{ paddingTop: '1.5rem' }}>
        <Loading loading={loading} error={error} onRetry={reload}>
          {current && (
            <div className="stack">
              {justSent && (
                <div className="card confirm-box">
                  <div className="tick"><Icon name="check" size={28} /></div>
                  <h2>{current.rsvp?.status === 'declined' ? 'Thanks for letting us know' : 'You’re on the list'}</h2>
                  <Summary rsvp={current.rsvp} />
                  <p className="muted small">{justSent.emailSent ? `A confirmation was sent to ${user.email}.` : 'Your response is saved, but we could not send the confirmation email.'}</p>
                </div>
              )}
              <EventInfo event={current.event} />
              <div className="card">
                <h2>Your reply</h2>
                {current.status === 'revoked' && <Alert kind="error">This invitation has been withdrawn.</Alert>}
                {current.status !== 'revoked' && !current.canRespond && <Alert kind="warn">Replies are closed for this event{current.event.status === 'cancelled' ? ' because it was cancelled' : ''}. Contact the organiser if you need to change something.</Alert>}
                {current.rsvp && !editing && !justSent && <Summary rsvp={current.rsvp} />}
                {current.canRespond && (editing || !current.rsvp) && (
                  <RsvpForm initial={current.rsvp} submitLabel={current.rsvp ? 'Update my response' : 'Send my response'} onSubmit={submit} onCancel={current.rsvp ? () => setEditing(false) : undefined} />
                )}
                {current.canRespond && current.rsvp && !editing && <button className="btn" onClick={() => { setEditing(true); setJustSent(null); }}>Change my response</button>}
              </div>
            </div>
          )}
        </Loading>
      </main>
    </>
  );
}
