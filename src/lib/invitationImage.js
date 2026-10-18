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

/** Wraps `text` into the fewest lines that fit `maxWidth`, with lines of similar length. */
function balancedLines(ctx, text, maxWidth) {
  const count = wrapLines(ctx, text, maxWidth).length;
  let lo = maxWidth * 0.3;
  let hi = maxWidth;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (wrapLines(ctx, text, mid).length <= count) hi = mid;
    else lo = mid;
  }
  return wrapLines(ctx, text, hi);
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
  const optional = (src) => (src ? loadImage(src).catch(() => null) : null);
  const [floral, bg, cutout] = await Promise.all([
    floralImage(),
    optional(config.card.background),
    optional(config.card.art),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.direction = lang === 'ar' ? 'rtl' : 'ltr';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  drawFramedCard(ctx, lang, t, f, c, floral, bg, cutout);

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

/** Average colour of a region of the illustration (fractions), as an [r,g,b] array. */
function sampleColor(art, [x0, x1], [y0, y1]) {
  const off = document.createElement('canvas');
  off.width = 1;
  off.height = 1;
  const o = off.getContext('2d');
  o.imageSmoothingQuality = 'high';
  const sw = art.naturalWidth * (x1 - x0);
  const sh = art.naturalHeight * (y1 - y0);
  o.drawImage(art, art.naturalWidth * x0, art.naturalHeight * y0, sw, sh, 0, 0, 1, 1);
  const [r, g, b] = o.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

/**
 * Draws a painted patch cut from the illustration (fractions `sx`/`sy`) into the
 * box (x, y, w, h), fading out radially from the `anchor` corner ('tl'|'tr'|'bl'|'br').
 * The patch is flipped to match the anchor, assuming the source sits top-left.
 */
function paintedPatch(ctx, art, sx, sy, x, y, w, h, anchor) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const o = off.getContext('2d');
  const flipX = anchor.includes('r');
  const flipY = anchor.includes('b');
  o.translate(flipX ? w : 0, flipY ? h : 0);
  o.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  o.drawImage(
    art,
    art.naturalWidth * sx[0], art.naturalHeight * sy[0],
    art.naturalWidth * (sx[1] - sx[0]), art.naturalHeight * (sy[1] - sy[0]),
    0, 0, w, h,
  );
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalCompositeOperation = 'destination-in';
  const cx = anchor.includes('r') ? w : 0;
  const cy = anchor.includes('b') ? h : 0;
  const r = Math.min(w, h); // fully transparent before the patch's inner edges
  const g = o.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
  g.addColorStop(0, 'rgba(0,0,0,1)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  o.fillStyle = g;
  o.fillRect(0, 0, w, h);
  ctx.drawImage(off, x, y);
}

/**
 * Couple cut-out on the right, its bottom edge faded into the paper.
 * Returns `leftEdge(y0, y1)`: the leftmost x the couple occupies between two
 * card y positions, so text can wrap around their silhouette.
 */
function drawCouple(ctx, cutout) {
  const w = config.card.artWidth || 470;
  const h = Math.round((cutout.naturalHeight / cutout.naturalWidth) * w);
  const x0 = W - 30 - w;
  const y0 = config.card.artTop ?? 1100;
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const o = off.getContext('2d');
  o.drawImage(cutout, 0, 0, w, h);
  const alpha = o.getImageData(0, 0, w, h).data;
  o.globalCompositeOperation = 'destination-in';
  const fade = o.createLinearGradient(0, h * 0.72, 0, h);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  o.fillStyle = fade;
  o.fillRect(0, 0, w, h);
  ctx.drawImage(off, x0, y0);

  // Leftmost opaque column per row of the cut-out.
  const rowLeft = new Array(h).fill(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha[(y * w + x) * 4 + 3] > 40) {
        rowLeft[y] = x;
        break;
      }
    }
  }
  return (ya, yb) => {
    let min = w;
    for (let y = Math.max(0, Math.floor(ya - y0)); y <= Math.min(h - 1, Math.ceil(yb - y0)); y++) {
      min = Math.min(min, rowLeft[y]);
    }
    return x0 + min;
  };
}

/**
 * Lays `text` out line by line between `left` and the couple's silhouette,
 * each line centred in the room it has. Returns the y after the last line.
 */
function wrapAroundCouple(ctx, text, y, lh, left, edgeAt, gap, maxRight) {
  const words = text.split(/\s+/);
  let line = '';
  const flush = (content) => {
    const right = Math.min(maxRight, edgeAt(y - lh * 0.8, y + lh * 0.25) - gap);
    ctx.fillText(content, (left + right) / 2, y);
    y += lh;
  };
  for (const word of words) {
    const right = Math.min(maxRight, edgeAt(y - lh * 0.8, y + lh * 0.25) - gap);
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > right - left) {
      flush(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) flush(line);
  return y;
}

/** Arched frame; painted flowers from `bg`, couple cut-out bottom-right (both optional). */
function drawFramedCard(ctx, lang, t, f, c, floral, bg, cutout) {
  const center = (text, y) => ctx.fillText(text, W / 2, y);
  const art = bg;

  // Paper background: the illustration's own paper tone when there is one.
  const [pr, pg, pb] = art ? sampleColor(art, [0.42, 0.72], [0.01, 0.09]) : [247, 240, 230];
  ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 100, W / 2, H * 0.42, H * 0.75);
  glow.addColorStop(0, 'rgba(255,252,248,0.75)');
  glow.addColorStop(1, `rgba(${pr - 14},${pg - 16},${pb - 18},0.55)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  const shoulder = 420;
  const peak = 150;

  // Arched panel, lighter than the paper.
  archFrame(ctx, 92, shoulder, peak);
  ctx.fillStyle = 'rgba(255,252,248,0.55)';
  ctx.fill();

  // Painted flowers cut from the illustration, feathered into the corners.
  if (art) {
    // The illustration's top-left flower cluster, reused (flipped) in three corners.
    const sx = [0, 0.34];
    const sy = [0, 0.27];
    paintedPatch(ctx, art, sx, sy, 0, 0, 420, 500, 'tl');
    paintedPatch(ctx, art, sx, sy, W - 360, 0, 360, 430, 'tr');
    paintedPatch(ctx, art, sx, sy, 0, H - 500, 420, 500, 'bl');
  }

  // Outer double border.
  ctx.strokeStyle = c.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, W - 96, H - 96);

  // Arched frame: double gold line + crest ornament.
  archFrame(ctx, 92, shoulder, peak);
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

  if (!art) {
    // Drawn floral clusters when there is no illustration.
    ctx.save();
    ctx.beginPath();
    ctx.rect(36, 36, W - 72, H - 72);
    ctx.clip();
    floralCluster(ctx, floral, 36, 190, false, true, 250, true);
    floralCluster(ctx, floral, 20, H - 40, false, false, 360);
    if (!cutout) floralCluster(ctx, floral, W - 20, H - 40, true, false, 360);
    ctx.restore();
  }
  const edgeAt = cutout ? drawCouple(ctx, cutout) : null;

  const maxText = 800;

  // Eyebrow.
  ctx.fillStyle = c.goldDeep;
  const eyebrow = lang === 'en' ? t.cover.eyebrow.toUpperCase() : t.cover.eyebrow;
  if (lang === 'en' && 'letterSpacing' in ctx) ctx.letterSpacing = '4px';
  fitFont(ctx, f.label, lang === 'en' ? 32 : 44, eyebrow, 560);
  center(eyebrow, 352);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ornament(ctx, 405, 120, c);

  drawNames(ctx, lang, t, f, c, 565, 150, 800);

  // Event type.
  ctx.fillStyle = c.roseDeep;
  fitFont(ctx, f.label, lang === 'ar' ? 54 : 48, t.cover.type, maxText);
  center(t.cover.type, 665);

  // Details.
  ctx.fillStyle = c.ink;
  fitFont(ctx, f.title, 60, dateFull(lang), maxText);
  center(dateFull(lang), 775);
  ctx.fillStyle = c.roseDeep;
  fitFont(ctx, f.title, 56, timeText(lang), maxText);
  center(timeText(lang), 850);
  ctx.fillStyle = c.ink;
  fitFont(ctx, f.title, 58, t.venue.name, maxText);
  center(t.venue.name, 940);
  ctx.fillStyle = c.inkSoft;
  fitFont(ctx, f.body, 42, t.venue.location, maxText);
  center(t.venue.location, 1002);

  ornament(ctx, 1070, 110, c);

  if (edgeAt) {
    // Message + closing line wrap around the couple's silhouette, sharing their space.
    const left = 115;
    const maxRight = W - 115;
    ctx.fillStyle = c.inkSoft;
    ctx.font = f.body(lang === 'ar' ? 42 : 38);
    const y = wrapAroundCouple(ctx, t.story.message, 1160, lang === 'ar' ? 64 : 52, left, edgeAt, 28, maxRight);
    // Closing line: one fixed column (the narrowest room over its whole height).
    ctx.fillStyle = c.roseDeep;
    ctx.font = f.names(lang === 'ar' ? 52 : 50);
    const top = y + 45;
    const right = Math.min(maxRight, edgeAt(top - 60, top + 160) - 28);
    const clh = lang === 'ar' ? 72 : 62;
    balancedLines(ctx, t.closing.line, right - left).forEach((line, i) =>
      ctx.fillText(line, (left + right) / 2, top + i * clh));
    return;
  }

  // Invitation message.
  ctx.fillStyle = c.inkSoft;
  ctx.font = f.body(lang === 'ar' ? 44 : 42);
  const lines = wrapLines(ctx, t.story.message, 780).slice(0, 5);
  const lh = lang === 'ar' ? 68 : 56;
  lines.forEach((line, i) => center(line, 1150 + i * lh));
  const textEnd = 1150 + (lines.length - 1) * lh;

  {
    // Closing line in script.
    ctx.fillStyle = c.roseDeep;
    fitFont(ctx, f.names, lang === 'ar' ? 64 : 72, t.closing.line, 680);
    center(t.closing.line, textEnd + 170);
    ornament(ctx, textEnd + 250, 90, c);
  }
}
