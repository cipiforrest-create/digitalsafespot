const SITE_ORIGIN = 'https://www.digital-x-marketing.com';

const PRODUCT_GUIDES = {
  'web-presence': '/blog/koliko-kosta-web-stranica-bih.html',
  'ecommerce-launch': '/blog/aplikacije-po-mjeri.html',
  'application-mvp': '/growthos.html',
  'second-brain-os': '/second-brain-os.html',
  'ai-concierge': '/blog/ai-chatbot-vodic.html',
  'workflow-starter': '/blog/ai-automatizacija-vodic.html',
  'review-engine': '/blog/automatizacija-recenzija.html',
  'seo-aeo': '/blog/aeo-vodic.html',
  'growth-campaigns': '/blog/google-meta-oglasi-vodic.html',
  'speed-optimization': '/blog/brzina-sajta.html',
  'content-system': '/blog/content-marketing-vodic.html',
  'digital-partner': '/o-nama.html',
};

const PRODUCT_DEPTH = {
  'web-presence': {
    bs: ['Za biznise kojima treba ozbiljna prezentacijska stranica bez nepotrebne kompleksnosti.', 'Jasna struktura ponude, mobilni dizajn, kontaktne putanje, osnovni tehnički SEO i mjerenje ključnih radnji.', 'Rad počinje sadržajnom arhitekturom i prioritetnim stranicama, zatim dizajnom, razvojem i provjerom na telefonu i desktopu.', 'Predaja uključuje objavljenu stranicu, osnovne upute za izmjene i listu preporučenih narednih SEO ili konverzijskih koraka.'],
    en: ['For businesses that need a credible presentation website without unnecessary complexity.', 'A clear offer structure, mobile-first design, conversion-ready contact paths, essential technical SEO and key-event measurement.', 'Work starts with content architecture and priority pages, followed by design, development and device-level QA.', 'Handover includes the published website, basic editing guidance and a prioritized list of next SEO or conversion improvements.'],
    de: ['Für Unternehmen, die eine professionelle Präsentationswebsite ohne unnötige Komplexität benötigen.', 'Klare Angebotsstruktur, Mobile-First-Design, kontaktstarke Wege, technische SEO-Basis und Messung wichtiger Aktionen.', 'Wir beginnen mit Inhaltsarchitektur und Prioritätsseiten, danach folgen Design, Entwicklung und Geräteprüfung.', 'Die Übergabe umfasst die veröffentlichte Website, kurze Pflegehinweise und priorisierte Empfehlungen für SEO und Conversion.'],
  },
  'ecommerce-launch': {
    bs: ['Za prodavnice koje žele da kupac završi cijeli proces od proizvoda do narudžbe bez ručnog prepisivanja.', 'Kategorije, proizvodi, korpa, dostava, plaćanje, osnovna analitika i administrativni tok prilagođen stvarnoj ponudi.', 'Prvo mapiramo katalog, pravila isporuke i naplate, zatim gradimo checkout i testiramo cijeli put kupca.', 'Predaja uključuje funkcionalnu trgovinu, testne narudžbe, osnovnu obuku i checklistu za siguran launch.'],
    en: ['For stores that want customers to complete the journey from product discovery to order without manual handoffs.', 'Categories, products, cart, delivery, payment, essential analytics and an admin flow matched to the real catalogue.', 'We map the catalogue, shipping and payment rules first, then build checkout and test the full customer journey.', 'Handover includes a working store, test orders, basic training and a launch checklist.'],
    de: ['Für Shops, die den Weg von der Produktauswahl bis zur Bestellung ohne manuelle Übergaben abbilden möchten.', 'Kategorien, Produkte, Warenkorb, Versand, Zahlung, Basis-Analytics und ein Admin-Ablauf passend zum realen Sortiment.', 'Zuerst klären wir Katalog, Versand- und Zahlungsregeln, danach bauen und testen wir den vollständigen Checkout.', 'Die Übergabe umfasst den funktionsfähigen Shop, Testbestellungen, eine kurze Einweisung und eine Launch-Checkliste.'],
  },
  'application-mvp': {
    bs: ['Za firme kojima gotovi alati više ne prate stvarni proces rada.', 'MVP fokusiran na jedan glavni workflow: portal, rezervacije, dashboard, CRM tok ili drugi interni operativni proces.', 'Definišemo korisnike, dozvole, podatke i najvrjedniji tok prije nego što se gradi dodatna funkcionalnost.', 'Predaja uključuje radni MVP, dokumentovane ključne tokove i plan narednih faza prema stvarnoj upotrebi.'],
    en: ['For teams whose real workflow no longer fits off-the-shelf tools.', 'A focused MVP around one core workflow: portal, booking, dashboard, CRM flow or another internal operating process.', 'We define users, permissions, data and the highest-value flow before expanding functionality.', 'Handover includes a working MVP, documented core flows and a phased roadmap based on real usage.'],
    de: ['Für Teams, deren reale Abläufe nicht mehr zu Standardsoftware passen.', 'Ein fokussiertes MVP für einen Kernprozess: Portal, Buchung, Dashboard, CRM-Ablauf oder einen anderen internen Prozess.', 'Vor dem Ausbau definieren wir Nutzer, Rechte, Daten und den wertvollsten Arbeitsablauf.', 'Die Übergabe umfasst ein funktionsfähiges MVP, dokumentierte Kernabläufe und einen Phasenplan auf Basis der echten Nutzung.'],
  },
  'second-brain-os': {
    bs: ['Za timove koji imaju važno znanje razbacano po dokumentima, razgovorima i alatima.', 'Privatni sloj znanja koji povezuje odobrene izvore, pretragu, kontekst i kontrolisane AI komande.', 'Prvo definišemo izvore, pravila pristupa i osjetljive akcije, pa tek onda povezujemo asistenta i automatizacije.', 'Predaja uključuje mapu izvora, pravila dozvola, testirane scenarije i jasan trag šta AI smije, a šta ne smije raditi.'],
    en: ['For teams with important knowledge scattered across documents, conversations and tools.', 'A private knowledge layer connecting approved sources, retrieval, context and controlled AI actions.', 'We define sources, access rules and sensitive actions before connecting the assistant and automations.', 'Handover includes a source map, permission rules, tested scenarios and a clear boundary of what the AI may and may not do.'],
    de: ['Für Teams, deren wichtiges Wissen über Dokumente, Gespräche und Tools verteilt ist.', 'Eine private Wissensschicht mit freigegebenen Quellen, Suche, Kontext und kontrollierten KI-Aktionen.', 'Zuerst definieren wir Quellen, Zugriffsregeln und sensible Aktionen, danach verbinden wir Assistent und Automatisierungen.', 'Die Übergabe umfasst Quellenübersicht, Berechtigungen, getestete Szenarien und klare Grenzen für erlaubte KI-Aktionen.'],
  },
  'ai-concierge': {
    bs: ['Za biznise koji gube vrijeme na ista pitanja ili sporo odgovaraju na nove upite.', 'AI asistent za web ili odabrane kanale koji odgovara iz provjerenog konteksta, kvalifikuje upit i prikuplja potrebne podatke.', 'Definišemo dozvoljene teme, tone of voice, eskalaciju prema čovjeku i podatke koje asistent smije tražiti.', 'Predaja uključuje testne scenarije, fallback pravila i mjerljive tačke poput kvalifikovanih upita ili rezervacija.'],
    en: ['For businesses that lose time on repetitive questions or respond too slowly to new enquiries.', 'An AI assistant for web or selected channels that answers from approved context, qualifies enquiries and collects the right details.', 'We define allowed topics, tone of voice, human escalation and exactly which data the assistant may request.', 'Handover includes tested scenarios, fallback rules and measurable outcomes such as qualified leads or bookings.'],
    de: ['Für Unternehmen, die Zeit mit wiederkehrenden Fragen verlieren oder neue Anfragen zu langsam beantworten.', 'Ein KI-Assistent für Web oder ausgewählte Kanäle, der aus freigegebenem Kontext antwortet, Anfragen qualifiziert und relevante Daten erfasst.', 'Wir definieren erlaubte Themen, Tonalität, Übergabe an Menschen und welche Daten der Assistent abfragen darf.', 'Die Übergabe umfasst Testszenarien, Fallback-Regeln und messbare Ziele wie qualifizierte Leads oder Buchungen.'],
  },
  'workflow-starter': {
    bs: ['Za timove koji isti podatak ručno prepisuju između maila, forme, CRM-a i zadataka.', 'Jedan prioritetni workflow od okidača do provjerene akcije, obavijesti ili zapisa u sistemu.', 'Mapiramo sadašnji ručni proces, izuzetke i tačke gdje automatizacija mora stati i tražiti potvrdu.', 'Predaja uključuje testne slučajeve, evidenciju grešaka i jednostavan opis kako se workflow prati i održava.'],
    en: ['For teams that manually copy the same information between email, forms, CRM and task tools.', 'One priority workflow from trigger to a verified action, notification or system record.', 'We map the current manual process, exceptions and the points where automation must stop for human approval.', 'Handover includes test cases, error handling and a simple operating note for monitoring and maintenance.'],
    de: ['Für Teams, die dieselben Daten manuell zwischen E-Mail, Formularen, CRM und Aufgaben übertragen.', 'Ein priorisierter Workflow vom Auslöser bis zur geprüften Aktion, Benachrichtigung oder Systembuchung.', 'Wir erfassen den heutigen manuellen Prozess, Ausnahmen und Stellen, an denen eine Freigabe durch Menschen nötig ist.', 'Die Übergabe umfasst Tests, Fehlerbehandlung und eine kurze Betriebsanleitung für Monitoring und Pflege.'],
  },
  'review-engine': {
    bs: ['Za lokalne i uslužne biznise koji žele sistematski tražiti recenziju nakon stvarno završene usluge.', 'Automatski zahtjev za recenziju, podsjetnik po pravilima i jasan tok bez agresivnog spamovanja klijenata.', 'Povezujemo trenutak završetka usluge s pravilnim timingom poruke i mogućnošću ručnog isključivanja.', 'Predaja uključuje poruke, pravila slanja, testni tok i pregled kako mjeriti stopu odgovora.'],
    en: ['For local and service businesses that want a consistent review request after a genuinely completed service.', 'An automated review request, rule-based follow-up and a clear flow without aggressive customer spam.', 'We connect the service-completion moment to appropriate message timing and a manual opt-out path.', 'Handover includes message templates, sending rules, a tested flow and a simple way to track response rate.'],
    de: ['Für lokale Dienstleister, die nach tatsächlich abgeschlossenen Leistungen systematisch um Bewertungen bitten möchten.', 'Automatisierte Bewertungsanfrage, regelbasierte Erinnerung und ein klarer Ablauf ohne aggressives Nachfassen.', 'Wir verbinden den Abschluss der Leistung mit passendem Versandzeitpunkt und einer manuellen Ausschlussmöglichkeit.', 'Die Übergabe umfasst Nachrichten, Versandregeln, Tests und eine einfache Messung der Rücklaufquote.'],
  },
  'seo-aeo': {
    bs: ['Za biznise kojima trebaju tehnički SEO, lokalna vidljivost i spremnost sadržaja za AI odgovore u jednom planu.', 'Tehnička baza, Google Business i Maps signali, sadržaj, strukturirani podaci i jasna mjesečna evidencija promjena.', 'Prioriteti se biraju prema stvarnoj potražnji, stanju sajta i konkurenciji, a ne prema generičnoj SEO checklisti.', 'Predaja svakog ciklusa uključuje šta je urađeno, šta se promijenilo i koji je sljedeći najvrjedniji korak.'],
    en: ['For businesses that need technical SEO, local visibility and AI-answer readiness in one plan.', 'Technical foundations, Google Business and Maps signals, content, structured data and a clear monthly record of changes.', 'Priorities are chosen from real search demand, site condition and competition rather than a generic SEO checklist.', 'Each cycle ends with what changed, what was measured and the next highest-value action.'],
    de: ['Für Unternehmen, die technische SEO, lokale Sichtbarkeit und Vorbereitung für KI-Antworten in einem Plan benötigen.', 'Technische Basis, Google-Business- und Maps-Signale, Inhalte, strukturierte Daten und klare monatliche Dokumentation.', 'Prioritäten entstehen aus realer Nachfrage, Website-Zustand und Wettbewerb statt aus einer generischen SEO-Checkliste.', 'Jeder Zyklus endet mit dokumentierten Änderungen, Messwerten und dem nächsten wertvollsten Schritt.'],
  },
  'growth-campaigns': {
    bs: ['Za biznise koji žele da Meta ili Google kampanje budu vezane za stvarni prodajni cilj, a ne samo klikove.', 'Struktura kampanje, landing putanja, mjerenje konverzije i optimizacija prema kvalitetu upita ili prodaje.', 'Prvo provjeravamo ponudu, tracking i odredišnu stranicu, pa tek onda skaliramo budžet.', 'Predaja uključuje pregled potrošnje, konverzija, naučenih signala i odluku šta testirati sljedeće.'],
    en: ['For businesses that want Meta or Google campaigns tied to a real sales goal rather than clicks alone.', 'Campaign structure, landing journey, conversion measurement and optimization around lead or sales quality.', 'We validate the offer, tracking and destination page before increasing spend.', 'Handover includes spend, conversions, learned signals and a clear decision on the next test.'],
    de: ['Für Unternehmen, die Meta- oder Google-Kampagnen an echte Vertriebsziele statt nur an Klicks koppeln möchten.', 'Kampagnenstruktur, Landing-Journey, Conversion-Messung und Optimierung nach Lead- oder Verkaufsqualität.', 'Wir prüfen Angebot, Tracking und Zielseite, bevor Budgets erhöht werden.', 'Die Übergabe umfasst Ausgaben, Conversions, gewonnene Signale und eine klare Entscheidung für den nächsten Test.'],
  },
  'speed-optimization': {
    bs: ['Za postojeće stranice kojima trebaju brže učitavanje, stabilniji layout i tehničko čišćenje bez kompletnog redizajna.', 'Analiza najvećih usporenja, optimizacija resursa, slika i učitavanja te uklanjanje jasnih tehničkih regresija.', 'Mjerimo stanje prije izmjena i ponovo nakon zahvata da se vidi stvarna razlika, ne samo osjećaj brzine.', 'Predaja uključuje prije/poslije nalaze, promjene koje su napravljene i listu problema koji zahtijevaju veći razvojni zahvat.'],
    en: ['For existing sites that need better loading speed, layout stability and technical cleanup without a full redesign.', 'Bottleneck analysis, resource and image optimization, loading improvements and removal of clear technical regressions.', 'We measure before the changes and again after implementation so the result is evidence-based, not just perceived speed.', 'Handover includes before/after findings, implemented changes and a list of issues that require a larger development effort.'],
    de: ['Für bestehende Websites, die schnellere Ladezeiten, stabileres Layout und technische Bereinigung ohne komplettes Redesign benötigen.', 'Analyse der Engpässe, Optimierung von Ressourcen und Bildern, besseres Laden und Beseitigung klarer technischer Regressionen.', 'Wir messen vor und nach der Umsetzung, damit der Effekt belegt und nicht nur subjektiv wahrgenommen wird.', 'Die Übergabe umfasst Vorher/Nachher-Befunde, umgesetzte Änderungen und Punkte, die einen größeren Entwicklungsaufwand brauchen.'],
  },
  'content-system': {
    bs: ['Za brendove koji objavljuju neredovno ili svaki put počinju od prazne stranice.', 'Plan tema, copy, vizuelni format i kratki video organizovani u ponovljiv sistem sadržaja.', 'Definišemo stubove sadržaja, format odobravanja i šta se može reciklirati između kanala bez kopiranja svega jedan-na-jedan.', 'Predaja uključuje kalendar, gotove ili pripremljene objave i pravila koja održavaju konzistentan ton brenda.'],
    en: ['For brands that publish inconsistently or restart from a blank page every time.', 'Topic planning, copy, visual formats and short video organized into a repeatable content system.', 'We define content pillars, approval flow and what can be repurposed across channels without copying everything one-to-one.', 'Handover includes a calendar, ready or prepared posts and rules that keep the brand voice consistent.'],
    de: ['Für Marken, die unregelmäßig veröffentlichen oder jedes Mal bei null beginnen.', 'Themenplanung, Copy, visuelle Formate und Kurzvideo als wiederholbares Content-System.', 'Wir definieren Content-Säulen, Freigabeprozess und welche Inhalte kanalübergreifend sinnvoll wiederverwendet werden können.', 'Die Übergabe umfasst Kalender, fertige oder vorbereitete Beiträge und Regeln für eine konsistente Markenstimme.'],
  },
  'digital-partner': {
    bs: ['Za firme kojima ne treba još jedan izolovan projekat nego kontinuirano poboljšavanje weba, vidljivosti, sadržaja i automatizacije.', 'Prioritetni backlog, redovni ciklusi isporuke i jedan pregled šta trenutno najviše utiče na rast ili operativnu efikasnost.', 'Svaki ciklus počinje izborom nekoliko mjerljivih prioriteta umjesto paralelnog rada na svemu.', 'Predaja je kontinuirana: završeni taskovi, rezultati, otvoreni rizici i sljedeći prioritet su uvijek vidljivi.'],
    en: ['For businesses that do not need another isolated project, but ongoing improvement across web, visibility, content and automation.', 'A prioritized backlog, regular delivery cycles and one view of what currently matters most for growth or operating efficiency.', 'Each cycle starts by choosing a small number of measurable priorities instead of working on everything at once.', 'Delivery is continuous: completed work, outcomes, open risks and the next priority remain visible.'],
    de: ['Für Unternehmen, die kein weiteres Einzelprojekt, sondern kontinuierliche Verbesserung von Web, Sichtbarkeit, Content und Automation benötigen.', 'Priorisierter Backlog, regelmäßige Lieferzyklen und ein gemeinsamer Blick auf die aktuell wichtigsten Wachstums- oder Effizienzhebel.', 'Jeder Zyklus startet mit wenigen messbaren Prioritäten statt mit paralleler Arbeit an allem.', 'Die Lieferung ist kontinuierlich: erledigte Aufgaben, Ergebnisse, offene Risiken und der nächste Schwerpunkt bleiben sichtbar.'],
  },
};

const META = {
  '/growthos.html': ['GrowthOS poslovna aplikacija po mjeri | CRM, automatizacija i AI | Digital X', 'GrowthOS povezuje CRM, projekte, automatizacije, izvještaje, portal za klijente i AI znanje u poslovnu aplikaciju prilagođenu stvarnom procesu firme.'],
  '/en/growthos.html': ['GrowthOS Custom Business App | CRM, Automation & AI | Digital X', 'Explore GrowthOS, a custom business app that connects CRM, projects, automation, reports, client portal and AI knowledge in one workflow.'],
  '/de/growthos.html': ['GrowthOS Business-App nach Maß | CRM, Automatisierung & KI | Digital X', 'GrowthOS verbindet CRM, Projekte, Automatisierungen, Berichte, Kundenportal und KI-Wissen in einer maßgeschneiderten Business-App.'],
  '/cinematic-digitalx/': ['Cinematic web stranice | 3D scroll iskustva | Digital X', 'Cinematic web stranice sa scroll-driven storytellingom, premium interakcijama, SEO spremnom strukturom i razvojem po mjeri.'],
  '/en/cinematic-digitalx/': ['Digital X Cinematic Websites | 3D Scroll & Premium Web Experiences', 'Award-style cinematic websites with scroll-driven storytelling, premium interaction, SEO-ready structure and custom development by Digital X.'],
  '/de/cinematic-digitalx/': ['Digital X Cinematic Websites | 3D-Scroll & Premium-Web-Erlebnisse', 'Cinematic Websites mit scrollgetriebenem Storytelling, Premium-Interaktionen, SEO-tauglicher Struktur und individueller Entwicklung von Digital X.'],
};

const SECOND_LAYER_PATHS = new Set([
  '/shop/', '/en/shop/', '/de/shop/',
  '/de/landing-seo.html', '/en/blog/lokalni-seo-google-mapa.html',
  ...Object.keys(META),
]);

function localeForPath(pathname) {
  if (pathname.startsWith('/en/')) return 'en';
  if (pathname.startsWith('/de/')) return 'de';
  return 'bs';
}

function productId(pathname) {
  return pathname.match(/^\/(?:en\/|de\/)?shop\/product\/([^/]+)\/$/)?.[1] || null;
}

function localizePath(path, locale) {
  if (locale === 'bs') return path;
  return `/${locale}${path}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function stripBlockById(html, tag, id) {
  const re = new RegExp(`\\s*<${tag}\\b[^>]*\\bid=["']${id}["'][^>]*>[\\s\\S]*?<\\/${tag}>`, 'i');
  return html.replace(re, '');
}

function insertBeforeHeadClose(html, markup) {
  return /<\/head>/i.test(html) ? html.replace(/<\/head>/i, `${markup}\n</head>`) : `${markup}\n${html}`;
}

function insertBeforeMainClose(html, markup) {
  if (/<\/main>/i.test(html)) return html.replace(/<\/main>/i, `${markup}\n</main>`);
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${markup}\n</body>`);
  return `${html}\n${markup}`;
}

function replaceMeta(html, title, description) {
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  out = out.replace(/\s*<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i, '');
  out = insertBeforeHeadClose(out, `<meta name="description" content="${escapeHtml(description)}">`);
  out = out.replace(/(<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*\bcontent=["'])[^"']*(["'][^>]*>)/i, `$1${escapeHtml(title)}$2`);
  out = out.replace(/(<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*\bcontent=["'])[^"']*(["'][^>]*>)/i, `$1${escapeHtml(description)}$2`);
  out = out.replace(/(<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*\bcontent=["'])[^"']*(["'][^>]*>)/i, `$1${escapeHtml(title)}$2`);
  out = out.replace(/(<meta\b(?=[^>]*\bname=["']twitter:description["'])[^>]*\bcontent=["'])[^"']*(["'][^>]*>)/i, `$1${escapeHtml(description)}$2`);
  return out;
}

function productStyle() {
  return `<style id="dx-second-layer-style">
.dx-product-depth{max-width:1180px;margin:0 auto;padding:68px 24px}.dx-product-depth h2{margin:0 0 12px;font-size:clamp(1.8rem,4vw,3rem);line-height:1.08}.dx-product-depth>p{max-width:76ch;opacity:.78;line-height:1.7}.dx-product-depth-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:28px}.dx-product-depth article{padding:22px;border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:16px;background:color-mix(in srgb,currentColor 4%,transparent)}.dx-product-depth h3{margin:0 0 8px;font-size:1rem}.dx-product-depth article p{margin:0;line-height:1.65;opacity:.82}.dx-product-depth-link{margin-top:22px}.dx-product-depth-link a{color:inherit;text-decoration:underline;text-underline-offset:3px}@media(max-width:720px){.dx-product-depth{padding:52px 20px}.dx-product-depth-grid{grid-template-columns:1fr}}
</style>`;
}

function buildProductDepth(id, locale) {
  const copy = PRODUCT_DEPTH[id]?.[locale];
  if (!copy) return null;
  const labels = {
    bs: ['Šta tačno dobijate', 'Za koga je', 'Isporuka', 'Kako radimo', 'Predaja i kontrola', 'Povezani vodič'],
    en: ['What this service actually delivers', 'Best fit', 'Delivery', 'How we work', 'Handover and control', 'Related guide'],
    de: ['Was diese Leistung konkret liefert', 'Geeignet für', 'Lieferumfang', 'Arbeitsweise', 'Übergabe und Kontrolle', 'Passender Leitfaden'],
  }[locale];
  const intro = {
    bs: 'Opseg se potvrđuje prije početka, a ispod je praktičan okvir onoga što ova usluga rješava i kako izgleda predaja.',
    en: 'Scope is confirmed before work starts; this is the practical framework for what the service solves and how delivery is controlled.',
    de: 'Der genaue Umfang wird vor dem Start bestätigt; hier sehen Sie den praktischen Rahmen für Ziel, Umsetzung und Übergabe.',
  }[locale];
  const guide = localizePath(PRODUCT_GUIDES[id], locale);
  return `<section class="dx-product-depth" id="dx-product-depth" aria-labelledby="dx-product-depth-title">
<h2 id="dx-product-depth-title">${labels[0]}</h2><p>${intro}</p>
<div class="dx-product-depth-grid">
<article><h3>${labels[1]}</h3><p>${escapeHtml(copy[0])}</p></article>
<article><h3>${labels[2]}</h3><p>${escapeHtml(copy[1])}</p></article>
<article><h3>${labels[3]}</h3><p>${escapeHtml(copy[2])}</p></article>
<article><h3>${labels[4]}</h3><p>${escapeHtml(copy[3])}</p></article>
</div><p class="dx-product-depth-link"><a href="${guide}">${labels[5]} →</a></p></section>`;
}

function enhanceProduct(html, pathname) {
  const id = productId(pathname);
  if (!id || !PRODUCT_DEPTH[id]) return html;
  const locale = localeForPath(pathname);
  let out = stripBlockById(html, 'section', 'dx-product-depth');
  out = stripBlockById(out, 'style', 'dx-second-layer-style');
  out = insertBeforeHeadClose(out, productStyle());
  out = insertBeforeMainClose(out, buildProductDepth(id, locale));
  return out;
}

function cleanEnglishShop(html) {
  return html
    .replaceAll('Services as clear<br/><i>Digital products.</i>', 'Digital services with<br/><i>clear scope and pricing.</i>')
    .replaceAll('Select a web, AI, automation, growth or content as a clear digital product. For more complex requirements, please ask for a measure of evaluation.', 'Choose a web, AI, automation, growth or content service with a clear starting scope. For more complex needs, request a tailored estimate.')
    .replace(/>Of\s+(?=\d[\d.,\s]*KM)/g, '>From ')
    .replace(/>of\s+(?=\d[\d.,\s]*KM)/g, '>from ')
    .replace(/>Corp\b/g, '>Cart')
    .replaceAll('The final price shall be confirmed after the volume agreement.', 'The final price is confirmed after the scope is agreed.')
    .replaceAll('Presentation page with clear offer, mobile design, basic SEO and contact during.', 'A focused business website with a clear offer, mobile-first design, essential SEO and conversion-ready contact paths.')
    .replaceAll('Complete trade with categories, products, delivery, payment and training.', 'A complete online store with categories, products, delivery, payment and practical admin training.')
    .replaceAll('Quick download, more stable display and technical cleaning of the existing site.', 'Faster loading, more stable rendering and technical cleanup of the existing site.')
    .replaceAll('Meta and Google campaigns related to the landing site, analyst and sales target.', 'Meta and Google campaigns connected to the landing page, analytics and measurable sales goals.')
    .replaceAll('Maybe you need this too.', 'You may also need this.')
    .replaceAll('Custom offer', 'Tailored offer');
}

function cleanGermanShop(html) {
  return html
    .replaceAll('Meta- und Google-Kampagnen im Zusammenhang mit der Landestelle, Analyst und Vertriebsziel.', 'Meta- und Google-Kampagnen mit Landingpage, Analytics und messbaren Vertriebszielen.')
    .replaceAll('Schneller Download, stabilere Anzeige und technische Reinigung der bestehenden Seite.', 'Schnellere Ladezeiten, stabilere Darstellung und technische Bereinigung der bestehenden Website.')
    .replaceAll('Vielleicht brauchst du das auch.', 'Das könnte ebenfalls sinnvoll sein.')
    .replaceAll('Kundenspezifisches Angebot', 'Individuelles Angebot')
    .replaceAll('Der angegebene Preis ist eine erste Schätzung. Der endgültige Umfang und die Frist werden vor dem Start bestätigt.', 'Der angegebene Preis ist eine erste Schätzung. Der endgültige Leistungsumfang und Zeitplan werden vor dem Start bestätigt.')
    .replace(/<li>Technische<\/li>/g, '<li>Technische SEO-Basis</li>');
}

function fixGermanSeoLanding(html) {
  const title = 'SEO, GEO & AEO Agentur | Google, Maps & AI-Suche | Digital X';
  const desc = 'SEO, lokale Sichtbarkeit auf Google Maps und AEO für AI-Suche in einem Paket. Technische Optimierung, Google Business Profile, Content und klare Reports ab 249 KM/Monat.';
  let out = replaceMeta(html, title, desc);
  out = out.replace(/\s*<script\b[^>]*type=["']application\/ld\+json["'][^>]*>\s*\{[\s\S]*?"@type"\s*:\s*"Service"[\s\S]*?<\/script>/i, '');
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_ORIGIN}/de/landing-seo.html#service`,
    name: 'SEO, GEO & AEO Optimierung',
    description: desc,
    serviceType: 'SEO, GEO und AEO',
    provider: { '@id': `${SITE_ORIGIN}/#organization` },
    areaServed: ['BA', 'HR', 'RS', 'DE', 'AT', 'CH'],
    url: `${SITE_ORIGIN}/de/landing-seo.html`,
    inLanguage: 'de',
  };
  out = insertBeforeHeadClose(out, `<script id="dx-de-seo-service" type="application/ld+json">${JSON.stringify(schema)}</script>`);
  out = out
    .replace('Kunden suchen Sie auf <span class="grad-text">Drei Plätze.</span> Wie lange finden sie dich?', 'Kunden suchen Sie in <span class="grad-text">drei Kanälen.</span> Werden Sie gefunden?')
    .replace('Kunden suchen Sie auf <span>Drei Plätze.</span> Wie lange finden sie dich?', 'Kunden suchen Sie in <span>drei Kanälen.</span> Werden Sie gefunden?')
    .replace('Google Search Google Maps. Und zunehmend - ChatGPT, Komplexität und Zwillinge.', 'Google Search. Google Maps. Und zunehmend ChatGPT, Perplexity und Gemini.')
    .replace(/<b>- Ich weiß nicht\.<\/b>/g, '<b>GEO:</b>')
    .replace(/<b>- Ich bin nicht mehr da\.<\/b>/g, '<b>AEO:</b>')
    .replaceAll('Scarpee Scheme, lmms.txt', 'Schema Markup, llms.txt')
    .replaceAll('Senden — Analyse bei 24 Stunden', 'Senden — Analyse innerhalb von 24 Stunden')
    .replaceAll('Im Gegensatz zu Anzeigen, die Optimierung nicht aufhören, wenn Sie aufhören zu bezahlen.', 'Im Gegensatz zu Anzeigen endet organische Sichtbarkeit nicht automatisch, sobald das Werbebudget pausiert.');
  return out;
}

function fixEnglishLocalSeo(html) {
  const title = 'Local SEO: How to Rank in Google Maps Top 3 | Digital X';
  const desc = 'A practical guide to Google Business Profile, reviews, NAP consistency and activity—the core signals that help local businesses compete for Google Maps visibility.';
  let out = replaceMeta(html, title, desc);
  out = out
    .replace(/When someone in your town type in a "tooth near" or "car service \+ city", Google above all results shows <b>three business on a map<\/b>These three get a huge majority of calls, all the others are crumbs\. Local SEO \(GEO\) is the discipline of entry at these three\./, 'When someone searches for “dentist near me” or “car service + city”, Google often highlights three local businesses in the map pack. Those positions can capture a meaningful share of high-intent calls and direction requests. Local SEO is the work of making your business eligible and competitive for that visibility.')
    .replaceAll('Full-full — exact primary category', 'Complete and accurate — exact primary category')
    .replace(/The person who(?:'|’)?s looking for "near" is ready to buy <i>today<\/i>[\s\S]*?(?=<\/p>)/, 'Someone searching “near me” usually has strong local intent. A well-maintained profile can continue attracting organic discovery without paying for each click. Results vary by market, but consistent optimization improves the signals Google uses to understand relevance and trust.')
    .replace(/By yourself: download your profile on business\.google\.com, fill in everything[\s\S]*?(?=<\/p>)/, 'On your own: claim or verify your Google Business Profile, complete every relevant field, add current photos and ask real customers for an honest review after service.')
    .replace(/A bonus that competition does not know: AI browsers \(ChatGPT, Gemini\) use Google Business information for local recommendations\./, 'AI assistants may draw on public business information from sources such as your website, business profiles and other trusted pages, depending on the system and query.')
    .replaceAll('"Great hairdresser, fast order, Sarajevo" is worth more than the "5 stars".', 'A specific written review provides more context than a star rating alone.');
  return out;
}

export function shouldEnhanceSecondLayerPath(pathname) {
  if (!pathname) return false;
  if (productId(pathname)) return true;
  return SECOND_LAYER_PATHS.has(pathname);
}

export function enhanceSecondLayerHtml(source, pathname) {
  if (typeof source !== 'string' || !shouldEnhanceSecondLayerPath(pathname)) return source;
  let html = source;
  const locale = localeForPath(pathname);

  if (pathname === '/en/shop/' || pathname.startsWith('/en/shop/product/')) html = cleanEnglishShop(html);
  if (pathname === '/de/shop/' || pathname.startsWith('/de/shop/product/')) html = cleanGermanShop(html);
  if (productId(pathname)) html = enhanceProduct(html, pathname);
  if (pathname === '/de/landing-seo.html') html = fixGermanSeoLanding(html);
  if (pathname === '/en/blog/lokalni-seo-google-mapa.html') html = fixEnglishLocalSeo(html);
  if (META[pathname]) html = replaceMeta(html, META[pathname][0], META[pathname][1]);

  return html;
}
