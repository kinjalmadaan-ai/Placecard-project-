import { useMemo, useState } from 'react';
import { api } from '../../api.js';
import { useLoad } from '../../hooks.js';
import WithEvent from '../../components/EventSelect.jsx';
import { Loading, PageHead, Badge, Icon, Empty } from '../../components/ui.jsx';
import { AddGuestModal, GuestDetailModal } from '../../components/GuestModals.jsx';
import { downloadCsv, fmtDateTime, rsvpLabel } from '../../lib.js';

const PAGE = 10;

function GuestTable({ event }) {
  const { data, loading, error, reload } = useLoad(() => api(`/admin/events/${event.id}/guests`).then((d) => d.guests), [event.id]);
  const [q, setQ] = useState(''); const [rs, setRs] = useState('all'); const [inv, setInv] = useState('all');
  const [sort, setSort] = useState({ key: 'name', dir: 1 }); const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null); const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const get = { name: (g) => (g.name || '').toLowerCase(), rsvp: (g) => g.rsvpStatus, invitation: (g) => g.invitation.status, attendees: (g) => g.rsvp?.attendeeCount || 0, submitted: (g) => g.rsvp?.submittedAt || '' }[sort.key];
    return (data || [])
      .filter((g) => (!term || `${g.name} ${g.email || ''} ${g.phone || ''}`.toLowerCase().includes(term)) && (rs === 'all' || g.rsvpStatus === rs) && (inv === 'all' || g.invitation.status === inv))
      .sort((a, b) => (get(a) > get(b) ? 1 : get(a) < get(b) ? -1 : 0) * sort.dir);
  }, [data, q, rs, inv, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages);
  const shown = rows.slice((cur - 1) * PAGE, cur * PAGE);
  const th = (key, label) => <th aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}><button onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))}>{label}{sort.key === key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}</button></th>;

  function exportCsv() {
    downloadCsv(`${event.name.replace(/[^\w]+/g, '-')}-guests.csv`, [
      ['Name', 'Email', 'Phone', 'Invitation status', 'RSVP status', 'Attendees', 'Additional guests', 'Dietary', 'Accessibility', 'Message', 'Submitted'],
      ...rows.map((g) => [g.name, g.email, g.phone, g.invitation.status, rsvpLabel[g.rsvpStatus], g.rsvp?.attendeeCount ?? '', (g.rsvp?.additionalNames || []).join('; '), g.rsvp?.dietary, g.rsvp?.accessibility, g.rsvp?.message, g.rsvp ? fmtDateTime(g.rsvp.submittedAt) : '']),
    ]);
  }

  return (
    <>
      <PageHead title="Guests" sub={`${data?.length ?? 0} on the list for ${event.name}`}>
        <button className="btn" onClick={exportCsv} disabled={!rows.length}><Icon name="download" size={16} />Export CSV</button>
        <button className="btn primary" onClick={() => setAdding(true)}><Icon name="plus" size={16} />Add guest</button>
      </PageHead>
      <Loading loading={loading} error={error} onRetry={reload}>
        {!data?.length ? <Empty title="No guests yet">Add guests by email, or generate shareable links from the Invitations page.<br /><br /><button className="btn primary" onClick={() => setAdding(true)}>Add your first guest</button></Empty> : (
          <>
            <div className="toolbar">
              <div className="search grow"><Icon name="search" size={16} /><input type="search" placeholder="Search name, email or phone" aria-label="Search guests" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
              <select aria-label="Filter by RSVP" value={rs} onChange={(e) => { setRs(e.target.value); setPage(1); }}><option value="all">All RSVPs</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option><option value="pending">Pending</option></select>
              <select aria-label="Filter by invitation" value={inv} onChange={(e) => { setInv(e.target.value); setPage(1); }}><option value="all">All invitations</option><option value="pending">Pending</option><option value="accepted">Accepted</option><option value="expired">Expired</option><option value="revoked">Revoked</option></select>
            </div>
            {shown.length === 0 ? <Empty title="No matches">Try a different search or clear the filters.</Empty> : (
              <div className="tablewrap"><table className="tbl">
                <thead><tr>{th('name', 'Guest')}<th>Phone</th>{th('invitation', 'Invitation')}{th('rsvp', 'RSVP')}{th('attendees', 'Attendees')}{th('submitted', 'Submitted')}<th /></tr></thead>
                <tbody>{shown.map((g) => (
                  <tr key={g.id}>
                    <td data-label="Guest"><strong>{g.name || <span className="muted">Unnamed link</span>}</strong><br /><span className="muted small">{g.email || 'Shareable link'}</span></td>
                    <td data-label="Phone">{g.phone || '—'}</td>
                    <td data-label="Invitation"><Badge kind={g.invitation.status} /></td>
                    <td data-label="RSVP"><Badge kind={g.rsvpStatus}>{rsvpLabel[g.rsvpStatus]}</Badge></td>
                    <td data-label="Attendees">{g.rsvp?.status === 'confirmed' ? g.rsvp.attendeeCount : '—'}</td>
                    <td data-label="Submitted">{g.rsvp ? fmtDateTime(g.rsvp.submittedAt) : '—'}</td>
                    <td className="actions" data-label=""><button className="btn sm" onClick={() => setDetail(g)}>View</button></td>
                  </tr>))}</tbody>
              </table></div>
            )}
            <div className="pager"><span>{rows.length} guest{rows.length === 1 ? '' : 's'} · page {cur} of {pages}</span>
              <div className="row"><button className="btn sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)}>Previous</button><button className="btn sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)}>Next</button></div></div>
          </>
        )}
      </Loading>
      {detail && <GuestDetailModal guest={detail} event={event} onClose={() => setDetail(null)} onChanged={reload} />}
      {adding && <AddGuestModal event={event} mode="email" onClose={() => setAdding(false)} onDone={reload} />}
    </>
  );
}

export default function Guests() { return <WithEvent>{(event) => <GuestTable key={event.id} event={event} />}</WithEvent>; }
