// The cover renderer: draws a multi-panel GTA-style poster on any canvas —
// photos per panel with their own crop, a colour grade, procedural
// decorations (sun disc, palm silhouettes, halftone, grain, vignette) and
// the bold title block. Pure canvas 2D, no network, no library.
import { layoutById, layoutRects, TITLE_BAND } from './layouts.js';

const GUTTER = 10;

/** Deterministic pseudo-random generator so grain looks the same every draw. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draws one photo into a panel rect, cover-fit, with per-panel zoom/pan. */
export function drawPanelPhoto(ctx, photo, rect, crop, grade) {
  if (!photo) return;
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (crop?.zoom ?? 1);
  const pw = iw * scale;
  const ph = ih * scale;
  const dx = rect.x + (rect.w - pw) / 2 + (crop?.ox ?? 0) * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + (crop?.oy ?? 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = grade === 'bw' || grade === 'duotone' ? 'grayscale(1) contrast(1.12) brightness(1.03)' : 'none';
  ctx.drawImage(photo, dx, dy, pw, ph);
  ctx.filter = 'none';
  paintGradeTint(ctx, rect, grade);
  ctx.restore();
}

/** The colour-grade tint washed over a photo panel. */
export function paintGradeTint(ctx, rect, grade) {
  const { x, y, w, h } = rect;
  let tint;
  if (grade === 'sunset') {
    tint = ctx.createLinearGradient(x, y, x, y + h);
    tint.addColorStop(0, 'rgba(255, 170, 60, 0.10)');
    tint.addColorStop(0.55, 'rgba(255, 90, 60, 0.08)');
    tint.addColorStop(1, 'rgba(190, 30, 110, 0.34)');
  } else if (grade === 'neon') {
    tint = ctx.createLinearGradient(x, y, x + w, y + h);
    tint.addColorStop(0, 'rgba(255, 46, 136, 0.28)');
    tint.addColorStop(0.5, 'rgba(120, 40, 200, 0.10)');
    tint.addColorStop(1, 'rgba(45, 226, 197, 0.26)');
  } else if (grade === 'vice') {
    tint = ctx.createLinearGradient(x, y + h, x, y);
    tint.addColorStop(0, 'rgba(255, 140, 40, 0.30)');
    tint.addColorStop(1, 'rgba(20, 190, 180, 0.22)');
  } else if (grade === 'duotone') {
    tint = ctx.createLinearGradient(x, y, x + w, y + h);
    tint.addColorStop(0, 'rgba(255, 46, 136, 0.30)');
    tint.addColorStop(1, 'rgba(0, 180, 200, 0.28)');
  } else if (grade === 'halftone') {
    tint = ctx.createLinearGradient(x, y, x, y + h);
    tint.addColorStop(0, 'rgba(255, 170, 60, 0.08)');
    tint.addColorStop(1, 'rgba(160, 20, 110, 0.26)');
  } else {
    tint = ctx.createLinearGradient(x, y, x, y + h);
    tint.addColorStop(0, 'rgba(255, 255, 255, 0.04)');
    tint.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
  }
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = tint;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

/** A retro striped sun disc, drawn with horizontal slice gaps. */
export function drawSunDisc(ctx, cx, cy, r) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
  glow.addColorStop(0, 'rgba(255, 190, 80, 0.55)');
  glow.addColorStop(1, 'rgba(255, 190, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 1.7, cy - r * 1.7, r * 3.4, r * 3.4);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, '#ffe066');
  disc.addColorStop(0.45, '#ff9a3d');
  disc.addColorStop(1, '#ff2e88');
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = disc;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(43, 10, 60, 0.85)';
  let gapY = cy + r * 0.05;
  let gapH = r * 0.05;
  while (gapY < cy + r) {
    ctx.fillRect(cx - r, gapY, r * 2, gapH);
    gapY += gapH + r * 0.16;
    gapH *= 1.35;
  }
  ctx.restore();
}

/** One palm silhouette: a curved trunk and seven drooping fronds. */
export function drawPalm(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.09;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(0.12, -0.55, 0.42, -0.95);
  ctx.stroke();
  ctx.translate(0.42, -0.95);
  for (let i = 0; i < 5; i++) {
    const a = (-175 + i * 32) * (Math.PI / 180);
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(0.34, -0.1, 0.74, 0.1);
    ctx.quadraticCurveTo(0.34, 0.16, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/** Rows of halftone dots fading down the title band. */
export function drawHalftoneDots(ctx, band, color) {
  const step = Math.max(14, band.h / 11);
  ctx.save();
  for (let row = 0; row * step < band.h; row++) {
    for (let col = 0; col * step < band.w + step; col++) {
      const px = band.x + col * step + (row % 2 ? step / 2 : 0);
      const py = band.y + row * step;
      const r = (step * 0.32 * (row + 1)) / 11;
      ctx.globalAlpha = 0.16 + row * 0.02;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Film grain: thousands of faint speckles, seeded so exports are stable. */
export function drawGrain(ctx, w, h, seed) {
  const rand = mulberry32(seed);
  ctx.save();
  ctx.globalAlpha = 0.06;
  const count = Math.floor((w * h) / 260);
  for (let i = 0; i < count; i++) {
    const v = rand() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
  }
  ctx.restore();
}

/** Soft dark corners so the poster feels printed, not flat. */
export function drawVignette(ctx, w, h) {
  const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(10, 2, 20, 0.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
}

/** Fits the title on one line, shrinking it until it fits the band. */
export function fitTitleFont(ctx, text, maxWidth, startSize, family) {
  let size = startSize;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 18) {
    size -= 2;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

/** The title block: gradient display type, neon script subtitle, rule lines. */
export function drawTitleBlock(ctx, band, title, subtitle, grade) {
  const { x, y, w, h } = band;
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, '#2b0f4d');
  bg.addColorStop(0.5, '#4d0f45');
  bg.addColorStop(1, '#160a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x, y, w, Math.max(4, h * 0.02));
  const text = (title || 'SUNSET HEIST').trim().toUpperCase();
  const cx = x + w / 2;
  ctx.save();
  ctx.translate(cx, y + h * 0.52);
  ctx.rotate(-0.018);
  ctx.translate(-cx, -(y + h * 0.52));
  const size = fitTitleFont(ctx, text, w * 0.92, h * 0.44, "'Archivo Black', sans-serif");
  const grad = ctx.createLinearGradient(x, y, x + w, y + h * 0.4);
  grad.addColorStop(0, '#fff7ae');
  grad.addColorStop(0.45, '#ffd166');
  grad.addColorStop(0.75, '#ff7a3d');
  grad.addColorStop(1, '#ff2e88');
  ctx.font = `${size}px 'Archivo Black', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#1c0630';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeText(text, cx, y + h * 0.46);
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, y + h * 0.46);
  ctx.restore();
  const sub = (subtitle || '').trim();
  if (sub) {
    ctx.save();
    ctx.font = `${Math.max(16, h * 0.115)}px 'Pacifico', cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = h * 0.09;
    ctx.fillStyle = '#7df9e8';
    ctx.fillText(sub, cx, y + h * 0.82);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(255, 209, 102, 0.9)';
  ctx.font = `bold ${Math.max(11, h * 0.055)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('★  SUNSET COAST  •  NEON EDITION  ★', cx, y + h * 0.14);
}

/**
 * Draws the whole cover on `canvas` from a state object:
 * photos (images), panelPhotos (photo index per panel), panelCrops,
 * layout id, grade id, title, subtitle and whether decorations are on.
 * Returns the panel rectangles in canvas pixels (for hit-testing).
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const layout = layoutById(state.layout);
  const rects = layoutRects(layout, w, h);
  const band = { x: TITLE_BAND.x * w, y: TITLE_BAND.y * h, w: TITLE_BAND.w * w, h: TITLE_BAND.h * h };
  const gutter = Math.max(4, Math.round(w * 0.006));
  ctx.fillStyle = '#160a2e';
  ctx.fillRect(0, 0, w, h);
  const photoArea = { x: 0, y: 0, w, h: band.y };
  if (state.decorations) {
    const sky = ctx.createLinearGradient(0, 0, 0, photoArea.h);
    sky.addColorStop(0, '#ff9a3d');
    sky.addColorStop(0.5, '#ff5e62');
    sky.addColorStop(1, '#7a1048');
    ctx.fillStyle = sky;
    ctx.fillRect(photoArea.x, photoArea.y, photoArea.w, photoArea.h);
    drawSunDisc(ctx, w * 0.5, photoArea.h * 0.42, Math.min(w, h) * 0.16);
  }
  rects.forEach((rect, i) => {
    const inner = { x: rect.x + gutter / 2, y: rect.y + gutter / 2, w: rect.w - gutter, h: rect.h - gutter };
    const photoIndex = state.panelPhotos?.[i] ?? 0;
    const photo = state.photos?.[photoIndex] ?? null;
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    }
    if (!photo) {
      const empty = ctx.createLinearGradient(inner.x, inner.y, inner.x, inner.y + inner.h);
      empty.addColorStop(0, '#3d2560');
      empty.addColorStop(1, '#1d1030');
      ctx.fillStyle = empty;
      ctx.fillRect(inner.x, inner.y, inner.w, inner.h);
    } else {
      drawPanelPhoto(ctx, photo, inner, state.panelCrops?.[i], state.grade);
    }
    ctx.restore();
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = gutter;
    ctx.strokeRect(inner.x, inner.y, inner.w, inner.h);
    ctx.restore();
  });
  if (state.grade === 'halftone') drawHalftoneDots(ctx, { x: 0, y: 0, w, h: band.y }, '#1c0630');
  drawTitleBlock(ctx, band, state.title, state.subtitle, state.grade);
  if (state.decorations) {
    // Palms grow from the cover's bottom corners, small enough that their
    // crowns stay below the title text and clear of the centred subtitle.
    const palm = Math.min(w, h) * 0.06;
    drawPalm(ctx, w * 0.012, h - 2, palm, '#0d0418');
    drawPalm(ctx, w * 0.988, h - 2, -palm * 0.85, '#0d0418');
    drawHalftoneDots(ctx, { x: w * 0.82, y: band.y + band.h * 0.55, w: w * 0.16, h: band.h * 0.4 }, '#ffd166');
  }
  drawVignette(ctx, w, h);
  if (state.decorations) drawGrain(ctx, w, h, 20261119);
  return rects;
}
