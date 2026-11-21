import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Loading, PageHead, Field, Alert } from '../../components/ui.jsx';
import { useLoad } from '../../hooks.js';

export default function Settings() {
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(() => api('/admin/settings').then((d) => d.settings), []);
  const [f, setF] = useState({ organisationName: '', senderName: '', replyTo: '', defaultMessage: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => { if (data) setF({ organisationName: data.organisationName || '', senderName: data.senderName || '', replyTo: data.replyTo || '', defaultMessage: data.defaultMessage || '' }); }, [data]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api('/admin/settings', { method: 'PUT', body: f }); toast.success('Settings saved'); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  }
  return (
    <>
      <PageHead title="Settings" sub="How your emails look to guests." />
      <Loading loading={loading} error={error} onRetry={reload}>
        <form className="card stack" style={{ maxWidth: 640 }} onSubmit={save}>
          <Field label="Organisation or host name" hint="Used in the invitation email, e.g. “Maya & Daniel”."><input maxLength={100} value={f.organisationName} onChange={set('organisationName')} /></Field>
          <Field label="Sender name" hint="Shown as the sender in guests’ inboxes. The address itself is set on the server."><input maxLength={60} value={f.senderName} onChange={set('senderName')} /></Field>
          <Field label="Reply-to email" hint="Where guest replies go. Optional."><input type="email" value={f.replyTo} onChange={set('replyTo')} /></Field>
          <Field label="Default invitation message" hint="Used when you don't write a personal message."><textarea rows={4} maxLength={1000} value={f.defaultMessage} onChange={set('defaultMessage')} /></Field>
          <Alert kind="error">{err}</Alert>
          <div className="row end"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button></div>
        </form>
      </Loading>
    </>
  );
}
