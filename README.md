# Neon Coast Cover Studio

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Daniikhwan/gta6-cover-art-01/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Daniikhwan/gta6-cover-art-01/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline web app that turns your own photos into GTA 6-style cover art:
a multi-panel poster with bold caption lettering, a Vice City sunset or
neon colour grade, procedural palm silhouettes, a striped sun disc,
halftone dots and film grain — exported as a PNG to share.

## What it does

- **Any photo** — upload one or two photos from your machine (FileReader,
  local only, never uploaded). Each panel can use either photo, and you can
  fill every panel with one photo or alternate the two.
- **Crop per panel** — click a panel to select it, drag to pan, scroll or
  use the zoom slider; sliders for pan and zoom too.
- **Six layouts** — Comic Grid (hero + two panels), Four Panel, Sunset
  Strip, Full Bleed, Duo Split and Tilted Snaps.
- **Five colour grades** — Vice Sunset, Neon Nights, Noir (B&W), Halftone
  and Duotone.
- **Editable lettering** — a bold caption in Archivo Black with a sunset
  gradient and a neon script subtitle in Pacifico, plus one-tap caption
  ideas (“Sunset Heist”, “Boulevard Queen”).
- **Three post sizes** — Square 1080 x 1080, Portrait 1080 x 1350 and
  Wide 1920 x 1080, each a one-click PNG export.
- **Polish** — live preview, undo/redo, a “Surprise me” shuffle, and a
  procedural sunset backdrop so the cover looks finished even before a
  photo is added.

## Layouts & grades

| Layout | Panels | Grade | Look |
| --- | --- | --- | --- |
| Comic Grid | hero + 2 | Vice Sunset | warm golden hour |
| Four Panel | 2 x 2 | Neon Nights | pink + teal glow |
| Sunset Strip | 3 tall | Noir | high-contrast B&W |
| Full Bleed | 1 | Halftone | comic print dots |
| Duo Split | 2 | Duotone | magenta / cyan ink |
| Tilted Snaps | 2 tilted | | |

Everything is original: no Rockstar Games logo, wordmark, artwork,
characters or fonts. Lettering uses Archivo Black, Bebas Neue and
Pacifico, vendored under `app/fonts/` under the SIL Open Font License
(`app/fonts/OFL.txt`). The two sample photos under `app/samples/` were
made for make.fun with an image model and are free to use.

## Run

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. The app is plain
static files under `app/` with no build step and makes zero network
requests at runtime — every script, font and image is a file under `app/`.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library.

## Screenshots

- `screenshots/1-cover.jpg` — an exported wide cover (1920 x 1080)
- `screenshots/2-editor.jpg` — the editor with a photo loaded
- `screenshots/3-cover.jpg` — an exported portrait cover (1080 x 1350)
- `screenshots/4-cover.jpg` — an exported square cover (1080 x 1080)

All four are produced by the app itself (see `shots.json` for the scenes).
