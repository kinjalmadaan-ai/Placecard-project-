import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from './ui.jsx';

// Shown to email/password users who have not yet confirmed their address.
export default function VerifyBanner({ onVerified }) {
  const { user, resendVerification, refresh } = useAuth();
  const [msg, setMsg] = useState('');
  if (!user || user.emailVerified) return null;
  const run = async (fn, ok) => { try { await fn(); setMsg(ok); } catch (e) { setMsg(e.code === 'auth/too-many-requests' ? 'Please wait a minute before requesting another email.' : 'Could not complete that. Try again shortly.'); } };
  return (
    <Alert kind="warn">
      <strong>Please verify your email address.</strong> We sent a link to {user.email}. Invitations sent to this address open once it is verified.
      <div className="row" style={{ marginTop: '.5rem' }}>
        <button className="btn sm" onClick={() => run(resendVerification, 'Verification email sent.')}>Resend email</button>
        <button className="btn sm primary" onClick={async () => { await run(refresh, ''); if (auth_verified(user)) onVerified?.(); }}>I have verified</button>
        {msg && <span className="small">{msg}</span>}
      </div>
    </Alert>
  );
}
const auth_verified = (u) => u.emailVerified;
