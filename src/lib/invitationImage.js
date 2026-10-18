// Draws a 1080×1920 invitation card on a canvas, in the style of a printed
// invitation: arched ornamental frame, floral clusters, script names, details,
// message, and an optional couple illustration (config.card.art).
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
    title: (s) => `400 ${s}px "Amiri", serif`,
    body: (s) => `400 ${s}px "Amiri", serif`,
  },
  en: {
    names: (s) => `400 ${s}px "Parisienne", cursive`,
    joiner: (s) => `400 ${s}px "Parisienne", cursive`,
    label: (s) => `500 ${s}px "Cormorant Garamond", Georgia, serif`,
    title: (s) => `500 ${s}px "Cormorant Garamond", Georgia, serif`,
    body: (s) => `500 ${s}px "Cormorant Garamond", Georgia, serif`,
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

/** The page's floral SVG as a standalone image, with CSS colour variables resolved. */
function floralImage() {
  const svg = document.querySelector('.cover__floral');
  if (!svg) return Promise.resolve(null);
  const css = getComputedStyle(document.documentElement);
  const markup = svg.outerHTML
    .replace(/var\((--[\w-]+)\)/g, (_, name) => css.getPropertyValue(name).trim() || '#c48b86')
    .replace(/class="[^"]*"/, '')
    .replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"');
  return loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`).catch(() => null);
}

function cssVar(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
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

/** Thin gold rule with a small diamond and scroll dots in the middle. */
function ornament(ctx, y, half, c) {
  const cx = W / 2;
  ctx.save();
  ctx.strokeStyle = c.gold;
  ctx.fillStyle = c.gold;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx - half, y);
  ctx.lineTo(cx - 30, y);
  ctx.moveTo(cx + 30, y);
  ctx.lineTo(cx + half, y);
  ctx.stroke();
  for (const dx of [-half - 8, half + 8, -42, 42]) {
    ctx.beginPath();
    ctx.arc(cx + dx, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(cx, y - 12);
  ctx.lineTo(cx + 12, y);
  ctx.lineTo(cx, y + 12);
  ctx.lineTo(cx - 12, y);
  ctx.closePath();
  ctx.fillStyle = c.blushLight;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Arched frame (pointed arch on top) traced at inset `i`. */
function archFrame(ctx, i, shoulder, peak) {
  const l = i;
  const r = W - i;
  const b = H - i;
  ctx.beginPath();
  ctx.moveTo(l, b);
  ctx.lineTo(l, shoulder);
  ctx.bezierCurveTo(l, shoulder - 120, W / 2 - 160, peak + 40, W / 2, peak);
  ctx.bezierCurveTo(W / 2 + 160, peak + 40, r, shoulder - 120, r, shoulder);
  ctx.lineTo(r, b);
  ctx.closePath();
}

/** A cluster of floral sprigs around a corner point. */
function floralCluster(ctx, img, x, y, flipX, flipY, size, compact = false) {
  if (!img) return;
  const pieces = [
    { r: 0, s: 1, dx: 0, dy: 0 },
    { r: 0.55, s: 0.75, dx: 40, dy: 120 },
    { r: -0.5, s: 0.7, dx: 140, dy: -10 },
  ].filter((_, i) => !compact || i !== 1);
  for (const p of pieces) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.translate(p.dx, p.dy);
    ctx.rotate(p.r);
    const s = size * p.s;
    ctx.drawImage(img, -s * 0.05, -s * 0.95, s, s);
    ctx.restore();
  }
}

/** Renders the invitation card and resolves with a PNG Blob. */
export async function renderInvitationImage(lang, t) {
  const f = FONTS[lang];
  const c = {
    paper: '#f7f0e6',
    paperLight: '#fbf7f0',
    blush: cssVar('--blush', '#ebc9c3'),
    blushLight: cssVar('--blush-light', '#f6e3de'),
    rose: cssVar('--rose', '#c48b86'),
    roseDeep: cssVar('--rose-deep', '#9a5c58'),
    gold: cssVar('--gold', '#b39062'),
    goldDeep: cssVar('--gold-deep', '#85653c'),
    ink: '#2f221d',
    inkSoft: '#5e4b43',
  };

  await Promise.all(
    Object.values(f).map((fn) => document.fonts?.load(fn(40), 'أحمد Ahmed 0123').catch(() => null)),
  );
  const [floral, art] = await Promise.all([
    floralImage(),
    config.card.art ? loadImage(config.card.art).catch(() => null) : null,
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  if (art) drawArtCard(ctx, lang, t, f, c, art);
  else drawFramedCard(ctx, lang, t, f, c, floral);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  );
}

/** Names on one line: first · joiner · second, in reading order, centred at y. */
function drawNames(ctx, lang, t, f, c, y, size, maxWidth) {
  const parts = [
    { text: t.names.first, font: f.names(size), color: c.ink },
    { text: t.names.joiner, font: f.joiner(Math.round(size * 0.8)), color: c.rose },
    { text: t.names.second, font: f.names(size), color: c.ink },
  ];
  const gap = lang === 'ar' ? 30 : 26;
  parts.forEach((p) => {
    ctx.font = p.font;
    p.w = ctx.measureText(p.text).width;
  });
  const total = parts.reduce((s, p) => s + p.w, 0) + gap * 2;
  const k = Math.min(1, maxWidth / total);
  ctx.save();
  ctx.translate(W / 2, y);
  ctx.scale(k, k);
  let x = -total / 2;
  for (const p of lang === 'ar' ? [...parts].reverse() : parts) {
    ctx.font = p.font;
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, x + p.w / 2, 0);
    x += p.w + gap;
  }
  ctx.restore();
}

/** Text on paper at the top, the couple illustration filling the bottom. */
function drawArtCard(ctx, lang, t, f, c, art) {
  const center = (text, y) => ctx.fillText(text, W / 2, y);
  const maxText = 820;

  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, W, H);

  // Illustration: crop [top, bottom] of the source, full card width, bottom-aligned.
  const [ct, cb] = config.card.artCrop || [0, 1];
  const sy = art.naturalHeight * ct;
  const sh = art.naturalHeight * (cb - ct);
  const dh = (sh / art.naturalWidth) * W;
  const dy = H - dh;
  ctx.drawImage(art, 0, sy, art.naturalWidth, sh, 0, dy, W, dh);

  // Soft fade from the paper into the illustration.
  const fade = ctx.createLinearGradient(0, dy, 0, dy + 120);
  fade.addColorStop(0, c.paper);
  fade.addColorStop(1, 'rgba(247,240,230,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, dy - 1, W, 122);

  // Gentle paper glow behind the text.
  const glow = ctx.createRadialGradient(W / 2, dy * 0.45, 50, W / 2, dy * 0.45, dy * 0.8);
  glow.addColorStop(0, 'rgba(253,250,245,0.9)');
  glow.addColorStop(1, 'rgba(253,250,245,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, dy + 200);

  // Eyebrow.
  ctx.fillStyle = c.goldDeep;
  const eyebrow = lang === 'en' ? t.cover.eyebrow.toUpperCase() : t.cover.eyebrow;
  if (lang === 'en' && 'letterSpacing' in ctx) ctx.letterSpacing = '4px';
  fitFont(ctx, f.label, lang === 'en' ? 28 : 38, eyebrow, 720);
  center(eyebrow, 130);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ornament(ctx, 175, 120, c);

  drawNames(ctx, lang, t, f, c, 300, lang === 'ar' ? 124 : 122, 820);

  ctx.fillStyle = c.roseDeep;
  fitFont(ctx, f.label, lang === 'ar' ? 42 : 36, t.cover.type, maxText);
  center(t.cover.type, 378);

  ctx.fillStyle = c.ink;
  fitFont(ctx, f.title, 48, dateFull(lang), maxText);
  center(dateFull(lang), 460);
  ctx.fillStyle = c.roseDeep;
  fitFont(ctx, f.title, 44, timeText(lang), maxText);
  center(timeText(lang), 522);
  ctx.fillStyle = c.ink;
  fitFont(ctx, f.title, lang === 'ar' ? 46 : 44, t.venue.name, maxText);
  center(t.venue.name, 594);
  ctx.fillStyle = c.inkSoft;
  fitFont(ctx, f.body, 33, t.venue.location, maxText);
  center(t.venue.location, 643);

  ornament(ctx, 690, 110, c);

  ctx.fillStyle = c.inkSoft;
  ctx.font = f.body(lang === 'ar' ? 33 : 32);
  const lines = wrapLines(ctx, t.story.message, 840).slice(0, 4);
  const lh = lang === 'ar' ? 54 : 44;
  lines.forEach((line, i) => center(line, 748 + i * lh));

  // Thin double border over everything.
  ctx.strokeStyle = c.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,253,249,0.8)';
  ctx.strokeRect(48, 48, W - 96, H - 96);
}

/** Text-only card: arched ornamental frame with floral corners. */
function drawFramedCard(ctx, lang, t, f, c, floral) {
  const center = (text, y) => ctx.fillText(text, W / 2, y);

  // Paper background with soft warm vignette.
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 100, W / 2, H * 0.42, H * 0.75);
  glow.addColorStop(0, c.paperLight);
  glow.addColorStop(1, 'rgba(232,217,196,0.9)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Outer double border.
  ctx.strokeStyle = c.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // Arched inner frame: filled panel + double gold line + crest ornament.
  const shoulder = 420;
  const peak = 150;
  archFrame(ctx, 92, shoulder, peak);
  ctx.fillStyle = 'rgba(253,250,245,0.82)';
  ctx.fill();
  ctx.strokeStyle = c.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  archFrame(ctx, 106, shoulder + 6, peak + 16);
  ctx.strokeStyle = c.blush;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.save();
  ctx.fillStyle = c.gold;
  ctx.translate(W / 2, peak);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-9, -9, 18, 18);
  ctx.restore();

  // Floral clusters: top-left and both bottom corners.
  ctx.save();
  ctx.beginPath();
  ctx.rect(36, 36, W - 72, H - 72);
  ctx.clip();
  floralCluster(ctx, floral, 36, 230, false, true, 280, true);
  floralCluster(ctx, floral, 20, H - 40, false, false, 360);
  floralCluster(ctx, floral, W - 20, H - 40, true, false, 360);
  ctx.restore();

  const maxText = 760;

  // Eyebrow.
  ctx.fillStyle = c.goldDeep;
  const eyebrow = lang === 'en' ? t.cover.eyebrow.toUpperCase() : t.cover.eyebrow;
  if (lang === 'en' && 'letterSpacing' in ctx) ctx.letterSpacing = '4px';
  fitFont(ctx, f.label, lang === 'en' ? 28 : 38, eyebrow, 600);
  center(eyebrow, 370);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ornament(ctx, 420, 120, c);

  drawNames(ctx, lang, t, f, c, 590, lang === 'ar' ? 130 : 128, 740);

  // Event type.
  ctx.fillStyle = c.roseDeep;
  fitFont(ctx, f.label, lang === 'ar' ? 46 : 40, t.cover.type, maxText);
  center(t.cover.type, 680);

  // Details.
  ctx.fillStyle = c.ink;
  fitFont(ctx, f.title, lang === 'ar' ? 52 : 52, dateFull(lang), maxText);
  center(dateFull(lang), 790);
  ctx.fillStyle = c.roseDeep;
  fitFont(ctx, f.title, lang === 'ar' ? 48 : 48, timeText(lang), maxText);
  center(timeText(lang), 862);
  ctx.fillStyle = c.ink;
  fitFont(ctx, f.title, lang === 'ar' ? 50 : 48, t.venue.name, maxText);
  center(t.venue.name, 945);
  ctx.fillStyle = c.inkSoft;
  fitFont(ctx, f.body, lang === 'ar' ? 36 : 36, t.venue.location, maxText);
  center(t.venue.location, 1000);

  ornament(ctx, 1065, 110, c);

  // Invitation message.
  ctx.fillStyle = c.inkSoft;
  ctx.font = f.body(lang === 'ar' ? 38 : 38);
  const lines = wrapLines(ctx, t.story.message, 740).slice(0, 5);
  const lh = lang === 'ar' ? 62 : 52;
  lines.forEach((line, i) => center(line, 1140 + i * lh));
  const textEnd = 1140 + (lines.length - 1) * lh;

  // Closing line in script.
  ctx.fillStyle = c.roseDeep;
  fitFont(ctx, f.names, lang === 'ar' ? 64 : 72, t.closing.line, 680);
  center(t.closing.line, textEnd + 170);
  ornament(ctx, textEnd + 250, 90, c);
}
