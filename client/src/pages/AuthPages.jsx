
import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, friendlyAuthError } from '../context/AuthContext.jsx';
import {
  Logo,
  Field,
  Alert,
  GoogleButton,
  Spinner
} from '../components/ui.jsx';

// Redirect users after successful sign-in
function useRedirectWhenSignedIn() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const from = useLocation().state?.from;

  useEffect(() => {
    if (!loading && user) {
      nav(from || (isAdmin ? '/admin' : '/portal'), {
        replace: true
      });
    }
  }, [user, isAdmin, loading, from, nav]);

  return { loading, from };
}

// Shared authentication layout
function Shell({ title, sub, children }) {
  return (
    <div className="auth-experience">

      {/* Left invitation section */}
      <section className="auth-story">
        <div className="auth-story-content">

          <span className="auth-eyebrow">
            A LITTLE MAGIC IN EVERY MOMENT
          </span>

          <h2>
            Every celebration
            <br />
            starts with an
            <br />
            <span>invitation.</span>
          </h2>

          <p>
            Bring your favourite people together. Create beautiful
            invitations and make every RSVP feel effortless.
          </p>

          {/* Invitation preview */}
          <div className="auth-invitation">
            <div className="auth-invitation-top">
              ✦ A SPECIAL INVITATION ✦
            </div>

            <div className="auth-invitation-body">
              <span className="auth-flower">✿ ✿ ✿</span>

              <h3>A day to remember</h3>

              <p>
                Good people. Beautiful moments.
                Happy memories.
              </p>

              <div className="auth-invitation-line" />

              <span className="auth-invitation-date">
                A SPECIAL OCCASION
              </span>

              <strong>
                Made for moments worth celebrating
              </strong>
            </div>
          </div>

          <div className="auth-story-footer">
            ✦ Beautiful invitations. Personal guest links. Easy RSVPs.
          </div>

        </div>
      </section>

      {/* Right authentication section */}
      <section className="auth-form-side">
        <div className="card auth-card auth-card-new">

          <Logo />

          <h1>{title}</h1>

          {sub && <p className="muted">{sub}</p>}

          {children}

        </div>
      </section>

    </div>
  );
}

// Google sign-in section
function GoogleSection({ setError, disabled }) {
  const { google } = useAuth();
  const [busy, setBusy] = useState(false);

  async function click() {
    setError('');
    setBusy(true);

    try {
      await google();
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <GoogleButton
        onClick={click}
        disabled={disabled || busy}
      />

      <div className="divider">
        or use your email
      </div>
    </>
  );
}

// LOGIN PAGE
export function Login() {
  const { login } = useAuth();
  const { loading, from } = useRedirectWhenSignedIn();

  const [f, setF] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      await login({
        email: f.email.trim(),
        password: f.password
      });
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Welcome back"
      sub={
        from?.startsWith('/invite')
          ? 'Sign in to open your invitation.'
          : 'Sign in to see your invitations or manage your events.'
      }
    >

      <GoogleSection setError={setError} />

      <form className="stack" onSubmit={submit}>

        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={f.email}
            onChange={(e) =>
              setF({ ...f, email: e.target.value })
            }
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            required
            autoComplete="current-password"
            value={f.password}
            onChange={(e) =>
              setF({ ...f, password: e.target.value })
            }
          />
        </Field>

        <Alert kind="error">
          {error}
        </Alert>

        <button
          className="btn primary"
          style={{ width: '100%' }}
          disabled={busy}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

      </form>

      <p className="small" style={{ marginTop: '1rem' }}>
        <Link to="/forgot-password">
          Forgot your password?
        </Link>
      </p>

      <p className="small muted">
        New here?{' '}
        <Link to="/register" state={{ from }}>
          Create an account
        </Link>
      </p>

    </Shell>
  );
}

// REGISTRATION PAGE
export function Register() {
  const { register } = useAuth();
  const { loading, from } = useRedirectWhenSignedIn();

  const [f, setF] = useState({
    name: '',
    email: '',
    password: '',
    confirm: ''
  });

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (f.name.trim().length < 2) {
      return setError('Please enter your full name.');
    }

    if (f.password.length < 8) {
      return setError('Your password needs at least 8 characters.');
    }

    if (f.password !== f.confirm) {
      return setError('The two passwords do not match.');
    }

    setBusy(true);

    try {
      await register({
        name: f.name.trim(),
        email: f.email.trim(),
        password: f.password
      });
    } catch (err) {
      setError(friendlyAuthError(err));
      setBusy(false);
    }
  }

  return (
    <Shell
      title="Create your account"
      sub={
        from?.startsWith('/invite')
          ? 'Use the email address your invitation was sent to.'
          : 'Guests need an account to reply to invitations.'
      }
    >

      <GoogleSection setError={setError} />

      <form className="stack" onSubmit={submit}>

        <Field label="Full name">
          <input
            required
            autoComplete="name"
            value={f.name}
            onChange={(e) =>
              setF({ ...f, name: e.target.value })
            }
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            required
            autoComplete="email"
            value={f.email}
            onChange={(e) =>
              setF({ ...f, email: e.target.value })
            }
          />
        </Field>

        <Field
          label="Password"
          hint="At least 8 characters."
        >
          <input
            type="password"
            required
            autoComplete="new-password"
            value={f.password}
            onChange={(e) =>
              setF({ ...f, password: e.target.value })
            }
          />
        </Field>

        <Field label="Confirm password">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={f.confirm}
            onChange={(e) =>
              setF({ ...f, confirm: e.target.value })
            }
          />
        </Field>

        <Alert kind="error">
          {error}
        </Alert>

        <button
          className="btn primary"
          style={{ width: '100%' }}
          disabled={busy}
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>

      </form>

      <p className="small muted" style={{ marginTop: '1rem' }}>
        Already registered?{' '}
        <Link to="/login" state={{ from }}>
          Sign in
        </Link>
      </p>

    </Shell>
  );
}

// FORGOT PASSWORD PAGE
export function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');

  const [state, setState] = useState({
    done: false,
    error: '',
    busy: false
  });

  async function submit(e) {
    e.preventDefault();

    setState({
      done: false,
      error: '',
      busy: true
    });

    try {
      await resetPassword(email.trim());

      setState({
        done: true,
        error: '',
        busy: false
      });

    } catch (err) {

      // Do not reveal whether an account exists for this email.
      if (err.code === 'auth/user-not-found') {
        setState({
          done: true,
          error: '',
          busy: false
        });
      } else {
        setState({
          done: false,
          error: friendlyAuthError(err),
          busy: false
        });
      }
    }
  }

  return (
    <Shell
      title="Reset your password"
      sub="Enter your email and we will send you a link to choose a new password."
    >

      {state.done ? (

        <Alert kind="success">
          If an account exists for {email}, a reset link is on its way.
          Check your spam folder too.
        </Alert>

      ) : (

        <form className="stack" onSubmit={submit}>

          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Alert kind="error">
            {state.error}
          </Alert>

          <button
            className="btn primary"
            style={{ width: '100%' }}
            disabled={state.busy}
          >
            {state.busy ? 'Sending…' : 'Send reset link'}
          </button>

        </form>

      )}

      <p className="small" style={{ marginTop: '1rem' }}>
        <Link to="/login">
          Back to sign in
        </Link>
      </p>

    </Shell>
  );
}
