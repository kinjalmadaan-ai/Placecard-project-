import { useState } from 'react';
import { api } from '../../api.js';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../firebase.js';
import { useAuth, friendlyAuthError } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { PageHead, Field, Alert } from '../../components/ui.jsx';

export default function Profile() {
  const { user, resetPassword, logout } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user.displayName || '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const providers = user.providerData
    .map((p) => (p.providerId === 'google.com' ? 'Google' : 'Email and password'))
    .join(', ');

  const initials = (user.displayName || user.email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();

  async function save(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);

    try {
      await api('/me', {
        method: 'PUT',
        body: { displayName: name.trim() },
      });

      await updateProfile(auth.currentUser, {
        displayName: name.trim(),
      });

      toast.success('Profile updated successfully');
    } catch (x) {
      setErr(x.message || 'Could not update your profile.');
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    try {
      await resetPassword(user.email);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (x) {
      toast.error(friendlyAuthError(x));
    }
  }

  return (
    <>
      <PageHead
        title="My profile"
        sub="Manage your personal details and account security."
      />

      <div className="profile-page">

        <section className="profile-welcome">
          <div className="profile-avatar">
            {initials}
          </div>

          <div className="profile-welcome-text">
            <span className="profile-eyebrow">YOUR PLACECard ACCOUNT</span>
            <h2>Hello, {user.displayName || 'there'}!</h2>
            <p>Keep your account details up to date.</p>
          </div>

          <div className="profile-welcome-icon">✦</div>
        </section>

        <div className="profile-grid">

          <section className="card profile-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon">♙</div>
              <div>
                <h3>Personal information</h3>
                <p>Update the name associated with your account.</p>
              </div>
            </div>

            <form className="stack" onSubmit={save}>
              <Field label="Display name">
                <input
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                />
              </Field>

              <Alert kind="error">{err}</Alert>

              <button
                className="btn primary profile-save"
                disabled={busy || !name.trim()}
              >
                {busy ? 'Saving changes…' : 'Save changes →'}
              </button>
            </form>
          </section>

          <section className="card profile-card">
            <div className="profile-section-heading">
              <div className="profile-section-icon">▤</div>
              <div>
                <h3>Account information</h3>
                <p>Your registered account details.</p>
              </div>
            </div>

            <div className="profile-details">
              <div className="profile-detail">
                <span>Email address</span>
                <strong>{user.email}</strong>
              </div>

              <div className="profile-detail">
                <span>Account role</span>
                <strong className="profile-role">Administrator</strong>
              </div>

              <div className="profile-detail">
                <span>Sign-in method</span>
                <strong>{providers || 'Not available'}</strong>
              </div>
            </div>
          </section>

        </div>

        <section className="card profile-security">
          <div className="profile-security-copy">
            <div className="profile-section-icon">♧</div>
            <div>
              <h3>Security and access</h3>
              <p>Keep your account secure and manage your access.</p>
            </div>
          </div>

          <div className="profile-security-actions">
            <button className="btn" onClick={reset}>
              Send password reset email
            </button>

            <button className="btn profile-signout" onClick={logout}>
              Sign out
            </button>
          </div>
        </section>

        <div className="profile-footer-note">
          <span>✦</span>
          Your Placecard account, all in one place.
        </div>

      </div>
    </>
  );
}