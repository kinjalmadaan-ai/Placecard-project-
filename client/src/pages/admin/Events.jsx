import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { useAdmin } from '../../context/AdminContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Loading, PageHead, Badge, Empty, Confirm, Bar } from '../../components/ui.jsx';
import { fmtShortDate } from '../../lib.js';

export default function Events() {
  const { events, loading, error, reload, setSelectedId } = useAdmin();
  const toast = useToast();
  const [del, setDel] = useState(null);
  const [busy, setBusy] = useState(false);

  async function toggle(e) {
    try { await api(`/admin/events/${e.id}/${e.status === 'published' ? 'unpublish' : 'publish'}`, { method: 'POST' }); toast.success(e.status === 'published' ? 'Event unpublished' : 'Event published'); reload(); }
    catch (err) { toast.error(err.message); }
  }
  async function remove() {
    setBusy(true);
    try { await api(`/admin/events/${del.id}`, { method: 'DELETE' }); toast.success('Event deleted'); setDel(null); reload(); }
    catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHead title="Events" sub="Create and manage everything you are hosting."><Link className="btn primary" to="/admin/events/new">Create event</Link></PageHead>
      <Loading loading={loading} error={error} onRetry={reload}>
        {events.length === 0 ? <Empty title="No events yet">Your events will be listed here once you create one.<br /><br /><Link className="btn primary" to="/admin/events/new">Create event</Link></Empty> : (
          <div className="tablewrap"><table className="tbl">
            <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Attending</th><th /></tr></thead>
            <tbody>{events.map((e) => (
              <tr key={e.id}>
                <td data-label="Event"><Link to={`/admin/events/${e.id}`}><strong>{e.name}</strong></Link><br /><span className="muted small">{e.category}</span></td>
                <td data-label="Date">{fmtShortDate(e.date)}</td>
                <td data-label="Status"><Badge kind={e.status} /></td>
                <td data-label="Attending" style={{ minWidth: 150 }}>{e.attendingCount || 0}{e.capacity ? ` / ${e.capacity}` : ''}{e.capacity > 0 && <Bar value={e.attendingCount || 0} max={e.capacity} />}</td>
                <td className="actions" data-label="">
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <Link className="btn sm" to={`/admin/events/${e.id}/edit`}>Edit</Link>
                    <button className="btn sm" onClick={() => toggle(e)}>{e.status === 'published' ? 'Unpublish' : 'Publish'}</button>
                    <Link className="btn sm" to="/admin/guests" onClick={() => setSelectedId(e.id)}>Guests</Link>
                    <button className="btn sm danger" onClick={() => setDel(e)}>Delete</button>
                  </div>
                </td>
              </tr>))}</tbody>
          </table></div>
        )}
      </Loading>
      {del && <Confirm danger title={`Delete “${del.name}”?`} message="This permanently deletes the event along with all of its guests, invitations and RSVPs. Invitation links will stop working." confirmLabel="Delete event" busy={busy} onConfirm={remove} onClose={() => setDel(null)} />}
    </>
  );
}
