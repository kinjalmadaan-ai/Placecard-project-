import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext.jsx';
import { Empty, Spinner, Alert } from './ui.jsx';

// Wraps pages that work on one event at a time. Renders children only when an event is selected.
export default function WithEvent({ children }) {
  const { events, selected, setSelectedId, loading, error } = useAdmin();
  if (loading) return <Spinner />;
  if (error) return <Alert kind="error">{error}</Alert>;
  if (!events.length) return <Empty title="Create your first event">Guests, invitations and replies all belong to an event.<br /><br /><Link className="btn primary" to="/admin/events/new">Create event</Link></Empty>;
  return (
    <>
      <div className="toolbar">
        <select aria-label="Choose event" value={selected.id} onChange={(e) => setSelectedId(e.target.value)} style={{ maxWidth: 420 }}>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.date})</option>)}
        </select>
      </div>
      {children(selected)}
    </>
  );
}
