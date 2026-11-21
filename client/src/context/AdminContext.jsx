import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { api } from '../api.js';
import { useLoad } from '../hooks.js';

const Ctx = createContext(null);
export const useAdmin = () => useContext(Ctx);

// Holds the admin's events and which event the Guests / Invitations / RSVP / Emails pages are looking at.
export function AdminProvider({ children }) {
  const { data, loading, error, reload } = useLoad(() => api('/admin/events').then((d) => d.events), []);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('placecard.event') || '');
  const events = data || [];
  const selected = events.find((e) => e.id === selectedId) || events[0] || null;
  useEffect(() => { if (selected) localStorage.setItem('placecard.event', selected.id); }, [selected]);
  const value = useMemo(() => ({ events, loading, error, reload, selected, setSelectedId }), [events, loading, error, reload, selected]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
