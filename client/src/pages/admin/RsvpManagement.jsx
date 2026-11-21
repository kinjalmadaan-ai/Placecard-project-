import { useState } from 'react';
import { api } from '../../api.js';
import { useLoad } from '../../hooks.js';
import WithEvent from '../../components/EventSelect.jsx';
import { Loading, PageHead, Bar, Empty } from '../../components/ui.jsx';
import { EditRsvpModal, GuestDetailModal } from '../../components/GuestModals.jsx';

function Board({ event }) {
  const { data, loading, error, reload } = useLoad(() => api(`/admin/events/${event.id}/guests`), [event.id]);
  const [edit, setEdit] = useState(null);
  const [detail, setDetail] = useState(null);
  const guests = (data?.guests || []).filter((g) => g.invitation.status !== 'revoked');
  const ev = data?.event || event;
  const groups = [['confirmed', 'Confirmed'], ['declined', 'Declined'], ['pending', 'Pending']];

  return (
    <>
      <PageHead title="RSVP management" sub={`Responses for ${event.name}`} />
      <Loading loading={loading} error={error} onRetry={reload}>
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{ev.attendingCount || 0} people attending{ev.capacity ? ` of ${ev.capacity} places` : ' (no capacity limit)'}</strong>
            {ev.capacity > 0 && <span className="muted small">{Math.max(0, ev.capacity - (ev.attendingCount || 0))} left</span>}
          </div>
          {ev.capacity > 0 && <div style={{ marginTop: '.5rem' }}><Bar value={ev.attendingCount || 0} max={ev.capacity} color={(ev.attendingCount || 0) >= ev.capacity ? 'var(--rose)' : 'var(--lav)'} /></div>}
        </div>
        {!guests.length ? <Empty title="No guests yet">Responses will be grouped here once you invite guests.</Empty> : (
          <div className="cols">
            {groups.map(([key, label]) => {
              const list = guests.filter((g) => g.rsvpStatus === key);
              return (
                <section className="col" key={key}>
                  <h2>{label}<span className="muted">{list.length}{key === 'confirmed' && ` · ${list.reduce((n, g) => n + g.rsvp.attendeeCount, 0)} people`}</span></h2>
                  {list.length === 0 && <p className="muted small">Nobody here yet.</p>}
                  {list.map((g) => (
                    <div className="person" key={g.id}>
                      <div style={{ minWidth: 0 }}>
                        <button className="btn link" onClick={() => setDetail(g)}><strong>{g.name || 'Link guest'}</strong></button>
                        <div className="muted small" style={{ overflowWrap: 'anywhere' }}>{key === 'confirmed' ? `${g.rsvp.attendeeCount} attending` : g.email || 'Not claimed yet'}</div>
                      </div>
                      <button className="btn sm" onClick={() => setEdit(g)}>{key === 'pending' ? 'Record' : 'Edit'}</button>
                    </div>))}
                </section>);
            })}
          </div>
        )}
      </Loading>
      {edit && <EditRsvpModal guest={edit} onClose={() => setEdit(null)} onChanged={reload} />}
      {detail && <GuestDetailModal guest={detail} event={event} onClose={() => setDetail(null)} onChanged={reload} />}
    </>
  );
}
export default function RsvpManagement() { return <WithEvent>{(event) => <Board key={event.id} event={event} />}</WithEvent>; }
