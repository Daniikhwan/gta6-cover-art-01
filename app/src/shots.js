// Fixed scenes for screenshots: ?shot=editor shows the editor with a photo
// loaded; ?shot=cover shows the exported cover alone at the requested size.
// Params: photo, photo2, caption, subtitle, layout, grade, size
// (square | portrait | wide). window.__shotReady is set once painted.
import { EXPORT_SIZES } from './cover.js';

export async function runShot(shot, query, app) {
  const { state, loadSample, redraw, syncControls } = app;
  state.layout = query.get('layout') || 'comic';
  state.grade = query.get('grade') || 'sunset';
  state.caption = query.get('caption') || 'Sunset Heist';
  state.subtitle = query.get('subtitle') || 'neon coast nights';
  const sizeId = query.get('size') || (shot === 'cover' ? 'wide' : 'square');
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) || EXPORT_SIZES[2];
  state.size = size.id;
  const seed = Number(query.get('seed'));
  if (Number.isFinite(seed) && seed > 0) state.seed = seed;
  await loadSample(query.get('photo') || 'boulevard', 0);
  if (query.get('photo2')) await loadSample(query.get('photo2'), 1);
  else state.photos[1] = state.photos[0];
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    app.canvas.width = size.w;
    app.canvas.height = size.h;
  }
  syncControls();
  try { await document.fonts.ready; } catch { /* fonts are local; keep going */ }
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
