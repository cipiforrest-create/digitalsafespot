# Digital X — checkpoint stop frames and live-world calibration

Source videos: `concierge/source-assets/cinema/klip1.mp4`, `klip2.mp4`, `klip3.mp4` (864×496, 24 fps, H.264).
The web sequence in `ai-concierge-preview/media/cinema-v1/clip-N/{864,640}/NNNN.webp` is frame-for-frame the same.
All three clips settle to near-zero motion at their end (mean inter-frame luma change < 0.1/255 over the last
40+ frames), so the last frame of each clip is the stop. It is also where the existing film already held.

| Checkpoint | Stop frame | Pre-stop | Continue |
|---|---|---|---|
| 01 ORB — Intelligence | `01_ORB_STOP_FRAME.png` klip1 f240 @ 10.000 s | klip1 f239 @ 9.958 s | klip2 f0 @ 0.000 s |
| 02 X — Digital experience | `02_X_STOP_FRAME.png` klip2 f192 @ 8.000 s | klip2 f191 @ 7.958 s | klip3 f0 @ 0.000 s |
| 03 ENGINE — Connected system | `03_ENGINE_STOP_FRAME.png` klip3 f192 @ 8.000 s | klip3 f191 @ 7.958 s | — (convergence holds this frame) |

`00_DIGITAL_X_THREE_CHECKPOINT_REFERENCE_BOARD.png` shows all three with notes.

Measured continuity: ORB stop → Video 2 f0 differs by a mean 6.7/255 (same composition). X stop → Video 3 f0
differs by 26.5/255 (Video 3 opens closer on the X), so the X release pushes the camera 4 % before crossfading.

**Video 3 has no separate "automation engine" object.** It ends on the X feeding four glass tiles over concentric
floor rings. Following the brief's own rule that the video frame wins, stop 3 treats those floor rings as the
engine (six modules sit on them) and the four tiles as the system pillars.

## Palette (sampled from all three stop frames)

shadow `#010204` · mid `#39465c` · bright `#abbee2` · peak `#f1f7fc`. The page presents the film through
`filter: grayscale(1)`. The WebGL canvas sits under the same filter, and every procedural colour uses these tokens, so
the match holds with or without the filter.

## Calibration

- `concierge/shared/world-calibration.ts` defines every object in stop-frame pixels (sphere centre and radius,
  12-point X outlines, tile rectangles, signal paths, floor-ring ellipses, node anchors).
- The camera is the film frame: vertical FOV 32° across 496 px. A view offset maps the frame onto the same
  contain-fit rectangle the film canvas uses, so plate and geometry always stay registered.
- Phones (≤ 720 px) crop the film to its centre instead of letterboxing it (`mobileRoi`: 470 source px wide for
  Video 1/2 and the ORB and X, widening smoothly to 590 px during Video 3 so all four system tiles fit; never more than
  ~5 % trimmed top or bottom). `frameRect` applies the same fit to the film canvas and the live world, so the handoff
  stays exact. The band is 52 % of the screen (46 % below 700 px tall) and never moves; each checkpoint splits into
  two screens (`data-sub` a/b), and during a video the coming chapter's title shows beneath the band.
- Film pixels are projection-mapped onto the X, the tiles and the small X at their canonical pose. Live light is
  additive and zero at the handoff.
- `concierge/world-plates.py` derives the clean plates (`media/cinema-v1/world/*-clean-*.webp`). These show only
  once an object is live, so painted rings, stars and tiles never appear twice.
  `orb-hole-*.webp` removes the sphere entirely: once live, the ORB is its own film-mapped layer that hovers
  (±4.5 source px) above the room.
- Idle motion (all zero at the handoff, scaled by the live factor): the ORB hovers and its inner network turns,
  the light around the X (and around the small X at stop 3) breathes and now and then flashes softly as a halo that fades with distance — never full-height bands, a narrow glint crosses the X and the
  small X, and the stop-3 tiles bob by ±1.8 px.

## First paint

The page ships in its enhanced layout (`data-enhanced`, `data-reveal="0"`, `data-sub="v"`) with Video 1 frame 0 as a `<picture>` inside the film band, fitted exactly like the canvas (contain on desktop, the phone crop on phones). The film replaces it with the identical frame, so there is no poster swap, reflow or loader flash. Film media is cached for a week (`vercel.json`); HTML stays `no-store`.

## QA tools

- `node concierge/world-handoff-qa.mjs <dir> <w>x<h>` measures film against live WebGL at the end of each arrival.
  Last run (Intel HD 630/D3D11) at 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844 and 360×740
  (phones re-measured with the crop: mean ≤ 0.02/255): mean abs difference ≤ 0.14/255 and p99 ≤ 1 at every size and checkpoint; no pixel differed by more than 8.
  The live layer renders at full resolution and switches to mipmapped sampling below half scale, matching the
  film canvas' own resampling.
- `node concierge/world-qa.mjs <dir> <w>x<h> <positions> [query] [--mobile|--reduced|--drag]` takes screenshots at
  scroll positions in stage heights.
- `?debug3d=1` opens the calibration panel (stop-frame overlay slider, phase, progress, zoom/anchor, yaw/pitch,
  light, quality, fps). It is a separate chunk that never loads without the flag.
- `?world=0` forces the still-frame fallback; `?world=1` skips the capability check.
