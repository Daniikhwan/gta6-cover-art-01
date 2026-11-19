// Neon Coast Cover Studio — editor wiring: photos, layout, grade, caption,
// per-panel crop (drag to pan, wheel / sliders to zoom), undo/redo and PNG
// export in the three common post sizes. Photos are read locally with
// FileReader and never leave the machine. A `?shot=` query hands control to
// ./shots.js for deterministic screenshots instead.
import { drawCoverArt, renderCoverCanvas, GRADES, EXPORT_SIZES } from './cover.js';
import { LAYOUTS, layoutPanels, panelCount } from './layouts.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const captionEl = document.getElementById('caption');
const subtitleEl = document.getElementById('subtitle');
const layoutEl = document.getElementById('layout');
const gradeEl = document.getElementById('grade');
const sizeEl = document.getElementById('size');
const zoomEl = document.getElementById('zoom');
const panXEl = document.getElementById('panX');
const panYEl = document.getElementById('panY');
const selectedLabel = document.getElementById('selectedLabel');

export const state = {
  layout: 'comic',
  grade: 'sunset',
  size: 'square',
  caption: 'Sunset Heist',
  subtitle: 'neon coast nights',
  seed: 20261119,
  photos: [null, null],
  panels: [
    { photo: 0, ox: 0, oy: 0, zoom: 1 },
    { photo: 1, ox: 0, oy: 0, zoom: 1 },
    { photo: 0, ox: 0, oy: 0, zoom: 1 },
    { photo: 1, ox: 0, oy: 0, zoom: 1 },
  ],
};
let selected = 0;

// Undo / redo snapshots of everything except the photo pixels.
const undoStack = [];
const redoStack = [];
function snapshotState() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, size: state.size,
    caption: state.caption, subtitle: state.subtitle, seed: state.seed,
    panels: state.panels, selected,
  });
}
function restoreSnapshot(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  selected = s.selected;
  syncControls();
}
export function pushHistory() {
  undoStack.push(snapshotState());
  if (undoStack.length > 40) undoStack.shift();
  redoStack.length = 0;
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshotState());
  restoreSnapshot(undoStack.pop());
  redraw();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshotState());
  restoreSnapshot(redoStack.pop());
  redraw();
}

function sizeFor(id) {
  return EXPORT_SIZES.find((s) => s.id === id) || EXPORT_SIZES[0];
}

function redraw() {
  const size = sizeFor(state.size);
  canvas.width = size.w;
  canvas.height = size.h;
  drawCoverArt(ctx, size.w, size.h, state);
  // Selected-panel outline, drawn in preview space.
  const layout = layoutPanels(state.layout, size.w, size.h);
  const rect = layout.panels[selected];
  if (rect && !document.body.classList.contains('shot-cover')) {
    ctx.save();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = Math.max(4, size.w * 0.006);
    ctx.setLineDash([18, 10]);
    ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
    ctx.restore();
  }
}

function syncControls() {
  captionEl.value = state.caption;
  subtitleEl.value = state.subtitle;
  layoutEl.value = state.layout;
  gradeEl.value = state.grade;
  sizeEl.value = state.size;
  const pan = state.panels[selected];
  zoomEl.value = String(pan.zoom);
  panXEl.value = String(pan.ox);
  panYEl.value = String(pan.oy);
  selectedLabel.textContent = `Panel ${selected + 1} of ${panelCount(state.layout)} selected — photo ${pan.photo + 1}`;
}

function fillPanels(mode) {
  pushHistory();
  const n = panelCount(state.layout);
  for (let i = 0; i < n; i++) {
    state.panels[i].photo = mode === 'one' ? 0 : i % 2;
  }
  redraw();
}

/** Loads an image from a URL, resolving to the image once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadPhotoSlot(slot, file) {
  const url = URL.createObjectURL(file);
  try {
    state.photos[slot] = await loadImage(url);
    pushHistory();
    redraw();
    statusEl.textContent = `Photo ${slot + 1} loaded — drag it inside its panel to crop.`;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadSample(name, slot) {
  state.photos[slot] = await loadImage(`samples/${name}.jpg`);
  redraw();
}

function exportCover(sizeId) {
  const size = sizeFor(sizeId);
  const out = renderCoverCanvas(size.w, size.h, state);
  out.toBlob((blob) => {
    if (!blob) { statusEl.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    statusEl.textContent = `Saved neon-coast-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
}

// Populate the layout and grade menus from the engine's own lists.
for (const l of LAYOUTS) {
  const o = document.createElement('option');
  o.value = l.id; o.textContent = `${l.label} — ${l.hint}`;
  layoutEl.appendChild(o);
}
for (const g of GRADES) {
  const o = document.createElement('option');
  o.value = g.id; o.textContent = `${g.label} — ${g.hint}`;
  gradeEl.appendChild(o);
}
layoutEl.value = state.layout;
gradeEl.value = state.grade;

document.getElementById('photoA').addEventListener('change', (e) => {
  if (e.target.files[0]) loadPhotoSlot(0, e.target.files[0]);
});
document.getElementById('photoB').addEventListener('change', (e) => {
  if (e.target.files[0]) loadPhotoSlot(1, e.target.files[0]);
});
document.getElementById('sampleA').addEventListener('click', async () => { await loadSample('boulevard', 0); statusEl.textContent = 'Boulevard sample in Photo 1.'; });
document.getElementById('sampleB').addEventListener('click', async () => { await loadSample('pier', 1); statusEl.textContent = 'Pier sample in Photo 2.'; });
document.getElementById('fillOne').addEventListener('click', () => fillPanels('one'));
document.getElementById('fillAlt').addEventListener('click', () => fillPanels('alt'));

layoutEl.addEventListener('change', () => { pushHistory(); state.layout = layoutEl.value; selected = 0; syncControls(); redraw(); });
gradeEl.addEventListener('change', () => { pushHistory(); state.grade = gradeEl.value; redraw(); });
sizeEl.addEventListener('change', () => { pushHistory(); state.size = sizeEl.value; redraw(); });
captionEl.addEventListener('input', () => { state.caption = captionEl.value; redraw(); });
subtitleEl.addEventListener('input', () => { state.subtitle = subtitleEl.value; redraw(); });
document.getElementById('idea1').addEventListener('click', () => { state.caption = 'Sunset Heist'; state.subtitle = 'neon coast nights'; syncControls(); redraw(); });
document.getElementById('idea2').addEventListener('click', () => { state.caption = 'Boulevard Queen'; state.subtitle = 'queen of the strip'; syncControls(); redraw(); });

function applyCrop() {
  const pan = state.panels[selected];
  pan.zoom = Number(zoomEl.value);
  pan.ox = Number(panXEl.value);
  pan.oy = Number(panYEl.value);
  redraw();
}
zoomEl.addEventListener('input', applyCrop);
panXEl.addEventListener('input', applyCrop);
panYEl.addEventListener('input', applyCrop);
zoomEl.addEventListener('change', pushHistory);
panXEl.addEventListener('change', pushHistory);
panYEl.addEventListener('change', pushHistory);

document.getElementById('usePhoto1').addEventListener('click', () => { pushHistory(); state.panels[selected].photo = 0; syncControls(); redraw(); });
document.getElementById('usePhoto2').addEventListener('click', () => { pushHistory(); state.panels[selected].photo = 1; syncControls(); redraw(); });
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
// Keyboard: Ctrl/Cmd+Z undoes, Ctrl/Cmd+Shift+Z (or Ctrl+Y) redoes.
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (!mod || e.target.matches('input, select, textarea')) return;
  if (e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
  else if ((e.key.toLowerCase() === 'z' && e.shiftKey) || e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
});
document.getElementById('shuffle').addEventListener('click', () => {
  pushHistory();
  const layouts = LAYOUTS.map((l) => l.id);
  const grades = GRADES.map((g) => g.id);
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.seed = Math.floor(Math.random() * 100000);
  selected = 0;
  syncControls();
  redraw();
});

document.getElementById('exportSquare').addEventListener('click', () => exportCover('square'));
document.getElementById('exportPortrait').addEventListener('click', () => exportCover('portrait'));
document.getElementById('exportWide').addEventListener('click', () => exportCover('wide'));

// Click a panel to select it; drag inside it to pan its photo; wheel zooms it.
function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  const px = (clientX - r.left) * sx;
  const py = (clientY - r.top) * sy;
  const layout = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const p = layout.panels[i];
    if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) return i;
  }
  return -1;
}
let dragging = false;
let lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  if (i !== selected) { selected = i; syncControls(); redraw(); }
  dragging = true;
  lastX = e.clientX; lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const r = canvas.getBoundingClientRect();
  const pan = state.panels[selected];
  pan.ox += ((e.clientX - lastX) / r.width) * 1.6;
  pan.oy += ((e.clientY - lastY) / r.height) * 1.6;
  pan.ox = Math.max(-1, Math.min(1, pan.ox));
  pan.oy = Math.max(-1, Math.min(1, pan.oy));
  lastX = e.clientX; lastY = e.clientY;
  panXEl.value = String(pan.ox);
  panYEl.value = String(pan.oy);
  redraw();
});
canvas.addEventListener('pointerup', () => { if (dragging) { dragging = false; pushHistory(); } });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const pan = state.panels[selected];
  pan.zoom = Math.max(1, Math.min(2.5, pan.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  zoomEl.value = String(pan.zoom);
  redraw();
}, { passive: false });

// Deterministic screenshot scenes, or the live editor with sample photos.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, { state, loadSample, redraw, syncControls, exportCover, canvas });
} else {
  document.fonts.ready.then(() => redraw());
  loadSample('boulevard', 0).then(() => loadSample('pier', 1)).catch(() => {});
  syncControls();
  redraw();
}

export { redraw, exportCover, syncControls };
