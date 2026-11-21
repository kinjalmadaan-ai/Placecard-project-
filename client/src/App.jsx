
import { Routes, Route, Navigate } from 'react-router-dom';
import { firebaseConfigured } from './firebase.js';

import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import Protected from './components/Protected.jsx';
import SiteLayout from './components/SiteLayout.jsx';

import Landing from './pages/Landing.jsx';
import { Login, Register, ForgotPassword } from './pages/AuthPages.jsx';
import Portal from './pages/Portal.jsx';
import InvitePage from './pages/InvitePage.jsx';
import RsvpPage from './pages/RsvpPage.jsx';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Overview from './pages/admin/Overview.jsx';
import Events from './pages/admin/Events.jsx';
import EventEdit from './pages/admin/EventEdit.jsx';
import EventDetail from './pages/admin/EventDetail.jsx';
import Guests from './pages/admin/Guests.jsx';
import Invitations from './pages/admin/Invitations.jsx';
import RsvpManagement from './pages/admin/RsvpManagement.jsx';
import Emails from './pages/admin/Emails.jsx';
import Settings from './pages/admin/Settings.jsx';
import Profile from './pages/admin/Profile.jsx';


function SetupNotice() {
  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>Firebase is not configured yet</h1>
        <p>
          Create <code>client/.env</code> from
          <code> client/.env.example</code> and fill in your
          Firebase web app values, then restart
          <code> npm run dev</code>. The README (steps 5 and 13)
          shows exactly where to find them.
        </p>
      </div>
    </div>
  );
}


export default function App() {
  if (!firebaseConfigured) return <SetupNotice />;

  return (
    <AuthProvider>
      <ToastProvider>

        <Routes>

          {/* Shared footer for user-facing pages */}
          <Route element={<SiteLayout />}>

            <Route path="/" element={<Landing />} />

            {/* Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            {/* Invitations */}
            <Route
              path="/invite/:token"
              element={<InvitePage />}
            />

            {/* Protected guest portal */}
            <Route element={<Protected />}>
              <Route path="/portal" element={<Portal />} />

              <Route
                path="/portal/invitations/:id"
                element={<RsvpPage />}
              />
            </Route>

          </Route>


          {/* Admin routes without the public footer */}
          <Route element={<Protected admin />}>
            <Route path="/admin" element={<AdminLayout />}>

              <Route index element={<Overview />} />

              <Route path="events" element={<Events />} />
              <Route path="events/new" element={<EventEdit />} />
              <Route path="events/:id" element={<EventDetail />} />
              <Route
                path="events/:id/edit"
                element={<EventEdit />}
              />

              <Route path="guests" element={<Guests />} />
              <Route path="invitations" element={<Invitations />} />
              <Route path="rsvps" element={<RsvpManagement />} />
              <Route path="emails" element={<Emails />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />

            </Route>
          </Route>


          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>

      </ToastProvider>
    </AuthProvider>
  );
}
