import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(resolve(site, relative), "utf8");
const html = read("index.html");

const DESKTOP_FRAMES = 360;
const MOBILE_FRAMES = 180;
// Frames are served immutable under stable filenames, so a rebuilt ladder only
// reaches returning visitors through a new revision folder.
const REVISION = "r2";

test("the homepage film scrubs through the shared frame engine", () => {
  assert.match(html, /src="\/cinematic-shared\/scroll-cinematic\.js"/);
  assert.match(html, /src="\/cinematic-shared\/lenis\.min\.js"/);
  assert.match(html, /src="\/js\/homepage-cinematic\.js"/);
  assert.doesNotMatch(html, /three|THREE\.|assets\/index-Bc9hv9bI\.js/);

  assert.match(html, /window\.SCRUB_SECTIONS = \[\{/);
  assert.match(html, new RegExp(`frameCount: small \\? ${MOBILE_FRAMES} : ${DESKTOP_FRAMES}`));
  assert.match(html, /element: '#film'/);
  assert.match(html, /canvas: '#filmCanvas'/);
  assert.match(html, /id="filmCanvas" data-cinematic-canvas/);

  // Staged loading: the page is handed over once a coarse pass spans the film.
  assert.match(html, /readyAt: \d+/);
  const engine = read("cinematic-shared/scroll-cinematic.js");
  assert.match(engine, /readyAt/);
  assert.match(engine, /if \(completed >= readyFrames\) finish\(\);/);

  // The scrub is slowed and smoothed to match the scroll rather than jump.
  assert.match(html, /lerp: 0\.06/);
  assert.match(html, /concurrency: 8/);
  assert.match(engine, /Number\.isFinite\(section\.lerp\) \? section\.lerp : 0\.085/);
  assert.match(engine, /for \(let stride = 32; stride >= 1; stride = Math\.floor\(stride \/ 2\)\)/);
});

test("both frame ladders are complete, non-empty and served as WebP", () => {
  for (const [folder, count] of [["lg", DESKTOP_FRAMES], ["sm", MOBILE_FRAMES]]) {
    const directory = resolve(site, `media/frames/journey/${REVISION}/${folder}`);
    const files = readdirSync(directory).filter((name) => name.endsWith(".webp"));
    assert.equal(files.length, count, `${folder} ladder frame count`);
    for (let index = 1; index <= count; index += 1) {
      const file = resolve(directory, `frame_${String(index).padStart(4, "0")}.webp`);
      assert.ok(statSync(file).size > 2048, `${folder}/frame_${index} is too small`);
    }
  }
  assert.match(html, new RegExp(`/media/frames/journey/${REVISION}/sm/frame_\\{frame\\}\\.webp`));
  assert.match(html, new RegExp(`/media/frames/journey/${REVISION}/lg/frame_\\{frame\\}\\.webp`));
  // Nothing may still point at the unversioned path.
  assert.doesNotMatch(html, /\/media\/frames\/journey\/(?:lg|sm)\//);
});

test("the film ships the poster, the social card and one still per chapter", () => {
  for (const name of ["journey-open", "journey-core", ...[1, 2, 3, 4, 5, 6].map((i) => `journey-beat-${i}`)]) {
    for (const extension of ["jpg", "webp"]) {
      const file = resolve(site, `media/poster/${name}.${extension}`);
      assert.ok(statSync(file).size > 4096, `${name}.${extension}`);
    }
  }
  assert.match(html, /og:image" content="https:\/\/www\.digital-x-marketing\.com\/media\/poster\/journey-core\.jpg"/);
  assert.equal((html.match(/journey-beat-\d\.jpg/g) || []).length, 6);
});

test("the opening screen carries the statement and nothing else", () => {
  const hero = html.match(/<section class="hero"[\s\S]*?\n<\/section>/)?.[0];
  assert.ok(hero, "missing hero section");

  for (const copy of [
    "01 · Digital X — Signal",
    "Prisustvo koje se pamti.",
    "Cinematic web stranice, SEO / GEO / AEO i AI automatizacija — Digital X Sarajevo.",
    "Web. Marketing. Inteligencija.",
  ]) {
    assert.ok(hero.includes(copy), copy);
  }

  // No calls to action, no supporting paragraph, nothing but the statement.
  assert.doesNotMatch(hero, /<a\b|<button\b|class="btn/);
  assert.equal((hero.match(/<p\b/g) || []).length, 2);
  assert.ok(html.indexOf('<section class="hero"') < html.indexOf('<section class="film"'));
});

test("nothing is drawn over the film until it resolves", () => {
  const film = html.match(/<section class="film"[\s\S]*?\n<\/section>/)?.[0];
  assert.ok(film, "missing film section");

  // One copy block, and it only opens in the last stretch of the track.
  const windows = [...film.matchAll(/data-scrub-copy data-in="([\d.]+)" data-out="([\d.]+)"/g)]
    .map(([, start, end]) => [Number(start), Number(end)]);
  assert.equal(windows.length, 1);
  assert.ok(windows[0][0] >= 0.9, "closing plate opens too early");
  assert.ok(windows[0][1] > 1, "closing plate must stay solid at the end of the track");
  assert.ok(film.includes("Cinematic web stranice.<br>Budite drugačiji."));

  // Sized against viewport height too, so the plate cannot run off the top of a
  // short window and clip its first line.
  const css = read("css/homepage-cinematic.css");
  assert.match(css, /\.film__chapter--end \.film__statement \{[^}]*min\(4\.6vw, 7vh\)/s);

  // No chapter labels and no worded skip control over the picture.
  assert.doesNotMatch(film, /data-mark/);
  assert.doesNotMatch(film, /film__marks|film__scroll/);
  assert.match(film, /<button class="film__skip"[^>]*aria-label="Preskoči film"/);
  assert.doesNotMatch(film.match(/<button class="film__skip"[\s\S]*?<\/button>/)[0], />[^<\s][^<]*</);

  // Headings inside the film section: only the closing plate's.
  assert.equal((film.match(/<h[1-6]\b/g) || []).length, 1);

  const script = read("js/homepage-cinematic.js");
  assert.match(script, /RESOLVE_AT = 0\.9\d/);
  assert.match(script, /is-resolved/);
  // The navigation stands down for the run of the film.
  assert.match(script, /classList\.toggle\('film-running', running\)/);
  assert.match(read("css/homepage-responsive.css"), /html\.film-running \.language-switcher/);
});

test("the page keeps one H1 that names the services and a clean heading outline", () => {
  const headings = [...html.matchAll(/<h([1-4])\b/g)].map((match) => Number(match[1]));
  assert.equal(headings.filter((level) => level === 1).length, 1);
  assert.equal(headings[0], 1);
  for (let index = 1; index < headings.length; index += 1) {
    assert.ok(headings[index] - headings[index - 1] <= 1, `heading jump at ${index}`);
  }

  const h1 = html.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? "";
  assert.match(h1, /Prisustvo koje se pamti\./);
  assert.match(h1, /Cinematic web stranice/);
  assert.match(h1, /SEO \/ GEO \/ AEO/);
  assert.match(h1, /AI automatizacija/);
});

test("the merged page keeps the live sections and drops the duplicated ones", () => {
  const order = [...html.matchAll(/<section class="[^"]*" id="([a-z]+)"/g)].map((match) => match[1]);
  // Smart Website Launch lands the moment the film resolves, before the
  // cinematic categories.
  assert.deepEqual(order, [
    "hero", "film", "ponuda", "cinematic", "pristup", "usluge", "rast",
    "radovi", "koncepti", "proces", "cjenovnik", "shop", "analiza", "vodici", "kontakt",
  ]);
  assert.equal(new Set(order).size, order.length);

  // The six disciplines are described once in the body, inside the explorer.
  // (The JSON-LD offer catalog legitimately mirrors the same taglines.)
  const body = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, "");
  assert.equal((body.match(/Chatbot, podsjetnici, recenzije\./g) || []).length, 1);
  assert.equal((body.match(/Rješenja po mjeri vaših procesa\./g) || []).length, 1);
  assert.doesNotMatch(html, /class="disc__item"/);

  // #autoritet restated the SEO panel word for word and is gone; the growth
  // stages no longer repeat discipline taglines either.
  assert.doesNotMatch(html, /id="autoritet"/);
  for (const tagline of [
    "Google, mape i AI odgovori na jednoj tehničkoj osnovi.",
    "Stranice i trgovine koje se učitavaju ispod dvije sekunde — i prodaju.",
    "Kampanje povezane s landing stranicom i stvarnim ciljem.",
  ]) {
    assert.equal((body.match(new RegExp(tagline.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length, 1, tagline);
  }

  // Deep links that other pages and the footer rely on still resolve.
  for (const slug of ["web", "aplikacije", "seo", "oglasavanje", "sadrzaj", "automatizacija"]) {
    assert.match(html, new RegExp(`id="usluga-${slug}"`), slug);
  }
  assert.match(html, /<section class="section section--explorer" id="usluge"/);
});

test("live content above and including Smart Website Launch is untouched", () => {
  const liveSections = ["pristup", "cinematic", "ponuda"];
  const source = readFileSync(resolve(site, "index.html"), "utf8");
  for (const id of liveSections) {
    assert.ok(source.includes(`id="${id}"`), id);
  }
  assert.match(source, /Smart Website Launch dostupan je za samo pet projekata/);
  assert.match(source, /src="\/media\/live\/smart-website-launch-cinematic\.webp"/);
  for (const image of [
    "/media/live/cinematic-hotel.jpg",
    "/media/live/cinematic-watch.webp",
    "/media/live/cinematic-penthouse.jpg",
    "/media/live/cinematic-clothes.jpg",
    "/media/live/cinematic-dentist.jpg",
    "/media/live/cinematic-deepsea-submarine.jpg",
    "/media/live/cinematic-vanta.jpg",
  ]) {
    assert.ok(source.includes(image), image);
  }
});

test("every service, workflow and portfolio visual from the live page is still used", () => {
  for (const image of [
    "/media/live/service-web.webp",
    "/media/live/service-apps.webp",
    "/media/live/service-seo.webp",
    "/media/live/service-growth.webp",
    "/media/live/service-content.webp",
    "/media/live/service-automation.webp",
    "/media/live/automation-workflows.webp",
    "/media/live/application-suite.webp",
    "/media/live/before-legal.webp",
    "/media/live/portfolio-legal.webp",
    "/media/live/custom-project-planning.webp",
  ]) {
    assert.ok(html.includes(image), image);
  }
});

test("calls to action point at destinations that exist", () => {
  const anchors = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
  for (const href of anchors) {
    if (href.startsWith("#")) {
      assert.ok(ids.has(href.slice(1)), `dangling anchor ${href}`);
    } else if (href.startsWith("/") && !href.startsWith("//")) {
      const target = href.split(/[?#]/)[0];
      const candidate = target.endsWith("/") ? `${target}index.html` : target;
      assert.doesNotThrow(() => statSync(resolve(site, candidate.slice(1))), `missing ${href}`);
    }
  }
});

test("the single lead form still posts the fields the intake endpoint needs", () => {
  assert.equal((html.match(/<form\b/g) || []).length, 1);
  assert.match(html, /<form class="contact__form" data-contact novalidate>/);
  for (const name of ["name", "email", "need", "message"]) {
    assert.match(html, new RegExp(`name="${name}"`), name);
  }
  const script = read("js/homepage-cinematic.js");
  assert.match(script, /fetch\('\/api\/lead'/);
  assert.match(script, /name = 'website'/);
  assert.match(script, /name="consent"/);
  assert.match(script, /mailto:marketing@digital-x-marketing\.com/);
});

test("mobile gets a smaller ladder, a shorter track and a full-screen film", () => {
  const css = read("css/homepage-cinematic.css");
  assert.match(css, /--film-scroll: 1150vh/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*--film-scroll: 640vh/);
  assert.match(html, /small \? 180 : 360/);

  // The film is not letterboxed into a band any more; the engine contains the
  // frame across the whole stage and fills the rest from the frame itself.
  assert.doesNotMatch(css, /height: 60vw/);
  assert.match(html, /fit: small \? 'contain' : 'cover'/);
  assert.match(html, /fitScale: 1\.4/);
  const engine = read("cinematic-shared/scroll-cinematic.js");
  assert.match(engine, /section\.fit === 'contain'/);
  assert.match(engine, /scratch\.width = 64/);
  assert.match(engine, /paint\(Math\.min\(cover, contain \* zoom\)\)/);
});

test("the opening screen sits on the portal plate", () => {
  const hero = html.match(/<section class="hero"[\s\S]*?\n<\/section>/)?.[0];
  assert.ok(hero, "missing hero section");
  assert.match(hero, /class="hero__backdrop"/);
  assert.match(hero, /srcset="\/media\/live\/hero-portal\.webp"/);
  assert.match(hero, /media="\(max-width: 720px\)"[^>]*hero-portal-portrait\.webp/);
  assert.match(hero, /class="hero__scrim"/);
  assert.match(hero, /alt="[^"]+"/);

  for (const asset of ["hero-portal.jpg", "hero-portal.webp", "hero-portal-portrait.jpg", "hero-portal-portrait.webp"]) {
    assert.ok(statSync(resolve(site, `media/live/${asset}`)).size > 8192, asset);
  }
  // The plate is behind the type, and the type still carries no calls to action.
  const css = read("css/homepage-cinematic.css");
  assert.match(css, /\.hero__backdrop \{[^}]*z-index: 0/s);
  assert.match(css, /\.hero__inner \{[^}]*z-index: 2/s);
  assert.doesNotMatch(hero, /<a\b|<button\b|class="btn/);
});

test("the restored interactions stay wired to the live markup hooks", () => {
  const script = read("js/homepage-cinematic.js");
  for (const hook of [
    "data-explorer-tabs", "data-explorer-feature", "data-orbit-fill", "data-dot",
    "data-growth-stages", "data-growth-signal", "data-growth-live",
    "data-chain-step", "data-compare", "data-nav-toggle", "data-nav-sheet",
    "data-film-rail", "data-film-skip",
  ]) {
    assert.ok(script.includes(hook), hook);
    assert.ok(html.includes(hook), `markup is missing ${hook}`);
  }
});
