# active-memory handoff: Digital X homepage — 3D scroll story

**Handoff #1** · 2026-11-17 · Lineage: #1 (2026-11-17): rebuilt the homepage 3D scroll story (orb → X → six services) with three.js + Blender (Higgsfield 3D Jutsu) after the user's reference images; preview deployed, not merged.

## 0. Instructions for Claude (read first)

You are continuing work from a previous chat. That chat is gone; this file is the complete context and the source of truth.

1. Read this whole file before replying.
2. Follow sections 3 (Style), 4 (Hard rules) and 5 (Corrections) in every reply, for the rest of this chat. They override your defaults.
3. Use the values in section 8 exactly. Never round, re-estimate, or "correct" them.
4. Do not suggest anything listed in section 7 (Changed / rejected) again unless the user brings it up.
5. Code word: None active. If the user types /amcodeword, start every reply with the phrase they choose (default "Yes Boss!").
6. Your first reply: at most 5 lines covering the goal, the current state, and the next step (section 11). Mention any files from section 13 that were not attached. Ask the questions in section 12 if there are any. End with "Ready to continue with <next step>?" Then wait for the user's go.

## 1. Mission
- **Goal:** Make the scroll-driven 3D section of the digital-x-marketing.com homepage (below the hero) look like an award-winning interactive 3D experience, matching the user's three reference images: (1) crystal orb with glowing network on a chrome pedestal under a light beam, (2) thick black stone X with glowing diagonal cracks, orb above it joined by a light line, ring of light with nodes, (3) the same X centred with six glass service panels in two columns, rock islands, light portals.
- **Done looks like:** the live preview visually matches those references on desktop and phone, interactive (hover/click/drag), then the user approves a merge.
- **Why it matters:** it is Digital X's own showcase; the user said "this is my last try" on the latest round.

## 2. About the user (as relevant to this work)
- Owner of Digital X (web, SEO, AI automation agency, Sarajevo/BiH). Site copy is Bosnian; the user writes to Claude in English (informal, with typos).
- Not a developer; judges by looking at the Vercel preview on desktop and phone and sends screenshots.
- Generates reference images in outside tools and sends them; also uses Higgsfield.

## 3. Style & communication
- **Language:** English replies. Site text stays in Bosnian.
- **Tone:** direct, practical, no fluff.
- **Reply length:** short summary of what changed + preview link; details only when useful.
- **Formatting:** short paragraphs/bullets; send screenshots of the result.
- **Working style:** build, verify with screenshots, deploy the preview, then report with the preview link. When the user says "build it after I send new images", wait for the images.
- **Avoid:** claiming the preview is updated before the Vercel deployment is READY; asking unnecessary questions.

## 4. Hard rules (word for word)
1. "do not touch hero section and ai concierge, only the tripple video scroll and 3d interactive part" (the user later explicitly asked to shrink the left text of act 1 and move the label boxes — done; otherwise leave hero and concierge alone).
2. "dont merge yet"
3. "0s and 1s stay white"
4. "remove 0s and 1s from hero section and cinematic, start from the finishing part of the scroll driven experience below 3d sections, just a little more visible"
5. Push only to branch `claude/digital-x-homepage-3d-scroll-5gnrhr`; PR stays a draft.
6. Never put the model name/ID in commits, PRs or code. Commit messages end with:
   `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01WjgWbNLSmqkwSLJRcpG8bc`.
7. Keep the user's email private.

## 5. Corrections log
| # | Claude did | The user wanted |
|---|---|---|
| 1 | Laser from the orb ran behind the X | Laser on the front side of the X (fixed: orb moves in front of the X in act 2, beam drawn over the scene, lands on the camera-facing face) |
| 2 | Reported the preview link while it still showed the old build | Preview must show the latest build — Vercel does NOT auto-deploy this branch; deploy manually each time and confirm READY |
| 3 | Act 1 left text too heavy; label boxes covered the small orbs | Less text on the left; boxes visible and not blocking the small orbs (H1 is now a small eyebrow, labels above/below the small orbs) |
| 4 | Plate icons looked weak | Use the user's icon set (browser+film strip, magnifier+pin+bars, hexagon network, gears in loop, funnel, growth chart) |
| 5 | Small orbs and big orb looked bad | Crystal orb like the reference (glass, constellation network, orbit rings, chrome pedestal, light shaft) |
| 6 | 0/1 rain ran over hero and cinematic sections | Rain only from the end of the scroll experience below the 3D sections, a little more visible |
| 7 | Was mid-way generating Higgsfield images | User interrupted: use Blender for 3D objects from the reference images instead |
| 8 | First bloom version washed the scene grey (and a white glare leaked from the X) | Deep blacks with crisp glow like the references (fixed: high bloom threshold, Neutral tone mapping, crack light only inside cracks) |

## 6. Decisions
| Decision | Why |
|---|---|
| Live three.js scene (not video) for the 3D story | interactive hover/click/drag |
| 3D models from Blender via Higgsfield 3D Jutsu, loaded as `isle.glb` | user asked for Blender |
| Act 3: six glass panels in two columns (left: Cinematografske web stranice, SEO · AEO · GEO, AI sistemi; right: Analitika, Lead sistemi, Automatizacija) | user's reference image 1 |
| Panel names come from the page DOM (translations carry) | i18n |
| First click on a panel locks it and plays its live miniature; second click opens its page | keep interaction + navigation |
| Bloom on desktop only (UnrealBloomPass); phones render without bloom | performance |
| Rain stays white | user's call |

## 7. Changed / rejected
- Thin marble X (0.46 deep, cuts across arms) → thick stone monolith X (0.8 deep), long diagonal cracks, six chiselled shards (matches references)
- Full-size glowing core inside the X → thin glowing slabs only inside the cracks (core leaked as a white glare)
- Plates floating over rock islands with labels below → glass panels in two columns with icon | divider | name
- Procedural rocks → Blender rocks; orb on rock → orb on chrome pedestal (sinks into the rock as act 2 begins)
- ACES tone mapping with bloom (washed out) → Neutral tone mapping, exposure 1.15, opaque canvas under bloom
- ❌ Green Matrix-style rain (user: stays white)
- ❌ Higgsfield GPT Image 2.6 / soul_location / recraft (refused: "Requires basic plan or higher" on free plan)
- ❌ gltf-transform compression of the GLB (blocked by the tool's safety classifier; GLB shipped uncompressed)
- ❌ Merging to production (not yet)

## 8. Data & facts (exact)
| Item | Value |
|---|---|
| Repo | `cipiforrest-create/digitalsafespot` |
| Working branch | `claude/digital-x-homepage-3d-scroll-5gnrhr` |
| Draft PR | #6 (base `recovery/source-backup`) |
| Production branch (do not merge yet) | `seo/cinematic-safe-production-2026-11-12` |
| Latest commit | `3c54494a6a3b15be7ab99b3e322a3e77589b96ff` ("Monolith X with glowing cracks, and bloom over the scene") |
| Latest preview deployment | `dpl_CoTXVo63uL1AqyckTHWviBqZFcK3` — READY |
| Preview link (branch alias) | https://digital-x-agency-git-claude-digital-x-homepag-bd5b6b-eynna-hair.vercel.app (Vercel Authentication protected) |
| Vercel team / project | `team_ZEb1eZULuhuRNPeCgv4i1TPX` / `digital-x-agency` (`prj_hVVSDOcXHJ89izTaz9iZID84gbXD`) |
| Deploy method | Vercel MCP `create_deployment`, forceNew "1", gitSource `{type:"github", org:"cipiforrest-create", repo:"digitalsafespot", ref:<branch>, sha:<commit>}`; then poll `get_deployment` until READY |
| Blender (Higgsfield 3D Jutsu) project | `992d0eee-5d70-45c1-9beb-c5276e2d15d6`, revision 7 — https://higgsfield.ai/3d-jutsu/992d0eee-5d70-45c1-9beb-c5276e2d15d6 |
| Blender objects | `ROCK_plinth`, `ROCK_island_1..3`, `PED_base`, `PED_glow`, `HERO_x` (solid; invisible pick/beam target), `HERO_xs_0..5` (shards), `HERO_x_core` (crack-glow slabs) |
| GLB in repo | `ai-concierge-preview/media/isle-v1/isle.glb` (695,524 bytes) |
| Higgsfield | free plan, ~8.8 credits left; only `z_image` works (0.15 credits/image, max ~2 concurrent) |
| Bloom | `UnrealBloomPass(new Vector2(256,256), .85, .28, 1.7)`; `NeutralToneMapping`, exposure 1.15; clear alpha 1; desktop only |
| X | depth 0.8; act 3 scale 1.14; marble map; roughness .5, clearcoat .3, DoubleSide |
| Rain | `concierge/client/ambient.ts`, `LIGHT=.72`, revealed after the `[data-sequence]` section |
| Tests | `npm test`: 340 pass, 2 pre-existing fails ("withExecutionLock reports contention…", "an unsupported numeric / ranking guarantee…"); 3D story browser spec: 4/4 pass |

## 9. People, terms & names
- **People:** the user (Digital X owner).
- **Terms:** "orb" / "AI concierge hologram" = glass orb in act 1; "X" = Digital X mark; "acts/sections 1–3" = ORB, X, ENGINE checkpoints; "0s and 1s" = binary rain background; "preview link" = Vercel branch alias.
- **Names in use:** `concierge/client/deck.ts` (three.js scene), `concierge/client/deck-modules.ts` (icons, live miniatures, `drawPanel`), `concierge/client/cinema-story.ts` (scroll controller, labels), `concierge/shared/cinema-timeline.ts`, `concierge/cinema-story.mjs` (HTML), `ai-concierge-preview/world.css`, `ai-concierge-preview/cinema-story.css`, `concierge/tests/cinema-story.spec.ts`. Build: `npm run build` (output in `public/`).

## 10. Work state
| Item | Status | Version / location | Notes |
|---|---|---|---|
| Act 1 orb (crystal glass, network, orbit rings, chrome pedestal, light shaft, 4 small glass orbs) | done | deck.ts | matches reference 3 |
| Act 2 monolith X with glowing cracks, tether, orbit ring | done | deck.ts + isle.glb rev 7 | matches reference 2 |
| Act 3 panels, arcs, light portals, wide ring | done on desktop | deck.ts, deck-modules.ts | phone: panels too small to read (see section 11) |
| Bloom (desktop) | done | deck.ts | |
| Preview | deployed READY | dpl_CoTXVo63uL1AqyckTHWviBqZFcK3 | |
| Merge to production | not started | — | user said don't merge yet |

How to verify locally: `npm run build`, serve `public/` (`python3 -m http.server 8787`), screenshot with Playwright Chromium (`executablePath: '/opt/pw-browsers/chromium'`, args `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`). The story spec needs a temporary Playwright config with `baseURL: 'http://localhost:8787'` and `timeout: 180000` (delete it afterwards).

## 11. Next steps
1. **Next action:** fix act 3 on phones — in the user's last phone screenshot the six 3D glass panels are tiny and unreadable beside the X. Make them legible on small screens (e.g. larger panels in a single column, or hide the 3D panel text on phones and let the DOM cards below carry the names), then screenshot at 390×844.
2. Build, run `npm test` and the 3D story spec, commit with the attribution lines, push to the branch, deploy the preview manually, wait for READY, send the link with screenshots.
3. Wait for the user's approval before any merge to production.

## 12. Open questions ⚠️
- When should this go to production (merge into `seo/cinematic-safe-production-2026-11-12`)? Candidates: after the phone fix / later / never.
- Upgrade Higgsfield to a paid plan to use GPT Image 2.6 for higher-quality textures? Candidates: yes / no (stay on Z Image).

## 13. Re-attach checklist
- [ ] The three latest reference images (act 3 composition with panels; act 2 X on rock with orb and ring; crystal orb on chrome pedestal): the visual target.
- [ ] The phone screenshot of act 3 (panels too small): the next fix.

---
<sub>Audit: 13/13 sections · 7 rules · 8 corrections · 19 data points · secrets removed: none found · generated by active-memory</sub>
