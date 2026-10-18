// Draws a 1080×1920 invitation card (text details + a simple couple avatar)
// on a canvas. Runs entirely in the browser; no external services.
import { dateFull, timeText } from './format.js';

const W = 1080;
const H = 1920;

const FONTS = {
  ar: {
    names: (s) => `700 ${s}px "Aref Ruqaa", "Amiri", serif`,
    joiner: (s) => `400 ${s}px "Aref Ruqaa", "Amiri", serif`,
    label: (s) => `500 ${s}px "Reem Kufi", "Amiri", sans-serif`,
    title: (s) => `700 ${s}px "Amiri", serif`,
    body: (s) => `400 ${s}px "Amiri", serif`,
  },
  en: {
    names: (s) => `400 ${s}px "Great Vibes", cursive`,
    joiner: (s) => `400 ${s}px "Great Vibes", cursive`,
    label: (s) => `500 ${s}px "Cormorant Garamond", Georgia, serif`,
    title: (s) => `500 ${s}px "Cormorant Garamond", Georgia, serif`,
    body: (s) => `italic 400 ${s}px "Cormorant Garamond", Georgia, serif`,
  },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

const svgImage = (markup, w, h) =>
  loadImage(
    `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      markup.replace('<svg', `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"`),
    )}`,
  ).catch(() => null);

/** The page's floral SVG as a standalone image, with CSS colour variables resolved. */
function floralImage() {
  const svg = document.querySelector('.cover__floral');
  if (!svg) return Promise.resolve(null);
  const css = getComputedStyle(document.documentElement);
  const markup = svg.outerHTML
    .replace(/var\((--[\w-]+)\)/g, (_, name) => css.getPropertyValue(name).trim() || '#c48b86')
    .replace(/class="[^"]*"/, '');
  return svgImage(markup, 440, 440);
}

/** Simple illustrated couple: groom (beard, teal shirt) and bride (hijab). */
function coupleAvatar(c) {
  const markup = `<svg viewBox="0 0 400 332">
    <circle cx="200" cy="178" r="150" fill="${c.blushLight}"/>
    <circle cx="200" cy="178" r="150" fill="none" stroke="${c.gold}" stroke-width="2"/>
    <defs><clipPath id="disc"><circle cx="200" cy="178" r="149"/></clipPath></defs>
    <g clip-path="url(#disc)">
      <!-- groom -->
      <path d="M40 320C42 240 72 210 110 200L125 216L140 200C178 210 208 240 210 320Z" fill="#2f5d5c"/>
      <path d="M110 200L125 224L140 200L133 195L125 208L117 195Z" fill="#244a49"/>
      <g fill="#e8e1d6"><circle cx="125" cy="244" r="3"/><circle cx="125" cy="268" r="3"/></g>
      <rect x="110" y="170" width="30" height="32" rx="8" fill="#a8704f"/>
      <ellipse cx="80" cy="132" rx="7" ry="11" fill="#b9805e"/>
      <ellipse cx="170" cy="132" rx="7" ry="11" fill="#b9805e"/>
      <ellipse cx="125" cy="128" rx="45" ry="53" fill="#b9805e"/>
      <path d="M80 120C78 80 104 64 127 64C154 64 173 82 171 118C163 102 150 94 127 94C107 94 91 102 80 120Z" fill="#2b211d"/>
      <path d="M82 134C84 168 104 184 125 184C146 184 166 168 168 134C162 150 152 158 141 160C133 154 117 154 109 160C98 158 88 150 82 134Z" fill="#2b211d"/>
      <path d="M111 161Q125 175 139 161Z" fill="#fff"/>
      <g fill="none" stroke="#2b211d" stroke-width="3.2" stroke-linecap="round">
        <path d="M101 126Q108 119 115 126"/><path d="M135 126Q142 119 149 126"/>
        <path d="M99 111L114 109"/><path d="M136 109L151 111"/>
      </g>
      <!-- bride -->
      <path d="M248 320L275 262L302 320Z" fill="#f6f1e8"/>
      <path d="M275 58C224 58 203 100 206 146C207 178 214 196 222 210C200 222 188 254 186 320L248 320L275 262L302 320L364 320C362 254 350 222 328 210C336 196 343 178 344 146C347 100 326 58 275 58Z" fill="#b8abaa"/>
      <path d="M236 214C254 238 296 238 314 214" fill="none" stroke="#9d8f8e" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="275" cy="140" rx="40" ry="49" fill="#9d8f8e"/>
      <ellipse cx="275" cy="142" rx="35" ry="44" fill="#e3b998"/>
      <g fill="${c.blush}" opacity="0.8"><circle cx="254" cy="154" r="7"/><circle cx="296" cy="154" r="7"/></g>
      <g fill="none" stroke="#3b2a24" stroke-width="2.8" stroke-linecap="round">
        <path d="M256 138Q263 131 270 138"/><path d="M280 138Q287 131 294 138"/>
      </g>
      <path d="M265 158Q275 167 285 158" fill="none" stroke="${c.roseDeep}" stroke-width="2.8" stroke-linecap="round"/>
    </g>
  </svg>`;
  return svgImage(markup, 800, 664);
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Sets font at `size`, shrinking until `text` fits `maxWidth`. */
function fitFont(ctx, fontFn, size, text, maxWidth) {
  let s = size;
  ctx.font = fontFn(s);
  while (ctx.measureText(text).width > maxWidth && s > 16) {
    s -= 2;
    ctx.font = fontFn(s);
  }
  return s;
}

/** Splits `text` into lines no wider than `maxWidth` with the current font. */
function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function divider(ctx, y, half, gold, blush) {
  const cx = W / 2;
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - half, y);
  ctx.lineTo(cx - 34, y);
  ctx.moveTo(cx + 34, y);
  ctx.lineTo(cx + half, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, y - 14);
  ctx.lineTo(cx + 14, y);
  ctx.lineTo(cx, y + 14);
  ctx.lineTo(cx - 14, y);
  ctx.closePath();
  ctx.fillStyle = blush;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Renders the invitation card and resolves with a PNG Blob. */
export async function renderInvitationImage(lang, t) {
  const f = FONTS[lang];
  const colors = {
    ivory: cssVar('--ivory') || '#fbf7f1',
    blush: cssVar('--blush') || '#ebc9c3',
    blushLight: cssVar('--blush-light') || '#f6e3de',
    rose: cssVar('--rose') || '#c48b86',
    roseDeep: cssVar('--rose-deep') || '#9a5c58',
    gold: cssVar('--gold') || '#b39062',
    goldDeep: cssVar('--gold-deep') || '#85653c',
    ink: cssVar('--ink') || '#3b2a24',
    inkSoft: cssVar('--ink-soft') || '#66524a',
  };

  // Make sure every font used on the card is loaded before drawing.
  await Promise.all(
    Object.values(f).map((fn) => document.fonts?.load(fn(40), 'أحمد Ahmed 0123').catch(() => null)),
  );
  const [floral, avatar] = await Promise.all([floralImage(), coupleAvatar(colors)]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Background with soft colour washes.
  ctx.fillStyle = colors.ivory;
  ctx.fillRect(0, 0, W, H);
  const wash = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(251,247,241,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  wash(W * 0.85, 120, 700, 'rgba(235,201,195,0.45)');
  wash(W * 0.1, H - 120, 700, 'rgba(239,227,207,0.75)');

  // Card with double border.
  const pad = 54;
  ctx.fillStyle = 'rgba(255,253,249,0.75)';
  ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);
  ctx.strokeStyle = colors.blush;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pad + 14, pad + 14, W - (pad + 14) * 2, H - (pad + 14) * 2);

  // Florals in two corners (same artwork as the page).
  const fs = 300;
  if (floral) {
    ctx.save();
    ctx.translate(4, 4 + fs);
    ctx.scale(1, -1);
    ctx.drawImage(floral, 0, 0, fs, fs);
    ctx.restore();
    ctx.save();
    ctx.translate(W - 4, H - 4 - fs);
    ctx.scale(-1, 1);
    ctx.drawImage(floral, 0, 0, fs, fs);
    ctx.restore();
  }

  const maxText = W - 240;
  const cornerText = W - 2 * (fs + 10);
  const center = (text, y) => ctx.fillText(text, W / 2, y);

  // Eyebrow.
  ctx.fillStyle = colors.goldDeep;
  const eyebrow = lang === 'en' ? t.cover.eyebrow.toUpperCase() : t.cover.eyebrow;
  if (lang === 'en' && 'letterSpacing' in ctx) ctx.letterSpacing = '5px';
  fitFont(ctx, f.label, lang === 'en' ? 30 : 40, eyebrow, cornerText);
  center(eyebrow, 300);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Names, stacked like the printed cover.
  ctx.fillStyle = colors.ink;
  const nameSize = lang === 'ar' ? 150 : 170;
  fitFont(ctx, f.names, nameSize, t.names.first, maxText);
  center(t.names.first, 480);
  ctx.fillStyle = colors.rose;
  ctx.font = f.joiner(lang === 'ar' ? 100 : 110);
  center(t.names.joiner, 585);
  ctx.fillStyle = colors.ink;
  fitFont(ctx, f.names, nameSize, t.names.second, maxText);
  center(t.names.second, 725);

  // Event type + divider.
  ctx.fillStyle = colors.roseDeep;
  fitFont(ctx, f.label, lang === 'ar' ? 50 : 46, t.cover.type, maxText);
  center(t.cover.type, 820);
  divider(ctx, 875, 220, colors.gold, colors.blushLight);

  // Avatar sits at the bottom; the text block is centred in the space above it.
  const aw = 380;
  const ah = Math.round((aw * 332) / 400);
  const ay = H - pad - 22 - ah;

  ctx.font = f.body(lang === 'ar' ? 40 : 40);
  const lines = wrapLines(ctx, t.story.message, 800).slice(0, 4);
  const lh = lang === 'ar' ? 66 : 54;
  const gaps = [95, 70, 84, 56]; // message→date, date→time, time→venue, venue→location
  const blockH = (lines.length - 1) * lh + gaps.reduce((a, b) => a + b, 0);
  const top = 955;
  const room = ay - 70 - top;
  let y = top + Math.max(0, (room - blockH) / 2);

  // Invitation message.
  ctx.fillStyle = colors.inkSoft;
  lines.forEach((line, i) => center(line, y + i * lh));
  y += (lines.length - 1) * lh + gaps[0];

  // Date, time, venue.
  ctx.fillStyle = colors.ink;
  fitFont(ctx, f.title, lang === 'ar' ? 56 : 58, dateFull(lang), maxText);
  center(dateFull(lang), y);
  y += gaps[1];
  ctx.fillStyle = colors.roseDeep;
  fitFont(ctx, f.title, lang === 'ar' ? 50 : 52, timeText(lang), maxText);
  center(timeText(lang), y);
  y += gaps[2];
  ctx.fillStyle = colors.ink;
  fitFont(ctx, f.title, lang === 'ar' ? 58 : 56, t.venue.name, maxText);
  center(t.venue.name, y);
  y += gaps[3];
  ctx.fillStyle = colors.inkSoft;
  fitFont(ctx, f.body, 38, t.venue.location, maxText);
  center(t.venue.location, y);

  // Couple avatar; groom on the side read first.
  if (avatar) {
    ctx.save();
    if (lang === 'ar') {
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(avatar, (W - aw) / 2, ay, aw, ah);
    ctx.restore();
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}
