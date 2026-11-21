import { useState } from 'react';
import { api } from '../../api.js';
import { useLoad } from '../../hooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import WithEvent from '../../components/EventSelect.jsx';
import { Loading, PageHead, Badge, Field, Confirm, Alert } from '../../components/ui.jsx';
import { fmtDateTime } from '../../lib.js';

function summary(r) {
  const parts = [`${r.sent} sent`]; if (r.skipped) parts.push(`${r.skipped} skipped (already sent today)`); if (r.failed) parts.push(`${r.failed} failed`);
  return parts.join(', ') + (r.errors?.length ? `. ${r.errors[0]}` : '');
}

function Comms({ event }) {
  const toast = useToast();
  const logs = useLoad(() => api(`/admin/email-logs?eventId=${event.id}`).then((d) => d.logs), [event.id]);
  const [note, setNote] = useState('');
  const [audience, setAudience] = useState('pending');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  async function run() {
    setBusy(true); setResult(null);
    try {
      const r = confirm === 'update' ? await api(`/admin/events/${event.id}/notify`, { method: 'POST', body: { note } }) : await api(`/admin/events/${event.id}/reminders`, { method: 'POST', body: { audience } });
      setResult({ kind: r.failed ? 'warn' : 'success', text: summary(r) }); logs.reload();
    } catch (e) { setResult({ kind: 'error', text: e.message }); } finally { setBusy(false); setConfirm(''); }
  }
  const unpublished = event.status !== 'published';

  return (
    <>
      <PageHead title="Email communications" sub={`Messages for ${event.name}`} />
      {unpublished && <div className="alert warn" style={{ marginBottom: '1rem' }}>Publish the event to send updates and reminders.</div>}
      <div className="grid g2">
        <div className="card stack">
          <h2>Send an event update</h2>
          <p className="muted small" style={{ margin: 0 }}>Tell every invited guest that details have changed. Limited to once every 5 minutes.</p>
          <Field label="Note to guests (optional)"><textarea rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="The ceremony now starts at 3:30 pm." /></Field>
          <button className="btn primary" disabled={unpublished || busy} onClick={() => setConfirm('update')}>Send update</button>
        </div>
        <div className="card stack">
          <h2>Send reminders</h2>
          <p className="muted small" style={{ margin: 0 }}>Reminders go out only when you press the button. Each guest gets at most one per day. Nothing here is sent automatically unless you set up the optional scheduler (see README).</p>
          <Field label="Who should get one?"><select value={audience} onChange={(e) => setAudience(e.target.value)}><option value="pending">Guests who have not replied</option><option value="confirmed">Guests who are attending</option><option value="all">Everyone except those who declined</option></select></Field>
          <button className="btn primary" disabled={unpublished || busy} onClick={() => setConfirm('reminder')}>Send reminders</button>
        </div>
      </div>
      {result && <div style={{ marginTop: '1rem' }}><Alert kind={result.kind}>{result.text}</Alert></div>}
      <h2 style={{ marginTop: '2rem' }}>Delivery log</h2>
      <Loading loading={logs.loading} error={logs.error} onRetry={logs.reload}>
        {!logs.data?.length ? <p className="muted">No emails have been sent for this event yet.</p> : (
          <div className="tablewrap"><table className="tbl">
            <thead><tr><th>When</th><th>To</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>{logs.data.map((l) => (
              <tr key={l.id}><td data-label="When">{fmtDateTime(l.createdAt)}</td><td data-label="To" style={{ overflowWrap: 'anywhere' }}>{l.to}</td><td data-label="Type">{l.type}</td>
                <td data-label="Status"><Badge kind={l.status} />{l.error && <div className="muted small">{l.error}</div>}</td></tr>))}</tbody>
          </table></div>
        )}
      </Loading>
      {confirm && <Confirm title={confirm === 'update' ? 'Send update to all guests?' : 'Send reminders now?'} message={confirm === 'update' ? 'Every invited guest with an email address will receive this update.' : 'Matching guests will each receive a reminder email.'} confirmLabel="Send" busy={busy} onConfirm={run} onClose={() => setConfirm('')} />}
    </>
  );
}
export default function Emails() { return <WithEvent>{(event) => <Comms key={event.id} event={event} />}</WithEvent>; }
