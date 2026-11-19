// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the cover alone, full frame. Query keys:
// photo (sample name), photo2 (second sample), caption, subtitle, layout,
// grade and size (square, portrait or wide). window.__shotReady is set
// once the scene has painted, so a screenshot runner can wait on it.
import { EXPORT_SIZES, GRADES, layoutById } from './layouts.js';

export async function runShot(shot, query, state, redraw, loadImage, loadSample) {
  const canvas = document.getElementById('coverCanvas');
  const titleInput = document.getElementById('titleInput');
  const subtitleInput = document.getElementById('subtitleInput');
  const layout = query.get('layout') ?? 'comic';
  const grade = query.get('grade') ?? 'sunset';
  const sizeId = query.get('size') ?? (shot === 'cover' ? 'wide' : 'wide');
  const size = EXPORT_SIZES[sizeId] ?? EXPORT_SIZES.wide;
  state.layout = layout;
  state.grade = grade;
  state.size = sizeId;
  state.title = query.get('caption') ?? 'SUNSET HEIST';
  state.subtitle = query.get('subtitle') ?? 'a story in neon & gold';
  if (titleInput) titleInput.value = state.title;
  if (subtitleInput) subtitleInput.value = state.subtitle;
  document.querySelectorAll('#sizeRadios .chip').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.size === sizeId);
  });
  // Chips were built from the default state, so re-mark the active ones by
  // their display names (layout ids and chip labels differ).
  document.querySelectorAll('#layoutButtons .chip').forEach((btn) => {
    btn.classList.toggle('active', btn.textContent === layoutById(layout).name);
  });
  const gradeName = GRADES.find((g) => g.id === grade)?.name ?? '';
  document.querySelectorAll('#gradeButtons .chip').forEach((btn) => {
    btn.classList.toggle('active', btn.textContent === gradeName);
  });
  await loadSample(query.get('photo') ?? 'boulevard');
  if (query.get('photo2')) await loadSample(query.get('photo2'));
  state.panelPhotos = [0, 1, 0, 1].slice(0, 4);
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    canvas.width = size.w;
    canvas.height = size.h;
  }
  await document.fonts.ready;
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
