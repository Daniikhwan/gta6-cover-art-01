// Wires the Neon Coast Cover Studio page: photo uploads and samples, layout
// and grade chips, per-panel crop (click a panel, drag to pan, zoom slider),
// caption editing, and PNG export in 1080x1080, 1080x1350, 1920x1080.
// A `?shot=` query sets up a fixed scene for a screenshot (./shots.js).
import { drawCover } from './cover.js';
import { LAYOUTS, GRADES, EXPORT_SIZES, layoutById } from './layouts.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('coverCanvas');
const titleInput = document.getElementById('titleInput');
const subtitleInput = document.getElementById('subtitleInput');
const statusEl = document.getElementById('status');
const thumbsEl = document.getElementById('photoThumbs');
const panelLabel = document.getElementById('panelLabel');
const zoomRange = document.getElementById('zoomRange');
const zoomValue = document.getElementById('zoomValue');
const decorToggle = document.getElementById('decorToggle');

const state = {
  photos: [],
  photoNames: [],
  panelPhotos: [0, 1, 0, 1],
  panelCrops: [{ zoom: 1, ox: 0, oy: 0 }, { zoom: 1, ox: 0, oy: 0 }, { zoom: 1, ox: 0, oy: 0 }, { zoom: 1, ox: 0, oy: 0 }],
  selectedPanel: 0,
  selectedPhoto: 0,
  layout: 'comic',
  grade: 'sunset',
  title: 'SUNSET HEIST',
  subtitle: 'a story in neon & gold',
  size: 'wide',
  decorations: true,
};

let lastRects = [];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Redraws the live preview and remembers the panel rects for hit-testing. */
export function redraw() {
  const size = EXPORT_SIZES[state.size];
  canvas.width = size.w;
  canvas.height = size.h;
  lastRects = drawCover(canvas, state) || [];
  const layout = layoutById(state.layout);
  const panel = layout.panels[state.selectedPanel] ?? layout.panels[0];
  panelLabel.textContent = `Panel ${state.selectedPanel + 1} · ${panel.name}`;
  const crop = state.panelCrops[state.selectedPanel] ?? { zoom: 1, ox: 0, oy: 0 };
  zoomRange.value = String(crop.zoom);
  zoomValue.textContent = `${crop.zoom.toFixed(2)}×`;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function renderThumbs() {
  thumbsEl.innerHTML = '';
  if (state.photos.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'empty';
    empty.textContent = 'No photos yet — upload some or try a sample.';
    thumbsEl.appendChild(empty);
    return;
  }
  state.photos.forEach((photo, i) => {
    const thumb = document.createElement('img');
    thumb.src = photo.src;
    thumb.alt = state.photoNames[i] || `Photo ${i + 1}`;
    thumb.title = thumb.alt;
    if (i === state.selectedPhoto) thumb.classList.add('active');
    thumb.addEventListener('click', () => {
      state.selectedPhoto = i;
      state.panelPhotos[state.selectedPanel] = i;
      renderThumbs();
      redraw();
      setStatus(`${thumb.alt} is now in panel ${state.selectedPanel + 1}.`);
    });
    thumbsEl.appendChild(thumb);
  });
}

function buildChips(container, items, current, onPick) {
  container.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (item.id === current ? ' active' : '');
    btn.textContent = item.name;
    btn.addEventListener('click', () => {
      onPick(item.id);
      buildChips(container, items, item.id, onPick);
      redraw();
    });
    container.appendChild(btn);
  });
}

function refreshLayoutChips() {
  buildChips(document.getElementById('layoutButtons'), LAYOUTS, state.layout, (id) => {
    state.layout = id;
    state.selectedPanel = 0;
    setStatus(`Layout: ${layoutById(id).name}.`);
  });
}

function refreshGradeChips() {
  buildChips(document.getElementById('gradeButtons'), GRADES, state.grade, (id) => {
    state.grade = id;
    setStatus(`Grade: ${GRADES.find((g) => g.id === id).name}.`);
  });
}

function refreshSizeChips() {
  document.querySelectorAll('#sizeRadios .chip').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.size === state.size);
    btn.addEventListener('click', () => {
      state.size = btn.dataset.size;
      refreshSizeChips();
      redraw();
      setStatus(`Export size: ${EXPORT_SIZES[state.size].label}.`);
    }, { once: true });
  });
}

async function addPhotoFile(file) {
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  state.photos.push(img);
  state.photoNames.push(file.name);
  state.selectedPhoto = state.photos.length - 1;
  state.panelPhotos[state.selectedPanel] = state.selectedPhoto;
  renderThumbs();
  redraw();
  setStatus(`${file.name} loaded into panel ${state.selectedPanel + 1}.`);
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  const existing = state.photoNames.indexOf(name);
  if (existing >= 0) {
    state.selectedPhoto = existing;
  } else {
    state.photos.push(img);
    state.photoNames.push(name);
    state.selectedPhoto = state.photos.length - 1;
  }
  state.panelPhotos[state.selectedPanel] = state.selectedPhoto;
  renderThumbs();
  redraw();
  setStatus(`Sample ${name} loaded into panel ${state.selectedPanel + 1}.`);
}

/** Renders the cover at an export size and downloads it as a PNG. */
export async function exportCover(sizeId) {
  const size = EXPORT_SIZES[sizeId] ?? EXPORT_SIZES.wide;
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off, state);
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  setStatus(`Saved ${a.download} — share it anywhere.`);
  return blob;
}

function selectPanelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = ((clientX - rect.left) / rect.width) * canvas.width;
  const py = ((clientY - rect.top) / rect.height) * canvas.height;
  for (let i = lastRects.length - 1; i >= 0; i--) {
    const r = lastRects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) {
      state.selectedPanel = i;
      redraw();
      return true;
    }
  }
  return false;
}

let dragging = false;
let dragStart = null;
let dragCrop = null;

canvas.addEventListener('pointerdown', (e) => {
  if (!selectPanelAt(e.clientX, e.clientY)) return;
  dragging = true;
  dragStart = { x: e.clientX, y: e.clientY };
  dragCrop = { ...state.panelCrops[state.selectedPanel] };
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragging || !dragStart) return;
  const rect = canvas.getBoundingClientRect();
  const panel = lastRects[state.selectedPanel];
  if (!panel) return;
  const dx = ((e.clientX - dragStart.x) / rect.width) * (canvas.width / panel.w);
  const dy = ((e.clientY - dragStart.y) / rect.height) * (canvas.height / panel.h);
  const crop = state.panelCrops[state.selectedPanel];
  crop.ox = Math.max(-0.6, Math.min(0.6, dragCrop.ox + dx * 0.5));
  crop.oy = Math.max(-0.6, Math.min(0.6, dragCrop.oy + dy * 0.5));
  redraw();
});

canvas.addEventListener('pointerup', () => {
  dragging = false;
  dragStart = null;
  canvas.classList.remove('dragging');
});

document.getElementById('photoInput').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    try {
      await addPhotoFile(file);
    } catch {
      setStatus(`Could not read ${file.name}.`);
    }
  }
  e.target.value = '';
});
document.getElementById('sampleBoulevard').addEventListener('click', () => loadSample('boulevard'));
document.getElementById('samplePier').addEventListener('click', () => loadSample('pier'));
document.getElementById('fillAllBtn').addEventListener('click', () => {
  state.panelPhotos = state.panelPhotos.map(() => state.selectedPhoto);
  redraw();
  setStatus('Every panel now shows the selected photo.');
});
document.getElementById('prevPanelBtn').addEventListener('click', () => {
  const n = layoutById(state.layout).panels.length;
  state.selectedPanel = (state.selectedPanel - 1 + n) % n;
  redraw();
});
document.getElementById('nextPanelBtn').addEventListener('click', () => {
  const n = layoutById(state.layout).panels.length;
  state.selectedPanel = (state.selectedPanel + 1) % n;
  redraw();
});
document.getElementById('fitBtn').addEventListener('click', () => {
  state.panelCrops[state.selectedPanel] = { zoom: 1, ox: 0, oy: 0 };
  redraw();
  setStatus('Crop reset for this panel.');
});
document.getElementById('shuffleBtn').addEventListener('click', () => {
  const n = state.photos.length;
  if (n < 2) {
    setStatus('Load a second photo (or a sample) to shuffle.');
    return;
  }
  state.panelPhotos = state.panelPhotos.map(() => Math.floor(Math.random() * n));
  redraw();
  setStatus('Photos shuffled across the panels.');
});
zoomRange.addEventListener('input', () => {
  state.panelCrops[state.selectedPanel].zoom = Number(zoomRange.value);
  zoomValue.textContent = `${Number(zoomRange.value).toFixed(2)}×`;
  redraw();
});
titleInput.addEventListener('input', () => {
  state.title = titleInput.value;
  redraw();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  redraw();
});
decorToggle.addEventListener('change', () => {
  state.decorations = decorToggle.checked;
  redraw();
});
document.getElementById('exportBtn').addEventListener('click', () => exportCover(state.size));

// Automation hook for the screenshot run: export without a click.
window.__coverApp = {
  state,
  redraw,
  exportCover,
  loadSample,
  loadImage,
};

refreshLayoutChips();
refreshGradeChips();
refreshSizeChips();
renderThumbs();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, state, redraw, loadImage, loadSample);
} else {
  // First paint already shows art: load both samples so nobody starts blank.
  Promise.all([loadSample('boulevard'), loadSample('pier')]).then(() => {
    state.panelPhotos = [0, 1, 0, 1];
    redraw();
  });
}
