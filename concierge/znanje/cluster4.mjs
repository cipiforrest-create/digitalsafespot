const a = (href, text) => `<a href="${href}">${text}</a>`;

export const cluster4Guides = [
  {
    slug: 'google-ads-search-vs-performance-max-bih', cluster: 'oglasi', stage: 'privuci', minutes: 7, published: '2026-11-23',
    title: 'Google Ads Search vs. Performance Max u BiH: šta odabrati za upite',
    h1: 'Google Ads Search vs. Performance Max: koja kampanja donosi kvalitetnije upite u BiH',
    desc: 'Poređenje Google Search i Performance Max kampanja za firme u BiH: kontrola ključnih riječi, negativni pojmovi, lokalno ciljanje i zaštita od nekvalitetnih upita.',
    keywords: ['google ads search vs performance max', 'google oglasi bih', 'performance max kampanja', 'google ads sarajevo', 'cijena upita google ads'],
    cover: {
      alt: 'Google Ads Search vs. Performance Max u BiH: kontrola namjere pretrage, negativne ključne riječi i mjerenje stvarnih upita',
      caption: 'Search kampanje hvataju aktivnu namjeru pretrage, dok Performance Max traži jake kreative i čiste signale konverzije.',
    },
    diagram: '/media/znanje/cluster4-search-vs-pmax-diagram.webp',
    answer: 'Za većinu uslužnih firmi u BiH prvi izbor je Google Search kampanja jer cilja ljude koji aktivno upisuju vašu uslugu i grad, uz punu kontrolu ključnih riječi i negativnih pojmova. Performance Max ima smisla za web shopove ili širenje nakon što već imate dovoljno kvalitetnih konverzija i jake video i slikovne kreative.',
    sections: [
      ['Search kampanje vs. Performance Max: ključne razlike za BiH tržište', `<p>Prema zvaničnoj dokumentaciji <a href="https://support.google.com/google-ads/answer/10724817" target="_blank" rel="noopener">Google Ads Help: About Performance Max</a>, Performance Max iz jedne kampanje prikazuje oglase kroz Search, Maps, YouTube, Display, Discover i Gmail. Za razliku od klasične Search kampanje gdje birate tačne pojmove pretrage, automatizacija bez čistih signala konverzije na manjim BiH budžetima često troši dio novca na široke prikaze i slabije upite.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster4-search-vs-pmax-diagram.webp" srcset="/media/znanje/cluster4-search-vs-pmax-diagram-768.webp 768w, /media/znanje/cluster4-search-vs-pmax-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Poređenje Google Ads Search kampanja, Performance Max kampanja i kontrola kvaliteta upita za BiH firme"><figcaption>Search daje kontrolu namjere i negativnih pojmova; Performance Max traži čiste konverzije i kvalitetne kreative.</figcaption></figure>
<div class="table-wrap"><table><thead><tr><th scope="col">Kriterij</th><th scope="col">Google Search kampanja</th><th scope="col">Performance Max (PMax)</th></tr></thead><tbody>
<tr><th scope="row">Gdje se prikazuje</th><td>Google pretraga (tekstualni oglasi s namjerom)</td><td>Search, Maps, YouTube, Display, Discover, Gmail</td></tr>
<tr><th scope="row">Kontrola pojmova</th><td>Visoka — tačne/frazne riječi i negativne liste</td><td>Ograničena — search themes, brand exclusions i negativne liste</td></tr>
<tr><th scope="row">Najbolje za</th><td>Ordinacije, advokate, servise, B2B i lokalne usluge</td><td>Web shopove (Shopping feed) i firme s većim obimom podataka</td></tr>
<tr><th scope="row">Glavni rizik</th><td>Preširoke ključne riječi bez sedmične provjere</td><td>Spam forme s Display/YouTube mreže ako mjerite pogrešne događaje</td></tr></tbody></table></div>`],
      ['Četiri kontrole koje štite budžet prije pokretanja kampanje', `<p>Bez obzira na to da li pokrećete Search ili Performance Max, kvalitet upita zavisi od signala koje šaljete Googleovom algoritmu i stranice na koju klik vodi. Prije prvog potrošenog eura ili marke provjerite ove četiri tačke:</p>
<ol><li><strong>Fokusirana odredišna stranica.</strong> Šaljite klikove na namjensku ${a('/shop/product/landing-starter/', 'landing stranicu (od 199 KM)')} za jednu uslugu, a ne na opštu početnu stranicu.</li>
<li><strong>Mjerenje stvarnih konverzija u GA4.</strong> Pratite slanje forme, klik na telefon i WhatsApp uz ${a('/znanje/ga4-consent-mode-v2-mjerenje-konverzija/', 'Consent Mode v2')}, nikada samo otvaranje stranice.</li>
<li><strong>Geografsko ograničenje.</strong> Ciljajte ljude u vašem gradu ili regiji (Sarajevo, BiH ili DACH), a ne „ljude zainteresovane za lokaciju“ ako radite lokalno.</li>
<li><strong>Sedmična lista negativnih pojmova.</strong> Isključujte pretrage poput „besplatno“, „posao“, „kurs“ ili konkurentske nazive koji ne donose kupce.</li></ol>`],
      ['Koliko košta vođenje Google Ads kampanja u BiH', `<p>Budžet za klikove plaćate direktno Googleu, dok se vođenje kampanja ugovara odvojeno. Kod Digital X ${a('/shop/product/growth-campaigns/', 'Kampanje za rast')} kreću od 249 KM mjesečno plus budžet za oglase, a detalje pogledajte na ${a('/usluge/google-ads/', 'Google Ads usluge')} i u vodiču ${a('/znanje/google-oglasi-cijena/', 'koliko koštaju Google oglasi')}.</p>`],
    ],
    faq: [
      ['Da li je Performance Max bolji od Search kampanje za malu firmu u BiH?', 'Za većinu lokalnih i B2B usluga s manjim budžetom Search kampanja je sigurniji početak jer svaki klik dolazi iz aktivne pretrage. Performance Max je korisniji za web shopove ili kao dopuna nakon stabilnih konverzija.'],
      ['Zašto Performance Max ponekad donosi nekvalitetne upite?', 'Zato što dio budžeta ide na Display i partnerske mreže. Ako je konverzija postavljena na običan klik ili nezaštićenu formu, algoritam uči da dovodi jeftine, ali nekvalitetne kontakte.'],
      ['Koliko košta vođenje Google Ads kampanja kod Digital X?', 'Vođenje kampanja (Kampanje za rast) kreće od 249 KM mjesečno, dok se medijski budžet za Google plaća odvojeno.'],
    ],
    related: [['/usluge/google-ads/', 'Google Ads usluga'], ['/shop/product/growth-campaigns/', 'Kampanje za rast — od 249 KM/mj'], ['/znanje/google-oglasi-cijena/', 'Google oglasi: cijena i budžet']],
  },
  {
    slug: 'meta-oglasi-kreativa-i-testiranje', cluster: 'oglasi', stage: 'privuci', minutes: 7, published: '2026-11-23',
    title: 'Meta Ads kreative i testiranje u 2026: kako smanjiti cijenu upita',
    h1: 'Meta Ads kreative i struktura testiranja: kako smanjiti cijenu upita na Instagramu i Facebooku',
    desc: 'Zašto je kreativa glavno ciljanje na Meti u 2026, kako testirati 3–5 uglova bez resetovanja faze učenja i kako spojiti Meta CAPI s landing stranicom.',
    keywords: ['meta ads kreative', 'testiranje facebook oglasa', 'instagram oglasi cijena upita', 'meta ads strategija 2026', 'optimizacija meta oglasa'],
    cover: {
      alt: 'Meta Ads kreative i testiranje u 2026: prve tri sekunde videa, 3–5 uglova poruke, Meta CAPI i landing stranica',
      caption: 'Na Meti kreativa bira publiku: jasna poruka u prve tri sekunde i čisti CAPI signali spuštaju cijenu upita.',
    },
    diagram: '/media/znanje/cluster4-creative-testing-diagram.webp',
    answer: 'U 2026. godini na Instagramu i Facebooku kreativa radi veći dio ciljanja nego sitna podešavanja interesa. Najnižu cijenu upita donosi testiranje tri do pet različitih uglova poruke (problem, demonstracija, dokaz, ponuda) unutar stabilne strukture kampanje, povezano s Meta Conversions API mjerenjem i fokusiranom landing stranicom.',
    sections: [
      ['Zašto je kreativa važnija od mikrociljanja publike', `<p>Savremeni Meta algoritam analizira ko zastaje na videu, čita tekst i šalje upit, pa sama kreativa filtrira kupce mnogo preciznije od uskih lista interesa. Kada oglas u prve tri sekunde jasno pokaže kome je namijenjen i koji problem rješava, Meta pronalazi slične ljude po nižoj cijeni prikaza.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster4-creative-testing-diagram.webp" srcset="/media/znanje/cluster4-creative-testing-diagram-768.webp 768w, /media/znanje/cluster4-creative-testing-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četverokoračni ciklus testiranja Meta Ads kreativa: hook i ugao, stabilna faza učenja, Pixel plus CAPI i landing stranica"><figcaption>Četiri koraka Meta optimizacije: od različitih uglova kreative do dedupliciranog CAPI signala i brze landing stranice.</figcaption></figure>
<div class="table-wrap"><table><thead><tr><th scope="col">Ugao kreative</th><th scope="col">Šta prikazuje u prve 3 sekunde</th><th scope="col">Kada najbolje radi</th></tr></thead><tbody>
<tr><th scope="row">Problem → Rješenje</th><td>Konkretna prepreka kupca i jasan ishod</td><td>Usluge, klinike, B2B i edukacije</td></tr>
<tr><th scope="row">Demonstracija proizvoda</th><td>Proizvod u ruci, tekstura, upotreba i mjerilo</td><td>Web shopovi, moda, kozmetika, oprema</td></tr>
<tr><th scope="row">Dokaz i proces</th><td>Stvarni rad, recenzija ili prije/poslije prikaz</td><td>Stomatologija, saloni, renovacije, agencije</td></tr>
<tr><th scope="row">Direktna ponuda</th><td>Jasna cijena ili paket + šta je uključeno</td><td>Remarketing i topla publika</td></tr></tbody></table></div>`],
      ['Pravila testiranja bez resetovanja faze učenja', `<p>Najčešća greška na manjim budžetima u BiH jeste dijeljenje kampanje na deset malih setova oglasa ili svakodnevno mijenjanje budžeta i tekstova. Prema zvaničnoj dokumentaciji <a href="https://www.facebook.com/business/help/2041148702652965" target="_blank" rel="noopener">Meta Business Help: Conversions API</a>, algoritmu trebaju stabilni, deduplicirani signali konverzije kako bi izašao iz faze učenja.</p>
<ol><li><strong>Testirajte 3–5 različitih uglova, ne sitne varijacije boje.</strong> Različit uvodni kadar i naslov daju jasniji signal od promjene jedne riječi.</li>
<li><strong>Ne dirajte kampanju prvih 5–7 dana.</strong> Svaka veća izmjena vraća algoritam na početak prikupljanja podataka.</li>
<li><strong>Spojite Pixel i Meta CAPI.</strong> Detalje deduplikacije i GDPR pristanka pogledajte u vodiču ${a('/znanje/meta-capi-server-side-tracking/', 'Meta Conversions API (CAPI)')}.</li>
<li><strong>Uskladite oglas i stranicu nakon klika.</strong> Ako oglas obećava paket od 499 KM, ${a('/shop/product/landing-starter/', 'landing stranica')} mora odmah potvrditi istu ponudu.</li></ol>`],
      ['Kada uključiti optimizaciju Meta oglasa i produkciju', `<p>Ako kampanje već troše budžet, ali cijena poruke ili narudžbe raste, problem je najčešće u zamoru kreativa, pogrešnom cilju kampanje ili sporoj stranici nakon klika. Pogledajte našu uslugu ${a('/usluge/optimizacija-meta-oglasa/', 'optimizacija Meta oglasa')}, vodič ${a('/znanje/kako-smanjiti-cijenu-facebook-oglasa/', 'kako smanjiti cijenu Facebook oglasa')} i ${a('/usluge/meta-ads/', 'Meta Ads vođenje (od 249 KM mjesečno)')}.</p>`],
    ],
    faq: [
      ['Koliko različitih kreativa treba imati aktivna Meta kampanja?', 'Za većinu malih i srednjih firmi dovoljno je tri do pet jasno različitih kreativa (kombinacija kratkog videa i statičnih kartica) po kampanji, uz osvježavanje kada učestalost prikaza poraste.'],
      ['Da li je bolje voditi ljude na WhatsApp/DM ili na web stranicu?', 'Poruke su brze za jednostavne usluge, dok web stranica s jasnom ponudom i CAPI mjerenjem bolje filtrira ozbiljne kupce i gradi dugoročni SEO i remarketing publiku.'],
      ['Koliko košta profesionalno vođenje Meta oglasa?', 'Kod Digital X Kampanje za rast kreću od 249 KM mjesečno plus budžet za oglase koji plaćate direktno Meti.'],
    ],
    related: [['/usluge/meta-ads/', 'Meta Ads usluga'], ['/usluge/optimizacija-meta-oglasa/', 'Optimizacija Meta oglasa'], ['/znanje/meta-capi-server-side-tracking/', 'Meta CAPI server-side mjerenje']],
  },
  {
    slug: 'kratki-video-reels-tiktok-produkcija', cluster: 'sadrzaj', stage: 'privuci', minutes: 6, published: '2026-11-23',
    title: 'Kratki video (Reels, TikTok, Shorts) za firme u BiH: produkcija u jednom danu',
    h1: 'Kratki video za firme u BiH: kako snimiti mjesec dana Reels i TikTok sadržaja u jednom danu',
    desc: 'Kako organizovati Content Day za snimanje Reels, TikTok i YouTube Shorts videa u jednom danu: hook u 3 sekunde, titlovi bez zvuka i upotreba u Meta oglasima.',
    keywords: ['kratki video produkcija', 'reels za firme bih', 'tiktok marketing bih', 'content day sarajevo', 'video proizvoda'],
    cover: {
      alt: 'Kratki video za firme u BiH: Content Day snimanje Reels, TikTok i Shorts formata u jednom danu',
      caption: 'Jedan dobro pripremljen Content Day daje materijal za cijeli mjesec objava i testiranje Meta oglasa.',
    },
    diagram: '/media/znanje/cluster4-content-day-diagram.webp',
    answer: 'Najefikasniji način da mala ili srednja firma u BiH održava Instagram Reels, TikTok i YouTube Shorts jeste jedan mjesečni Content Day umjesto svakodnevnog snimanja u žurbi. Uz pripremljenu listu od 8–12 kratkih tema, jasan vizuelni hook u prve tri sekunde i tačne titlove za gledanje bez zvuka, isti materijal pokriva i organske objave i plaćene oglase.',
    sections: [
      ['Četiri faze Content Day produkcije u jednom danu', `<p>Većina firmi odustane od videa nakon dvije sedmice jer pokušava snimati usput između sastanaka. Kada snimanje odvojite u jedan planirani blok mjesečno, dobijate dosljedan kvalitet slike, zvuka i poruke za sve kanale odjednom.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster4-content-day-diagram.webp" srcset="/media/znanje/cluster4-content-day-diagram-768.webp 768w, /media/znanje/cluster4-content-day-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četiri faze Content Day produkcije: brief i hookovi, poludnevno snimanje, montaža s titlovima i organska plus plaćena distribucija"><figcaption>Od jednog dana snimanja do mjesec dana kratkih videa za društvene mreže i Meta oglase.</figcaption></figure>
<ol><li><strong>Brief i lista kadrova.</strong> Pripremite 8–12 pitanja koja kupci stalno postavljaju i podijelite ih u četiri stuba: stručnost, dokaz, proces i ponuda.</li>
<li><strong>Poludnevno snimanje u seriji.</strong> Snimite prvo sve govorne dijelove (A-roll), a zatim detalje proizvoda, prostora i rada tima (B-roll).</li>
<li><strong>Montaža za gledanje bez zvuka.</strong> Prema smjernicama <a href="https://www.w3.org/WAI/media/av/captions/" target="_blank" rel="noopener">W3C WAI: Captions/Subtitles</a>, automatske titlove uvijek ručno ispravite kako bi poruka bila tačna i čitljiva i bez tona.</li>
<li><strong>Organska objava i oglasni test.</strong> Najbolje organske klipove pretvorite u kreative za ${a('/usluge/meta-ads/', 'Meta Ads kampanje')}.</li></ol>`],
      ['Šta čini kratki video korisnim za prodaju, a ne samo za preglede', `<p>Pregledi bez konteksta ne donose upite. Svaki poslovni video treba u prve tri sekunde pokazati kome je namijenjen, u sredini dati konkretan dokaz ili demonstraciju, a na kraju uputiti na jasan sljedeći korak — poruku, poziv ili stranicu ponude.</p>`],
      ['Koliko košta produkcija sadržaja i vođenje sistema', `<p>Kod Digital X ${a('/shop/product/content-system/', 'Sistem sadržaja')} kreće od 249 KM mjesečno i spaja plan, copy, vizuale i kratki video format. Detalje snimanja i montaže pogledajte na ${a('/usluge/video-proizvoda/', 'Video proizvoda')}, ${a('/usluge/produkcija-sadrzaja/', 'Produkcija sadržaja')} i u vodiču ${a('/znanje/plan-sadrzaja-drustvene-mreze/', 'plan sadržaja za društvene mreže')}.</p>`],
    ],
    faq: [
      ['Koliko videa mjesečno je dovoljno za malu firmu?', 'Dvije do tri kvalitetne objave sedmično (uključujući 4–8 kratkih videa mjesečno) dovoljne su za većinu firmi ako su teme vezane za stvarna pitanja kupaca.'],
      ['Da li svaki video mora imati govor pred kamerom?', 'Ne. Demonstracija proizvoda, proces rada, prije/poslije kadrovi i kratki tekstualni titlovi često rade jednako dobro bez dugog govora u kameru.'],
      ['Koliko košta Sistem sadržaja kod Digital X?', 'Sistem sadržaja kreće od 249 KM mjesečno, dok se fizičko snimanje na lokaciji (Content Day) i putni troškovi potvrđuju pisano prema obimu i lokaciji.'],
    ],
    related: [['/usluge/video-proizvoda/', 'Video proizvoda'], ['/usluge/produkcija-sadrzaja/', 'Produkcija sadržaja'], ['/shop/product/content-system/', 'Sistem sadržaja — od 249 KM/mj']],
  },
  {
    slug: 'fotografija-proizvoda-i-katalog-prodaja', cluster: 'sadrzaj', stage: 'izgraditi', minutes: 6, published: '2026-11-23',
    title: 'Fotografija proizvoda i digitalni katalog: kako vizuali dižu prodaju',
    h1: 'Fotografija proizvoda i digitalni katalog: standardi za web shop, oglase i B2B prodaju',
    desc: 'Kako fotografija proizvoda, WebP kompresija, fiksne dimenzije (CLS < 0,1), alt opisi i digitalni PDF/web katalozi povećavaju povjerenje i prodaju u BiH.',
    keywords: ['fotografija proizvoda', 'dizajn kataloga', 'slike za web shop', 'image seo webp', 'kataloska fotografija sarajevo'],
    cover: {
      alt: 'Fotografija proizvoda i digitalni katalog: dosljedno kadriranje, WebP brzina, alt opisi i B2B prodaja',
      caption: 'Jedan dosljedan set fotografija proizvoda pokriva web shop, Meta oglase i digitalni B2B katalog bez usporavanja sajta.',
    },
    diagram: '/media/znanje/cluster4-visual-standards-diagram.webp',
    answer: 'Kupac na internetu ne može uzeti proizvod u ruku, pa fotografija i struktura kataloga direktno odlučuju o povjerenju i narudžbi. Kvalitetan vizuelni sistem spaja dosljedno kadriranje (glavni ugao, detalj materijala i mjerilo), WebP kompresiju s fiksnim dimenzijama za Core Web Vitals i opisne alt tekstove za Google Images i AI pretragu.',
    sections: [
      ['Standardi fotografije proizvoda za web shop, oglase i katalog', `<p>Prema zvaničnim smjernicama <a href="https://developers.google.com/search/docs/appearance/google-images" target="_blank" rel="noopener">Google Search Central: Image SEO Best Practices</a>, slike trebaju biti u standardnim HTML <code>&lt;img&gt;</code> elementima, u modernim formatima poput WebP-a, s opisnim nazivima fajlova i jasnim <code>alt</code> tekstom. Istovremeno, fiksni <code>width</code> i <code>height</code> atributi sprječavaju pomjeranje stranice tokom učitavanja (CLS &lt; 0,1).</p>
<figure class="guide-figure"><img src="/media/znanje/cluster4-visual-standards-diagram.webp" srcset="/media/znanje/cluster4-visual-standards-diagram-768.webp 768w, /media/znanje/cluster4-visual-standards-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Poređenje konverzijski spremnog vizuelnog sistema proizvoda i najčešćih grešaka sa slikama na web shopovima"><figcaption>Jedan standardizovan set fotografija ubrzava web shop, jača Image SEO i hrani digitalne kataloge i oglase.</figcaption></figure>
<ul><li><strong>Tri obavezna kadra po proizvodu:</strong> čisti glavni kadar, krupni plan teksture/materijala i prikaz u stvarnoj upotrebi ili mjerilu.</li>
<li><strong>WebP i responzivni <code>srcset</code>:</strong> izbjegavajte sirove fajlove od 4 MB s fotoaparata koji ruše mobilni LCP (${a('/znanje/core-web-vitals-optimizacija-brzine/', 'Core Web Vitals vodič')}).</li>
<li><strong>Jedan izvor za više kanala:</strong> iste fotografije koriste se za ${a('/znanje/web-shop-placanje-dostava-bih/', 'web shop')}, Meta kataloge i B2B PDF ponude.</li></ul>`],
      ['Kada vam treba digitalni katalog uz web shop ili B2B ponudu', `<p>Za veleprodaju, građevinu, namještaj, opremu i brendove s više varijanti, strukturirani digitalni PDF i web katalog olakšavaju kupcu poređenje šifri, dimenzija i cijena prije upita. Prije dizajna kataloga usklađujemo nazive, varijante i cijene kako se podaci ne bi razlikovali od web shopa.</p>`],
      ['Usluge fotografisanja, dizajna kataloga i produkcije', `<p>Pogledajte naše usluge ${a('/usluge/fotografija-proizvoda/', 'Fotografija proizvoda')}, ${a('/usluge/dizajn-kataloga/', 'Dizajn kataloga')} i ${a('/usluge/produkcija-sadrzaja/', 'Produkcija sadržaja')}, gdje obim, broj proizvoda i lokaciju snimanja potvrđujemo pisano prije početka rada.</p>`],
    ],
    faq: [
      ['Koliko fotografija treba imati jedan proizvod u web shopu?', 'Najmanje tri do pet: glavni kadar na čistoj podlozi, bočni ili zadnji ugao, detalj materijala i fotografija u upotrebi koja pokazuje stvarnu veličinu.'],
      ['Da li je štampa kataloga uključena u cijenu dizajna kataloga?', 'Ne. Dizajn i tehnička priprema za web ili štampu ugovaraju se odvojeno od fizičke štampe, tiraža i dobavljača štampe.'],
      ['Možete li optimizovati postojeće fotografije proizvoda za brži sajt?', 'Da, nakon pregleda kvaliteta i prava korištenja možemo pripremiti WebP formate, dimenzije i alt opise za web shop ili katalog.'],
    ],
    related: [['/usluge/fotografija-proizvoda/', 'Fotografija proizvoda'], ['/usluge/dizajn-kataloga/', 'Dizajn kataloga'], ['/znanje/web-shop-placanje-dostava-bih/', 'Web shop plaćanje i dostava u BiH']],
  },
];
