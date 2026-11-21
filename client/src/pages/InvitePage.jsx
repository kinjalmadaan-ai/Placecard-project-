import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth, friendlyAuthError } from '../context/AuthContext.jsx';
import { Logo, Spinner, Alert, GoogleButton } from '../components/ui.jsx';
import EventInfo from '../components/EventInfo.jsx';
import VerifyBanner from '../components/VerifyBanner.jsx';

export default function InvitePage() {
  const { token } = useParams();
  const nav = useNavigate();
  const { user, loading: authLoading, google, logout } = useAuth();
  const [preview, setPreview] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [claim, setClaim] = useState({ busy: false, error: '', code: '' });
  const [gError, setGError] = useState('');
  const attempted = useRef(null);

  useEffect(() => {
    api(`/invitations/${token}`, { authed: false }).then(setPreview).catch((e) => setLoadError(e.message));
  }, [token]);

  async function tryClaim() {
    setClaim({ busy: true, error: '', code: '' });
    try {
      const { invitationId } = await api(`/invitations/${token}/claim`, { method: 'POST' });
      nav(`/portal/invitations/${invitationId}`, { replace: true });
    } catch (e) { setClaim({ busy: false, error: e.message, code: e.code || '' }); }
  }

  // Once signed in and the invitation is loaded, attach it to the account (once per user).
  useEffect(() => {
    if (!preview || !user || authLoading) return;
    if (['revoked', 'expired'].includes(preview.invitation.status) && !preview.invitation.claimed) return;
    if (attempted.current === user.uid) return;
    attempted.current = user.uid;
    tryClaim();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, user, authLoading]);

  const header = <header className="guest-head"><Logo /></header>;
  if (loadError) return <>{header}<main className="narrow" style={{ paddingTop: '2rem' }}><div className="card stack"><h1>We can’t open this invitation</h1><Alert kind="error">{loadError}</Alert><p className="muted">Check that you copied the whole link from your email, or ask the organiser to send it again.</p><Link className="btn" to="/">Go to the home page</Link></div></main></>;
  if (!preview || authLoading) return <>{header}<Spinner /></>;

  const { invitation, event } = preview;
  const dead = ['revoked', 'expired'].includes(invitation.status) && !invitation.claimed;
  const from = `/invite/${token}`;

  async function withGoogle() {
    setGError('');
    try { await google(); } catch (e) { setGError(friendlyAuthError(e)); }
  }

  return (
    <>
      {header}
      <main className="narrow" style={{ paddingTop: '1.5rem' }}>
        <div className="stack">
          <div className="card">
            <h2 style={{ marginBottom: '.25rem' }}>{invitation.guestName ? `Hello ${invitation.guestName}, you’re invited` : 'You’re invited'}</h2>
            {invitation.message && <p className="prewrap muted" style={{ margin: '.5rem 0 0' }}>{invitation.message}</p>}
          </div>
          <EventInfo event={event} />

          {dead && <Alert kind="error">{invitation.status === 'revoked' ? 'This invitation has been withdrawn by the organiser.' : 'This invitation has expired. Please ask the organiser to resend it.'}</Alert>}

          {!dead && !user && (
            <div className="card stack">
              <h2>Sign in to reply</h2>
              {invitation.emailHint && <p className="muted small" style={{ margin: 0 }}>This invitation is for {invitation.emailHint}. Please use that email address.</p>}
              <GoogleButton onClick={withGoogle} />
              <Alert kind="error">{gError}</Alert>
              <div className="row">
                <Link className="btn primary" to="/login" state={{ from }}>Sign in with email</Link>
                <Link className="btn" to="/register" state={{ from }}>Create an account</Link>
              </div>
            </div>
          )}

          {!dead && user && (
            <div className="card stack">
              <VerifyBanner onVerified={tryClaim} />
              {claim.busy && <p className="row"><span className="spinner" /> Opening your invitation…</p>}
              <Alert kind="error">{claim.error}</Alert>
              {claim.error && (
                <div className="row">
                  {claim.code === 'EMAIL_NOT_VERIFIED' && <button className="btn primary" onClick={tryClaim}>Try again</button>}
                  {['EMAIL_MISMATCH', 'CLAIMED'].includes(claim.code) && <button className="btn primary" onClick={async () => { await logout(); }}>Sign in with a different account</button>}
                  <Link className="btn" to="/portal">My invitations</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
