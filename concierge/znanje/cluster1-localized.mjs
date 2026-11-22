export const cluster1Localized = [
  {
    path: '/znanje/google-ai-overviews-kako-radi/',
    article: true,
    published: '2026-11-22',
    cover: '/media/znanje/cluster1-ai-overviews-cover.webp',
    diagram: '/media/znanje/cluster1-query-fanout-diagram.webp',
    en: {
      crumbs: [['Blog', '/en/blog/'], ['Google AI Overviews & Query Fan-Out', '/en/znanje/google-ai-overviews-kako-radi/']],
      eyebrow: 'GUIDE · AI SEARCH & QUERY FAN-OUT',
      title: 'Google AI Overviews & AI Mode: How Sources Are Selected | Digital X',
      h1: 'How Google AI Overviews and AI Mode select sources (and what query fan-out means)',
      desc: 'How Google AI Overviews and AI Mode decompose queries via query fan-out, official Google Search Central requirements and how to write 40–80 word passages.',
      keywords: ['google ai overviews', 'google ai mode', 'query fan out', 'aeo optimization', 'geo optimization'],
      cover: {
        alt: 'Google AI Overviews and Query Fan-Out architecture: decomposing one prompt into parallel sub-queries and 40–80 word passages',
        caption: 'Query fan-out splits complex prompts into parallel sub-queries and extracts standalone passages with verifiable citations.',
      },
      answer: 'Google AI Overviews and AI Mode require no special AI files or experimental schema—only standard Google Search eligibility, crawlable HTML text, Core Web Vitals (LCP ≤ 2.5s, INP < 200ms, CLS < 0.1) and standalone 40–80 word passages. Through query fan-out, Gemini decomposes complex prompts into parallel sub-queries and cites pages that answer each sub-topic clearly.',
      sections: [
        ['What query fan-out means in Google AI Mode', `<p>Query fan-out is the retrieval mechanism where Google AI Mode and AI Overviews split one complex user prompt into multiple parallel sub-queries to cover every angle of the question. Instead of ranking a single page for one keyword, the system retrieves standalone passages for each sub-query and synthesizes them with source links.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-query-fanout-diagram.webp" srcset="/media/znanje/cluster1-query-fanout-diagram-768.webp 768w, /media/znanje/cluster1-query-fanout-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Query fan-out diagram: from one user prompt to four sub-queries and extracted 40–80 word passages"><figcaption>From one prompt to grounded citations: each sub-query retrieves a self-contained passage backed by matching JSON-LD.</figcaption></figure>`],
        ['Official Google Search Central requirements & 40–80 word passages', `<p>Official <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener">Google Search Central: AI Features</a> documentation confirms standard Search eligibility and <a href="https://developers.google.com/search/docs/appearance/core-web-vitals" target="_blank" rel="noopener">Core Web Vitals</a> govern inclusion. Peer-reviewed KDD 2024 research (<a href="https://arxiv.org/pdf/2311.09735" target="_blank" rel="noopener">Aggarwal et al., GEO-bench</a>) shows verifiable statistics and citations lift generative visibility by up to 40%, while our <a href="/en/znanje/ai-spremnost-web-stranica-bih-2026/">78-site BiH benchmark</a> found 55.1% of business sites lack two or more extractable 30–90 word passages.</p>`],
      ],
      faq: [
        ['Does Google AI Overviews require special AI schema or llms.txt?', 'No. Google Search Central confirms no special Schema.org types or AI text files are required; standard Search eligibility, crawlable HTML and helpful content apply.'],
        ['Why are 40–80 word passages important for AI Mode?', 'Because query fan-out retrieves individual passages that answer a sub-query on their own without relying on surrounding paragraphs.'],
      ],
      related: [['/en/usluge/seo-aeo-geo/', 'SEO · AEO · GEO service'], ['/en/znanje/schema-markup-za-ai-pretragu/', 'Schema.org for AI search in 2026'], ['/en/usluge/x-signal/', 'Free X Signal audit']],
    },
    de: {
      crumbs: [['Blog', '/de/blog/'], ['Google AI Overviews & Query Fan-Out', '/de/znanje/google-ai-overviews-kako-radi/']],
      eyebrow: 'RATGEBER · KI-SUCHE & QUERY FAN-OUT',
      title: 'Google AI Overviews & AI Mode: Wie Quellen ausgewählt werden | Digital X',
      h1: 'Wie Google AI Overviews und AI Mode Quellen auswählen (Query Fan-Out)',
      desc: 'Wie Google AI Overviews und AI Mode Suchanfragen per Query Fan-Out zerlegen, welche Google-Search-Central-Regeln gelten und wie 40–80-Wörter-Absätze funktionieren.',
      keywords: ['google ai overviews', 'google ai mode', 'query fan out', 'aeo optimierung', 'geo optimierung'],
      cover: {
        alt: 'Google AI Overviews und Query Fan-Out Architektur: Zerlegung einer Anfrage in Unteranfragen und 40–80-Wörter-Absätze',
        caption: 'Query Fan-Out zerlegt komplexe Fragen in parallele Unteranfragen und extrahiert eigenständige Absätze mit Quellen.',
      },
      answer: 'Google AI Overviews und AI Mode erfordern keine speziellen KI-Dateien oder experimentelles Schema, sondern reguläre Google-Indexierbarkeit, lesbares HTML, Core Web Vitals (LCP ≤ 2,5 s, INP < 200 ms, CLS < 0,1) und eigenständige 40–80-Wörter-Absätze. Per Query Fan-Out zerlegt Gemini komplexe Fragen in parallele Unteranfragen und zitiert die präzisesten Teilantworten.',
      sections: [
        ['Was Query Fan-Out im Google AI Mode bedeutet', `<p>Query Fan-Out ist der Mechanismus, bei dem Google AI Mode und AI Overviews eine komplexe Nutzerfrage automatisch in mehrere parallele Unteranfragen aufteilen. Statt nur eine Seite für ein Keyword zu ranken, ruft das System für jede Teilfrage eigenständige Absätze ab und verknüpft sie mit Quellenlinks.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-query-fanout-diagram.webp" srcset="/media/znanje/cluster1-query-fanout-diagram-768.webp 768w, /media/znanje/cluster1-query-fanout-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Query-Fan-Out-Diagramm: von einer Nutzeranfrage zu vier Unteranfragen und extrahierten 40–80-Wörter-Absätzen"><figcaption>Von einer Anfrage zum Zitat: Jede Unteranfrage sucht einen eigenständigen Absatz mit passendem JSON-LD.</figcaption></figure>`],
        ['Offizielle Google-Anforderungen & 40–80-Wörter-Absätze', `<p>Die Dokumentation <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener">Google Search Central: AI Features</a> bestätigt, dass reguläre Such-Kriterien und <a href="https://developers.google.com/search/docs/appearance/core-web-vitals" target="_blank" rel="noopener">Core Web Vitals</a> gelten. Laut KDD-2024-Forschung (<a href="https://arxiv.org/pdf/2311.09735" target="_blank" rel="noopener">Aggarwal et al., GEO-bench</a>) steigern überprüfbare Statistiken und Zitate die generative Sichtbarkeit um bis zu 40 %, während in unserer <a href="/de/znanje/ai-spremnost-web-stranica-bih-2026/">78-Websites-Stichprobe</a> 55,1 % keine zwei extrahierbaren Absätze boten.</p>`],
      ],
      faq: [
        ['Braucht Google AI Overviews spezielles KI-Schema oder llms.txt?', 'Nein. Google Search Central bestätigt, dass keine speziellen Schema.org-Typen oder KI-Textdateien nötig sind; es gelten reguläre Such-Kriterien und sauberes HTML.'],
        ['Warum sind 40–80-Wörter-Absätze für AI Mode wichtig?', 'Weil Query Fan-Out einzelne Absätze extrahiert, die eine Unteranfrage eigenständig und ohne vorherigen Kontext beantworten.'],
      ],
      related: [['/de/usluge/seo-aeo-geo/', 'SEO · AEO · GEO Leistung'], ['/de/znanje/schema-markup-za-ai-pretragu/', 'Schema.org für KI-Suche 2026'], ['/de/usluge/x-signal/', 'Kostenlose X Signal Analyse']],
    },
  },
  {
    path: '/znanje/schema-markup-za-ai-pretragu/',
    article: true,
    published: '2026-11-22',
    cover: '/media/znanje/cluster1-schema-2026-cover.webp',
    diagram: '/media/znanje/cluster1-schema-graph-diagram.webp',
    en: {
      crumbs: [['Blog', '/en/blog/'], ['Schema.org for AI Search 2026', '/en/znanje/schema-markup-za-ai-pretragu/']],
      eyebrow: 'GUIDE · STRUCTURED DATA 2026',
      title: 'Schema.org for AI Search in 2026: Active vs. Retired Types | Digital X',
      h1: 'Schema.org for AI search in 2026: active entities, retired types and JSON-LD rules',
      desc: 'Which Schema.org types build trust in Google and AI search in 2026, the 7 types Google retired in June 2025 and how to link JSON-LD cleanly.',
      keywords: ['schema markup 2026', 'json-ld seo', 'deprecated schema 2025', 'organization localbusiness schema'],
      cover: {
        alt: 'Schema.org entity graph for 2026: Organization, LocalBusiness, Service, Offer, Article and ProfilePage linked via @id',
        caption: 'A connected JSON-LD entity graph removes ambiguity about who stands behind your offer, pricing and content.',
      },
      answer: 'In 2026, the highest-value Schema.org types for SEO and AI search are connected Organization, LocalBusiness, Service with Offer pricing, Article, ProfilePage and BreadcrumbList entities. Google restricted FAQPage rich results to authoritative government and health sites in August 2023 and retired seven types in June 2025 including ClaimReview, CourseInfo and SpecialAnnouncement.',
      sections: [
        ['Active Schema.org entity graph vs. retired 2025 types', `<p>Connected JSON-LD helps search engines and AI assistants verify your legal entity, location, pricing and editorial provenance without guessing. In our <a href="/en/znanje/ai-spremnost-web-stranica-bih-2026/">78-site BiH benchmark</a>, 50.0% of business websites lacked Organization or LocalBusiness schema, while <a href="https://developers.google.com/search/docs/appearance/structured-data/sd-policies" target="_blank" rel="noopener">Google Structured Data Policies</a> require strict parity with visible page text.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-schema-graph-diagram.webp" srcset="/media/znanje/cluster1-schema-graph-diagram-768.webp 768w, /media/znanje/cluster1-schema-graph-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Comparison of active 2026 Schema.org entity graph vs. types retired in June 2025 or restricted in 2023"><figcaption>Active 2026 JSON-LD graph links entities via @id and avoids the seven types retired in June 2025.</figcaption></figure>`],
        ['Three rules for error-free JSON-LD', `<p>Link every Service, Offer and Article back to one canonical <code>#organization</code> node via <code>@id</code>, match every BAM/EUR price and claim verbatim to visible HTML, and populate <code>sameAs</code> only with verified profiles such as Google Business Profile, YouTube, Instagram, Threads and GitHub (<a href="/en/cinjenice/">Digital X facts</a>).</p>`],
      ],
      faq: [
        ['Does FAQPage schema still help AI search without Google rich results?', 'Visible HTML FAQ sections help users and LLM passage extraction, while FAQPage JSON-LD remains valid when matching visible text—even though commercial sites no longer receive FAQ rich snippets in Google Search.'],
        ['Which seven Schema types did Google retire in June 2025?', 'BookActions, CourseInfo, ClaimReview, EstimatedSalary, LearningVideo, SpecialAnnouncement and VehicleListing.'],
      ],
      related: [['/en/usluge/seo-aeo-geo/', 'SEO · AEO · GEO service'], ['/en/znanje/google-ai-overviews-kako-radi/', 'How Google AI Overviews selects sources'], ['/en/usluge/x-signal/', 'Check JSON-LD with X Signal']],
    },
    de: {
      crumbs: [['Blog', '/de/blog/'], ['Schema.org für KI-Suche 2026', '/de/znanje/schema-markup-za-ai-pretragu/']],
      eyebrow: 'RATGEBER · STRUKTURIERTE DATEN 2026',
      title: 'Schema.org für KI-Suche 2026: Aktive vs. eingestellte Typen | Digital X',
      h1: 'Schema.org für KI-Suche 2026: aktive Entitäten, eingestellte Typen und JSON-LD-Regeln',
      desc: 'Welche Schema.org-Typen 2026 Vertrauen bei Google und KI-Systemen aufbauen, welche 7 Typen im Juni 2025 eingestellt wurden und wie JSON-LD sauber verknüpft wird.',
      keywords: ['schema markup 2026', 'json-ld seo', 'eingestellte schema typen 2025', 'organization localbusiness schema'],
      cover: {
        alt: 'Schema.org-Entitätsgraph für 2026: Organization, LocalBusiness, Service, Offer, Article und ProfilePage über @id verknüpft',
        caption: 'Ein verknüpfter JSON-LD-Entitätsgraph beseitigt Unklarheiten über Anbieter, Preise und Autorenschaft.',
      },
      answer: '2026 sind verknüpfte Entitäten wie Organization, LocalBusiness, Service mit Offer-Preisen, Article, ProfilePage und BreadcrumbList am wertvollsten. Google hat FAQPage-Rich-Results im August 2023 auf Behörden- und Gesundheitsseiten beschränkt und im Juni 2025 sieben Typen eingestellt, darunter ClaimReview, CourseInfo und SpecialAnnouncement.',
      sections: [
        ['Aktiver Schema.org-Graph vs. eingestellte Typen 2025', `<p>Verknüpftes JSON-LD hilft Suchmaschinen und KI-Assistenten, Unternehmen, Standort, Preise und Redaktionsmethodik eindeutig zu prüfen. In unserer <a href="/de/znanje/ai-spremnost-web-stranica-bih-2026/">78-Websites-Stichprobe</a> fehlte bei 50,0 % ein Organization- oder LocalBusiness-Schema, während die <a href="https://developers.google.com/search/docs/appearance/structured-data/sd-policies" target="_blank" rel="noopener">Google Structured Data Richtlinien</a> exakte Übereinstimmung mit dem sichtbaren Text verlangen.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-schema-graph-diagram.webp" srcset="/media/znanje/cluster1-schema-graph-diagram-768.webp 768w, /media/znanje/cluster1-schema-graph-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Vergleich des aktiven Schema.org-Entitätsgraphen 2026 mit im Juni 2025 eingestellten Typen"><figcaption>Der aktive JSON-LD-Graph 2026 verknüpft Entitäten per @id und meidet die sieben eingestellten Typen.</figcaption></figure>`],
        ['Drei Regeln für fehlerfreies JSON-LD', `<p>Verknüpfen Sie jedes Service-, Offer- und Article-Objekt per <code>@id</code> mit einem zentralen <code>#organization</code>-Knoten, gleichen Sie jeden BAM/EUR-Preis exakt mit dem sichtbaren HTML ab und hinterlegen Sie in <code>sameAs</code> nur verifizierte Profile wie Google Business Profile, YouTube, Instagram, Threads und GitHub (<a href="/de/cinjenice/">Digital X Fakten</a>).</p>`],
      ],
      faq: [
        ['Hilft FAQPage-Schema der KI-Suche auch ohne Google Rich Results?', 'Sichtbare HTML-FAQ-Bereiche helfen Nutzern und der LLM-Extraktion; FAQPage-JSON-LD bleibt zulässig, wenn es dem sichtbaren Text entspricht, liefert für kommerzielle Websites aber keine FAQ-Rich-Snippets mehr.'],
        ['Welche sieben Schema-Typen hat Google im Juni 2025 eingestellt?', 'BookActions, CourseInfo, ClaimReview, EstimatedSalary, LearningVideo, SpecialAnnouncement und VehicleListing.'],
      ],
      related: [['/de/usluge/seo-aeo-geo/', 'SEO · AEO · GEO Leistung'], ['/de/znanje/google-ai-overviews-kako-radi/', 'Wie Google AI Overviews Quellen wählt'], ['/de/usluge/x-signal/', 'JSON-LD mit X Signal prüfen']],
    },
  },
  {
    path: '/znanje/llms-txt-sta-je-i-treba-li-vam/',
    article: true,
    published: '2026-11-22',
    cover: '/media/znanje/cluster1-llms-txt-cover.webp',
    diagram: '/media/znanje/cluster1-ai-crawlers-diagram.webp',
    en: {
      crumbs: [['Blog', '/en/blog/'], ['Do You Need llms.txt?', '/en/znanje/llms-txt-sta-je-i-treba-li-vam/']],
      eyebrow: 'GUIDE · AI CRAWLERS & LLMS.TXT',
      title: 'Do You Need llms.txt in 2026? Google, ChatGPT & Perplexity | Digital X',
      h1: 'Do you need llms.txt in 2026: what Google, ChatGPT, Claude and Perplexity actually read',
      desc: 'What llms.txt is, why Google Search Central does not require it for AI Overviews, how to configure robots.txt for AI bots and when llms.txt helps.',
      keywords: ['llms.txt', 'llms-full.txt', 'robots.txt ai crawlers', 'gptbot oai-searchbot'],
      cover: {
        alt: 'llms.txt, robots.txt and AI retrieval: comparing mandatory HTML/JSON-LD foundations with optional llms.txt summaries',
        caption: 'Google AI Overviews reads HTML and JSON-LD; llms.txt is an optional summary for third-party AI tools.',
      },
      answer: 'Google Search Central explicitly confirms that llms.txt is not required for Google AI Overviews or AI Mode. Google relies on crawlable HTML, Core Web Vitals, max-snippet:-1 and accurate JSON-LD. Files like llms.txt and llms-full.txt are optional plain-text summaries for third-party AI tools, paired with open robots.txt rules and IndexNow.',
      sections: [
        ['What llms.txt is and why Google Search does not require it', `<p>The <code>/llms.txt</code> proposal (<a href="https://llmstxt.org/" target="_blank" rel="noopener">llmstxt.org</a>) provides a clean Markdown summary of key pages and pricing at the domain root. However, <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener">Google Search Central: AI Features</a> confirms no special AI text files are needed for AI Overviews or AI Mode.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-ai-crawlers-diagram.webp" srcset="/media/znanje/cluster1-ai-crawlers-diagram-768.webp 768w, /media/znanje/cluster1-ai-crawlers-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Four layers of AI visibility: mandatory HTML and JSON-LD foundation, robots.txt and IndexNow, optional llms.txt and off-site corroboration"><figcaption>Four layers of AI visibility: llms.txt is an optional third layer above clean HTML and structured data.</figcaption></figure>`],
        ['robots.txt, IndexNow and when llms.txt makes sense', `<p>Ensure <code>robots.txt</code> allows <code>Googlebot</code>, <code>Google-Extended</code>, <code>OAI-SearchBot</code>, <code>GPTBot</code>, <code>ClaudeBot</code> and <code>PerplexityBot</code> on public pages, and trigger IndexNow after deploys so Bing and ChatGPT Search pick up price updates immediately. Generate <a href="/llms.txt">llms.txt</a> and <a href="/llms-full.txt">llms-full.txt</a> from the same catalogue as your HTML pages so facts never drift.</p>`],
      ],
      faq: [
        ['Will my site miss Google AI Overviews without llms.txt?', 'No. Google Search Central confirms llms.txt is not required for AI Overviews or AI Mode; focus on crawlable HTML, Core Web Vitals and JSON-LD.'],
        ['Should robots.txt allow GPTBot and OAI-SearchBot?', 'Yes, if you want ChatGPT Search and AI assistants to discover and cite your public services and current pricing.'],
      ],
      related: [['/llms.txt', 'View Digital X llms.txt'], ['/en/usluge/seo-aeo-geo/', 'SEO · AEO · GEO service'], ['/en/znanje/google-ai-overviews-kako-radi/', 'How Google AI Overviews selects sources']],
    },
    de: {
      crumbs: [['Blog', '/de/blog/'], ['Brauchen Sie llms.txt?', '/de/znanje/llms-txt-sta-je-i-treba-li-vam/']],
      eyebrow: 'RATGEBER · KI-CRAWLER & LLMS.TXT',
      title: 'Brauchen Sie llms.txt 2026? Google, ChatGPT & Perplexity | Digital X',
      h1: 'Brauchen Sie llms.txt 2026: was Google, ChatGPT, Claude und Perplexity wirklich lesen',
      desc: 'Was llms.txt ist, warum Google Search Central es für AI Overviews nicht verlangt, wie robots.txt für KI-Bots konfiguriert wird und wann llms.txt hilft.',
      keywords: ['llms.txt', 'llms-full.txt', 'robots.txt ki crawler', 'gptbot oai-searchbot'],
      cover: {
        alt: 'llms.txt, robots.txt und KI-Suche: Vergleich zwischen HTML/JSON-LD-Basis und optionaler llms.txt-Übersicht',
        caption: 'Google AI Overviews liest HTML und JSON-LD; llms.txt ist eine optionale Übersicht für Drittanbieter-KI-Tools.',
      },
      answer: 'Google Search Central bestätigt ausdrücklich, dass llms.txt für Google AI Overviews und AI Mode nicht erforderlich ist. Entscheidend sind crawlbares HTML, Core Web Vitals, max-snippet:-1 und präzises JSON-LD. Dateien wie llms.txt und llms-full.txt sind optionale Klartext-Übersichten für KI-Tools, ergänzt durch offene robots.txt-Regeln und IndexNow.',
      sections: [
        ['Was llms.txt ist und warum Google es nicht verlangt', `<p>Der Vorschlag <code>/llms.txt</code> (<a href="https://llmstxt.org/" target="_blank" rel="noopener">llmstxt.org</a>) bündelt wichtige Seiten und Preise als Markdown im Stammverzeichnis. Die Dokumentation <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener">Google Search Central: AI Features</a> bestätigt jedoch, dass für AI Overviews und AI Mode keine speziellen KI-Textdateien nötig sind.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-ai-crawlers-diagram.webp" srcset="/media/znanje/cluster1-ai-crawlers-diagram-768.webp 768w, /media/znanje/cluster1-ai-crawlers-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Vier Ebenen der KI-Sichtbarkeit: HTML- und JSON-LD-Basis, robots.txt und IndexNow, optionales llms.txt und externe Bestätigung"><figcaption>Vier Ebenen der KI-Sichtbarkeit: llms.txt ist eine optionale dritte Ebene über sauberem HTML und Schema.</figcaption></figure>`],
        ['robots.txt, IndexNow und wann llms.txt sinnvoll ist', `<p>Erlauben Sie in <code>robots.txt</code> den Zugriff für <code>Googlebot</code>, <code>Google-Extended</code>, <code>OAI-SearchBot</code>, <code>GPTBot</code>, <code>ClaudeBot</code> und <code>PerplexityBot</code> auf öffentlichen Seiten und senden Sie nach jedem Deploy einen IndexNow-Ping für Bing und ChatGPT Search. Generieren Sie <a href="/llms.txt">llms.txt</a> und <a href="/llms-full.txt">llms-full.txt</a> aus demselben Katalog wie Ihre HTML-Seiten.</p>`],
      ],
      faq: [
        ['Fehlt meine Website ohne llms.txt in Google AI Overviews?', 'Nein. Google Search Central bestätigt, dass llms.txt für AI Overviews und AI Mode nicht nötig ist; entscheidend sind HTML, Core Web Vitals und JSON-LD.'],
        ['Sollte robots.txt GPTBot und OAI-SearchBot erlauben?', 'Ja, wenn ChatGPT Search und KI-Assistenten Ihre öffentlichen Leistungen und aktuellen Preise finden und zitieren sollen.'],
      ],
      related: [['/llms.txt', 'Digital X llms.txt ansehen'], ['/de/usluge/seo-aeo-geo/', 'SEO · AEO · GEO Leistung'], ['/de/znanje/google-ai-overviews-kako-radi/', 'Wie Google AI Overviews Quellen wählt']],
    },
  },
  {
    path: '/znanje/kako-mjeriti-ai-vidljivost/',
    article: true,
    published: '2026-11-22',
    cover: '/media/znanje/cluster1-ai-tracking-cover.webp',
    diagram: '/media/znanje/cluster1-ai-measurement-diagram.webp',
    en: {
      crumbs: [['Blog', '/en/blog/'], ['Measuring AI Visibility', '/en/znanje/kako-mjeriti-ai-vidljivost/']],
      eyebrow: 'GUIDE · AI VISIBILITY MEASUREMENT',
      title: 'How to Measure AI Visibility in ChatGPT & Perplexity | Digital X',
      h1: 'How to measure brand visibility in ChatGPT, Perplexity and Google AI Mode',
      desc: 'Methodology for measuring AI visibility without fake scores: fixed 20–30 prompt tracking, mentions vs. citations, GSC + GA4 attribution and the 7-day Core Update rule.',
      keywords: ['measure ai visibility', 'ai visibility tracker', 'chatgpt citation tracking', 'google ai mode analytics'],
      cover: {
        alt: 'Measuring AI visibility without fake guarantees: 20–30 fixed prompts across Google AI Mode, ChatGPT, Perplexity and Gemini',
        caption: 'Reliable AI visibility tracking pairs a fixed prompt log with Search Console clicks and GA4 conversions.',
      },
      answer: 'AI visibility is not measured by an invented 0–100 score, but by testing a fixed set of 20–30 buyer prompts monthly across Google AI Mode, ChatGPT, Perplexity and Gemini. Each entry logs the date, brand mention and exact cited URL, paired with Search Console and GA4 conversions while waiting 7 full days after any Google Core Update.',
      sections: [
        ['Fixed 20–30 prompt tracking vs. fake visibility scores', `<p>Generative answers vary by context, location and language, so no agency can guarantee a fixed rank in ChatGPT. Instead, track a fixed 20–30 prompt set across Bosnian, English and German covering informational, pricing, local Sarajevo/BiH and DACH queries, distinguishing unlinked brand mentions from clickable URL citations (Chen et al., 2025).</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-ai-measurement-diagram.webp" srcset="/media/znanje/cluster1-ai-measurement-diagram-768.webp 768w, /media/znanje/cluster1-ai-measurement-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Four-step AI visibility measurement workflow: fixed prompt set, monthly engine log, GSC and GA4 attribution and 7-day Core Update rule"><figcaption>Four-step measurement loop: from fixed buyer prompts to verified leads in Search Console and GA4.</figcaption></figure>`],
        ['Connecting AI citations to GSC, GA4 and Core Updates', `<p>Pair monthly prompt logs with Search Console query/page clicks and GA4 referral traffic plus form, WhatsApp and phone conversions. Following <a href="https://developers.google.com/search/docs/appearance/core-updates" target="_blank" rel="noopener">Google Core Updates</a> guidance, wait at least seven full days after rollout completion before comparing week-over-week data (<a href="/en/uredjivacka-politika/">Digital X editorial methodology</a>).</p>`],
      ],
      faq: [
        ['How often should we test our AI prompt set?', 'Monthly across a fixed 20–30 prompt set, plus 7–14 days after major content updates or a completed Google Core Update.'],
        ['Do you charge extra per tracked AI prompt?', 'No. Fixed prompt tracking is part of transparent SEO · GEO · AEO reporting without per-prompt surcharges (/en/usluge/seo-aeo-geo-cijena/).'],
      ],
      related: [['/en/usluge/seo-aeo-geo-cijena/', 'SEO, GEO & AEO pricing'], ['/en/uredjivacka-politika/', 'Editorial methodology'], ['/en/usluge/seo-aeo-geo/', 'SEO · AEO · GEO service']],
    },
    de: {
      crumbs: [['Blog', '/de/blog/'], ['KI-Sichtbarkeit messen', '/de/znanje/kako-mjeriti-ai-vidljivost/']],
      eyebrow: 'RATGEBER · KI-SICHTBARKEIT MESSEN',
      title: 'KI-Sichtbarkeit in ChatGPT & Perplexity messen | Digital X',
      h1: 'Wie man Markensichtbarkeit in ChatGPT, Perplexity und Google AI Mode misst',
      desc: 'Methodik zur Messung von KI-Sichtbarkeit ohne erfundene Scores: festes 20–30-Prompt-Set, Erwähnung vs. Zitat, GSC + GA4 und 7-Tage-Core-Update-Regel.',
      keywords: ['ki sichtbarkeit messen', 'ai visibility tracker', 'chatgpt zitate tracking', 'google ai mode analyse'],
      cover: {
        alt: 'KI-Sichtbarkeit ohne falsche Garantien messen: 20–30 feste Prompts über Google AI Mode, ChatGPT, Perplexity und Gemini',
        caption: 'Verlässliches KI-Tracking verbindet ein festes Prompt-Protokoll mit Search-Console-Klicks und GA4-Conversions.',
      },
      answer: 'KI-Sichtbarkeit wird nicht über einen erfundenen 0–100-Score gemessen, sondern über monatliche Tests eines festen Sets aus 20–30 Kauf-Prompts in Google AI Mode, ChatGPT, Perplexity und Gemini. Jeder Eintrag dokumentiert Datum, Markenerwähnung und zitierte URL, verknüpft mit Search Console, GA4 und der 7-Tage-Wartezeit nach Google Core Updates.',
      sections: [
        ['Festes 20–30-Prompt-Tracking statt erfundener Scores', `<p>Generative Antworten variieren je nach Kontext, Standort und Sprache, weshalb keine Agentur einen festen Rang in ChatGPT garantieren kann. Stattdessen testen wir monatlich 20–30 feste Prompts auf Bosnisch, Englisch und Deutsch (Information, Preisvergleich, lokal BiH und DACH) und trennen reine Markenerwähnungen von klickbaren URL-Zitaten (Chen et al., 2025).</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-ai-measurement-diagram.webp" srcset="/media/znanje/cluster1-ai-measurement-diagram-768.webp 768w, /media/znanje/cluster1-ai-measurement-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Vierstufiger Workflow zur Messung der KI-Sichtbarkeit: festes Prompt-Set, monatliches Engine-Log, GSC/GA4-Attribution und 7-Tage-Core-Update-Regel"><figcaption>Vierstufiger Messkreislauf: von festen Kauf-Prompts bis zu belegten Anfragen in Search Console und GA4.</figcaption></figure>`],
        ['Verknüpfung mit Search Console, GA4 und Core Updates', `<p>Verbinden Sie monatliche Prompt-Logs mit Search-Console-Klicks, GA4-Referral-Traffic sowie Formular-, WhatsApp- und Telefon-Conversions. Gemäß <a href="https://developers.google.com/search/docs/appearance/core-updates" target="_blank" rel="noopener">Google Core Updates</a> warten wir nach Abschluss eines Rollouts mindestens sieben volle Tage vor dem Wochenvergleich (<a href="/de/uredjivacka-politika/">Digital X Redaktionsmethodik</a>).</p>`],
      ],
      faq: [
        ['Wie oft sollten wir das KI-Prompt-Set testen?', 'Einmal monatlich über ein festes Set von 20–30 Prompts sowie 7–14 Tage nach größeren Inhaltsupdates oder einem abgeschlossenen Google Core Update.'],
        ['Berechnen Sie Aufpreise pro getracktem KI-Prompt?', 'Nein. Das feste Prompt-Tracking ist Teil des transparenten SEO · GEO · AEO Reportings ohne Prompt-Aufpreis (/de/usluge/seo-aeo-geo-cijena/).'],
      ],
      related: [['/de/usluge/seo-aeo-geo-cijena/', 'SEO-, GEO- & AEO-Preise'], ['/de/uredjivacka-politika/', 'Redaktionsmethodik'], ['/de/usluge/seo-aeo-geo/', 'SEO · AEO · GEO Leistung']],
    },
  },
];
