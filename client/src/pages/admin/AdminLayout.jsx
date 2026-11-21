import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon, Logo } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { AdminProvider } from '../../context/AdminContext.jsx';

const NAV = [
  ['/admin', 'Overview', 'dashboard', true], ['/admin/events', 'Events', 'calendar'], ['/admin/guests', 'Guests', 'users'],
  ['/admin/invitations', 'Invitations', 'send'], ['/admin/rsvps', 'RSVP management', 'check'], ['/admin/emails', 'Email communications', 'mail'],
  ['/admin/settings', 'Settings', 'settings'], ['/admin/profile', 'Profile', 'user'],
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const loc = useLocation();
  const [lastPath, setLastPath] = useState(loc.pathname);
  if (lastPath !== loc.pathname) { setLastPath(loc.pathname); setOpen(false); } // close drawer after navigating
  return (
    <AdminProvider>
      <div className="admin">
        <div className="mobilebar">
          <button className="icon-btn" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}><Icon name="menu" /></button>
          <Logo to="/admin" /><span style={{ width: 40 }} />
        </div>
        {open && <div className="scrim" onClick={() => setOpen(false)} />}
        <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="Admin navigation">
          <Logo to="/admin" />
          <nav className="nav">
            {NAV.map(([to, label, icon, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}><Icon name={icon} />{label}</NavLink>)}
          </nav>
          <div className="foot">
            <p className="muted small" style={{ overflowWrap: 'anywhere' }}>{user.email}</p>
            <button className="btn sm" onClick={logout}><Icon name="logout" size={16} />Sign out</button>
          </div>
        </aside>
        <main className="main"><Outlet /></main>
      </div>
    </AdminProvider>
  );
}
