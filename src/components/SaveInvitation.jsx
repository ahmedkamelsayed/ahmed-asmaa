import { useState } from 'react';
import { renderInvitationImage } from '../lib/invitationImage.js';
import { useLang } from '../lib/lang.js';
import { Icon } from './Ornaments.jsx';

// "Save invitation" — builds an image of the invitation and either opens the
// phone's share sheet (save to photos / send) or downloads it on desktop.
export default function SaveInvitation() {
  const { lang, t } = useLang();
  const s = t.save;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const blob = await renderInvitationImage(lang, t);
      const file = new File([blob], s.fileName, { type: 'image/png' });
      const touch = window.matchMedia('(pointer: coarse)').matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: t.meta.title });
          return;
        } catch (err) {
          if (err.name === 'AbortError') return; // guest closed the share sheet
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = s.fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err) {
      console.error(err);
      setMessage(s.failed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="save">
      <button type="button" className="btn btn--ghost" onClick={save} disabled={busy} aria-busy={busy}>
        <Icon name="download" />
        <span>{busy ? s.working : s.button}</span>
      </button>
      {message && <p className="save__msg" role="status">{message}</p>}
    </div>
  );
}
