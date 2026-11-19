# Neon Coast Cover Studio — Make GTA 6 Cover Art

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Daniikhwan/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Daniikhwan/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline web app that turns your own photos and a caption into GTA-style
multi-panel cover art — comic-grid panels, a Vice City sunset or neon grade,
bold display lettering — and exports it as a PNG to share. Built for the
make.fun competition **gta6-cover-art-01** ("Make GTA 6 Cover Art").

## What it does

- **Any photo:** upload your own photos (read locally with FileReader, never
  uploaded) or try the two included samples. Click a thumbnail to drop it
  into the selected panel, or fill every panel with one photo.
- **Crop + position each panel:** click a panel in the live preview to select
  it, drag to pan, use the zoom slider, or reset the crop.
- **Six panel layouts:** Comic Grid (hero + two), Four Panel, Sunset Strip,
  Full Bleed, Duo Split and Tilted Snaps.
- **Six colour grades:** Sunset, Neon Nights, Vice Glow, Duotone, Halftone
  and Noir B&W — gradient-map tints painted over every panel.
- **Original art, drawn on canvas:** a striped retro sun disc, palm
  silhouettes, halftone dots, film grain and a vignette, plus a gradient
  title block with Archivo Black display type and a neon Pacifico subtitle.
  No Rockstar logo, artwork, character or font anywhere.
- **Fast and easy:** photo → layout → caption → one click to export.
- **Export PNG in the common post sizes:** 1080 × 1080, 1080 × 1350 and
  1920 × 1080, rendered at full resolution by the app's own canvas.

## Run

```sh
node serve.ts
# open http://localhost:8080
```

Build the submission bundle:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Fonts

Archivo Black, Bebas Neue and Pacifico, vendored under `app/fonts/` under
the SIL Open Font License (see `app/fonts/OFL.txt`). The two sample photos
under `app/samples/` were made for make.fun with an image model and are free
to use.

## Screenshots

`screenshots/1-cover.jpg` is a 1920 × 1080 cover exported by the app,
`2-editor.jpg` shows the editor with a photo loaded, `3-cover.jpg` is a
1080 × 1350 portrait export and `4-cover.jpg` a 1080 × 1080 square export.
