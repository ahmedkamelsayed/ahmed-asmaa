import { useEffect, useMemo, useState } from 'react';
import { dateFull, digits, eventEpoch } from '../lib/format.js';
import { useLang } from '../lib/lang.js';
import { getRemaining } from '../lib/time.js';

const UNITS = ['days', 'hours', 'minutes', 'seconds'];

// Dev-only: append ?now=2026-11-06T13:59:50Z to preview the countdown at another moment.
function clockOffset() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return 0;
  const fake = new URLSearchParams(window.location.search).get('now');
  const t = fake ? Date.parse(fake) : NaN;
  return Number.isNaN(t) ? 0 : t - Date.now();
}

export default function Countdown() {
  const { lang, t } = useLang();
  const target = useMemo(eventEpoch, []);
  // null until mounted: the prerendered HTML shows the date only.
  const [now, setNow] = useState(null);

  useEffect(() => {
    const offset = clockOffset();
    const tick = () => {
      const time = Date.now() + offset;
      setNow(time);
      return time;
    };
    if (tick() >= target) return undefined;
    const id = setInterval(() => {
      if (tick() >= target) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target]);

  const r = now === null ? null : getRemaining(target, now);
  const c = t.countdown;

  return (
    <section className="section countdown" aria-labelledby="countdown-title">
      <p className="eyebrow reveal">{c.eyebrow}</p>
      <h2 className="section__title reveal" id="countdown-title">{c.title}</h2>

      {r && !r.passed && (
        <div className="countdown__grid reveal" role="timer" aria-live="off">
          {UNITS.map((u) => (
            <div className="countdown__unit" key={u}>
              <span className="countdown__num">{digits(String(r[u]).padStart(2, '0'), lang)}</span>
              <span className="countdown__label">{c.units[u]}</span>
            </div>
          ))}
        </div>
      )}

      {r && r.passed && (
        <div className="countdown__passed reveal" role="status">
          <p className="countdown__passed-title">{c.passedTitle}</p>
          <p className="script countdown__passed-line">{c.passedLine}</p>
        </div>
      )}

      <p className="countdown__date reveal">{dateFull(lang)}</p>
    </section>
  );
}
