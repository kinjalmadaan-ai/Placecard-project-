import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Logo, Loading, Badge, Empty } from '../components/ui.jsx';
import VerifyBanner from '../components/VerifyBanner.jsx';
import { fmtDate, fmtTimes } from '../lib.js';

export default function Portal() {
  const { user, isAdmin, logout } = useAuth();
  const { data, loading, error, reload } = useLoad(() => api('/me/invitations').then((d) => d.invitations), []);
  return (
    <>
      <header className="guest-head">
        <Logo to="/portal" />
        <div className="row">
          {isAdmin && <Link className="btn sm" to="/admin">Admin dashboard</Link>}
          <span className="muted small">{user.displayName || user.email}</span>
          <button className="btn sm ghost" onClick={logout}>Sign out</button>
        </div>
      </header>
      <main className="narrow" style={{ paddingTop: '2rem' }}>
        <h1 className="display">Your invitations</h1>
        <VerifyBanner onVerified={reload} />
        <Loading loading={loading} error={error} onRetry={reload}>
          {data?.length ? (
            <div className="inv-list" style={{ marginTop: '1rem' }}>
              {data.map((i) => (
                <div className="card inv-item" key={i.id}>
                  <div>
                    <h2 style={{ marginBottom: '.2rem' }}>{i.event.name}</h2>
                    <p className="muted small" style={{ margin: 0 }}>{fmtDate(i.event.date)} {fmtTimes(i.event) && `· ${fmtTimes(i.event)}`}</p>
                    <p className="small" style={{ margin: '.5rem 0 0' }}>
                      {i.status === 'revoked' ? <Badge kind="revoked">Withdrawn</Badge> : <Badge kind={i.rsvp?.status || 'pending'}>{i.rsvp ? (i.rsvp.status === 'confirmed' ? `Attending · ${i.rsvp.attendeeCount}` : 'Declined') : 'Awaiting your reply'}</Badge>}
                    </p>
                  </div>
                  {i.status !== 'revoked' && <Link className="btn primary" to={`/portal/invitations/${i.id}`}>{i.rsvp ? 'View or change' : 'Reply now'}</Link>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: '1rem' }}><Empty title="No invitations yet">Open the link in your invitation email while signed in, and the event will appear here.</Empty></div>
          )}
        </Loading>
      </main>
    </>
  );
}
