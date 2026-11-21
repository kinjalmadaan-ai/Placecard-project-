import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../../api.js';
import { useLoad } from '../../hooks.js';
import { useAdmin } from '../../context/AdminContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Loading, PageHead, Badge, Stat } from '../../components/ui.jsx';
import EventInfo from '../../components/EventInfo.jsx';

export default function EventDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { reload: reloadEvents, setSelectedId } = useAdmin();
  const { data, loading, error, reload } = useLoad(() => api(`/admin/events/${id}/guests`), [id]);

  async function toggle() {
    const pub = data.event.status === 'published';
    try { await api(`/admin/events/${id}/${pub ? 'unpublish' : 'publish'}`, { method: 'POST' }); toast.success(pub ? 'Event unpublished' : 'Event published'); reload(); reloadEvents(); }
    catch (e) { toast.error(e.message); }
  }
  const go = (path) => { setSelectedId(id); nav(path); };

  return (
    <Loading loading={loading} error={error} onRetry={reload}>
      {data && (() => {
        const g = data.guests.filter((x) => x.invitation.status !== 'revoked');
        const count = (s) => g.filter((x) => x.rsvpStatus === s).length;
        return (
          <>
            <PageHead title={data.event.name} sub={<Badge kind={data.event.status} />}>
              <Link className="btn" to={`/admin/events/${id}/edit`}>Edit</Link>
              <button className="btn" onClick={toggle}>{data.event.status === 'published' ? 'Unpublish' : 'Publish'}</button>
              <button className="btn primary" onClick={() => go('/admin/invitations')}>Invite guests</button>
            </PageHead>
            <div className="stats">
              <Stat label="Invited" value={g.length} />
              <Stat label="Confirmed" value={count('confirmed')} />
              <Stat label="Declined" value={count('declined')} />
              <Stat label="Pending" value={count('pending')} />
              <Stat label="Places filled" value={`${data.event.attendingCount || 0}${data.event.capacity ? ` / ${data.event.capacity}` : ''}`} />
            </div>
            <div className="row" style={{ marginBottom: '1rem' }}>
              <button className="btn" onClick={() => go('/admin/guests')}>View guest list</button>
              <button className="btn" onClick={() => go('/admin/rsvps')}>View RSVPs</button>
            </div>
            <p className="muted small">This is how guests see the event:</p>
            <EventInfo event={data.event} />
          </>
        );
      })()}
    </Loading>
  );
}
