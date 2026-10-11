const EN_SHOP_RE = /^\/en\/shop\/(?:$|product\/[^/]+\/$)/;

export function shouldPolishPath(pathname) {
  return EN_SHOP_RE.test(pathname || '')
    || pathname === '/de/shop/'
    || pathname === '/de/landing-seo.html'
    || pathname === '/en/blog/lokalni-seo-google-mapa.html';
}

function polishEnglishShop(html) {
  return html
    .replaceAll('The final price shall be confirmed after the scope is agreed.', 'The final price is confirmed after the scope is agreed.')
    .replaceAll('The final price shall be confirmed after the volume agreement.', 'The final price is confirmed after the scope is agreed.')
    .replaceAll('A web assistant and communication channels that respond, qualify and collect queries.', 'An AI assistant for web and selected channels that answers questions, qualifies enquiries and captures the details your team needs.')
    .replaceAll('Autostart', 'Automation Starter')
    .replaceAll('Content system', 'Content System')
    .replace(/<li>Technical<\/li>/g, '<li>Technical SEO foundation</li>')
    .replaceAll(' KM  Digital X Shop', ' KM | Digital X Shop');
}

function polishGermanShopLanding(html) {
  return html
    .replaceAll('Digital X Shop · Digitale Dienste und Systeme', 'Digital X Shop | Web, KI, Automatisierung & SEO')
    .replaceAll('Wählen Sie ein Web, KI, Automatisierung, Wachstum oder Inhalte als klares digitales Produkt. Für komplexere Anforderungen bitten wir Sie um ein Maß an Auswertung.', 'Wählen Sie Web, KI, Automatisierung, SEO oder Content als klar definiertes digitales Produkt. Für komplexere Anforderungen erstellen wir ein individuelles Angebot.')
    .replaceAll('Dienstleistungen so klar<br/><i>Digitale Produkte.</i>', 'Digitale Dienstleistungen.<br/><i>Klar als Produkte beschrieben.</i>')
    .replaceAll('Den nächsten Zug auswählen', 'Passende Lösung auswählen')
    .replaceAll('Premium Web Präsenz', 'Premium-Webpräsenz')
    .replaceAll('Präsentationsseite mit übersichtlichem Angebot, mobilem Design, Basis-SEO und Kontakt während.', 'Professionelle Unternehmenswebsite mit klarer Angebotsstruktur, Mobile-First-Design, technischer SEO-Basis und eindeutigen Kontaktwegen.')
    .replaceAll('Einführung des elektronischen Geschäftsverkehrs', 'E-Commerce Launch')
    .replaceAll('Kompletter Handel mit Kategorien, Produkten, Lieferung, Zahlung und Schulung.', 'Vollständiger Onlineshop mit Kategorien, Produkten, Versand, Zahlung und praktischer Einweisung in die Verwaltung.')
    .replaceAll('Benutzerdefinierte Anwendung', 'Individuelle Anwendung')
    .replaceAll('Portal, Buchung, Board oder Bedienwerkzeug angepasst an Ihren Prozess.', 'Portal, Buchungssystem, Dashboard oder internes Tool, abgestimmt auf Ihren tatsächlichen Arbeitsprozess.')
    .replaceAll('KI Zweites Gehirn-Betriebssystem', 'AI Second Brain OS')
    .replaceAll('Privates Geschäftsgedächtnis mit Co-Pilot-Assistenten, verwandten Quellen und genehmigten Befehlen.', 'Private Wissensbasis mit Co-Pilot, verbundenen Quellen und klar begrenzten, freigegebenen Aktionen.')
    .replaceAll('Ein Web-Assistent und Kommunikationskanäle, die reagieren, qualifizieren und Abfragen sammeln.', 'Ein KI-Assistent für Website und ausgewählte Kanäle, der Fragen beantwortet, Anfragen qualifiziert und die benötigten Daten strukturiert erfasst.')
    .replaceAll('Automatisch starten', 'Automation Starter')
    .replaceAll('Ein vorrangiger Workflow von der Abfrage zur Aufgabe, Benachrichtigung oder CRM-Aufzeichnung.', 'Ein priorisierter Workflow vom Eingang einer Anfrage bis zur geprüften Aufgabe, Benachrichtigung oder CRM-Aktualisierung.')
    .replaceAll('Überprüfungssystem', 'Bewertungssystem')
    .replaceAll('Automatische Überprüfungsanfrage nach Abschluss der Dienstleistung, mit Follow-up.', 'Automatische Bewertungsanfrage nach abgeschlossener Leistung, inklusive regelbasiertem Follow-up.')
    .replaceAll('Technische Basis, lokale Sichtbarkeit, Inhalte und Struktur für Google und AI Antworten.', 'Technische SEO-Basis, lokale Sichtbarkeit, Inhalte und Struktur für Google und KI-Antworten.')
    .replaceAll('&amp; Markeninhalt', 'Content &amp; Marke')
    .replaceAll('Inhaltssystem', 'Content-System')
    .replaceAll('Planen, kopieren, Visuals und kurzes Video, das als ein einheitliches Content-System formatiert ist.', 'Planung, Copy, Visuals und Kurzvideo als konsistentes Content-System für Ihre wichtigsten Kanäle.')
    .replaceAll('Beurteilung auf Anfrage', 'Preis auf Anfrage')
    .replaceAll('Benutzerdefinierte Anfrage', 'Individuelle Anfrage');
}

function polishGermanSeoLanding(html) {
  return html
    .replaceAll(
      'Google Search. Google Maps. Und zunehmend ChatGPT, Perplexity und Gemini. Unser Paket umfasst alle drei Fronten, <b>Von 249 KM monatlich</b>Nur in BiH mit AEO-Optimierungsstandard enthalten.',
      'Google Search. Google Maps. Und zunehmend ChatGPT, Perplexity und Gemini. Unser Paket verbindet alle drei Bereiche — <b>ab 249 KM pro Monat</b>. AEO-Optimierung ist standardmäßig enthalten.',
    )
    .replaceAll('. . . Keine vertragliche Verpflichtung mehr als 3 Monate', 'Keine Bindung über 3 Monate hinaus')
    .replaceAll('. Monatlicher Bericht in menschlicher Sprache', 'Monatlicher Bericht in klarer Sprache')
    .replaceAll('. Freie Analyse', 'Kostenlose Analyse')
    .replaceAll('interne Link', 'interne Verlinkung')
    .replaceAll('Google Business Profile, Bewertungen, lokale Karten — Um Sie zu finden "Nah"', 'Google Business Profile, Bewertungen und lokale Signale — damit Sie bei relevanten Suchen in Ihrer Region gefunden werden')
    .replaceAll('Schema Markup, llms.txt, Q&amp;A-Struktur, KI-Crawler-Ansatz — um Ihnen AI zu empfehlen', 'Schema Markup, llms.txt, klare Q&amp;A-Strukturen und saubere Zugänglichkeit für KI-Crawler — damit Systeme Ihr Angebot besser verstehen können')
    .replaceAll('Was getan wird, was gewachsen ist, was als nächstes kommt — ohne Slang', 'Was geändert wurde, welche Signale sich entwickelt haben und was als Nächstes priorisiert wird — ohne Fachjargon')
    .replaceAll('Warum die AEO — Warum jetzt?', 'Warum AEO — und warum jetzt?')
    .replaceAll('Millionen von Menschen nicht mehr Google – sie fragen KI. Wenn KI nicht über Sie weiß, Sie nicht für diese Kunden existieren.', 'Ein Teil der Suche verlagert sich in KI-Assistenten. Wer dort verständlich, strukturiert und vertrauenswürdig beschrieben ist, erhöht die Chance, in relevanten Antworten berücksichtigt zu werden.')
    .replaceAll('95% der BiH-Standorte haben auch keine Grundmarkierung.', 'Viele lokale Websites nutzen strukturierte Daten, klare Standortsignale und saubere Unternehmensprofile noch nicht konsequent.')
    .replaceAll('Alles, was wir für die AEO (Struktur, klare Antworten, Autorität) gleichzeitig zu tun, stärkt und klassische SEO.', 'Viele AEO-Maßnahmen — klare Struktur, präzise Antworten und nachvollziehbare Autorität — unterstützen zugleich klassisches SEO.')
    .replaceAll('In kleineren bosnischen Städten ist der Wettbewerb so inaktiv, dass zwei bis drei Monate disziplinierter Arbeit realistisch in die Top 3 führen. In härteren Nischen dauert es länger — im ersten Gespräch sagen wir ehrlich, was realistisch ist.', 'Erste messbare Veränderungen können je nach Ausgangslage innerhalb weniger Monate sichtbar werden. Wie schnell bessere Rankings oder Maps-Sichtbarkeit entstehen, hängt von Wettbewerb, Website-Zustand, Profilqualität und Suchnachfrage ab.')
    .replaceAll('AEO ist Optimierung für KI-Suchmaschinen. Millionen Menschen googeln nicht mehr — sie fragen eine KI. Kennt die KI Sie nicht, existieren Sie für diese Kunden nicht. Alles, was wir für AEO tun, stärkt zugleich das klassische SEO.', 'AEO optimiert Inhalte und technische Signale so, dass KI-Systeme Ihr Angebot leichter verstehen und korrekt einordnen können. Klare Struktur, gute Quellen und präzise Antworten unterstützen zugleich klassisches SEO.');
}

function polishEnglishLocalSeo(html) {
  return html
    .replaceAll('Local SEO: how to be first on Google map in your city', 'Local SEO: How to Rank in Google Maps Top 3')
    .replaceAll('Why this is the most profitable marketing for local business', 'Why local SEO matters for local businesses')
    .replaceAll('Complete and accurate — exact primary category, description, working time, price services, at least 10 real photos. Empty profile = invisible profile.', 'Complete and accurate — use the right primary category, current description, opening hours, services and recent photos. Missing or outdated fields can weaken relevance and trust signals.')
    .replaceAll('number, average, freshness and — what most do not know — <i>text</i> review.', 'volume, average rating, recency and the context in written reviews.')
    .replaceAll('The name, address and phone must be identical on the site, profile, Facebook and in folders. Google reads different data as unreliable.', 'Keep your business name, address and phone consistent across your website, Google Business Profile and other important directories. Conflicting information can create ambiguity.')
    .replaceAll('response to reviews, weekly posts on the profile, up-to-date information.', 'respond to reviews, keep business information current and publish useful updates when you have something relevant to share.')
    .replaceAll('A regulated profile = visibility on both the map and AI responses.', 'A well-maintained profile gives search and AI systems clearer public information about your business.');
}

export function enhanceFinalPolishHtml(source, pathname) {
  if (typeof source !== 'string' || !shouldPolishPath(pathname)) return source;
  let html = source;
  if (EN_SHOP_RE.test(pathname)) html = polishEnglishShop(html);
  if (pathname === '/de/shop/') html = polishGermanShopLanding(html);
  if (pathname === '/de/landing-seo.html') html = polishGermanSeoLanding(html);
  if (pathname === '/en/blog/lokalni-seo-google-mapa.html') html = polishEnglishLocalSeo(html);
  return html;
}
