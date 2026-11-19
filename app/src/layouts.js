// Panel layouts for Neon Coast Cover Studio.
// Every layout returns panel rectangles in pixels for a cover of size W x H,
// plus the title band where the caption sits. Panels are listed in draw order.
export const LAYOUTS = [
  { id: 'comic', label: 'Comic Grid', hint: 'Hero + two panels' },
  { id: 'four', label: 'Four Panel', hint: 'Classic 2 x 2 grid' },
  { id: 'strip', label: 'Sunset Strip', hint: 'Three tall strips' },
  { id: 'full', label: 'Full Bleed', hint: 'One photo, edge to edge' },
  { id: 'duo', label: 'Duo Split', hint: 'Two halves, one story' },
  { id: 'tilted', label: 'Tilted Snaps', hint: 'Polaroid-style tilt' },
];

// The comic gutter: thick white seams between panels, scaled to the cover.
export function gutterFor(W) {
  return Math.max(6, Math.round(W * 0.012));
}

export function layoutPanels(id, W, H) {
  const g = gutterFor(W); // thick comic gutter
  const titleH = Math.round(H * 0.2); // caption band at the foot
  const top = H - titleH;
  switch (id) {
    case 'comic': {
      const heroW = Math.round(W * 0.58);
      return {
        panels: [
          { x: 0, y: 0, w: heroW - g / 2, h: top, rot: 0 },
          { x: heroW + g / 2, y: 0, w: W - heroW - g / 2, h: Math.round(top / 2) - g / 2, rot: 0 },
          { x: heroW + g / 2, y: Math.round(top / 2) + g / 2, w: W - heroW - g / 2, h: top - Math.round(top / 2) - g / 2, rot: 0 },
        ],
        title: { x: 0, y: top, w: W, h: titleH },
        gutter: g,
      };
    }
    case 'four': {
      const hw = Math.round(W / 2);
      const hh = Math.round(top / 2);
      return {
        panels: [
          { x: 0, y: 0, w: hw - g / 2, h: hh - g / 2, rot: 0 },
          { x: hw + g / 2, y: 0, w: W - hw - g / 2, h: hh - g / 2, rot: 0 },
          { x: 0, y: hh + g / 2, w: hw - g / 2, h: top - hh - g / 2, rot: 0 },
          { x: hw + g / 2, y: hh + g / 2, w: W - hw - g / 2, h: top - hh - g / 2, rot: 0 },
        ],
        title: { x: 0, y: top, w: W, h: titleH },
        gutter: g,
      };
    }
    case 'strip': {
      const w3 = Math.round(W / 3);
      return {
        panels: [
          { x: 0, y: 0, w: w3 - g / 2, h: top, rot: 0 },
          { x: w3 + g / 2, y: 0, w: w3 - g, h: top, rot: 0 },
          { x: 2 * w3 + g / 2, y: 0, w: W - 2 * w3 - g / 2, h: top, rot: 0 },
        ],
        title: { x: 0, y: top, w: W, h: titleH },
        gutter: g,
      };
    }
    case 'duo': {
      const hw = Math.round(W / 2);
      return {
        panels: [
          { x: 0, y: 0, w: hw - g / 2, h: top, rot: 0 },
          { x: hw + g / 2, y: 0, w: W - hw - g / 2, h: top, rot: 0 },
        ],
        title: { x: 0, y: top, w: W, h: titleH },
        gutter: g,
      };
    }
    case 'tilted': {
      const pw = Math.round(W * 0.46);
      const ph = Math.round(top * 0.86);
      const y = Math.round(top * 0.05);
      return {
        panels: [
          { x: Math.round(W * 0.03), y, w: pw, h: ph, rot: -0.045 },
          { x: Math.round(W * 0.51), y: y + Math.round(top * 0.04), w: pw, h: ph, rot: 0.05 },
        ],
        title: { x: 0, y: top, w: W, h: titleH },
        gutter: g,
        tilted: true,
      };
    }
    case 'full':
    default: {
      return {
        panels: [{ x: 0, y: 0, w: W, h: top, rot: 0 }],
        title: { x: 0, y: top, w: W, h: titleH },
        gutter: g,
      };
    }
  }
}

// How many photo slots a layout can show at most.
export function panelCount(id) {
  return layoutPanels(id, 100, 100).panels.length;
}
