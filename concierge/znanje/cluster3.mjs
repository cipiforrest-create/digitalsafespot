const a = (href, text) => `<a href="${href}">${text}</a>`;

export const cluster3Guides = [
  {
    slug: 'core-web-vitals-optimizacija-brzine', cluster: 'web', stage: 'izgraditi', minutes: 7, published: '2026-11-23',
    title: 'Core Web Vitals i optimizacija brzine sajta u 2026: LCP, INP i CLS',
    h1: 'Core Web Vitals i optimizacija brzine web stranice: kako postići LCP ≤ 2,5 s, INP < 200 ms i CLS < 0,1',
    desc: 'Šta su Core Web Vitals (LCP, INP, CLS) u 2026, zašto je INP zamijenio FID, koji su najčešći uzroci sporog sajta u BiH i kako ih riješiti bez redizajna.',
    keywords: ['core web vitals', 'optimizacija brzine sajta', 'lcp inp cls', 'brzina web stranice bih', 'pagespeed optimizacija'],
    cover: {
      alt: 'Core Web Vitals i optimizacija brzine web stranice u 2026: LCP ≤ 2,5 s, INP < 200 ms i CLS < 0,1',
      caption: 'Brzina učitavanja (LCP), odziv na klik (INP) i stabilnost prikaza (CLS) direktno utiču na Google vidljivost, AI Overviews i stopu upita.',
    },
    diagram: '/media/znanje/cluster3-cwv-thresholds-diagram.webp',
    answer: 'Core Web Vitals su tri Googleove metrike stvarnog korisničkog iskustva: LCP (učitavanje glavnog sadržaja ≤ 2,5 s), INP (odziv na klik ili dodir < 200 ms, koji je zamijenio FID) i CLS (vizuelna stabilnost < 0,1). Na većini poslovnih sajtova u BiH problem nisu serveri nego nekompresovane slike, blokirajući CSS/JS i fontovi bez rezervisanog prostora.',
    sections: [
      ['Tri Core Web Vitals metrike i pragovi za 2026. godinu', `<p>Prema zvaničnoj dokumentaciji <a href="https://developers.google.com/search/docs/appearance/core-web-vitals" target="_blank" rel="noopener">Google Search Central: Core Web Vitals</a>, Google ocjenjuje stvarno iskustvo posjetilaca na mobitelu i desktopu kroz tri praga na 75. percentilu posjeta. Dobar rezultat na sve tri metrike podržava i klasično rangiranje i podobnost za <a href="/znanje/google-ai-overviews-kako-radi/">Google AI Overviews</a>.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster3-cwv-thresholds-diagram.webp" srcset="/media/znanje/cluster3-cwv-thresholds-diagram-768.webp 768w, /media/znanje/cluster3-cwv-thresholds-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Pregled tri Core Web Vitals metrike za 2026: LCP ≤ 2,5 s, INP < 200 ms i CLS < 0,1 uz glavne tehničke popravke"><figcaption>Googleovi pragovi za dobar Core Web Vitals rezultat i najbrže tehničke intervencije po metrici.</figcaption></figure>
<div class="table-wrap"><table><thead><tr><th scope="col">Metrika</th><th scope="col">Dobar prag</th><th scope="col">Najčešći uzrok pada</th><th scope="col">Prva popravka</th></tr></thead><tbody>
<tr><th scope="row">LCP (Largest Contentful Paint)</th><td>≤ 2,5 s</td><td>Velika hero slika bez preloadinga, spor TTFB, blokirajući CSS</td><td>WebP/AVIF format, <code>fetchpriority="high"</code>, inline kritični CSS</td></tr>
<tr><th scope="row">INP (Interaction to Next Paint)</th><td>&lt; 200 ms</td><td>Teški JS paketi, chat widgeti i skripte trećih strana</td><td><code>defer</code> na skriptama, razbijanje dugih zadataka, uklanjanje viška dodataka</td></tr>
<tr><th scope="row">CLS (Cumulative Layout Shift)</th><td>&lt; 0,1</td><td>Slike bez <code>width</code>/<code>height</code>, skok fonta, naknadni banneri</td><td>Fiksne dimenzije slika, <code>font-display: swap</code>, rezervisan prostor</td></tr></tbody></table></div>`],
      ['Zašto je INP zamijenio FID i šta to znači za mobilne korisnike', `<p>Za razliku od starog FID-a koji je mjerio samo prvu interakciju, <a href="https://web.dev/articles/inp" target="_blank" rel="noopener">Interaction to Next Paint (INP)</a> mjeri najsporiji odziv tokom cijele posjete — otvaranje menija, filtriranje proizvoda u web shopu ili klik na kontakt formu. Na slabijim telefonima u BiH teški page-builderi i neoptimizovani skripti lako prelaze 400 ms, zbog čega posjetilac misli da dugme ne radi i napušta stranicu.</p>`],
      ['Kada je dovoljna Speed optimizacija od 99 KM, a kada treba redizajn', `<p>Ako je struktura stranice dobra, a koče je slike, fontovi, keširanje i redoslijed učitavanja skripti, jednokratna ${a('/shop/product/speed-optimization/', 'Speed optimizacija (od 99 KM)')} rješava problem uz izvještaj prije i poslije. Ako je sajt građen na zastarjelom šablonu s desetinama konfliktnih dodataka, dugoročno je isplativiji čist ${a('/usluge/redizajn-web-stranice/', 'redizajn web stranice')} ili ${a('/usluge/optimizacija-brzine-sajta/', 'detaljna provjera brzine')} uz ${a('/usluge/x-signal/', 'besplatnu X Signal analizu')}.</p>`],
    ],
    faq: [
      ['Da li je PageSpeed Insights ocjena od 100 obavezna za dobar SEO?', 'Ne. Google koristi stvarne Core Web Vitals pragove (LCP ≤ 2,5 s, INP < 200 ms, CLS < 0,1), a ne samu laboratorijsku ocjenu od 0 do 100. Ipak, laboratorijski test u PageSpeed Insights jasno pokazuje šta usporava mobilni prikaz.'],
      ['Koliko košta ubrzanje postojeće web stranice?', 'Kod Digital X jednokratna Speed optimizacija kreće od 99 KM uz mjerenje prije i poslije intervencije, dok se složeniji zahvati na web shopovima ili custom aplikacijama procjenjuju nakon pregleda.'],
      ['Zašto je mobilni rezultat uvijek lošiji od desktopa?', 'Mobilni test simulira sporiji procesor i 4G mrežu, pa teške slike, neiskorišteni JavaScript i fontovi mnogo jače usporavaju telefon nego desktop računar.'],
    ],
    related: [['/usluge/optimizacija-brzine-sajta/', 'Optimizacija brzine sajta — od 99 KM'], ['/shop/product/speed-optimization/', 'Speed optimizacija paket'], ['/blog/brzina-sajta.html', 'Zašto spor sajt ubija prodaju']],
  },
  {
    slug: 'redizajn-web-stranice-bez-gubitka-seo', cluster: 'web', stage: 'izgraditi', minutes: 7, published: '2026-11-23',
    title: 'Redizajn web stranice bez gubitka SEO pozicija: 301 mapa i provjera',
    h1: 'Redizajn web stranice bez gubitka Google pozicija i prometa: kompletan protokol',
    desc: 'Kako uraditi redizajn web stranice bez pada posjeta: popis postojećih URL-ova, 301 preusmjerenja u jednom skoku, staging noindex zaštita i Search Console provjera.',
    keywords: ['redizajn web stranice seo', '301 preusmjerenja redizajn', 'migracija sajta bez gubitka pozicija', 'redizajn sajta cijena bih'],
    cover: {
      alt: 'Redizajn web stranice bez gubitka SEO pozicija: 301 mapa preusmjerenja, kanonski URL-ovi i staging zaštita',
      caption: 'Čuvanje postojećih URL-ova, 1:1 301 preusmjerenja i provjera kanonskih oznaka štite stečeni Google autoritet tokom redizajna.',
    },
    diagram: '/media/znanje/cluster3-redesign-migration-diagram.webp',
    answer: 'Redizajn web stranice gubi Google pozicije kada se promijene URL adrese bez 301 preusmjerenja, obrišu postojeći tekstovi i H1 naslovi ili se na produkciji slučajno ostavi noindex oznaka sa testnog servera. Siguran redizajn počinje popisom svih indeksiranih URL-ova, 1:1 mapom 301 preusmjerenja, očuvanjem JSON-LD entiteta i praćenjem Search Consolea odmah nakon objave.',
    sections: [
      ['Četiri faze redizajna koji čuva postojeći promet', `<p>Prema zvaničnom <a href="https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes" target="_blank" rel="noopener">Google Search Central vodiču za promjenu URL-ova</a>, pretraživač svaku novu adresu bez preusmjerenja tretira kao potpuno novu stranicu bez historije. Zato prije pisanja prvog reda novog dizajna izvozimo sve postojeće URL-ove iz sitemapa, Google Search Consolea i analitike.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster3-redesign-migration-diagram.webp" srcset="/media/znanje/cluster3-redesign-migration-diagram-768.webp 768w, /media/znanje/cluster3-redesign-migration-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četiri faze SEO-sigurnog redizajna web stranice: popis URL-ova, 1:1 301 mapa, staging provjera i nadzor nakon objave"><figcaption>Četiri faze sigurnog redizajna: od izvoza postojećih URL-ova do 7-dnevnog nadzora u Search Consoleu.</figcaption></figure>
<ol><li><strong>Inventar i benchmark.</strong> Sačuvajte listu svih URL-ova koji donose klikove ili imaju vanjske linkove, zajedno s njihovim H1 naslovima, meta opisima i JSON-LD podacima.</li>
<li><strong>Zadržite URL-ove kad god možete.</strong> Ako stara adresa već rangira (npr. <code>/usluge/web-dizajn/</code>), ne mijenjajte je bez jakog razloga.</li>
<li><strong>1:1 mapa 301/308 preusmjerenja.</strong> Svaki promijenjeni URL mora u jednom skoku voditi na najbližu tematsku stranicu — nikada sve na početnu stranicu.</li>
<li><strong>Staging zaštita i objava.</strong> Testnu verziju zaključajte lozinkom ili <code>noindex</code> zaglavljem, a na dan objave odmah uklonite blokadu, osvježite sitemap i pošaljite IndexNow ping.</li></ol>`],
      ['Pet grešaka koje najčešće obore promet nakon redizajna', `<p>Većina padova nakon redizajna nije „Google kazna“, nego tehnički previd na dan objave. Provjerite ovih pet tačaka prije nego što stari sajt zamijenite novim:</p>
<ul><li><strong>Zaboravljen <code>noindex</code> ili <code>Disallow: /</code></strong> prenesen sa testnog servera na živu domenu.</li>
<li><strong>Skraćivanje tekstova na stranicama usluga</strong> radi „minimalističkog dizajna“, čime nestaju ključni pojmovi i odgovori.</li>
<li><strong>Lanci preusmjerenja</strong> (<code>http</code> → <code>www</code> → <code>non-www</code> → novi slug) umjesto jednog direktnog skoka.</li>
<li><strong>Gubitak <code>hreflang</code> i kanonskih veza</strong> na višejezičnim BS/EN/DE stranicama.</li>
<li><strong>Neprovjereni interni linkovi</strong> koji i dalje gađaju stare adrese ili vraćaju 404 grešku.</li></ul>`],
      ['Koliko košta redizajn i kako provjeriti postojeći sajt', `<p>Kod Digital X ${a('/usluge/redizajn-web-stranice/', 'redizajn web stranice')} kreće od 349 KM kada zadržavate postojeći sadržaj uz moderniji izgled, brzinu i SEO strukturu, dok kompletna nova izrada kreće od 449 KM (${a('/usluge/web-dizajn/', 'Web dizajn paketi')}). Prije početka možete pokrenuti ${a('/usluge/x-signal/', 'besplatnu X Signal analizu')} i pročitati ${a('/blog/uiux-rebranding-vodic.html', 'vodič za UI/UX rebranding')}.</p>`],
    ],
    faq: [
      ['Da li je normalno da posjete kratko osciliraju nakon redizajna?', 'Ako se mijenjaju URL-ovi, Googleu treba nekoliko dana do nekoliko sedmica da ponovo obradi 301 preusmjerenja. Ako URL-ovi i sadržaj ostanu isti uz brži kod, pad se najčešće izbjegne.'],
      ['Smijem li sve stare URL-ove preusmjeriti na početnu stranicu?', 'Ne. Google masovno preusmjeravanje različitih tema na početnu stranicu često tretira kao soft 404 i ne prenosi autoritet stare stranice.'],
      ['Šta ako je stari sajt već imao lošu strukturu URL-ova?', 'Tada uvodimo čistu novu strukturu uz preciznu 1:1 mapu trajnih 301/308 preusmjerenja, ažuriramo sve interne linkove i uklanjamo stare adrese iz XML sitemapa.'],
    ],
    related: [['/usluge/redizajn-web-stranice/', 'Redizajn web stranice — od 349 KM'], ['/usluge/web-dizajn/', 'Web dizajn paketi'], ['/znanje/tehnicki-seo-audit-checklist/', 'Tehnički SEO audit u 15 minuta']],
  },
  {
    slug: 'web-shop-placanje-dostava-bih', cluster: 'shop', stage: 'izgraditi', minutes: 7, published: '2026-11-23',
    title: 'Web shop plaćanje i dostava u BiH: kartice, pouzeće i povrat',
    h1: 'Plaćanje i dostava u web shopu u BiH: kartično plaćanje, pouzeće, kuriri i pravila povrata',
    desc: 'Kako povezati kartično plaćanje i pouzeće u BiH web shopu, prikazati cijenu dostave bez napuštanja korpe i podesiti OfferShippingDetails i MerchantReturnPolicy schemu.',
    keywords: ['web shop placanje bih', 'karticno placanje bih', 'pouzece web shop', 'dostava web shop bih', 'merchantreturnpolicy schema'],
    cover: {
      alt: 'Plaćanje i dostava u BiH web shopu: kartični procesor, pouzeće, kurirske službe i MerchantReturnPolicy schema',
      caption: 'Kombinacija kartičnog plaćanja i pouzeća uz jasnu cijenu dostave prije zadnjeg koraka smanjuje napuštanje korpe u BiH.',
    },
    diagram: '/media/znanje/cluster3-checkout-flow-diagram.webp',
    answer: 'Uspješan web shop u BiH kombinuje plaćanje pouzećem (koje i dalje čini velik dio domaćih narudžbi) i kartično plaćanje putem lokalnog bankovnog ili regionalnog procesora. Kupci najčešće napuštaju korpu zbog skrivenih troškova dostave, obavezne registracije i nejasnih uslova povrata, dok Google za proizvode i usluge traži usklađene OfferShippingDetails i MerchantReturnPolicy podatke.',
    sections: [
      ['Kartično plaćanje vs. pouzeće u Bosni i Hercegovini', `<p>Kupci u BiH imaju različite navike: dio kupaca preferira plaćanje karticom odmah, dok drugi dio i dalje bira plaćanje pouzećem pri preuzimanju paketa. Web shop koji nudi samo jednu opciju gubi dio narudžbi već na koraku plaćanja, pa je najpraktičnije podržati oba načina uz jasnu potvrdu narudžbe.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster3-checkout-flow-diagram.webp" srcset="/media/znanje/cluster3-checkout-flow-diagram-768.webp 768w, /media/znanje/cluster3-checkout-flow-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Poređenje konverzijski spremnog BiH checkouta i najčešćih razloga napuštanja korpe"><figcaption>Jasan checkout u BiH spaja kartice i pouzeće, unaprijed prikazanu dostavu i vidljiva pravila povrata.</figcaption></figure>
<div class="table-wrap"><table><thead><tr><th scope="col">Način plaćanja</th><th scope="col">Prednost za kupca</th><th scope="col">Na šta paziti u praksi</th></tr></thead><tbody>
<tr><th scope="row">Plaćanje pouzećem (COD)</th><td>Nema unosa kartice; plaćanje kuriru pri preuzimanju</td><td>Potvrda narudžbe SMS-om/pozivom smanjuje nepreuzete pakete</td></tr>
<tr><th scope="row">Kartično plaćanje (procesor / banka)</th><td>Brža naplata, manje povrata paketa, kupci iz dijaspore</td><td>Ugovor s bankom/procesorom, 3D Secure i jasne pravne stranice</td></tr>
<tr><th scope="row">Virmansko / predračun (B2B)</th><td>Standard za firme i veće narudžbe</td><td>Automatsko slanje predračuna s rokom rezervacije zaliha</td></tr></tbody></table></div>`],
      ['Dostava, pravne stranice i Google Merchant schema', `<p>Prema zvaničnim <a href="https://developers.google.com/search/docs/appearance/structured-data/merchant-listing" target="_blank" rel="noopener">Google Search Central Merchant Listing smjernicama</a>, strukturirani podaci za ponude trebaju jasno navesti trošak dostave (<code>OfferShippingDetails</code>) i politiku povrata (<code>MerchantReturnPolicy</code>) u skladu s vidljivim stranicama na sajtu. Na Digital X sajtu svaka ponuda prati javnu stranicu ${a('/otkazivanje-povrat.html', 'uslova otkazivanja i povrata')}.</p>
<ul><li><strong>Prikažite cijenu dostave rano.</strong> Navedite fiksnu cijenu kurira ili prag za besplatnu dostavu već na stranici proizvoda i u korpi.</li>
<li><strong>Omogućite kupovinu bez registracije.</strong> Na mobitelu tražite samo ime, telefon, adresu i grad.</li>
<li><strong>Uskladite fiskalizaciju s knjigovođom.</strong> Pravila izdavanja računa i povrata razlikuju se po entitetu i vrsti robe.</li></ul>`],
      ['Koliko košta izrada web shopa spremnog za BiH tržište', `<p>Kod Digital X paket ${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')} kreće od 2.490 KM jednokratno i uključuje do 50 proizvoda, kategorije, galerije, podešavanje plaćanja i dostave te obuku tima. Detalje usluge pogledajte na ${a('/usluge/izrada-web-shopa/', 'Izrada web shopa u BiH')} i u vodiču ${a('/znanje/kako-otvoriti-web-shop-bih/', 'kako otvoriti web shop u BiH')}.</p>`],
    ],
    faq: [
      ['Da li je kartično plaćanje obavezno za web shop u BiH?', 'Nije zakonski obavezno ako nudite pouzeće ili predračun, ali kartično plaćanje značajno pomaže kod kupaca iz dijaspore, poklon narudžbi i smanjenja nepreuzetih paketa.'],
      ['Šta banka ili procesor plaćanja traži prije odobrenja kartičnog plaćanja?', 'Registrovanu firmu, aktivnu web stranicu s proizvodima u KM, SSL certifikat, jasno istaknute uslove kupovine, politiku privatnosti, podatke firme i pravila povrata i reklamacija.'],
      ['Koliko traje izrada web shopa s dostavom i plaćanjem?', 'Osnovni web shop obično traje nekoliko sedmica, zavisno od spremnosti kataloga proizvoda, fotografija i odobrenja ugovora s bankom ili kurirskom službom.'],
    ],
    related: [['/usluge/izrada-web-shopa/', 'Izrada web shopa u BiH — od 2.490 KM'], ['/shop/product/ecommerce-launch/', 'E-commerce Launch paket'], ['/znanje/kako-otvoriti-web-shop-bih/', 'Kako otvoriti web shop u BiH']],
  },
  {
    slug: 'konverzija-web-stranice-cro-vodic', cluster: 'shop', stage: 'privuci', minutes: 6, published: '2026-11-23',
    title: 'Optimizacija konverzije (CRO): zašto posjetioci ne šalju upit',
    h1: 'Optimizacija konverzije web stranice (CRO): kako pretvoriti postojeće posjete u upite i narudžbe',
    desc: 'Praktični CRO vodič za firme u BiH: zašto sajt ima posjete bez upita, kako srediti prvi ekran, cijene, mobilne forme, WhatsApp/AI predaju i GA4 mjerenje.',
    keywords: ['optimizacija konverzije', 'cro vodic', 'zasto sajt nema upite', 'landing stranica konverzija', 'x convert'],
    cover: {
      alt: 'Optimizacija konverzije web stranice (CRO): jasna ponuda u 5 sekundi, dokazi povjerenja, kratka forma i GA4 mjerenje',
      caption: 'Prije povećanja budžeta za oglase, uklanjanje prepreka na prvom ekranu i u formi podiže broj upita iz postojećeg prometa.',
    },
    diagram: '/media/znanje/cluster3-cro-funnel-diagram.webp',
    answer: 'Optimizacija konverzije (CRO) je uklanjanje prepreka zbog kojih posjetioci napuštaju web stranicu bez poziva, poruke ili narudžbe. Najveći pomak obično donose četiri promjene: jasna ponuda i cijena u prvih pet sekundi, vidljivi dokazi povjerenja, kratka mobilna forma od tri do četiri polja i brzo preuzimanje upita putem WhatsAppa ili AI asistenta.',
    sections: [
      ['Gdje posjetioci najčešće odustaju na poslovnim sajtovima', `<p>Većina firmi u BiH prvo povećava budžet za oglase kada nema dovoljno upita, iako problem često leži na samoj stranici. Ako posjetilac s mobitela u prvih pet sekundi ne vidi šta nudite, za koga i koji je sljedeći korak, vraća se na Google ili zatvara karticu bez obzira na to koliko je klik koštao.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster3-cro-funnel-diagram.webp" srcset="/media/znanje/cluster3-cro-funnel-diagram-768.webp 768w, /media/znanje/cluster3-cro-funnel-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četiri tačke gubitka konverzije na web stranici i konkretne CRO popravke od prvog ekrana do GA4 mjerenja"><figcaption>Četiri tačke gdje posjetioci odustaju i konkretne CRO popravke koje ne traže veći budžet za oglase.</figcaption></figure>
<div class="table-wrap"><table><thead><tr><th scope="col">Tačka na stranici</th><th scope="col">Česta greška</th><th scope="col">CRO popravka</th></tr></thead><tbody>
<tr><th scope="row">Prvi ekran (0–5 s)</th><td>Općenit slogan bez usluge i grada</td><td>Konkretan H1, jedna rečenica vrijednosti i jasan CTA</td></tr>
<tr><th scope="row">Ponuda i cijena</th><td>„Cijena na upit“ bez ikakvog okvira</td><td>Početne cijene u KM/EUR i šta je uključeno u obim</td></tr>
<tr><th scope="row">Kontakt forma</th><td>Osam obaveznih polja na malom ekranu</td><td>Ime, kontakt i kratak opis + direktan WhatsApp/poziv</td></tr>
<tr><th scope="row">Odgovor na upit</th><td>Čekanje do sutradan bez potvrde</td><td>Automatska potvrda ili vođeni ${a('/usluge/ai-chatbot-za-web-stranicu/', 'AI asistent')}</td></tr></tbody></table></div>`],
      ['Pet CRO provjera koje možete uraditi na mobitelu za 10 minuta', `<p>Otvorite svoju najposjećeniju stranicu na telefonu preko mobilnih podataka i prođite kroz ovih pet provjera kao da ste novi kupac:</p>
<ol><li><strong>Test pet sekundi:</strong> Da li se bez skrolanja vidi šta prodajete, gdje radite i kako vas kontaktirati?</li>
<li><strong>Jedan glavni cilj po stranici:</strong> Kampanje šaljite na fokusiranu ${a('/shop/product/landing-starter/', 'landing stranicu (od 199 KM)')}, a ne na opštu početnu stranicu.</li>
<li><strong>Dokaz pored poziva na akciju:</strong> Postavite stvarne projekte, recenzije ili jasnu metodologiju odmah iznad ili pored forme.</li>
<li><strong>Brzina i stabilnost dugmadi:</strong> Provjerite da se dugme za slanje ne pomjera dok se stranica učitava (${a('/znanje/core-web-vitals-optimizacija-brzine/', 'Core Web Vitals')}).</li>
<li><strong>Mjerenje stvarnih događaja:</strong> U GA4 pratite slanje forme, klik na telefon i WhatsApp tek nakon pristanka korisnika.</li></ol>`],
      ['Kako Digital X povezuje dizajn, razgovor i konverziju', `<p>Kroz ${a('/usluge/x-convert/', 'X Convert')} i ${a('/shop/product/smart-website-launch/', 'Smart Website Launch (499 KM)')} spajamo jasnu strukturu ponude, brzo mobilno iskustvo i vođeni razgovor koji kvalifikuje upit prije predaje vašem timu. Za postojeće stranice prvi korak je ${a('/usluge/x-signal/', 'besplatna X Signal analiza')} koja provjerava i tehničke signale i put do upita.</p>`],
    ],
    faq: [
      ['Šta je dobra stopa konverzije za poslovnu web stranicu?', 'Zavisi od branše, cijene usluge i izvora prometa (pretraga obično konvertuje više od hladnih društvenih oglasa). Najpouzdanije mjerilo je poređenje vlastitog trenda prije i poslije izmjena u GA4.'],
      ['Da li je bolje imati dugu kontakt formu ili kratku?', 'Za prvi kontakt kraća forma (3–4 polja) gotovo uvijek donosi više upita. Dodatne detalje možete prikupiti u razgovoru ili kroz vođeni upitnik nakon prvog koraka.'],
      ['Koliko košta izrada fokusirane landing stranice za kampanju?', 'Kod Digital X Landing stranica kreće od 199 KM jednokratno, dok Smart Website Launch do pet stranica s AI asistentom košta 499 KM.'],
    ],
    related: [['/usluge/x-convert/', 'X Convert — optimizacija konverzije'], ['/shop/product/landing-starter/', 'Landing stranica — od 199 KM'], ['/shop/product/smart-website-launch/', 'Smart Website Launch — 499 KM']],
  },
];



