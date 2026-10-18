import { config } from '../config.js';
import { useLang } from '../lib/lang.js';
import { FloralSprig, Icon } from './Ornaments.jsx';

export default function Location() {
  const { t } = useLang();
  return (
    <section className="section location" aria-labelledby="location-title">
      <div className="location__card reveal">
        <FloralSprig className="location__floral" />
        <p className="eyebrow">{t.location.eyebrow}</p>
        <h2 className="section__title" id="location-title">{t.location.title}</h2>
        <span className="location__pin"><Icon name="pin" /></span>
        <p className="location__venue">{t.venue.name}</p>
        <p className="location__desc">{t.venue.location}</p>
        <a className="btn btn--solid" href={config.venue.mapsUrl} target="_blank" rel="noopener noreferrer">
          <span>{t.location.button}</span>
          <Icon name="external" />
        </a>
      </div>
    </section>
  );
}
