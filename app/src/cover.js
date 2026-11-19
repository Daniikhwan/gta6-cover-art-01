// Cover renderer for Neon Coast Cover Studio: draws the whole poster onto a
// 2D canvas context at any size. Everything is procedural — sunset gradients,
// a striped sun disc, palm silhouettes, halftone dots, seeded grain and a
// vignette — over the user's own photos, with bold OFL lettering on top.
// No Rockstar artwork, logos or fonts are used anywhere in this file.
import { layoutPanels } from './layouts.js';

export const GRADES = [
  { id: 'sunset', label: 'Vice Sunset', hint: 'Warm golden hour' },
  { id: 'neon', label: 'Neon Nights', hint: 'Pink + teal glow' },
  { id: 'bw', label: 'Noir', hint: 'High-contrast black & white' },
  { id: 'halftone', label: 'Halftone', hint: 'Comic print dots' },
  { id: 'duotone', label: 'Duotone', hint: 'Magenta / cyan ink' },
];

// Deterministic random from a seed, so grain looks the same every export.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gradeFilter(grade) {
  switch (grade) {
    case 'sunset': return 'saturate(1.35) contrast(1.08) sepia(0.22) brightness(1.03)';
    case 'neon': return 'saturate(1.7) contrast(1.15) hue-rotate(-12deg) brightness(1.02)';
    case 'bw': return 'grayscale(1) contrast(1.25) brightness(1.05)';
    case 'halftone': return 'saturate(1.2) contrast(1.3)';
    case 'duotone': return 'grayscale(1) contrast(1.35) brightness(1.04)';
    default: return 'none';
  }
}

function gradeTint(ctx, W, H, grade) {
  // Colour wash laid over the whole cover after the photos are drawn.
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(255, 170, 60, 0.10)');
    g.addColorStop(0.6, 'rgba(255, 110, 90, 0.05)');
    g.addColorStop(1, 'rgba(190, 40, 120, 0.22)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else if (grade === 'neon') {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255, 0, 160, 0.14)');
    g.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 220, 255, 0.16)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else if (grade === 'duotone') {
    ctx.globalCompositeOperation = 'multiply';
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255, 0, 140, 0.55)');
    g.addColorStop(1, 'rgba(0, 190, 220, 0.55)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
  }
}

function drawSunsetSky(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#1b0f3b');
  g.addColorStop(0.35, '#6d1e6e');
  g.addColorStop(0.62, '#e8446c');
  g.addColorStop(0.82, '#ff8a3d');
  g.addColorStop(1, '#ffc46b');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Striped synthwave sun on its own canvas so the gaps stay transparent.
function drawStripedSun(ctx, cx, cy, r) {
  const off = document.createElement('canvas');
  off.width = off.height = Math.ceil(r * 2 + 4);
  const o = off.getContext('2d');
  const g = o.createLinearGradient(0, 0, 0, off.height);
  g.addColorStop(0, '#ffe95e');
  g.addColorStop(0.55, '#ff9a3d');
  g.addColorStop(1, '#ff2e88');
  o.fillStyle = g;
  o.beginPath(); o.arc(off.width / 2, off.height / 2, r, 0, Math.PI * 2); o.fill();
  o.globalCompositeOperation = 'destination-out';
  let y = off.height * 0.52;
  let thick = Math.max(2, r * 0.03);
  while (y < off.height) {
    o.fillRect(0, y, off.width, thick);
    y += thick + Math.max(4, r * 0.07);
    thick *= 1.5;
  }
  o.globalCompositeOperation = 'source-over';
  ctx.drawImage(off, cx - off.width / 2, cy - off.height / 2);
}

function drawPalm(ctx, x, y, s, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.strokeStyle = '#160a2e';
  ctx.fillStyle = '#160a2e';
  ctx.lineCap = 'round';
  // Trunk: a gentle curve leaning out of the corner.
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(14, -70, 44, -128);
  ctx.stroke();
  // Fronds fanning from the crown.
  const crownX = 44, crownY = -128;
  const fronds = [[-95, -38], [-70, -78], [-28, -102], [22, -100], [72, -72], [96, -28]];
  ctx.lineWidth = 7;
  for (const [dx, dy] of fronds) {
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(crownX + dx * 0.55, crownY + dy * 0.55 - 18, crownX + dx, crownY + dy + 26);
    ctx.stroke();
  }
  // Coconut cluster.
  ctx.beginPath(); ctx.arc(crownX - 6, crownY + 8, 6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(crownX + 8, crownY + 10, 6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawHalftoneDots(ctx, W, H, grade) {
  const cell = Math.max(14, Math.round(W / 64));
  ctx.save();
  ctx.fillStyle = grade === 'bw' ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.16)';
  for (let y = cell / 2; y < H * 0.3; y += cell) {
    for (let x = cell / 2; x < W; x += cell) {
      const r = (cell * 0.32) * (1 - y / (H * 0.34)) + 0.6;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawGrain(ctx, W, H, seed) {
  const rand = mulberry32(seed);
  const n = Math.floor((W * H) / 900);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = rand() * 0.09;
    ctx.fillStyle = rand() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    ctx.fillRect(rand() * W, rand() * H, 1.6, 1.6);
  }
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(10,0,25,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawPhotoCover(ctx, img, rect, pan, grade) {
  const { x, y, w, h } = rect;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih) * (pan.zoom || 1);
  const dw = iw * base;
  const dh = ih * base;
  const dx = x + (w - dw) / 2 + (pan.ox || 0) * w * 0.4;
  const dy = y + (h - dh) / 2 + (pan.oy || 0) * h * 0.4;
  ctx.save();
  ctx.filter = gradeFilter(grade);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawProceduralPanel(ctx, rect, seed, grade) {
  // A sunset backdrop for panels with no photo yet: sky, sun, palms.
  const { x, y, w, h } = rect;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.translate(x, y);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#2a1052'); g.addColorStop(0.55, '#c62d7a'); g.addColorStop(1, '#ffb347');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  drawStripedSun(ctx, w * 0.5, h * 0.42, Math.min(w, h) * 0.22);
  const s = Math.min(w, h) / 260;
  drawPalm(ctx, w * 0.06, h, s, false);
  drawPalm(ctx, w * 0.94, h, s * 0.85, true);
  ctx.restore();
  void seed; void grade;
}

function fitCaptionLines(ctx, text, maxWidth, startSize, font) {
  let size = startSize;
  let lines = [text];
  while (size > 20) {
    ctx.font = `${size}px ${font}`;
    const words = text.split(/\s+/);
    lines = [''];
    for (const word of words) {
      const trial = lines[lines.length - 1] ? lines[lines.length - 1] + ' ' + word : word;
      if (ctx.measureText(trial).width <= maxWidth) lines[lines.length - 1] = trial;
      else lines.push(word);
    }
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxWidth && lines.length <= 2) return { lines, size };
    size -= 4;
  }
  ctx.font = `${size}px ${font}`;
  return { lines, size };
}

function drawTitleBlock(ctx, W, H, title, state) {
  const t = title;
  const band = ctx.createLinearGradient(0, t.y, 0, t.y + t.h);
  band.addColorStop(0, 'rgba(16, 4, 40, 0.0)');
  band.addColorStop(0.22, 'rgba(16, 4, 40, 0.92)');
  band.addColorStop(1, '#100428');
  ctx.fillStyle = band;
  ctx.fillRect(t.x, t.y, t.w, t.h);
  // Neon rule above the caption.
  const rule = ctx.createLinearGradient(t.x, 0, t.x + t.w, 0);
  rule.addColorStop(0, '#ff2e88'); rule.addColorStop(0.5, '#ffc46b'); rule.addColorStop(1, '#00e5ff');
  ctx.fillStyle = rule;
  ctx.fillRect(t.x + W * 0.04, t.y + Math.max(3, H * 0.004), t.w - W * 0.08, Math.max(3, H * 0.005));

  const caption = (state.caption || 'SUNSET HEIST').trim().toUpperCase() || 'SUNSET HEIST';
  const maxW = t.w * 0.9;
  const subH = state.subtitle ? Math.round(H * 0.032) : 0;
  // Shrink the caption until caption + subtitle fit the band vertically,
  // so a two-line caption never collides with the subtitle.
  let startSize = Math.round(H * 0.085);
  let fitted = fitCaptionLines(ctx, caption, maxW, startSize, '"Archivo Black", "Bebas Neue", sans-serif');
  while (fitted.lines.length * fitted.size * 1.02 + subH > t.h * 0.94 && fitted.size > 20) {
    startSize -= 6;
    fitted = fitCaptionLines(ctx, caption, maxW, startSize, '"Archivo Black", "Bebas Neue", sans-serif');
  }
  const { lines, size } = fitted;
  const grad = ctx.createLinearGradient(0, t.y, 0, t.y + t.h);
  grad.addColorStop(0, '#fff3a0'); grad.addColorStop(0.5, '#ffb347'); grad.addColorStop(1, '#ff2e88');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lineH = size * 1.02;
  const totalH = lineH * lines.length;
  // Caption and subtitle stack as one block, centred in the band, so the
  // script subtitle always sits below the caption, never on top of it.
  const gap = Math.round(H * 0.006);
  const blockTop = t.y + (t.h - totalH - subH - gap) / 2;
  let cy = blockTop + lineH / 2;
  ctx.save();
  ctx.translate(W / 2, 0);
  ctx.rotate(-0.012);
  ctx.translate(-W / 2, 0);
  for (const line of lines) {
    ctx.font = `${size}px "Archivo Black", "Bebas Neue", sans-serif`;
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = '#160a2e';
    ctx.lineJoin = 'round';
    ctx.strokeText(line, W / 2, cy);
    ctx.fillStyle = grad;
    ctx.fillText(line, W / 2, cy);
    cy += lineH;
  }
  ctx.restore();
  if (state.subtitle) {
    ctx.font = `${Math.round(H * 0.034)}px Pacifico, cursive`;
    ctx.fillStyle = '#7df9ff';
    ctx.shadowColor = 'rgba(255, 46, 136, 0.9)';
    ctx.shadowBlur = Math.round(H * 0.012);
    ctx.fillText(state.subtitle, W / 2, blockTop + totalH + gap + subH / 2);
    ctx.shadowBlur = 0;
  }
}

// Draws the full cover. `state` carries layout, grade, caption, subtitle,
// photos (HTMLImageElement or null, up to 2) and panels [{photo, ox, oy, zoom}].
export function drawCoverArt(ctx, W, H, state) {
  const layout = layoutPanels(state.layout || 'comic', W, H);
  const seed = state.seed || 20261119;
  drawSunsetSky(ctx, W, H);
  // Thick white comic gutters: paint the whole panel area white first, so
  // the gaps between panels read as bold white seams, not sky.
  ctx.fillStyle = '#fff8f0';
  ctx.fillRect(0, 0, W, layout.title.y);
  // Sun disc peeking behind the panels on tilted / full layouts.
  if (state.layout === 'tilted' || state.layout === 'full') {
    drawStripedSun(ctx, W * 0.78, H * 0.24, Math.min(W, H) * 0.16);
  }
  const n = layout.panels.length;
  for (let i = 0; i < n; i++) {
    const rect = layout.panels[i];
    const pan = (state.panels && state.panels[i]) || { photo: 0, ox: 0, oy: 0, zoom: 1 };
    const img = state.photos ? state.photos[pan.photo] : null;
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    const local = { x: 0, y: 0, w: rect.w, h: rect.h };
    ctx.beginPath(); ctx.rect(0, 0, rect.w, rect.h); ctx.clip();
    if (img) drawPhotoCover(ctx, img, local, pan, state.grade || 'sunset');
    else drawProceduralPanel(ctx, local, seed + i, state.grade || 'sunset');
    if (layout.tilted) {
      // White snapshot border around tilted panels.
      ctx.lineWidth = Math.max(8, W * 0.012);
      ctx.strokeStyle = '#fff8f0';
      ctx.strokeRect(0, 0, rect.w, rect.h);
    }
    ctx.restore();
  }
  // Panel seams are already white: the panel area was painted white before
  // the panels were drawn, so no seam pass is needed here.
  gradeTint(ctx, W, H, state.grade || 'sunset');
  if (state.grade === 'halftone') drawHalftoneDots(ctx, W, H, state.grade);
  // Small palm silhouettes tucked into the bottom corners of the title band,
  // clipped so they never crawl up over the photos.
  const ps = Math.min(W, H) / 420;
  ctx.save();
  ctx.beginPath(); ctx.rect(0, layout.title.y, W, layout.title.h); ctx.clip();
  drawPalm(ctx, W * 0.02, H * 0.995, ps * 0.45, false);
  drawPalm(ctx, W * 0.98, H * 0.995, ps * 0.4, true);
  ctx.restore();
  drawTitleBlock(ctx, W, H, layout.title, state);
  drawGrain(ctx, W, H, seed);
  drawVignette(ctx, W, H);
}

// Renders the cover at export size onto a fresh canvas and returns it.
export function renderCoverCanvas(width, height, state) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  drawCoverArt(canvas.getContext('2d'), width, height, state);
  return canvas;
}

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', label: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];
