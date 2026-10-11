import test from 'node:test';
import assert from 'node:assert/strict';
import { enhanceFinalPolishHtml, shouldPolishPath } from '../lib/final-polish.mjs';

const doc = (body, head = '') => `<!doctype html><html><head>${head}</head><body><main>${body}</main></body></html>`;

test('final polish targets only remaining audited quality routes', () => {
  assert.equal(shouldPolishPath('/en/shop/'), true);
  assert.equal(shouldPolishPath('/en/shop/product/seo-aeo/'), true);
  assert.equal(shouldPolishPath('/de/landing-seo.html'), true);
  assert.equal(shouldPolishPath('/en/blog/lokalni-seo-google-mapa.html'), true);
  assert.equal(shouldPolishPath('/assets/app.js'), false);
});

test('English shop removes remaining literal phrasing', () => {
  const html = enhanceFinalPolishHtml(doc(`
    <p>The final price shall be confirmed after the scope is agreed.</p>
    <p>A web assistant and communication channels that respond, qualify and collect queries.</p>
    <h3>Autostart</h3><h3>Content system</h3><li>Technical</li>
  `, '<title>SEO · GEO · AEO — from 249 KM  Digital X Shop</title>'), '/en/shop/product/seo-aeo/');
  assert.doesNotMatch(html, /shall be confirmed|communication channels that respond|Autostart|Content system|<li>Technical<\/li>|KM  Digital/);
  assert.match(html, /final price is confirmed after the scope is agreed/i);
  assert.match(html, /Automation Starter/);
  assert.match(html, /Content System/);
  assert.match(html, /Technical SEO foundation/);
  assert.match(html, /KM \| Digital X Shop/);
});

test('German SEO landing is natural and avoids unsupported absolutes', () => {
  const html = enhanceFinalPolishHtml(doc(`
    <p>Google Search. Google Maps. Und zunehmend ChatGPT, Perplexity und Gemini. Unser Paket umfasst alle drei Fronten, <b>Von 249 KM monatlich</b>Nur in BiH mit AEO-Optimierungsstandard enthalten.</p>
    <span>. . . Keine vertragliche Verpflichtung mehr als 3 Monate</span><span>. Monatlicher Bericht in menschlicher Sprache</span><span>. Freie Analyse</span>
    <li>technische Optimierung, Schlüsselwörter, Inhalte, interne Link</li>
    <li><b>GEO:</b> Google Business Profile, Bewertungen, lokale Karten — Um Sie zu finden "Nah"</li>
    <li><b>AEO:</b> Schema Markup, llms.txt, Q&amp;A-Struktur, KI-Crawler-Ansatz — um Ihnen AI zu empfehlen</li>
    <li><b>Bericht:</b> Was getan wird, was gewachsen ist, was als nächstes kommt — ohne Slang</li>
    <h2>Warum die AEO — Warum jetzt?</h2>
    <p>Millionen von Menschen nicht mehr Google – sie fragen KI. Wenn KI nicht über Sie weiß, Sie nicht für diese Kunden existieren.</p>
    <p>95% der BiH-Standorte haben auch keine Grundmarkierung.</p>
    <p>Alles, was wir für die AEO (Struktur, klare Antworten, Autorität) gleichzeitig zu tun, stärkt und klassische SEO.</p>
    <p>In kleineren bosnischen Städten ist der Wettbewerb so inaktiv, dass zwei bis drei Monate disziplinierter Arbeit realistisch in die Top 3 führen. In härteren Nischen dauert es länger — im ersten Gespräch sagen wir ehrlich, was realistisch ist.</p>
    <p>AEO ist Optimierung für KI-Suchmaschinen. Millionen Menschen googeln nicht mehr — sie fragen eine KI. Kennt die KI Sie nicht, existieren Sie für diese Kunden nicht. Alles, was wir für AEO tun, stärkt zugleich das klassische SEO.</p>
  `), '/de/landing-seo.html');
  assert.doesNotMatch(html, /alle drei Fronten|Von 249|menschlicher Sprache|Freie Analyse|interne Link|Um Sie zu finden|um Ihnen AI zu empfehlen|ohne Slang|Warum die AEO|Millionen von Menschen nicht mehr Google|95%|realistisch in die Top 3|existieren Sie für diese Kunden nicht/);
  assert.match(html, /ab 249 KM pro Monat/);
  assert.match(html, /Kostenlose Analyse/);
  assert.match(html, /interne Verlinkung/);
  assert.match(html, /Schema Markup, llms\.txt/);
  assert.match(html, /Erste messbare Veränderungen/);
});

test('English local SEO article gets a polished H1, bullets and non-absolute claims', () => {
  const html = enhanceFinalPolishHtml(doc(`
    <h1>Local SEO: how to be first on Google map in your city</h1>
    <h2>Why this is the most profitable marketing for local business</h2>
    <li><b>Google Business Profile:</b> Complete and accurate — exact primary category, description, working time, price services, at least 10 real photos. Empty profile = invisible profile.</li>
    <li><b>Reviews:</b> number, average, freshness and — what most do not know — <i>text</i> review.</li>
    <li><b>NAP consistency:</b> The name, address and phone must be identical on the site, profile, Facebook and in folders. Google reads different data as unreliable.</li>
    <li><b>Activity:</b> response to reviews, weekly posts on the profile, up-to-date information.</li>
    <blockquote>A regulated profile = visibility on both the map and AI responses.</blockquote>
  `, '<script type="application/ld+json">{"@type":"Article","headline":"Local SEO: how to be first on Google map in your city"}</script>'), '/en/blog/lokalni-seo-google-mapa.html');
  assert.doesNotMatch(html, /how to be first on Google map|most profitable marketing|at least 10|invisible profile|what most do not know|must be identical|reads different data as unreliable|weekly posts|visibility on both the map and AI responses/);
  assert.match(html, /Local SEO: How to Rank in Google Maps Top 3/);
  assert.match(html, /Missing or outdated fields can weaken/);
  assert.match(html, /Conflicting information can create ambiguity/);
  assert.match(html, /publish useful updates when/);
  assert.match(html, /clearer public information about your business/);
});
