import { config } from '../config.js';
import { useLang } from '../lib/lang.js';
import { Divider, FloralSprig } from './Ornaments.jsx';

export default function Story() {
  const { t } = useLang();
  const { photo } = config;
  return (
    <section className="section story" id="invitation" aria-labelledby="story-title">
      <figure className="story__photo reveal">
        <div className="frame">
          <img
            src={photo.src}
            alt={t.photoAlt}
            width={photo.width}
            height={photo.height}
            decoding="async"
            style={{ objectPosition: photo.objectPosition }}
          />
        </div>
        <FloralSprig className="story__floral" />
      </figure>

      <div className="story__text reveal">
        <p className="eyebrow">{t.story.eyebrow}</p>
        <h2 className="story__title" id="story-title">{t.story.title}</h2>
        <p className="story__message">{t.story.message}</p>
        <Divider />
        <p className="story__sign script">{t.names.together}</p>
      </div>
    </section>
  );
}
