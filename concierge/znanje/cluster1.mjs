const a = (href, text) => `<a href="${href}">${text}</a>`;

export const cluster1Guides = [
  {
    slug: 'google-ai-overviews-kako-radi', cluster: 'ai-pretraga', stage: 'pronadjen', minutes: 7, published: '2026-11-22',
    title: 'Google AI Overviews i AI Mode: kako biraju izvore (query fan-out)',
    h1: 'Kako Google AI Overviews i AI Mode biraju izvore i šta je query fan-out',
    desc: 'Kako Google AI Overviews i AI Mode razlažu upite kroz query fan-out, koje tehničke uslove traži Google Search Central i kako pisati pasuse od 40–80 riječi.',
    keywords: ['google ai overviews', 'google ai mode', 'query fan out', 'aeo optimizacija', 'geo optimizacija bih'],
    cover: {
      alt: 'Google AI Overviews i Query Fan-Out arhitektura: razlaganje upita na podupite i izdvajanje pasusa od 40–80 riječi',
      caption: 'Query fan-out razlaže složeno pitanje na paralelne podupite i izdvaja samostalne pasuse s provjerljivim izvorima.',
    },
    diagram: '/media/znanje/cluster1-query-fanout-diagram.webp',
    answer: 'Google AI Overviews i AI Mode ne traže posebne AI fajlove ni eksperimentalnu schemu, nego standardnu indeksabilnost u Google pretrazi, čitljiv HTML tekst, Core Web Vitals (LCP ≤ 2,5 s, INP < 200 ms, CLS < 0,1) i jasne pasuse od 40–80 riječi. Kroz query fan-out Gemini razlaže složeno pitanje na više podupita i citira stranice koje najpreciznije odgovaraju na pojedinačne dijelove pitanja.',
    sections: [
      ['Šta je query fan-out u Google AI Modeu', `<p>Query fan-out je mehanizam u kojem Google AI Mode i AI Overviews jedno složeno korisničko pitanje automatski razlažu na više paralelnih podupita kako bi pokrili sve uglove teme. Umjesto da rangira samo jednu stranicu za jednu ključnu riječ, sistem pretražuje indeks za svaki podupit posebno i spaja najjasnije pasuse u jedinstven odgovor s linkovima na izvore.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-query-fanout-diagram.webp" srcset="/media/znanje/cluster1-query-fanout-diagram-768.webp 768w, /media/znanje/cluster1-query-fanout-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Dijagram query fan-out procesa: od jednog korisničkog upita do četiri podupita i izdvojenih pasusa od 40–80 riječi"><figcaption>Od jednog upita do citata: svaki podupit traži samostalan, provjerljiv pasus i usklađen JSON-LD.</figcaption></figure>
<ol><li><strong>Razlaganje namjere.</strong> Upit poput „najbolja SEO i AEO agencija za klinike u Sarajevu“ dijeli se na tehnički SEO, lokalne signale, cijene i metodologiju.</li>
<li><strong>Izdvajanje pasusa (chunk retrieval).</strong> Sistem ne čita samo uvod stranice, nego traži konkretan odlomak ispod H2 ili H3 podnaslova koji samostalno odgovara na podupit.</li>
<li><strong>Provjera entiteta i povjerenja.</strong> Odabrani pasusi upoređuju se sa strukturiranim podacima, autorstvom i vanjskim spominjanjima brenda.</li></ol>`],
      ['Tehnički uslovi za AI Overviews prema Google Search Centralu', `<p>Prema zvaničnoj dokumentaciji <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener">Google Search Central: AI Features</a>, za prikaz u AI Overviews i AI Modeu važe ista pravila kao za klasičnu Google pretragu. Stranica mora biti indeksirana, dostupna Googlebotu bez blokade u robots.txt, podobna za prikaz isječka i tehnički brza prema <a href="https://developers.google.com/search/docs/appearance/core-web-vitals" target="_blank" rel="noopener">Core Web Vitals</a> pragovima.</p>
<div class="table-wrap"><table><thead><tr><th scope="col">Tehnički signal</th><th scope="col">Zvanični standard (2026)</th><th scope="col">Kako provjeriti</th></tr></thead><tbody>
<tr><th scope="row">Indeksiranje i snippet</th><td><code>index,follow,max-snippet:-1,max-image-preview:large</code></td><td>Provjera meta robots taga i Search Console URL Inspection</td></tr>
<tr><th scope="row">Core Web Vitals</th><td>LCP ≤ 2,5 s · INP &lt; 200 ms · CLS &lt; 0,1</td><td>PageSpeed Insights i CrUX terenski podaci</td></tr>
<tr><th scope="row">HTML čitljivost</th><td>Glavni tekst i tabele u server-rendered HTML-u</td><td>Pregled izvornog HTML-a ili ${a('/usluge/x-signal/', 'X Signal analiza')}</td></tr>
<tr><th scope="row">JSON-LD usklađenost</th><td>Schema podaci tačno prate vidljivi tekst stranice</td><td>Rich Results Test i Schema Validator</td></tr></tbody></table></div>`],
      ['Kako pisati pasuse od 40–80 riječi koje AI sistemi izdvajaju', `<p>Svaki H2 i H3 podnaslov treba otvoriti jednim samostalnim pasusom od 40 do 80 riječi koji daje direktan odgovor bez oslanjanja na prethodni tekst. Recenzirano KDD 2024 istraživanje (<a href="https://arxiv.org/pdf/2311.09735" target="_blank" rel="noopener">Aggarwal et al., GEO-bench</a>) pokazalo je da dodavanje provjerljivih statistika, citata i izvora podiže generativnu vidljivost do 40%, dok u našem ${a('/znanje/ai-spremnost-web-stranica-bih-2026/', 'BiH benchmarku na 78 poslovnih sajtova')} čak 55,1% stranica nema ni dva takva pasusa.</p>
<ul><li><strong>Prva rečenica daje definiciju ili zaključak.</strong> Izbjegavajte duge uvode tipa „U današnjem digitalnom svijetu…“.</li>
<li><strong>Druga i treća rečenica dodaju dokaz.</strong> Navedite konkretan broj, raspon cijena u KM/EUR ili primarni izvor.</li>
<li><strong>Nakon pasusa slijedi tabela ili lista.</strong> Tabele poređenja i numerisani koraci olakšavaju ekstrakciju i ljudima i modelima.</li></ul>`],
      ['Šta uraditi na postojećoj stranici već ove sedmice', `<p>Najbrži pomak na postojećim stranicama usluga i vodiča postiže se bez redizajna: dodajte punu snippet direktivu, otvorite ključne podnaslove jasnim odgovorom od 40–80 riječi i povežite vidljive tvrdnje s primarnim izvorima. Za cjelovitu implementaciju pogledajte ${a('/usluge/seo-aeo-geo/', 'SEO · AEO · GEO uslugu')} i ${a('/usluge/seo-aeo-geo-cijena/', 'transparentno poređenje cijena')}.</p>
<ol><li>Pokrenite besplatnu ${a('/usluge/x-signal/', 'X Signal provjeru')} da vidite da li stranica ima jedan H1, validan JSON-LD i dovoljno samostalnih pasusa.</li>
<li>Provjerite da <code>meta name="robots"</code> ne sadrži <code>nosnippet</code> ili kratak <code>max-snippet</code> limit.</li>
<li>Dodajte tabelu poređenja ili cjenovni raspon direktno na glavnu stranicu usluge.</li>
<li>Povežite članak s ${a('/uredjivacka-politika/', 'uredničkom metodologijom')} i provjerljivim vanjskim profilima firme.</li></ol>`],
    ],
    faq: [
      ['Da li Google AI Overviews zahtijeva posebnu AI schemu ili llms.txt?', 'Ne. Zvanična Google Search Central dokumentacija potvrđuje da nisu potrebni posebni Schema.org tipovi ni AI tekstualni fajlovi; važe standardni Search uslovi, čitljiv HTML i kvalitetan sadržaj.'],
      ['Zašto je dužina pasusa od 40–80 riječi važna za AI Mode?', 'Zato što query fan-out izdvaja pojedinačne pasuse koji samostalno odgovaraju na podupit. Prekratki fragmenti nemaju kontekst, a predugi blokovi razvodnjavaju odgovor.'],
      ['Da li AI Overviews zamjenjuje klasični SEO?', 'Ne. AI Overviews i AI Mode oslanjaju se na Googleov indeks i signale kvaliteta, pa tehnički SEO, brzina i autoritet ostaju temelj vidljivosti.'],
      ['Kako provjeriti da li je moja stranica spremna za AI pretragu?', 'Možete pokrenuti besplatnu X Signal analizu na /usluge/x-signal/ koja provjerava HTML strukturu, snippet direktive, JSON-LD, autorstvo i spremnost pasusa.'],
    ],
    related: [['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga'], ['/znanje/schema-markup-za-ai-pretragu/', 'Schema.org za AI pretragu u 2026'], ['/znanje/ai-spremnost-web-stranica-bih-2026/', 'X Signal 2026 BiH benchmark']],
  },
  {
    slug: 'schema-markup-za-ai-pretragu', cluster: 'ai-pretraga', stage: 'pronadjen', minutes: 7, published: '2026-11-22',
    title: 'Schema.org za AI pretragu u 2026: šta radi, a šta je Google ukinuo',
    h1: 'Schema.org za AI pretragu u 2026: aktivni entiteti, povučeni tipovi i JSON-LD pravila',
    desc: 'Koji Schema.org tipovi grade povjerenje u Googleu i AI pretrazi 2026, kojih 7 tipova je Google povukao u junu 2025. i kako povezati JSON-LD bez grešaka.',
    keywords: ['schema markup 2026', 'json-ld seo', 'povuceni schema tipovi 2025', 'organization localbusiness schema', 'faqpage schema pravila'],
    cover: {
      alt: 'Schema.org graf entiteta za 2026: Organization, LocalBusiness, Service, Offer, Article i ProfilePage povezani preko @id',
      caption: 'Povezani JSON-LD graf entiteta uklanja dvosmislenost o tome ko stoji iza ponude, cijene i sadržaja.',
    },
    diagram: '/media/znanje/cluster1-schema-graph-diagram.webp',
    answer: 'U 2026. godini najvrjedniji Schema.org tipovi za SEO i AI pretragu su povezani entiteti Organization, LocalBusiness, Service s Offer cijenom, Article, ProfilePage i BreadcrumbList. Google je u augustu 2023. ograničio FAQPage rich rezultate na državne i zdravstvene sajtove, a u junu 2025. povukao sedam tipova uključujući ClaimReview, CourseInfo i SpecialAnnouncement.',
    sections: [
      ['Koji Schema.org tipovi grade povjerenje u 2026. godini', `<p>Strukturirani podaci u JSON-LD formatu pomažu pretraživačima i AI sistemima da nedvosmisleno povežu naziv firme, lokaciju, usluge, cijene i autore bez nagađanja iz neuređenog teksta. U našem ${a('/znanje/ai-spremnost-web-stranica-bih-2026/', 'BiH benchmarku na 78 poslovnih sajtova')}, tačno 50,0% analiziranih firmi uopće nema <code>Organization</code> ili <code>LocalBusiness</code> schemu.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-schema-graph-diagram.webp" srcset="/media/znanje/cluster1-schema-graph-diagram-768.webp 768w, /media/znanje/cluster1-schema-graph-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Poređenje aktivnog Schema.org grafa za 2026. i tipova koje je Google povukao ili ograničio"><figcaption>Aktivni JSON-LD graf povezuje entitete preko @id referenci i izbjegava povučene tipove iz 2025.</figcaption></figure>
<div class="table-wrap"><table><thead><tr><th scope="col">Schema tip</th><th scope="col">Gdje se koristi</th><th scope="col">Ključna polja za 2026.</th></tr></thead><tbody>
<tr><th scope="row">Organization + LocalBusiness</th><td>Cijeli sajt i kontakt</td><td><code>@id</code>, <code>legalName</code>, <code>address</code>, <code>geo</code>, <code>sameAs</code>, <code>hasMap</code>, <code>publishingPrinciples</code></td></tr>
<tr><th scope="row">Service + Offer</th><td>Stranice usluga i paketa</td><td><code>serviceType</code>, <code>areaServed</code>, <code>priceCurrency: "BAM"</code>, <code>OfferShippingDetails</code>, <code>MerchantReturnPolicy</code></td></tr>
<tr><th scope="row">Article + ProfilePage</th><td>Vodiči, blog i stranica tima</td><td><code>headline</code>, <code>datePublished</code>, <code>dateModified</code>, <code>wordCount</code>, <code>author</code>, <code>publishingPrinciples</code></td></tr>
<tr><th scope="row">BreadcrumbList + WebSite</th><td>Sve podstranice</td><td>Tačna hijerarhija putanje i kanonski URL bez preusmjerenja</td></tr></tbody></table></div>`],
      ['Šta je Google povukao u junu 2025. i ograničio kod FAQPage oznaka', `<p>Prema zvaničnim <a href="https://developers.google.com/search/docs/appearance/structured-data/sd-policies" target="_blank" rel="noopener">Google Structured Data pravilima</a>, dodavanje zastarjelih ili neusklađenih oznaka ne donosi rich rezultate i može stvoriti tehnički šum. U junu 2025. Google je ukinuo podršku za sedam tipova prikaza u pretrazi, dok je <code>FAQPage</code> rich rezultat još od augusta 2023. ograničen na autoritativne državne i zdravstvene domene.</p>
<ul><li><strong>Sedam povučenih tipova (juni 2025):</strong> <code>BookActions</code>, <code>CourseInfo</code>, <code>ClaimReview</code>, <code>EstimatedSalary</code>, <code>LearningVideo</code>, <code>SpecialAnnouncement</code> i <code>VehicleListing</code>.</li>
<li><strong>Šta raditi s FAQ sekcijama:</strong> zadržite vidljiva pitanja i odgovore u HTML-u (<code>&lt;details&gt;/&lt;summary&gt;</code>) jer ih AI sistemi i korisnici lako čitaju, ali ne računajte na <code>FAQPage</code> zvjezdice ili proširene isječke u Google pretrazi za komercijalne sajtove.</li></ul>`],
      ['Tri pravila za JSON-LD bez grešaka i halucinacija', `<p>Najčešća greška kod implementacije strukturiranih podataka je kopiranje generičkog JSON-LD šablona koji ne odgovara vidljivom tekstu na stranici. Google izričito zabranjuje označavanje sadržaja koji korisnik ne vidi, a AI sistemi gube povjerenje kada se cijena ili adresa u kodu razlikuju od teksta na ekranu.</p>
<ol><li><strong>Povežite graf preko <code>@id</code>.</strong> Umjesto ponavljanja nepovezanih blokova, povežite <code>Service.provider</code> i <code>Article.publisher</code> na isti <code>#organization</code> identifikator.</li>
<li><strong>Uskladite cijene i tvrdnje s vidljivim HTML-om.</strong> Svaki <code>Offer</code> iznos u BAM ili EUR mora biti jasno napisan i u tekstu stranice.</li>
<li><strong>Proširite <code>sameAs</code> samo provjerenim profilima.</strong> Uključite stvarne profile poput Google Business Profilea, YouTubea, Instagrama, Threadsa i GitHuba, kao što je opisano na stranici ${a('/cinjenice/', 'Činjenice o Digital X')}.</li></ol>`],
    ],
    faq: [
      ['Da li FAQPage schema i dalje pomaže za AI pretragu ako ne daje Google rich rezultat?', 'Vidljiva FAQ sekcija u HTML-u pomaže korisnicima i LLM ekstrakciji jer jasno spaja pitanje i kratak odgovor. Sama FAQPage JSON-LD oznaka je dozvoljena ako prati vidljivi tekst, ali za komercijalne firme više ne garantuje prošireni prikaz u Google pretrazi.'],
      ['Koji je najvažniji Schema tip za lokalnu firmu u BiH?', 'Kombinacija Organization i LocalBusiness sa tačnom adresom, GeoCoordinates koordinatama, radnim vremenom, telefonom, hasMap linkom na Google Business Profile i sameAs nizom.'],
      ['Kako provjeriti da li sajt ima neispravan ili povučen JSON-LD?', 'Pokrenite besplatnu X Signal analizu na /usluge/x-signal/ koja automatski provjerava sintaksu JSON-LD blokova i upozorava na tipove povučene u junu 2025.'],
      ['Smije li se u JSON-LD upisati ocjena recenzija ako nije prikazana na stranici?', 'Ne. AggregateRating i Review oznake smiju se koristiti samo za stvarne, provjerljive recenzije vidljive na toj stranici i u skladu s Googleovim pravilima za recenzije.'],
    ],
    related: [['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga'], ['/znanje/google-ai-overviews-kako-radi/', 'Kako Google AI Overviews bira izvore'], ['/usluge/x-signal/', 'Provjerite JSON-LD kroz X Signal']],
  },
  {
    slug: 'llms-txt-sta-je-i-treba-li-vam', cluster: 'ai-pretraga', stage: 'pronadjen', minutes: 6, published: '2026-11-22',
    title: 'Da li vam treba llms.txt? Šta čitaju Google, ChatGPT i Perplexity',
    h1: 'Da li vam treba llms.txt u 2026: šta stvarno čitaju Google, ChatGPT, Claude i Perplexity',
    desc: 'Šta je llms.txt, zašto ga Google Search Central ne traži za AI Overviews, kako podesiti robots.txt za AI botove i kada llms.txt ipak ima smisla.',
    keywords: ['llms.txt', 'llms-full.txt', 'robots.txt ai botovi', 'gptbot oai-searchbot', 'ai pretraga optimizacija'],
    cover: {
      alt: 'llms.txt, robots.txt i AI pretraga: poređenje obaveznog HTML/JSON-LD sloja i opcionalnog llms.txt pregleda',
      caption: 'Google AI Overviews čita HTML i JSON-LD; llms.txt je opcionalan sažetak za treće AI alate.',
    },
    diagram: '/media/znanje/cluster1-ai-crawlers-diagram.webp',
    answer: 'Google Search Central izričito potvrđuje da llms.txt nije potreban za prikaz u Google AI Overviews ni AI Modeu. Za Google su presudni indeksabilan HTML, Core Web Vitals, max-snippet:-1 i tačan JSON-LD. Datoteke llms.txt i llms-full.txt su opcionalan, čitljiv sažetak ponude i cijena za treće AI alate i agente, uz otvoren pristup u robots.txt i IndexNow.',
    sections: [
      ['Šta je llms.txt i zašto ga Google Search ne traži', `<p>Datoteka <code>/llms.txt</code> je predloženi Markdown standard (<a href="https://llmstxt.org/" target="_blank" rel="noopener">llmstxt.org</a>) koji u korijenu domene sažima ključne stranice, usluge i cijene bez navigacije i skripti. Međutim, zvanična dokumentacija <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener">Google Search Central: AI Features</a> potvrđuje da Google za AI Overviews i AI Mode ne zahtijeva nikakve posebne AI tekstualne fajlove.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-ai-crawlers-diagram.webp" srcset="/media/znanje/cluster1-ai-crawlers-diagram-768.webp 768w, /media/znanje/cluster1-ai-crawlers-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četiri sloja AI vidljivosti: obavezni HTML i JSON-LD temelj, robots.txt i IndexNow, opcionalni llms.txt i vanjska potvrda entiteta"><figcaption>Četiri sloja AI vidljivosti: llms.txt je tek treći, opcionalni sloj iznad čistog HTML-a i strukturiranih podataka.</figcaption></figure>`],
      ['robots.txt, IndexNow i AI botovi: kako kontrolisati pristup', `<p>Prije nego što razmišljate o <code>llms.txt</code> fajlu, provjerite da vaš <code>robots.txt</code> ne blokira pretraživačke AI botove i da koristite XML sitemap i IndexNow. ChatGPT Search se u velikoj mjeri oslanja na Bingov indeks i <code>OAI-SearchBot</code>, pa svaka izmjena cijena ili usluga brže stiže do AI odgovora kada nakon objave pošaljete IndexNow ping.</p>
<div class="table-wrap"><table><thead><tr><th scope="col">Crawler / Signal</th><th scope="col">Uloga</th><th scope="col">Preporuka za javne poslovne sajtove</th></tr></thead><tbody>
<tr><th scope="row">Googlebot + Google-Extended</th><td>Google Search, AI Overviews i Gemini</td><td><code>Allow: /</code> za javne stranice; blokirajte samo <code>/api/</code> i privatne rute</td></tr>
<tr><th scope="row">OAI-SearchBot + ChatGPT-User</th><td>ChatGPT Search i korisnički upiti uživo</td><td><code>Allow: /</code> kako bi ChatGPT mogao citirati aktuelne cijene i usluge</td></tr>
<tr><th scope="row">GPTBot + ClaudeBot + PerplexityBot</th><td>AI indeksiranje i odgovori s izvorima</td><td><code>Allow: /</code> na javnom marketing sadržaju</td></tr>
<tr><th scope="row">IndexNow + XML Sitemap</th><td>Brza obavijest o novim i izmijenjenim URL-ovima</td><td>Automatski ping nakon svakog produkcijskog deploya</td></tr></tbody></table></div>`],
      ['Kada llms.txt i llms-full.txt ipak imaju smisla', `<p>Iako <code>llms.txt</code> nije faktor rangiranja u Googleu, ima praktičnu vrijednost kada želite da AI agenti, razvojni alati ili korisnici koji kopiraju dokumentaciju dobiju čist, tačan pregled vaših usluga, cijena i ograničenja na jednom mjestu. Na Digital X sajtu ${a('/llms.txt', 'llms.txt')} i ${a('/llms-full.txt', 'llms-full.txt')} generišu se automatski iz istog kataloga kao i HTML stranice, tako da cijene nikada ne odstupaju.</p>
<ul><li><strong>Generišite ga iz jednog izvora istine.</strong> Ručno pisan <code>llms.txt</code> brzo zastari i stvara kontradikcije s cjenovnikom na sajtu.</li>
<li><strong>Ne koristite ga kao zamjenu za HTML.</strong> Studija Chen et al. (2025) pokazuje da AI sistemi najviše vjeruju jasnom javnom HTML-u i nezavisnim vanjskim izvorima.</li>
<li><strong>Uključite jasna ograničenja i kontakt.</strong> Navedite valutu (BAM/EUR), područje rada i napomenu da se konačan obim potvrđuje ponudom.</li></ul>`],
    ],
    faq: [
      ['Da li će moj sajt ispasti iz Google AI Overviews ako nemam llms.txt?', 'Ne. Google Search Central potvrđuje da llms.txt nije potreban za AI Overviews ni AI Mode. Fokusirajte se na indeksabilan HTML, Core Web Vitals, jasne odgovore i JSON-LD.'],
      ['Koja je razlika između llms.txt i llms-full.txt?', 'llms.txt je kratka mapa najvažnijih stranica i početnih cijena, dok llms-full.txt sadrži proširene opise usluga, FAQ odgovore i detalje na jednom mjestu.'],
      ['Da li robots.txt treba dozvoliti GPTBot i OAI-SearchBot?', 'Ako želite da vas ChatGPT Search i drugi AI asistenti mogu pronaći i citirati s tačnim cijenama, javne stranice trebaju biti otvorene za OAI-SearchBot, GPTBot, ClaudeBot i PerplexityBot.'],
      ['Kako provjeriti da li su robots.txt i sitemap ispravno podešeni?', 'Pokrenite besplatnu X Signal analizu na /usluge/x-signal/ ili provjerite izvještaj u Google Search Consoleu pod Postavke > robots.txt i Sitemaps.'],
    ],
    related: [['/llms.txt', 'Pogledajte Digital X llms.txt'], ['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga'], ['/znanje/google-ai-overviews-kako-radi/', 'Kako Google AI Overviews bira izvore']],
  },
  {
    slug: 'kako-mjeriti-ai-vidljivost', cluster: 'ai-pretraga', stage: 'mjeriti', minutes: 7, published: '2026-11-22',
    title: 'Kako mjeriti AI vidljivost u ChatGPT-u i Perplexityju bez lažnih garancija',
    h1: 'Kako mjeriti vidljivost brenda u ChatGPT-u, Perplexityju i Google AI Modeu',
    desc: 'Metodologija mjerenja AI vidljivosti bez lažnih ocjena: fiksni set od 20–30 promptova, spominjanje vs. citat, GSC + GA4 atribucija i 7-dnevno Core Update pravilo.',
    keywords: ['mjerenje ai vidljivosti', 'ai visibility tracker', 'chatgpt citati pracenje', 'google ai mode analitika', 'core update protokol'],
    cover: {
      alt: 'Mjerenje AI vidljivosti bez lažnih garancija: 20–30 fiksnih promptova kroz Google AI Mode, ChatGPT, Perplexity i Gemini',
      caption: 'Pouzdano praćenje AI vidljivosti spaja fiksni set promptova, evidenciju citata i stvarne konverzije u GSC-u i GA4.',
    },
    diagram: '/media/znanje/cluster1-ai-measurement-diagram.webp',
    answer: 'AI vidljivost se ne mjeri izmišljenim procentom od 0 do 100, nego mjesečnim testiranjem fiksnog seta od 20–30 kupovnih promptova kroz Google AI Mode, ChatGPT, Perplexity i Gemini. Za svaki prompt bilježe se datum, spominjanje brenda i tačan citirani URL, a rezultati se povezuju sa Search Consoleom i GA4 konverzijama uz poštovanje 7-dnevnog pravila nakon Google Core Updatea.',
    sections: [
      ['Zašto ne postoji jedinstven rang u AI odgovorima', `<p>Za razliku od klasičnih deset plavih linkova na Googleu, generativni odgovori u ChatGPT-u, Perplexityju, Geminiju i Google AI Modeu mijenjaju formulaciju zavisno od konteksta, lokacije i jezika upita. Zato nijedna agencija ne može garantovati „prvo mjesto u ChatGPT-u“, ali može precizno pratiti koliko često se vaš brend spominje i da li je vaš domen naveden kao klikabilan izvor.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster1-ai-measurement-diagram.webp" srcset="/media/znanje/cluster1-ai-measurement-diagram-768.webp 768w, /media/znanje/cluster1-ai-measurement-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četverokoračni proces mjerenja AI vidljivosti: fiksni set promptova, mjesečni log po platformama, GSC i GA4 atribucija i 7-dnevno Core Update pravilo"><figcaption>Četiri koraka mjerenja: od fiksnog seta promptova do stvarnih upita i konverzija u GA4.</figcaption></figure>
<ul><li><strong>Spominjanje brenda (Brand Mention):</strong> AI model navodi ime vaše firme u tekstu odgovora, ali bez direktnog linka.</li>
<li><strong>Citat s izvorom (Citation):</strong> AI sistem navodi vaš tačan URL kao izvor tvrdnje ili cijene — ovo donosi direktan referral promet i povjerenje.</li>
<li><strong>Vanjska potvrda (Earned Media):</strong> Studija Chen et al. (2025) pokazuje da AI pretraživači često citiraju nezavisne portale i direktorije prije samog sajta brenda.</li></ul>`],
      ['Metodologija fiksnog seta od 20–30 promptova (BS, EN i DE)', `<p>Umjesto skupih alata koji naplaćuju dodatke po svakih 50 promptova, mala i srednja firma dobija najjasniju sliku kroz fiksni set od 20 do 30 stvarnih pitanja kupaca koji se testira jednom mjesečno na istim platformama. Svaki unos u evidenciji sadrži tačan prompt, jezik, tržište, datum, da li je brend spomenut i koji URL je citiran.</p>
<div class="table-wrap"><table><thead><tr><th scope="col">Kategorija prompta</th><th scope="col">Primjer pitanja kupca</th><th scope="col">Šta mjerimo</th></tr></thead><tbody>
<tr><th scope="row">Informativni (AEO)</th><td>„Šta je razlika između SEO, AEO i GEO?“</td><td>Da li AI citira vaš vodič ili pojmovnik</td></tr>
<tr><th scope="row">Cjenovni i poređenje</th><td>„Koliko košta SEO optimizacija u BiH?“</td><td>Da li AI tačno prenosi vaše početne cijene u KM/EUR</td></tr>
<tr><th scope="row">Lokalni (BiH)</th><td>„Preporuka za web i SEO agenciju u Sarajevu“</td><td>Spominjanje brenda, Google Business signali i recenzije</td></tr>
<tr><th scope="row">DACH / izvozni (EN/DE)</th><td>„Webdesign &amp; SEO Agentur für DACH Unternehmen“</td><td>Vidljivost lokalizovanih /en/ i /de/ stranica</td></tr></tbody></table></div>`],
      ['Povezivanje AI vidljivosti sa Search Consoleom, GA4 i Core Update pravilom', `<p>Praćenje AI odgovora ima poslovnu vrijednost tek kada se poveže sa stvarnim klikovima u Google Search Consoleu i konverzijama u GA4 (slanje forme, klik na WhatsApp ili telefon). Prema zvaničnom <a href="https://developers.google.com/search/docs/appearance/core-updates" target="_blank" rel="noopener">Google Core Updates vodiču</a>, nakon završetka svakog Core Updatea na Search Status Dashboardu treba sačekati najmanje sedam punih dana prije poređenja sedmičnih rezultata.</p>
<p>Na stranici ${a('/usluge/ai-visibility-tracker/', 'AI Visibility Tracker')} i u našoj ${a('/uredjivacka-politika/', 'uredničkoj metodologiji')} detaljno je opisano kako spajamo mjesečni log promptova s tehničkim SEO-om bez skrivenih doplata po promptu (${a('/usluge/seo-aeo-geo-cijena/', 'pregled cijena')}).</p>`],
    ],
    faq: [
      ['Koliko često treba testirati AI promptove?', 'Jednom mjesečno na fiksnom setu od 20–30 promptova, te dodatno 7–14 dana nakon većih izmjena sadržaja ili završetka Google Core Updatea.'],
      ['Da li se posjete iz ChatGPT-a i Perplexityja vide u Google Analyticsu?', 'Da, klikovi na citirane linkove u ChatGPT Searchu i Perplexityju pojavljuju se u GA4 kao referral promet (npr. chatgpt.com ili perplexity.ai), dok se dio korisnika vraća direktno ili putem brendirane pretrage.'],
      ['Zašto Digital X ne naplaćuje dodatno po broju praćenih promptova?', 'Zato što je praćenje fiksnog seta promptova dio transparentnog mjesečnog izvještaja u sklopu SEO · GEO · AEO saradnje, bez vještačkog napuhavanja cijene po broju upita.'],
      ['Šta uraditi ako AI model navodi pogrešnu cijenu ili staru adresu firme?', 'Ažurirajte vidljivi HTML tekst, JSON-LD Offer/LocalBusiness podatke, llms.txt i vanjske profile (Google Business Profile, YouTube, GitHub, Instagram), pa pošaljite IndexNow i sitemap osvježenje.'],
    ],
    related: [['/usluge/ai-visibility-tracker/', 'AI Visibility Tracker metodologija'], ['/usluge/seo-aeo-geo-cijena/', 'SEO, GEO i AEO cijene'], ['/uredjivacka-politika/', 'Urednička politika i Core Update SOP']],
  },
];
