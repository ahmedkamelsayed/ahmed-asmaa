import { dateFull, timeText } from '../lib/format.js';
import { useLang } from '../lib/lang.js';
import { Icon } from './Ornaments.jsx';

export default function Details() {
  const { lang, t } = useLang();
  const items = [
    { icon: 'calendar', label: t.details.date, main: dateFull(lang) },
    { icon: 'clock', label: t.details.time, main: timeText(lang) },
    { icon: 'pin', label: t.details.venue, main: t.venue.name, sub: t.venue.location },
  ];

  return (
    <section className="section details" aria-labelledby="details-title">
      <p className="eyebrow reveal">{t.details.eyebrow}</p>
      <h2 className="section__title reveal" id="details-title">{t.details.title}</h2>

      <ul className="details__grid">
        {items.map((item) => (
          <li className="card reveal" key={item.icon}>
            <span className="card__icon"><Icon name={item.icon} /></span>
            <span className="card__label">{item.label}</span>
            <span className="card__main">{item.main}</span>
            {item.sub && <span className="card__sub">{item.sub}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
