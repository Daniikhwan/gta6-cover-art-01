// Panel layouts for the cover: every layout is a set of photo panels in
// normalised (0..1) coordinates plus a title band, so the same cover works
// at 1080x1080, 1080x1350 and 1920x1080. Panel names feed the editor label.

export const LAYOUTS = [
  {
    id: 'comic',
    name: 'Comic Grid',
    panels: [
      { name: 'Hero', x: 0, y: 0, w: 0.62, h: 0.78, rot: 0 },
      { name: 'Top right', x: 0.62, y: 0, w: 0.38, h: 0.39, rot: 0 },
      { name: 'Bottom right', x: 0.62, y: 0.39, w: 0.38, h: 0.39, rot: 0 },
    ],
  },
  {
    id: 'grid',
    name: 'Four Panel',
    panels: [
      { name: 'Top left', x: 0, y: 0, w: 0.5, h: 0.39, rot: 0 },
      { name: 'Top right', x: 0.5, y: 0, w: 0.5, h: 0.39, rot: 0 },
      { name: 'Bottom left', x: 0, y: 0.39, w: 0.5, h: 0.39, rot: 0 },
      { name: 'Bottom right', x: 0.5, y: 0.39, w: 0.5, h: 0.39, rot: 0 },
    ],
  },
  {
    id: 'strip',
    name: 'Sunset Strip',
    panels: [
      { name: 'Skyline', x: 0, y: 0, w: 1, h: 0.3, rot: 0 },
      { name: 'Street', x: 0, y: 0.3, w: 1, h: 0.26, rot: 0 },
      { name: 'Night', x: 0, y: 0.56, w: 1, h: 0.22, rot: 0 },
    ],
  },
  {
    id: 'hero',
    name: 'Full Bleed',
    panels: [{ name: 'Full bleed', x: 0, y: 0, w: 1, h: 0.78, rot: 0 }],
  },
  {
    id: 'duo',
    name: 'Duo Split',
    panels: [
      { name: 'Left', x: 0, y: 0, w: 0.5, h: 0.78, rot: 0 },
      { name: 'Right', x: 0.5, y: 0, w: 0.5, h: 0.78, rot: 0 },
    ],
  },
  {
    id: 'tilted',
    name: 'Tilted Snaps',
    panels: [
      { name: 'Hero', x: 0, y: 0, w: 1, h: 0.58, rot: 0 },
      { name: 'Snapshot 1', x: 0.05, y: 0.56, w: 0.42, h: 0.26, rot: -4 },
      { name: 'Snapshot 2', x: 0.53, y: 0.56, w: 0.42, h: 0.26, rot: 3 },
    ],
  },
];

/** The title band every layout shares: the bottom 22% of the cover. */
export const TITLE_BAND = { x: 0, y: 0.78, w: 1, h: 0.22 };

/** Looks a layout up by id, falling back to the first layout. */
export function layoutById(id) {
  return LAYOUTS.find((entry) => entry.id === id) ?? LAYOUTS[0];
}

/** Panel rectangles in canvas pixels for a layout at width w and height h. */
export function layoutRects(layout, w, h) {
  return layout.panels.map((panel) => ({
    name: panel.name,
    x: panel.x * w,
    y: panel.y * h,
    w: panel.w * w,
    h: panel.h * h,
    rot: panel.rot,
  }));
}

/** The export sizes the app offers, in pixels. */
export const EXPORT_SIZES = {
  square: { label: '1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080', w: 1920, h: 1080 },
};

/** The colour grades, each with the tint its overlay paints. */
export const GRADES = [
  { id: 'sunset', name: 'Sunset' },
  { id: 'neon', name: 'Neon Nights' },
  { id: 'vice', name: 'Vice Glow' },
  { id: 'duotone', name: 'Duotone' },
  { id: 'halftone', name: 'Halftone' },
  { id: 'bw', name: 'Noir B&W' },
];
