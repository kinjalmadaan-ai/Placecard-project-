import { useState } from 'react';
import { api } from '../../api.js';
import { useLoad } from '../../hooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import WithEvent from '../../components/EventSelect.jsx';
import { Loading, PageHead, Badge, Icon, Empty, Confirm } from '../../components/ui.jsx';
import { AddGuestModal } from '../../components/GuestModals.jsx';
import { copyText, fmtDateTime } from '../../lib.js';

function InvitationTable({ event }) {
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(() => api(`/admin/events/${event.id}/guests`).then((d) => d.guests), [event.id]);
  const [adding, setAdding] = useState(null);
  const [revoke, setRevoke] = useState(null);
  const [busyId, setBusyId] = useState('');

  async function act(g, action, okMsg) {
    setBusyId(g.id);
    try { await api(`/admin/guests/${g.id}/${action}`, { method: 'POST' }); toast.success(okMsg); await reload(); }
    catch (e) { toast.error(e.message); } finally { setBusyId(''); setRevoke(null); }
  }

  return (
    <>
      <PageHead title="Invitations" sub={`Send, resend, share and revoke invitations for ${event.name}.`}>
        <button className="btn" onClick={() => setAdding('link')}><Icon name="link" size={16} />Shareable link</button>
        <button className="btn primary" onClick={() => setAdding('email')}><Icon name="mail" size={16} />Invite by email</button>
      </PageHead>
      {event.status !== 'published' && <div className="alert warn" style={{ marginBottom: '1rem' }}>This event is a {event.status}. Emails can only be sent once it is published, and guests cannot open invitations until then.</div>}
      <Loading loading={loading} error={error} onRetry={reload}>
        {!data?.length ? <Empty title="No invitations yet">Invite a guest by email, or create a link to share on WhatsApp or anywhere else.</Empty> : (
          <div className="tablewrap"><table className="tbl">
            <thead><tr><th>Guest</th><th>Type</th><th>Status</th><th>Last sent</th><th /></tr></thead>
            <tbody>{data.map((g) => {
              const st = g.invitation.status; const busy = busyId === g.id;
              return (
                <tr key={g.id}>
                  <td data-label="Guest"><strong>{g.name || <span className="muted">Unnamed link</span>}</strong><br /><span className="muted small">{g.email || 'Not claimed yet'}</span></td>
                  <td data-label="Type">{g.invitation.type === 'link' ? 'Link' : 'Email'}</td>
                  <td data-label="Status"><Badge kind={st} /></td>
                  <td data-label="Last sent">{g.invitation.lastSentAt ? `${fmtDateTime(g.invitation.lastSentAt)} (${g.invitation.sendCount}×)` : '—'}</td>
                  <td className="actions" data-label="">
                    <div className="row" style={{ justifyContent: 'flex-end' }}>
                      {st !== 'revoked' && <button className="btn sm" onClick={async () => { toast[(await copyText(g.invitation.link)) ? 'success' : 'error']('Invitation link copied'); }}><Icon name="copy" size={14} />Copy link</button>}
                      {g.email && st !== 'revoked' && <button className="btn sm" disabled={busy} onClick={() => act(g, 'send', g.invitation.sendCount ? 'Invitation resent' : 'Invitation sent')}>{g.invitation.sendCount ? 'Resend' : 'Send'}</button>}
                      {st === 'revoked' ? <button className="btn sm" disabled={busy} onClick={() => act(g, 'reinstate', 'Invitation reinstated')}>Reinstate</button> : <button className="btn sm danger" disabled={busy} onClick={() => setRevoke(g)}>Revoke</button>}
                    </div>
                  </td>
                </tr>);
            })}</tbody>
          </table></div>
        )}
      </Loading>
      {adding && <AddGuestModal event={event} mode={adding} onClose={() => setAdding(null)} onDone={reload} />}
      {revoke && <Confirm danger title="Revoke this invitation?" message={`${revoke.name || 'This link'} will no longer be able to open the invitation or change their RSVP. You can reinstate it later.`} confirmLabel="Revoke" busy={busyId === revoke.id} onConfirm={() => act(revoke, 'revoke', 'Invitation revoked')} onClose={() => setRevoke(null)} />}
    </>
  );
}
export default function Invitations() { return <WithEvent>{(event) => <InvitationTable key={event.id} event={event} />}</WithEvent>; }
