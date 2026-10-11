// Eight representative fixtures for the T16 analyzer split. Each is (name, html, url, status).
// They exercise healthy pages, missing metadata, heading anomalies, CTA/contact signals, valid and
// malformed schema, malformed markup, and a partial/truncated-style body. Used by both the golden
// AuditFacts tests and the analyzeHtml byte-parity tests, so the same inputs prove both layers.
export type Fixture = { name: string; html: string; url: string; status: number };
const healthy = `<!doctype html><html lang="bs"><head>
<title>Digital X — web i AI agencija Sarajevo</title>
<meta name="description" content="Cinematic web stranice, AI asistenti i SEO za firme u Bosni i Hercegovini. Pomažemo vam do više klijenata i bolje vidljivosti.">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="https://example.com/">
<meta property="og:title" content="Digital X">
<meta property="og:image" content="https://example.com/og.png">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Digital X","url":"https://example.com/"}</script>
</head><body><main>
<h1>Web i AI rješenja za vaš rast</h1>
<h2>Usluge</h2><h2>Primjeri</h2>
<p>${'Nudimo web stranice, AI asistente i SEO usluge za firme koje žele više klijenata. '.repeat(8)}</p>
<img src="a.jpg" alt="Web dizajn"><img src="b.jpg" alt="AI asistent">
<a href="mailto:info@example.com">Kontaktirajte nas</a>
</main></body></html>`;
const missingMeta = `<!doctype html><html><head></head><body>
<p>Neki tekst bez naslova, opisa, canonicala i viewporta.</p>
</body></html>`;
const headingsAnomaly = `<!doctype html><html lang="bs"><head><title>Stranica s više glavnih naslova ovdje</title>
<meta name="description" content="Ova stranica ima tri H1 elementa da pokaže kako se ocjenjuje hijerarhija naslova na stranici danas.">
<meta name="viewport" content="width=device-width"></head><body>
<h1>Prvi glavni naslov</h1><h1>Drugi glavni naslov</h1><h1>Treći glavni naslov</h1>
</body></html>`;
const ctaSignals = `<!doctype html><html lang="bs"><head><title>Kontakt i poziv na akciju stranica</title>
<meta name="description" content="Stranica s formom, telefonom i e-mailom kao jasnim putem do upita za posjetioce koji žele ponudu.">
<meta name="viewport" content="width=device-width"></head><body>
<h1>Zatražite ponudu za vaše usluge</h1>
<form action="/contact"><input name="email"><button>Pošalji</button></form>
<a href="tel:+38761123456">Nazovite nas</a>
</body></html>`;
const schemaValid = `<!doctype html><html lang="bs"><head><title>Lokalna firma sa strukturiranim podacima</title>
<meta name="description" content="Primjer stranice s ispravnim LocalBusiness i FAQPage JSON-LD oznakama za bolju vidljivost u pretrazi.">
<meta name="viewport" content="width=device-width">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"LocalBusiness","name":"Firma"},{"@type":"FAQPage"}]}</script>
</head><body><h1>Naša lokalna firma</h1><p>Opis usluga i ponude za klijente u regiji.</p></body></html>`;
const schemaMalformed = `<!doctype html><html lang="bs"><head><title>Stranica s neispravnim JSON-LD blokom</title>
<meta name="description" content="Ova stranica sadrži neispravan JSON-LD koji parser mora tretirati kao podatak i prijaviti kao neispravan.">
<meta name="viewport" content="width=device-width">
<script type="application/ld+json">{ ovo nije ispravan json }</script>
</head><body><h1>Naslov</h1></body></html>`;
const malformedHtml = `<html><head><title>Neuredan HTML bez zatvaranja</title>
<meta name="robots" content="noindex"><body><h1>Naslov<h1>Drugi<p>Tekst<img src=x><a href="mailto:x@y.z">Mail`;
const truncatedLike = `<!doctype html><html lang="bs"><head><title>Djelimično dohvaćena stranica presje`;
export const auditFixtures: Fixture[] = [
  { name: 'healthy', html: healthy, url: 'https://example.com/', status: 200 },
  { name: 'missing-meta', html: missingMeta, url: 'http://example.com/', status: 200 },
  { name: 'headings-anomaly', html: headingsAnomaly, url: 'https://example.com/', status: 200 },
  { name: 'cta-signals', html: ctaSignals, url: 'https://example.com/', status: 200 },
  { name: 'schema-valid', html: schemaValid, url: 'https://example.com/', status: 200 },
  { name: 'schema-malformed', html: schemaMalformed, url: 'https://example.com/', status: 200 },
  { name: 'malformed-html', html: malformedHtml, url: 'https://example.com/', status: 200 },
  { name: 'truncated-like', html: truncatedLike, url: 'https://example.com/', status: 200 },
];