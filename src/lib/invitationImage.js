// Draws a 1080×1920 invitation card (photo + main details) on a canvas.
// Runs entirely in the browser; no external services.
import { config } from '../config.js';
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
    accent: (s) => `400 ${s}px "Aref Ruqaa", "Amiri", serif`,
  },
  en: {
    names: (s) => `300 ${s}px "Cormorant Garamond", Georgia, serif`,
    joiner: (s) => `400 ${s}px "Pinyon Script", cursive`,
    label: (s) => `500 ${s}px "Cormorant Garamond", Georgia, serif`,
    title: (s) => `500 ${s}px "Cormorant Garamond", Georgia, serif`,
    body: (s) => `italic 400 ${s}px "Cormorant Garamond", Georgia, serif`,
    accent: (s) => `400 ${s}px "Pinyon Script", cursive`,
  },
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src.slice(0, 60)}`));
    img.src = src;
  });
}

/** The page's floral SVG as a standalone image, with CSS colour variables resolved. */
async function floralImage() {
  const svg = document.querySelector('.cover__floral');
  if (!svg) return null;
  const css = getComputedStyle(document.documentElement);
  const markup = svg.outerHTML
    .replace(/var\((--[\w-]+)\)/g, (_, name) => css.getPropertyValue(name).trim() || '#c48b86')
    .replace(/class="[^"]*"/, '')
    .replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="440" height="440"');
  return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`).catch(() => null);
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

function archPath(ctx, x, y, w, h, bottomRadius) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h - bottomRadius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - bottomRadius, y + h);
  ctx.lineTo(x + bottomRadius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bottomRadius);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h, objectPosition) {
  const [px, py] = (objectPosition || '50% 50%').split(/\s+/).map((v) => parseFloat(v) / 100);
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.naturalWidth - sw) * px, (img.naturalHeight - sh) * py, sw, sh, x, y, w, h);
}

function divider(ctx, y, gold, blush) {
  const cx = W / 2;
  ctx.save();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 200, y);
  ctx.lineTo(cx - 34, y);
  ctx.moveTo(cx + 34, y);
  ctx.lineTo(cx + 200, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, y - 15);
  ctx.lineTo(cx + 15, y);
  ctx.lineTo(cx, y + 15);
  ctx.lineTo(cx - 15, y);
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
    paper: cssVar('--paper') || '#fffdf9',
    blush: cssVar('--blush') || '#ebc9c3',
    blushLight: cssVar('--blush-light') || '#f6e3de',
    rose: cssVar('--rose') || '#c48b86',
    roseDeep: cssVar('--rose-deep') || '#9a5c58',
    champagne: cssVar('--champagne') || '#efe3cf',
    gold: cssVar('--gold') || '#b39062',
    goldDeep: cssVar('--gold-deep') || '#85653c',
    ink: cssVar('--ink') || '#3b2a24',
    inkSoft: cssVar('--ink-soft') || '#66524a',
  };

  // Make sure every font used on the card is loaded before drawing.
  await Promise.all(
    Object.values(f).map((fn) => document.fonts?.load(fn(40), 'أحمد Ahmed 0123').catch(() => null)),
  );
  const [photo, floral] = await Promise.all([loadImage(config.photo.src), floralImage()]);

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
  const fs = 270;
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

  const maxText = W - 220;
  // Lines near the floral corners stay narrower so they never overlap.
  const cornerText = W - 2 * (fs + 10);

  // Eyebrow.
  ctx.fillStyle = colors.goldDeep;
  const eyebrow = lang === 'en' ? t.cover.eyebrow.toUpperCase() : t.cover.eyebrow;
  if (lang === 'en' && 'letterSpacing' in ctx) ctx.letterSpacing = '6px';
  fitFont(ctx, f.label, lang === 'en' ? 30 : 38, eyebrow, cornerText);
  ctx.fillText(eyebrow, W / 2, 205);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  // Arched photo with frame.
  const pw = 560;
  const ph = 700;
  const px = (W - pw) / 2;
  const py = 275;
  ctx.save();
  ctx.shadowColor = 'rgba(91,58,44,0.25)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  archPath(ctx, px - 14, py - 14, pw + 28, ph + 28, 26);
  ctx.fillStyle = colors.paper;
  ctx.fill();
  ctx.restore();
  ctx.save();
  archPath(ctx, px, py, pw, ph, 14);
  ctx.clip();
  drawCover(ctx, photo, px, py, pw, ph, config.photo.objectPosition);
  ctx.restore();
  archPath(ctx, px - 28, py - 28, pw + 56, ph + 56, 32);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Names: first · joiner · second, laid out in reading order.
  const nameSize = lang === 'ar' ? 118 : 112;
  const parts = [
    { text: t.names.first, font: f.names(nameSize), color: colors.ink },
    { text: t.names.joiner, font: f.joiner(Math.round(nameSize * 0.75)), color: colors.rose },
    { text: t.names.second, font: f.names(nameSize), color: colors.ink },
  ];
  const gap = 28;
  parts.forEach((p) => {
    ctx.font = p.font;
    p.w = ctx.measureText(p.text).width;
  });
  const total = parts.reduce((s, p) => s + p.w, 0) + gap * 2;
  const scale = Math.min(1, maxText / total);
  const ordered = lang === 'ar' ? [...parts].reverse() : parts;
  let x = W / 2 - (total * scale) / 2;
  const namesY = 1170;
  ctx.save();
  ctx.translate(W / 2, namesY);
  ctx.scale(scale, scale);
  ctx.translate(-W / 2, -namesY);
  x = W / 2 - total / 2;
  ordered.forEach((p) => {
    ctx.font = p.font;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, x + p.w / 2, namesY);
    x += p.w + gap;
  });
  ctx.restore();

  // Event type.
  ctx.fillStyle = colors.roseDeep;
  fitFont(ctx, f.label, lang === 'ar' ? 46 : 42, t.cover.type, maxText);
  ctx.fillText(t.cover.type, W / 2, 1265);

  divider(ctx, 1325, colors.gold, colors.blushLight);

  // Date, time, venue.
  ctx.fillStyle = colors.ink;
  fitFont(ctx, f.title, lang === 'ar' ? 58 : 60, dateFull(lang), maxText);
  ctx.fillText(dateFull(lang), W / 2, 1430);

  ctx.fillStyle = colors.roseDeep;
  fitFont(ctx, f.title, lang === 'ar' ? 52 : 54, timeText(lang), maxText);
  ctx.fillText(timeText(lang), W / 2, 1510);

  ctx.fillStyle = colors.ink;
  fitFont(ctx, f.title, lang === 'ar' ? 62 : 60, t.venue.name, maxText);
  ctx.fillText(t.venue.name, W / 2, 1625);

  ctx.fillStyle = colors.inkSoft;
  fitFont(ctx, f.body, lang === 'ar' ? 40 : 40, t.venue.location, maxText);
  ctx.fillText(t.venue.location, W / 2, 1690);

  // Closing accent.
  ctx.fillStyle = colors.roseDeep;
  fitFont(ctx, f.accent, lang === 'ar' ? 50 : 56, t.closing.line, cornerText);
  ctx.fillText(t.closing.line, W / 2, 1790);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}
