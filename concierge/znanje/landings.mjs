// Search-aligned commercial landing pages: plain Bosnian URLs and headings for what buyers type
// ("izrada web shopa", "lokalni seo sarajevo", "web stranica za stomatologe").
// Same rules as cities.mjs: no invented clients, statistics, reviews or competitor prices.
// Digital X prices come from the shop catalogue (public/llms.txt); demos are labelled as concepts.
const a = (href, text) => `<a href="${href}">${text}</a>`;
const demo = (href, name) => `<p class="demo-note">Interaktivni koncept: ${a(href, name)}. Koncept je napravljen kao demonstracija mogućnosti, nije stranica stvarnog klijenta.</p>`;

export const landings = [
  {
    path: '/usluge/izrada-web-shopa/',
    crumbs: [['Usluge', '/usluge/'], ['Izrada web shopa', '/usluge/izrada-web-shopa/']],
    eyebrow: 'WEB SHOP · BOSNA I HERCEGOVINA',
    title: 'Izrada web shopa u BiH: cijena i šta dobijate | Digital X',
    h1: 'Izrada web shopa u BiH: trgovina spremna za prvu narudžbu',
    desc: 'Izrada web shopa za firme u BiH: kategorije, proizvodi, plaćanje, dostava i obuka. E-commerce Launch od 2.490 KM. Shopify, WooCommerce ili rješenje po mjeri.',
    keywords: ['izrada web shopa', 'izrada web shopa bih', 'izrada online prodavnice', 'izrada web shopa sarajevo', 'web shop cijena'],
    service: { name: 'Izrada web shopa', serviceType: 'E-commerce website development', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['E-commerce Launch', 2490]] },
    answer: 'Digital X izrađuje web shopove za firme u Bosni i Hercegovini: kategorije i proizvode, plaćanje, dostavu, pravne stranice i obuku tima. Paket E-commerce Launch kreće od 2.490 KM. Platformu biramo prema vašem asortimanu i načinu prodaje, a obim i rok potvrđujemo pisano prije početka.',
    sections: [
      ['Šta dobijate u paketu E-commerce Launch', `<ul>
<li><strong>Trgovina na mobitelu i računaru.</strong> Kategorije, stranice proizvoda, pretraga, korpa i naplata.</li>
<li><strong>Plaćanje i dostava.</strong> Načine plaćanja i dostave koje vaša firma može ponuditi podešavamo zajedno s vama.</li>
<li><strong>Pravne i informativne stranice.</strong> Uslovi kupovine, dostava, povrat i privatnost.</li>
<li><strong>Osnovni SEO.</strong> Naslovi, opisi, strukturirani podaci o proizvodima i mapa sajta za Google.</li>
<li><strong>Obuka.</strong> Kako dodati proizvod, promijeniti cijenu i obraditi narudžbu.</li></ul>
<p>Detalji paketa su na stranici ${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')}.</p>`],
      ['Shopify, WooCommerce ili po mjeri', `<p>Nema jedne platforme koja je najbolja za sve. Razlike, troškove i ograničenja objašnjavamo u vodiču ${a('/znanje/wordpress-shopify-ili-custom/', 'WordPress, Shopify ili custom')}.</p>
<div class="table-wrap"><table><thead><tr><th scope="col">Platforma</th><th scope="col">Najbolje za</th><th scope="col">Prednost u BiH</th></tr></thead><tbody>
<tr><th scope="row">WooCommerce (WordPress)</th><td>Većinu trgovina u BiH s lokalnim dostavama i karticama</td><td>Fleksibilnost, lokalni platni procesori (Monri/PikPay/banke), bez mjesečne provizije platforme</td></tr>
<tr><th scope="row">Shopify</th><td>Brendove koji prodaju i u EU/dijaspori i žele minimalno održavanje</td><td>Stabilan hosting, brz checkout, jednostavno upravljanje zalihama</td></tr>
<tr><th scope="row">Custom / Next.js</th><td>Specifične B2B kataloge, konfiguratore i ERP integracije</td><td>Maksimalna brzina, prilagođen tok narudžbe i potpuna kontrola</td></tr></tbody></table></div>`],
      ['Prije prve narudžbe', `<ol><li><strong>Asortiman.</strong> Popis proizvoda, varijanti i cijena u tabeli.</li>
<li><strong>Fotografije.</strong> Dobre fotografije prodaju više od opisa. Po potrebi radimo ${a('/usluge/fotografija-proizvoda/', 'fotografisanje proizvoda')}.</li>
<li><strong>Plaćanje i dostava.</strong> Ugovor s bankom ili procesorom plaćanja i dogovor s dostavnom službom.</li>
<li><strong>Pravni dio.</strong> Uslovi kupovine i povrata u skladu s propisima o zaštiti potrošača.</li></ol>
<p>Cijeli put od ideje do prve prodaje opisan je u vodiču ${a('/znanje/kako-otvoriti-web-shop-bih/', 'kako otvoriti web shop u BiH')}.</p>`],
      ['Kad vam treba više od trgovine', `<p>${a('/usluge/smart-storefront/', 'Smart Storefront')} dodaje AI asistenta koji kupcu pomaže izabrati proizvod i prikuplja upite. Za prvu prodaju nakon objave tu su ${a('/usluge/digitalne-kampanje/', 'Google i Meta kampanje')}.</p>`],
    ],
    faq: [
      ['Koliko košta izrada web shopa?', 'Kod Digital X paket E-commerce Launch kreće od 2.490 KM. Cijena zavisi od broja proizvoda, načina plaćanja, integracija i dizajna, a potvrđujemo je pisano prije početka.'],
      ['Koliko traje izrada web shopa?', 'Zavisi od asortimana i od toga koliko su spremni proizvodi, fotografije i ugovori za plaćanje i dostavu. Rok potvrđujemo u ponudi i dijelimo posao u faze.'],
      ['Možete li prebaciti postojeću trgovinu?', 'Da. Prenosimo proizvode i za stare adrese postavljamo preusmjerenja kako ne biste izgubili pozicije na Googleu.'],
      ['Ko je vlasnik trgovine?', 'Vi. Domena, nalozi i podaci ostaju na vašoj firmi.'],
    ],
    related: [['/shop/product/ecommerce-launch/', 'E-commerce Launch — od 2.490 KM'], ['/usluge/web-dizajn/', 'Web dizajn: paketi i cijene'], ['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/kontakt.html', 'Kontakt i besplatne konzultacije']],
  },
  {
    path: '/usluge/web-dizajn/',
    crumbs: [['Usluge', '/usluge/'], ['Web dizajn', '/usluge/web-dizajn/']],
    eyebrow: 'WEB DIZAJN · SARAJEVO I BIH',
    title: 'Web dizajn Sarajevo i BiH: cijene od 199 KM | Digital X',
    h1: 'Web dizajn u Sarajevu i BiH: moderne stranice s jasnim cijenama',
    desc: 'Web dizajn za firme u Sarajevu i BiH: landing stranica od 199 KM, web prezentacija od 449 KM, cinematic web s AI asistentom 499 KM, web shop od 2.490 KM.',
    keywords: ['web dizajn', 'web dizajn sarajevo', 'web dizajn bih', 'web dizajner sarajevo', 'dizajn web stranice cijena', 'moderna web stranica'],
    service: { name: 'Web dizajn', serviceType: 'Web design', areaServed: [{ '@type': 'City', name: 'Sarajevo' }, { '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Landing stranica', 199], ['Premium web prisustvo', 449], ['Smart Website Launch', 499], ['E-commerce Launch', 2490]] },
    answer: 'Digital X je agencija za web dizajn iz Sarajeva. Dizajniramo i izrađujemo stranice za firme u cijeloj BiH: landing stranicu od 199 KM, web prezentaciju od 449 KM, cinematic web s AI asistentom za 499 KM i web shop od 2.490 KM. Svaka stranica radi na mobitelu, ima osnovni SEO i pripada vašoj firmi.',
    sections: [
      ['Cijene web dizajna', `<div class="table-wrap"><table><thead><tr><th scope="col">Paket</th><th scope="col">Za koga</th><th scope="col">Cijena</th></tr></thead><tbody>
<tr><th scope="row">${a('/shop/product/landing-starter/', 'Landing stranica')}</th><td>Jedna ponuda, kampanja ili događaj</td><td>od 199 KM</td></tr>
<tr><th scope="row">${a('/shop/product/web-presence/', 'Premium web prisustvo')}</th><td>Firma kojoj treba ozbiljna web prezentacija</td><td>od 449 KM</td></tr>
<tr><th scope="row">${a('/shop/product/smart-website-launch/', 'Smart Website Launch')}</th><td>Cinematic web do pet stranica s AI asistentom prva tri mjeseca</td><td>499 KM</td></tr>
<tr><th scope="row">${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')}</th><td>Online prodaja s plaćanjem i dostavom</td><td>od 2.490 KM</td></tr></tbody></table></div>
<p>Konačan obim i rok potvrđujemo pisano prije početka. Detaljan pregled troškova je u članku ${a('/blog/koliko-kosta-web-stranica-bih.html', 'koliko košta web stranica u BiH')}.</p>`],
      ['Šta dobijate uz svaki dizajn', `<ul><li><strong>Dizajn za mobitel.</strong> Većina posjeta dolazi s telefona, pa dizajn krećemo od malog ekrana.</li>
<li><strong>Brzina.</strong> Optimizovane slike i čist kod, jer spora stranica gubi posjetioce prije nego što se učita.</li>
<li><strong>Osnovni SEO.</strong> Naslovi, opisi, strukturirani podaci i mapa sajta, da vas Google i AI pretraga mogu razumjeti.</li>
<li><strong>Jasan put do upita.</strong> Poziv, WhatsApp ili obrazac uvijek su na dohvat ruke.</li>
<li><strong>Vlasništvo.</strong> Domena, sadržaj i pristupi ostaju na vašoj firmi.</li></ul>`],
      ['Primjeri i koncepti', `<p>Pogledajte ${a('/primjeri-web-stranica/', 'primjere web stranica')} i ${a('/projekti/', 'naše radove')}. Za hotele, nekretnine i luksuzne brendove radimo i ${a('/usluge/cinematic-web-stranice/', 'cinematic web stranice')} koje se pokreću dok posjetilac skrola.</p>
${demo('/cinematic-hotel/', 'cinematic hotel')}`],
      ['Web dizajn za vašu industriju', `<p>Stranica ordinacije, advokatske kancelarije ili hotela odgovara na različita pitanja. Pogledajte šta preporučujemo za ${a('/industrije/stomatologija/', 'stomatologe')}, ${a('/industrije/advokati/', 'advokate')}, ${a('/industrije/hoteli-i-turizam/', 'hotele i turizam')} i ${a('/industrije/nekretnine/', 'nekretnine')}.</p>`],
      ['Već imate stranicu?', `<p>Ako stranica postoji, ali ne donosi upite, često je dovoljan ${a('/usluge/redizajn-web-stranice/', 'redizajn web stranice')}, a ne izrada od nule. ${a('/usluge/x-signal/', 'Besplatna analiza sajta')} pokazuje šta prvo popraviti.</p>`],
    ],
    faq: [
      ['Koliko košta web dizajn u Sarajevu?', 'Kod Digital X landing stranica kreće od 199 KM, web prezentacija od 449 KM, cinematic web s AI asistentom košta 499 KM, a web shop kreće od 2.490 KM. Cijenu potvrđujemo pisano prije početka.'],
      ['Koja je razlika između web dizajna i izrade web stranice?', 'Web dizajn je izgled i raspored stranice, a izrada uključuje i programiranje, sadržaj, SEO i objavu. Digital X radi oboje u jednom paketu.'],
      ['Radite li za firme izvan Sarajeva?', 'Da. Radimo za firme iz cijele Bosne i Hercegovine i regije. Sastanci se mogu održati online.'],
      ['Ko je vlasnik stranice nakon izrade?', 'Vi. Domena, sadržaj i pristupi ostaju na vašoj firmi.'],
    ],
    related: [['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/usluge/izrada-web-stranica/sarajevo/', 'Izrada web stranica Sarajevo'], ['/usluge/redizajn-web-stranice/', 'Redizajn web stranice'], ['/znanje/gdpr-pristupacnost-web-stranice/', 'GDPR, kolačići i pristupačnost'], ['/kontakt.html', 'Kontakt i besplatne konzultacije']],
  },
  {
    path: '/usluge/redizajn-web-stranice/',
    crumbs: [['Usluge', '/usluge/'], ['Web dizajn', '/usluge/web-dizajn/'], ['Redizajn web stranice', '/usluge/redizajn-web-stranice/']],
    eyebrow: 'REDIZAJN · X CONVERT',
    title: 'Redizajn web stranice: kad ima smisla i šta košta | Digital X',
    h1: 'Redizajn web stranice: od stare stranice do stranice koja donosi upite',
    desc: 'Redizajn web stranice za firme u BiH metodom X Convert: analiza, nova struktura, brža stranica i jasniji put do upita. Bez gubitka pozicija na Googleu.',
    keywords: ['redizajn web stranice', 'redizajn sajta', 'novi dizajn web stranice', 'osvježavanje web stranice', 'redizajn web stranice cijena'],
    service: { name: 'Redizajn web stranice (X Convert)', serviceType: 'Website redesign and conversion optimization', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Premium web prisustvo', 449], ['Smart Website Launch', 499]] },
    answer: 'Redizajn ima smisla kad stranica izgleda zastarjelo, sporo se učitava, loše radi na mobitelu ili ne donosi upite. Digital X redizajn radi metodom X Convert: prvo besplatna analiza, zatim nova struktura, dizajn i brža stranica, uz preusmjerenja da ne izgubite pozicije na Googleu. Nova stranica kreće od 449 KM.',
    sections: [
      ['Znakovi da vam treba redizajn', `<ul><li>Stranica je spora ili se raspada na mobitelu.</li><li>Posjetioci ne nalaze cijene, kontakt ili ponudu.</li><li>Stranica ne donosi upite iako ima posjeta.</li><li>Dizajn više ne odgovara kvalitetu vaše usluge.</li></ul>
<p>Ponekad redizajn nije potreban. Bolja ponuda, jasniji obrazac ili nova ${a('/shop/product/landing-starter/', 'landing stranica')} mogu biti dovoljni.</p>`],
      ['Kako radi X Convert', `<ol><li><strong>Analiza.</strong> ${a('/usluge/x-signal/', 'Besplatna analiza sajta')} provjerava brzinu, SEO i put do upita.</li>
<li><strong>Struktura.</strong> Planiramo stranice prema pitanjima koja kupci stvarno postavljaju.</li>
<li><strong>Dizajn i razvoj.</strong> Nova stranica, brža i prilagođena mobitelu.</li>
<li><strong>Prelazak bez gubitka.</strong> Za stare adrese postavljamo preusmjerenja kako Google ne bi izgubio vaše stranice.</li></ol>
<p>Više o metodi na stranici ${a('/usluge/x-convert/', 'X Convert')}.</p>`],
      ['Šta košta redizajn', `<p>Nova web prezentacija kreće od 449 KM, a cinematic web s AI asistentom košta 499 KM. Ako redizajn uključuje web shop ili mnogo stranica, cijenu potvrđujemo nakon analize. Pregled svih paketa je na stranici ${a('/usluge/web-dizajn/', 'web dizajn')}.</p>`],
    ],
    faq: [
      ['Hoću li izgubiti pozicije na Googleu nakon redizajna?', 'Ne bi trebalo, ako se za svaku staru adresu postavi preusmjerenje na novu i sačuvaju važni sadržaji. To je dio svakog Digital X redizajna.'],
      ['Koliko košta redizajn web stranice?', 'Nova web prezentacija kreće od 449 KM, a cinematic web s AI asistentom košta 499 KM. Veći projekti dobijaju cijenu nakon besplatne analize.'],
      ['Može li se zadržati postojeći sadržaj?', 'Da. Dobar sadržaj prenosimo i uređujemo, a ono što ne pomaže kupcu skraćujemo ili uklanjamo.'],
    ],
    related: [['/usluge/web-dizajn/', 'Web dizajn: paketi i cijene'], ['/usluge/x-convert/', 'X Convert'], ['/usluge/optimizacija-brzine-sajta/', 'Optimizacija brzine sajta'], ['/usluge/x-signal/', 'Besplatna analiza sajta']],
  },
  {
    path: '/usluge/lokalni-seo-sarajevo/',
    crumbs: [['Usluge', '/usluge/'], ['SEO · AEO · GEO', '/usluge/seo-aeo-geo/'], ['Lokalni SEO Sarajevo', '/usluge/lokalni-seo-sarajevo/']],
    eyebrow: 'LOKALNI SEO · SARAJEVO',
    title: 'Lokalni SEO Sarajevo: Google mapa i pretraga | Digital X',
    h1: 'Lokalni SEO u Sarajevu: budite na Google mapi kad vas traže u blizini',
    desc: 'Lokalni SEO za firme u Sarajevu: Google Business profil, dosljedni podaci o firmi, recenzije i lokalne stranice usluga. SEO · GEO · AEO od 249 KM mjesečno.',
    keywords: ['lokalni seo sarajevo', 'seo optimizacija sarajevo', 'google mapa optimizacija', 'google business profil sarajevo', 'seo agencija sarajevo'],
    service: { name: 'Lokalni SEO Sarajevo', serviceType: 'Local search engine optimization', areaServed: [{ '@type': 'City', name: 'Sarajevo' }], offers: [['SEO · GEO · AEO', 249, 'mjesečno'], ['Sistem recenzija', 199]] },
    answer: 'Lokalni SEO je rad na tome da vas Google prikaže ljudima koji traže vašu uslugu u Sarajevu, u pretrazi i na Google mapi. Sastoji se od uređenog Google Business profila, istih podataka o firmi svuda na internetu, redovnih recenzija i posebne stranice za svaku uslugu. Kod Digital X paket SEO · GEO · AEO kreće od 249 KM mjesečno.',
    sections: [
      ['Šta Google gleda kod lokalne pretrage', `<p>Google objašnjava da lokalne rezultate određuju relevantnost, udaljenost i istaknutost. Relevantnost gradite tačnom kategorijom i jasnim opisom usluga. Udaljenost ne možete mijenjati. Istaknutost raste s recenzijama, spominjanjima firme i kvalitetom web stranice.</p>`],
      ['Šta radimo', `<ol><li><strong>Google Business profil.</strong> Kategorije, usluge, radno vrijeme, fotografije i redovne objave. Više na stranici ${a('/usluge/google-business-profile/', 'Google Business Profile optimizacija')}.</li>
<li><strong>Isti podaci svuda.</strong> Ime, adresa i telefon jednako napisani na stranici, profilu, mrežama i direktorijima.</li>
<li><strong>Stranice usluga.</strong> Posebna stranica za svaku uslugu i dio grada koji pokrivate, s pitanjima koja kupci stvarno postavljaju.</li>
<li><strong>Strukturirani podaci.</strong> LocalBusiness, Service i FAQPage schema, kako bi Google i AI asistenti sigurno pročitali ko ste i gdje radite.</li>
<li><strong>Recenzije.</strong> Zahtjev za recenziju nakon završene usluge. ${a('/shop/product/review-engine/', 'Sistem recenzija')} to radi automatski, od 199 KM.</li>
<li><strong>Mjerenje.</strong> Pozivi, upiti i klikovi na rutu iz profila i Search Consolea.</li></ol>`],
      ['Za koga je lokalni SEO najvažniji', `<p>Za firme koje kupci posjećuju ili zovu iz blizine: ordinacije, salone, servise, restorane, apartmane, advokate i majstore. Ako radite za ${a('/industrije/stomatologija/', 'stomatološke ordinacije')} ili ${a('/industrije/hoteli-i-turizam/', 'hotele i apartmane')}, pogledajte i stranice za te djelatnosti.</p>`],
      ['Šta se ne može obećati', `<p>Niko ne može garantovati prvo mjesto na mapi. Poredak zavisi i od toga gdje se korisnik nalazi i koliko je konkurenata u blizini. Garantujemo obim rada i transparentno mjerenje. Korake koje možete uraditi sami opisuje vodič ${a('/blog/lokalni-seo-google-mapa.html', 'kako biti prvi na Google mapi')}.</p>`],
    ],
    faq: [
      ['Koliko košta lokalni SEO u Sarajevu?', 'Kod Digital X paket SEO · GEO · AEO kreće od 249 KM mjesečno i uključuje lokalnu vidljivost. Obim zavisi od broja lokacija, usluga i konkurencije, a potvrđujemo ga prije početka.'],
      ['Koliko brzo se vide rezultati na Google mapi?', 'Ispravke profila Google obično primijeti za nekoliko dana do sedmica. Stabilniji rast za konkurentne pojmove obično traje nekoliko mjeseci i zavisi od recenzija i konkurencije.'],
      ['Treba li mi web stranica za lokalni SEO?', 'Profil može raditi i bez nje, ali stranica s posebnom stranicom za svaku uslugu pomaže Googleu da vas poveže s više pretraga i daje kupcu više razloga da vas izabere.'],
      ['Da li radite i lokalni SEO izvan Sarajeva?', 'Da, za firme u cijeloj BiH. Princip je isti, a sadržaj i podaci prilagođavaju se gradu i području koje firma pokriva.'],
    ],
    related: [['/usluge/seo-aeo-geo/', 'SEO optimizacija Sarajevo, AEO i GEO'], ['/usluge/google-business-profile/', 'Google Business Profile optimizacija'], ['/znanje/sta-je-seo-optimizacija/', 'Šta je SEO optimizacija i koliko košta']],
  },
  {
    path: '/industrije/stomatologija/',
    crumbs: [['Industrije', '/industrije/'], ['Stomatologija', '/industrije/stomatologija/']],
    eyebrow: 'INDUSTRIJE · STOMATOLOGIJA',
    title: 'Web stranica za stomatološku ordinaciju | Digital X',
    h1: 'Web stranica za stomatološku ordinaciju: povjerenje prije prvog poziva',
    desc: 'Izrada web stranice i lokalni SEO za stomatološke ordinacije u BiH: usluge, tim, lokacija, recenzije i jednostavno zakazivanje. Cinematic web s AI asistentom 499 KM.',
    keywords: ['web stranica za stomatologe', 'izrada web stranice za stomatološku ordinaciju', 'marketing za stomatologe', 'stomatolog sarajevo web'],
    service: { name: 'Web stranice i marketing za stomatološke ordinacije', serviceType: 'Web design and local marketing for dental clinics', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Premium web prisustvo', 449], ['Smart Website Launch', 499], ['SEO · GEO · AEO', 249, 'mjesečno']] },
    answer: 'Pacijent prije poziva provjerava usluge, tim, lokaciju i iskustva drugih pacijenata. Digital X izrađuje stranice za ordinacije koje te odgovore daju odmah i vode do zakazivanja: prezentacijska stranica od 449 KM, cinematic web s AI asistentom 499 KM, a lokalni SEO od 249 KM mjesečno.',
    sections: [
      ['Šta pacijent traži na stranici ordinacije', `<ul><li><strong>Usluge.</strong> Posebna stranica za implante, ortodonciju, izbjeljivanje i ostale tretmane, jer ljudi traže konkretan tretman.</li>
<li><strong>Tim.</strong> Imena, stručnost i fotografije doktora.</li>
<li><strong>Lokacija i radno vrijeme.</strong> Adresa, parking, karta i način dolaska.</li>
<li><strong>Zakazivanje.</strong> Poziv, WhatsApp ili obrazac, vidljiv na svakom ekranu mobitela.</li>
<li><strong>Iskustva pacijenata.</strong> Google recenzije, uz poštovanje privatnosti pacijenata.</li></ul>`],
      ['Upiti i van radnog vremena', `<p>Mnogo pitanja stiže uveče i vikendom. ${a('/usluge/ai-receptionist/', 'AI recepcionar')} odgovara na česta pitanja o uslugama i radnom vremenu i prikuplja zahtjev za termin koji tim potvrđuje sutradan. Ne postavlja dijagnozu i ne zamjenjuje doktora.</p>`],
      ['Primjeri koje možete isprobati', `<p>Za dentalne ordinacije smo napravili interaktivni cinematic koncept i koncept redizajna stranice ordinacije.</p>
${demo('/cinematic-dentist/', 'cinematic web za dentalnu ordinaciju')}
<p>Prije i poslije redizajna možete uporediti na stranici ${a('/projekti/#transformations', 'Radovi')}.</p>`],
      ['Pronađeni u svom gradu', `<p>Većina pacijenata traži ordinaciju u blizini. Zato uz stranicu uređujemo Google Business profil, recenzije i lokalne stranice usluga. Više o tome na stranici ${a('/usluge/lokalni-seo-sarajevo/', 'lokalni SEO')}.</p>`],
    ],
    faq: [
      ['Koliko košta web stranica za stomatološku ordinaciju?', 'Prezentacijska stranica kreće od 449 KM, a cinematic web do pet stranica s AI asistentom prva tri mjeseca košta 499 KM. Veći broj usluga ili jezika povećava obim, a cijenu potvrđujemo prije početka.'],
      ['Možete li povezati online zakazivanje?', 'Možemo povezati obrazac, WhatsApp ili postojeći sistem za termine koji ordinacija koristi. Šta je moguće zavisi od tog sistema, pa to provjeravamo prije ponude.'],
      ['Smijemo li objaviti cijene tretmana?', 'To odlučuje ordinacija u skladu s pravilima komore i propisima. Stranica može navesti okvirne cijene ili poziv na konsultacije.'],
    ],
    related: [['/shop/product/smart-website-launch/', 'Smart Website Launch — 499 KM'], ['/usluge/ai-receptionist/', 'AI recepcionar'], ['/industrije/', 'Sve industrije']],
  },
  {
    path: '/industrije/advokati/',
    crumbs: [['Industrije', '/industrije/'], ['Advokati', '/industrije/advokati/']],
    eyebrow: 'INDUSTRIJE · ADVOKATI I KANCELARIJE',
    title: 'Web stranica za advokatsku kancelariju | Digital X',
    h1: 'Web stranica za advokatsku kancelariju: jasna područja rada i ozbiljan prvi utisak',
    desc: 'Izrada web stranice za advokate i advokatske kancelarije u BiH: područja rada, tim, stručni odgovori na pitanja klijenata i diskretan kontakt. Od 449 KM.',
    keywords: ['web stranica za advokate', 'izrada web stranice advokatska kancelarija', 'advokat sarajevo web stranica', 'marketing za advokate'],
    service: { name: 'Web stranice za advokatske kancelarije', serviceType: 'Web design for law firms', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Premium web prisustvo', 449], ['Smart Website Launch', 499]] },
    answer: 'Klijent koji traži advokata želi brzo saznati da li kancelarija radi njegovu vrstu predmeta, ko su advokati i kako ih diskretno kontaktirati. Digital X izrađuje stranice za kancelarije s jasnim područjima rada, timom i stručnim odgovorima na česta pitanja. Prezentacijska stranica kreće od 449 KM.',
    sections: [
      ['Šta stranica kancelarije treba', `<ul><li><strong>Područja rada.</strong> Posebna stranica za porodično, radno, privredno ili krivično pravo, napisana jezikom klijenta.</li>
<li><strong>Tim.</strong> Advokati, obrazovanje, jezici i oblasti rada.</li>
<li><strong>Stručni odgovori.</strong> Kratki tekstovi o pitanjima koja klijenti najčešće postavljaju. Takav sadržaj gradi povjerenje i pomaže Googleu i AI asistentima da prepoznaju vašu stručnost.</li>
<li><strong>Diskretan kontakt.</strong> Jasan obrazac i informacija kako postupate s podacima koje klijent pošalje.</li>
<li><strong>Više jezika.</strong> Za klijente iz dijaspore i strane firme, engleski ili njemački.</li></ul>`],
      ['Pravila struke', `<p>Oglašavanje advokata u BiH uređuju pravila advokatskih komora. Stranicu zato pišemo informativno: bez obećanja ishoda i bez poređenja s drugim kancelarijama. Konačan tekst odobrava kancelarija.</p>`],
      ['Koncept koji možete pogledati', `<p>Za advokatsku kancelariju smo napravili koncept redizajna. Prije i poslije možete uporediti na stranici ${a('/projekti/#transformations', 'Radovi')}. Koncept je demonstracija, nije stranica stvarnog klijenta.</p>`],
    ],
    faq: [
      ['Koliko košta web stranica za advokatsku kancelariju?', 'Prezentacijska stranica kreće od 449 KM. Broj područja rada, jezika i stručnih tekstova određuje obim, a cijenu potvrđujemo prije početka.'],
      ['Ko piše stručne tekstove?', 'Strukturu i nacrt pripremamo mi, a pravni sadržaj provjerava i odobrava kancelarija prije objave.'],
      ['Možete li stranicu napraviti na više jezika?', 'Da. Stranica može imati bosanski, engleski i njemački, s posebnim adresama za svaki jezik.'],
    ],
    related: [['/shop/product/web-presence/', 'Premium web prisustvo — od 449 KM'], ['/usluge/seo-aeo-geo/', 'SEO optimizacija Sarajevo, AEO i GEO'], ['/industrije/', 'Sve industrije']],
  },
  {
    path: '/industrije/hoteli-i-turizam/',
    crumbs: [['Industrije', '/industrije/'], ['Hoteli i turizam', '/industrije/hoteli-i-turizam/']],
    eyebrow: 'INDUSTRIJE · HOTELI, APARTMANI I TURIZAM',
    title: 'Web stranica za hotel i apartmane: direktne rezervacije | Digital X',
    h1: 'Web stranica za hotele i apartmane: više direktnih upita, manje provizija',
    desc: 'Web stranice za hotele, apartmane i turističke agencije u BiH: više jezika, fotografije koje prodaju prostor, direktan upit i lokalni SEO. Cinematic web 499 KM.',
    keywords: ['web stranica za hotel', 'web stranica za apartmane', 'marketing za hotele', 'direktne rezervacije web stranica', 'web stranica za turističku agenciju'],
    service: { name: 'Web stranice i marketing za hotele i turizam', serviceType: 'Web design and marketing for hospitality', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Smart Website Launch', 499], ['Kampanje za rast', 249, 'mjesečno']] },
    answer: 'Gosti otkrivaju smještaj na platformama, ali prije rezervacije često provjere i vlastitu stranicu objekta. Digital X izrađuje stranice za hotele i apartmane na više jezika, s prostorom prikazanim kroz fotografije ili cinematic iskustvo i direktnim upitom bez provizije. Cinematic web s AI asistentom košta 499 KM.',
    sections: [
      ['Šta gost traži prije rezervacije', `<ul><li><strong>Prostor.</strong> Sobe, pogled, okolina i stvarne fotografije.</li>
<li><strong>Jezik gosta.</strong> Engleski i njemački za većinu gostiju iz inostranstva, uz bosanski za domaće.</li>
<li><strong>Lokacija.</strong> Udaljenost od centra, aerodroma i znamenitosti.</li>
<li><strong>Direktan upit.</strong> Obrazac, WhatsApp ili veza na sistem za rezervacije koji već koristite.</li></ul>`],
      ['Cinematic prikaz prostora', `<p>Za hotele i luksuzni smještaj radimo ${a('/usluge/cinematic-web-stranice/', 'cinematic web stranice')} koje prostor pokazuju kroz pokret dok gost skrola.</p>
${demo('/cinematic-hotel/', 'HALCYON, cinematic web za luksuzni hotel')}`],
      ['Upiti na više jezika i u svako doba', `<p>${a('/usluge/ai-receptionist/', 'AI recepcionar')} odgovara gostima na njihovom jeziku o terminima, parkingu ili doručku i prikuplja upit za vaš tim. Cijene i dostupnost potvrđuje vaš tim.</p>`],
      ['Pronađeni na Googleu i mapi', `<p>Gosti traže „apartman Sarajevo centar“ ili „hotel Mostar“. Lokalni SEO i Google Business profil pomažu da se pojavite i izvan platformi. Više na stranici ${a('/usluge/lokalni-seo-sarajevo/', 'lokalni SEO')}.</p>`],
    ],
    faq: [
      ['Koliko košta web stranica za apartmane ili hotel?', 'Prezentacijska stranica kreće od 449 KM, a cinematic web do pet stranica s AI asistentom prva tri mjeseca košta 499 KM. Više jezika i povezivanje sistema za rezervacije povećavaju obim.'],
      ['Možete li povezati Booking ili sistem za rezervacije?', 'Možemo povezati sistem koji već koristite, ako ima mogućnost ugradnje ili veze. To provjeravamo prije ponude.'],
      ['Da li vodite i oglase za smještaj?', 'Da. Kampanje za rast na Googleu i Meti kreću od 249 KM mjesečno, a budžet za oglase plaćate platformi odvojeno.'],
    ],
    related: [['/usluge/cinematic-web-stranice/', 'Cinematic web stranice'], ['/shop/product/smart-website-launch/', 'Smart Website Launch — 499 KM'], ['/industrije/', 'Sve industrije']],
  },
  {
    path: '/industrije/nekretnine/',
    crumbs: [['Industrije', '/industrije/'], ['Nekretnine', '/industrije/nekretnine/']],
    eyebrow: 'INDUSTRIJE · NEKRETNINE I GRADNJA',
    title: 'Web stranica za nekretnine i investitore | Digital X',
    h1: 'Web stranica za nekretnine: projekt koji kupac razumije prije razgledanja',
    desc: 'Web stranice za investitore, agencije za nekretnine i nove stambene projekte u BiH: stanovi, tlocrti, lokacija i upit za razgledanje. Cinematic prikaz projekta.',
    keywords: ['web stranica za nekretnine', 'web stranica za investitora', 'web stranica za stambeni projekat', 'marketing za nekretnine'],
    service: { name: 'Web stranice za nekretnine i investitore', serviceType: 'Web design for real estate', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Smart Website Launch', 499], ['Kampanje za rast', 249, 'mjesečno']] },
    answer: 'Kupac stana ili poslovnog prostora želi vidjeti tlocrt, cijenu ili raspon cijena, lokaciju i rok završetka prije nego što zakaže razgledanje. Digital X izrađuje stranice za investitore i agencije koje te informacije daju jasno, uz cinematic prikaz projekta. Cinematic web s AI asistentom košta 499 KM; veći projekti dobijaju ponudu po obimu.',
    sections: [
      ['Šta stranica projekta treba', `<ul><li><strong>Stanovi i tlocrti.</strong> Pregled po spratu, kvadraturi i dostupnosti.</li>
<li><strong>Lokacija.</strong> Karta, okolina, škole, prevoz i udaljenosti.</li>
<li><strong>Rok i faze gradnje.</strong> Jasno i ažurno.</li>
<li><strong>Upit za razgledanje.</strong> Obrazac koji odmah kaže za koji stan je upit.</li>
<li><strong>Dijaspora.</strong> Engleski i njemački za kupce iz inostranstva.</li></ul>`],
      ['Cinematic prikaz projekta', `<p>Arhitektura se bolje prodaje kad je kupac može doživjeti. Za premium projekte radimo ${a('/usluge/cinematic-web-stranice/', 'cinematic web stranice')} vođene skrolom.</p>
${demo('/cinematic-penthouse/', 'THE MERIDIAN, cinematic web za premium nekretninu')}`],
      ['Od prve posjete do razgledanja', `<p>${a('/usluge/ai-receptionist/', 'AI asistent')} odgovara na pitanja o stanovima i prikuplja upit za razgledanje, a ${a('/usluge/digitalne-kampanje/', 'Google i Meta kampanje')} dovode kupce koji traže stan u vašem dijelu grada.</p>`],
    ],
    faq: [
      ['Koliko košta web stranica za stambeni projekat?', 'Cinematic web do pet stranica s AI asistentom prva tri mjeseca košta 499 KM. Pregled stanova po dostupnosti, više jezika i 3D prikazi povećavaju obim, pa takve projekte nudimo po procjeni.'],
      ['Možete li prikazati dostupnost stanova?', 'Da. Dostupnost se može ažurirati iz tabele ili sistema koji koristite, tako da kupac vidi tačno stanje.'],
      ['Imate li fotografije i renderinge?', 'Renderinge obično daje arhitekt ili investitor. Mi ih uklapamo u stranicu, a po potrebi organizujemo fotografisanje i video.'],
    ],
    related: [['/usluge/cinematic-web-stranice/', 'Cinematic web stranice'], ['/usluge/digitalne-kampanje/', 'Digitalne kampanje'], ['/industrije/', 'Sve industrije']],
  },
  {
    path: '/industrije/restorani/',
    crumbs: [['Industrije', '/industrije/'], ['Restorani i kafići', '/industrije/restorani/']],
    eyebrow: 'INDUSTRIJE · RESTORANI I KAFIĆI',
    title: 'Web stranica i marketing za restoran: meni, rezervacije, Google | Digital X',
    h1: 'Web stranica za restoran: meni, rezervacija i Google mapa na jednom mjestu',
    desc: 'Web stranica, lokalni SEO i Instagram oglasi za restorane i kafiće u BiH: meni koji se čita na mobitelu, rezervacija, Google Business profil i recenzije. Od 199 KM.',
    keywords: ['web stranica za restoran', 'izrada web stranice za restoran', 'marketing za restorane', 'online meni za restoran', 'restoran sarajevo web'],
    service: { name: 'Web stranice i marketing za restorane', serviceType: 'Web design and local marketing for restaurants', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Landing stranica', 199], ['Premium web prisustvo', 449], ['Smart Website Launch', 499]] },
    answer: 'Gost prije dolaska provjerava meni, cijene, radno vrijeme, lokaciju i recenzije, najčešće na mobitelu. Digital X izrađuje stranice za restorane i kafiće koje to pokazuju odmah i vode do rezervacije ili poziva: jednostavna stranica od 199 KM, prezentacijska od 449 KM, a web s AI asistentom 499 KM.',
    sections: [
      ['Šta gost traži na stranici restorana', `<ul>
<li><strong>Meni kao tekst, ne kao PDF.</strong> Čita se na mobitelu, a Google i AI asistenti ga mogu pročitati i preporučiti.</li>
<li><strong>Rezervacija ili poziv.</strong> Dugme za poziv, WhatsApp ili obrazac vidljiv na svakom ekranu.</li>
<li><strong>Radno vrijeme i lokacija.</strong> Karta, parking i isto radno vrijeme kao na Google profilu.</li>
<li><strong>Fotografije jela i prostora.</strong> Prave fotografije prodaju više od opisa. Po potrebi radimo ${a('/usluge/fotografija-proizvoda/', 'fotografisanje')}.</li>
<li><strong>Događaji i grupe.</strong> Posebna stranica za proslave i poslovne ručkove, jer to ljudi posebno traže.</li></ul>`],
      ['Google mapa i recenzije', `<p>Za restoran je Google Business profil često važniji od same stranice. Uređujemo kategorije, fotografije, meni i radno vrijeme, a uz ${a('/shop/product/review-engine/', 'sistem recenzija')} gosti nakon posjete dobiju poziv da ostave recenziju. Više na stranici ${a('/usluge/lokalni-seo-sarajevo/', 'lokalni SEO')}.</p>`],
      ['Instagram i oglasi', `<p>Restoran se bira očima. Lokalni Instagram i Facebook oglasi za ljude u blizini, uz sedmični sadržaj, pune termine koji su inače prazni. Pogledajte ${a('/usluge/meta-ads/', 'Facebook i Instagram oglase')}.</p>`],
    ],
    faq: [
      ['Koliko košta web stranica za restoran?', 'Jednostavna stranica s menijem i rezervacijom kreće od 199 KM, prezentacijska stranica od 449 KM, a web s AI asistentom 499 KM. Cijenu potvrđujemo pisano prije početka.'],
      ['Zašto meni ne bi trebao biti PDF?', 'PDF se teško čita na mobitelu i sporo učitava, a Google i AI asistenti ga slabije razumiju. Meni kao tekst se lakše mijenja i bolje se pronalazi.'],
      ['Možete li povezati online rezervacije?', 'Možemo povezati obrazac, WhatsApp ili sistem za rezervacije koji restoran već koristi. Šta je moguće provjeravamo prije ponude.'],
    ],
    related: [['/usluge/lokalni-seo-sarajevo/', 'Lokalni SEO Sarajevo'], ['/usluge/meta-ads/', 'Facebook i Instagram oglasi'], ['/industrije/', 'Sve industrije']],
  },
  {
    path: '/industrije/luksuzni-brendovi/',
    crumbs: [['Industrije', '/industrije/'], ['Luksuzni brendovi', '/industrije/luksuzni-brendovi/']],
    eyebrow: 'INDUSTRIJE · LUKSUZNI BRENDOVI',
    title: 'Web stranica za luksuzni brend: cinematic web i web shop | Digital X',
    h1: 'Web stranica za luksuzni brend: doživljaj proizvoda prije kupovine',
    desc: 'Cinematic web stranice i web shopovi za luksuzne brendove: satove, parfeme, modu i nakit. Proizvod u pokretu, diskretan upit i kupovina. Cinematic web 499 KM.',
    keywords: ['web stranica za luksuzni brend', 'luksuzni web dizajn', 'cinematic web stranica', 'web shop za modni brend', 'web stranica za nakit i satove'],
    service: { name: 'Web stranice za luksuzne brendove', serviceType: 'Luxury brand web design', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Smart Website Launch', 499], ['E-commerce Launch', 2490]] },
    answer: 'Kupac luksuznog proizvoda kupuje osjećaj prije cijene: materijal, detalj, priču i povjerenje u brend. Digital X izrađuje cinematic web stranice u kojima se proizvod otkriva dok posjetilac skroluje, uz diskretan upit ili kupovinu. Cinematic web do pet stranica košta 499 KM, a web shop kreće od 2.490 KM.',
    sections: [
      ['Šta luksuzna stranica mora imati', `<ul>
<li><strong>Proizvod u prvom planu.</strong> Velike fotografije i pokret koji pokazuje materijal i detalj.</li>
<li><strong>Mir na ekranu.</strong> Malo teksta, dosta prostora, jasna tipografija.</li>
<li><strong>Priča brenda.</strong> Porijeklo, izrada i ljudi iza proizvoda.</li>
<li><strong>Diskretan kontakt.</strong> Upit, privatna prezentacija ili kupovina, bez napadnih poziva.</li>
<li><strong>Brzina uprkos slikama.</strong> Optimizovane slike i video kako doživljaj ne bi čekao.</li></ul>`],
      ['Primjeri koje možete isprobati', `<p>Napravili smo više interaktivnih koncepata za luksuzne proizvode.</p>
${demo('/cinematic-watch/', 'cinematic web za luksuzni sat')}
${demo('/cinematic-perfume/', 'cinematic web za parfem')}
${demo('/cinematic-clothes/', 'cinematic web za modni brend')}
<p>Više o pristupu na stranici ${a('/usluge/cinematic-web-stranice/', 'cinematic web stranice')}.</p>`],
      ['Kad brend prodaje online', `<p>Za prodaju na internetu radimo ${a('/usluge/izrada-web-shopa/', 'web shop')} koji zadržava isti doživljaj, a ${a('/usluge/smart-storefront/', 'Smart Storefront')} dodaje asistenta koji kupcu pomaže izabrati proizvod. Za vizuale tu su ${a('/usluge/fotografija-proizvoda/', 'fotografija')} i ${a('/usluge/video-proizvoda/', 'video proizvoda')}.</p>`],
    ],
    faq: [
      ['Koliko košta web stranica za luksuzni brend?', 'Cinematic web do pet stranica s AI asistentom prva tri mjeseca košta 499 KM. Web shop kreće od 2.490 KM. Veći broj proizvoda, jezika ili posebne animacije povećavaju obim.'],
      ['Da li animacije usporavaju stranicu?', 'Ne moraju. Slike i video pripremamo za brzo učitavanje, a pokret se učitava postepeno dok posjetilac skroluje.'],
      ['Jesu li primjeri stranice stvarnih klijenata?', 'Ne. To su interaktivni koncepti napravljeni kao demonstracija mogućnosti.'],
    ],
    related: [['/usluge/cinematic-web-stranice/', 'Cinematic web stranice'], ['/usluge/izrada-web-shopa/', 'Izrada web shopa'], ['/industrije/', 'Sve industrije']],
  },
  {
    path: '/industrije/privatne-klinike/',
    crumbs: [['Industrije', '/industrije/'], ['Privatne klinike i poliklinike', '/industrije/privatne-klinike/']],
    eyebrow: 'INDUSTRIJE · ZDRAVSTVO I POLIKLINIKE',
    title: 'Web stranica i SEO za privatne klinike i poliklinike | Digital X',
    h1: 'Web stranica za privatnu kliniku: jasni pregledi, povjerenje i zakazivanje termina',
    desc: 'Izrada web stranica, lokalni SEO i AI recepcionar za privatne klinike, poliklinike i laboratorije u BiH: odjeli, doktori, cjenovnik i zakazivanje. Od 449 KM.',
    keywords: ['web stranica za polikliniku', 'web stranica za privatnu kliniku', 'marketing za klinike bih', 'lokalni seo klinika sarajevo'],
    service: { name: 'Web stranice i marketing za privatne klinike', serviceType: 'Web design and local SEO for medical clinics', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Premium web prisustvo', 449], ['Smart Website Launch', 499], ['SEO · GEO · AEO', 249, 'mjesečno']] },
    answer: 'Pacijent prije zakazivanja pregleda traži konkretan odjel, ime doktora, pripremu za pregled, lokaciju i okvirnu cijenu. Digital X izrađuje brze stranice za klinike i poliklinike s jasnim zakazivanjem i lokalnim SEO-om: prezentacijska stranica od 449 KM, cinematic web s AI asistentom 499 KM, a SEO · GEO · AEO od 249 KM mjesečno.',
    sections: [
      ['Šta pacijent mora pronaći za 10 sekundi', `<ul><li><strong>Odjeli i pretrage.</strong> Posebna stranica za svaku granu medicine i dijagnostiku kako bi vas Google povezao s konkretnim simptomom ili pregledom.</li>
<li><strong>Tim ljekara.</strong> Biografije, specijalizacije i radno vrijeme ordiniranja.</li>
<li><strong>Priprema i cijene.</strong> Jasne upute prije dolaska smanjuju broj nepotrebnih poziva recepciji.</li>
<li><strong>Zakazivanje 24/7.</strong> Forma, klik-za-poziv ili ${a('/usluge/ai-receptionist/', 'AI recepcionar')} koji prikuplja zahtjev za termin i van radnog vremena bez davanja medicinskih savjeta.</li></ul>`],
      ['Lokalni SEO i Google Mape za klinike', `<p>Pacijenti najčešće pretražuju „poliklinika Sarajevo“ ili „ultrazvuk blizu mene“. Uređujemo ${a('/usluge/google-business-profile/', 'Google Business profil')}, kategorije po odjelima i ${a('/shop/product/review-engine/', 'sistem recenzija')}.</p>`],
    ],
    faq: [
      ['Koliko košta web stranica za privatnu kliniku ili polikliniku?', 'Prezentacijska stranica kreće od 449 KM, a Smart Website Launch s AI asistentom košta 499 KM. Veće poliklinike s više odjela i integracijom zakazivanja dobijaju ponudu po obimu.'],
      ['Smije li AI asistent davati medicinske savjete?', 'Ne. Asistent odgovara isključivo na organizaciona pitanja (radno vrijeme, lokacija, priprema za pregled, cjenovnik) i predaje zahtjev za termin vašem osoblju.'],
      ['Kako štitite podatke pacijenata?', 'Kontakt forme prikupljaju samo minimum podataka potreban za zakazivanje termina, uz jasnu politiku privatnosti i bez pohrane osjetljivih medicinskih nalaza na javnom webu.'],
    ],
    related: [['/industrije/stomatologija/', 'Web za stomatološke ordinacije'], ['/usluge/lokalni-seo-sarajevo/', 'Lokalni SEO Sarajevo'], ['/usluge/ai-receptionist/', 'AI recepcionar']],
  },
  {
    path: '/industrije/racunovodstvo-i-konsalting/',
    crumbs: [['Industrije', '/industrije/'], ['Računovodstvo i konsalting', '/industrije/racunovodstvo-i-konsalting/']],
    eyebrow: 'INDUSTRIJE · B2B USLUGE I RAČUNOVODSTVO',
    title: 'Web stranica za računovodstvene agencije i konsultante | Digital X',
    h1: 'Web stranica za računovodstvo i konsalting: autoritet koji donosi B2B upite',
    desc: 'Izrada web stranica i SEO za računovodstvene agencije, porezne savjetnike i B2B konsultante u BiH i dijaspori: jasne usluge, vodiči i upiti. Od 449 KM.',
    keywords: ['web stranica za računovodstvo', 'knjigovodstvena agencija web stranica', 'marketing za računovođe bih', 'b2b web stranica sarajevo'],
    service: { name: 'Web stranice i SEO za računovodstvo i konsalting', serviceType: 'Web design and SEO for accounting and consulting firms', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Premium web prisustvo', 449], ['SEO · GEO · AEO', 249, 'mjesečno']] },
    answer: 'Vlasnik firme koji traži knjigovođu ili poslovnog savjetnika bira povjerenje, stručnost i brz odgovor. Digital X izrađuje B2B web stranice za računovodstvene agencije i konsultante s jasnim paketima, stručnim odgovorima i lokalnim SEO-om: prezentacijska stranica kreće od 449 KM, a SEO · GEO · AEO od 249 KM mjesečno.',
    sections: [
      ['Šta B2B klijent provjerava prije prvog sastanka', `<ul><li><strong>Vrste klijenata.</strong> Radite li s obrtima, d.o.o. firmama, IT sektorom ili stranim investitorima koji otvaraju firmu u BiH?</li>
<li><strong>Jasne usluge.</strong> Knjigovodstvo, obračun plata, porezno savjetovanje, osnivanje firme i prijave.</li>
<li><strong>Stručni odgovori (AEO/GEO).</strong> Kratki vodiči o porezima, doprinosima i otvaranju firme dovode klijente direktno s Googlea i AI pretrage.</li>
<li><strong>Više jezika.</strong> Engleski i njemački za strane osnivače i dijasporu.</li></ul>`],
      ['Automatizacija prvog upita', `<p>Umjesto dugih telefonskih poziva bez osnovnih podataka, forma ili ${a('/usluge/ai-chatbot-za-web-stranicu/', 'AI asistent')} može unaprijed pitati za pravni oblik firme, broj zaposlenih i djelatnost.</p>`],
    ],
    faq: [
      ['Koliko košta web stranica za računovodstvenu agenciju?', 'Prezentacijska stranica kreće od 449 KM jednokratno, a Smart Website Launch s AI asistentom košta 499 KM.'],
      ['Možete li napraviti stranicu i na engleskom ili njemačkom za strane firme?', 'Da. Višejezične stranice pomažu agencijama koje rade sa stranim investitorima i dijasporom.'],
      ['Kako privući nove B2B klijente bez agresivnih oglasa?', 'Kombinacijom jasnih stranica usluga, stručnih odgovora na česta pitanja (SEO/AEO) i uređenog Google Business profila.'],
    ],
    related: [['/industrije/advokati/', 'Web za advokatske kancelarije'], ['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga'], ['/industrije/', 'Sve industrije']],
  },
  {
    path: '/usluge/optimizacija-brzine-sajta/',
    crumbs: [['Usluge', '/usluge/'], ['Optimizacija brzine sajta', '/usluge/optimizacija-brzine-sajta/']],
    eyebrow: 'BRZINA SAJTA · CORE WEB VITALS',
    title: 'Optimizacija brzine sajta: od 99 KM, mjereno prije i poslije | Digital X',
    h1: 'Optimizacija brzine web stranice: brži sajt, mjeren prije i poslije',
    desc: 'Spor sajt gubi posjetioce i pozicije na Googleu. Speed optimizacija od 99 KM: mjerenje, slike, kod, cache i mobilna stabilnost, uz izvještaj prije i poslije.',
    keywords: ['optimizacija brzine sajta', 'ubrzanje web stranice', 'spor sajt', 'core web vitals', 'pagespeed optimizacija'],
    service: { name: 'Optimizacija brzine web stranice', serviceType: 'Website performance optimization', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Speed optimizacija', 99, 'jednokratno']] },
    answer: 'Digital X ubrzava postojeće web stranice: prvo izmjerimo brzinu i stabilnost prikaza, zatim optimizujemo slike, kod i cache te popravimo prikaz na mobitelu. Na kraju dobijate izvještaj prije i poslije. Speed optimizacija kreće od 99 KM jednokratno, a obim potvrđujemo nakon mjerenja.',
    sections: [
      ['Šta radimo', `<ol>
<li><strong>Mjerenje prije intervencije.</strong> Bilježimo brzinu učitavanja i stabilnost prikaza na mobitelu i računaru, kako bi rezultat bio uporediv.</li>
<li><strong>Slike.</strong> Prave dimenzije, moderni formati i odgođeno učitavanje slika ispod prvog ekrana.</li>
<li><strong>Kod i cache.</strong> Uklanjamo nepotrebne skripte i stilove, odgađamo ono što ne treba odmah i podešavamo keširanje.</li>
<li><strong>Mobilna stabilnost.</strong> Elementi koji skaču tokom učitavanja dobiju rezervisan prostor.</li>
<li><strong>Izvještaj prije i poslije.</strong> Iste mjere, isti uređaji, jasna razlika.</li></ol>
<p>Detalji paketa su na stranici ${a('/shop/product/speed-optimization/', 'Speed optimizacija')}.</p>`],
      ['Koje brojeve gledamo', `<div class="table-wrap"><table><thead><tr><th scope="col">Mjera</th><th scope="col">Šta znači</th><th scope="col">Dobra vrijednost po Googleu</th></tr></thead><tbody>
<tr><th scope="row">LCP</th><td>Koliko brzo se pojavi glavni sadržaj</td><td>do 2,5 sekunde</td></tr>
<tr><th scope="row">INP</th><td>Koliko brzo stranica reaguje na klik ili dodir</td><td>do 200 milisekundi</td></tr>
<tr><th scope="row">CLS</th><td>Koliko elementi skaču tokom učitavanja</td><td>do 0,1</td></tr>
</tbody></table></div>
<p>To su Core Web Vitals, mjere koje Google koristi da ocijeni iskustvo na stranici. Zašto su važne za prodaju objašnjavamo u vodiču ${a('/blog/brzina-sajta.html', 'zašto spor sajt ubija prodaju')}.</p>`],
      ['Kad brzina nije dovoljna', `<p>Ako je stranica zastarjela i u dizajnu i u kodu, ubrzavanje daje ograničen rezultat. Tada je isplativiji ${a('/usluge/redizajn-web-stranice/', 'redizajn')}. Da brzina ne bi opet pala nakon izmjena, tu je ${a('/shop/product/site-care/', 'održavanje stranice')} od 49 KM mjesečno.</p>`],
    ],
    faq: [
      ['Koliko košta optimizacija brzine sajta?', 'Speed optimizacija kod Digital X kreće od 99 KM jednokratno. Konačan obim i cijenu potvrđujemo nakon prvog mjerenja.'],
      ['Da li brži sajt bolje rangira na Googleu?', 'Brzina i stabilnost prikaza dio su Googleove ocjene iskustva na stranici. Nisu jedini faktor, ali spor sajt gubi posjetioce prije nego što vide ponudu.'],
      ['Radite li na WordPressu i Shopifyju?', 'Da. Šta se može promijeniti zavisi od platforme, teme i dodataka, pa to provjerimo u mjerenju prije ponude.'],
      ['Kako da provjerim brzinu svog sajta?', 'Besplatno preko Google PageSpeed Insights ili kroz našu besplatnu analizu sajta, uz objašnjenje šta brojevi znače.'],
    ],
    related: [['/usluge/x-signal/', 'Besplatna analiza sajta'], ['/blog/brzina-sajta.html', 'Vodič: brzina sajta'], ['/usluge/web-dizajn/', 'Web dizajn i cijene']],
  },
  {
    path: '/usluge/ai-chatbot-za-web-stranicu/',
    crumbs: [['Usluge', '/usluge/'], ['AI chatbot za web stranicu', '/usluge/ai-chatbot-za-web-stranicu/']],
    eyebrow: 'AI ASISTENT · WEB I PORUKE',
    title: 'AI chatbot za web stranicu: cijena od 490 KM | Digital X',
    h1: 'AI chatbot za web stranicu koji odgovara, kvalifikuje i prikuplja upite',
    desc: 'AI chatbot za web stranicu firme u BiH: odgovori 24/7 iz vašeg sadržaja, pitanja za kvalifikaciju i predaja razgovora čovjeku. AI prodajni asistent od 490 KM.',
    keywords: ['ai chatbot za web stranicu', 'chatbot za web stranicu', 'ai asistent za web', 'chatbot cijena', 'ai chatbot bih'],
    service: { name: 'AI chatbot za web stranicu', serviceType: 'AI chatbot development', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['AI prodajni asistent', 490, 'uz mjesečno održavanje']] },
    answer: 'Digital X postavlja AI chatbot na web stranicu firme: asistent odgovara 24/7 iz vašeg sadržaja i u vašem tonu, postavlja pitanja koja kvalifikuju upit i predaje razgovor čovjeku kad treba. AI prodajni asistent kreće od 490 KM, uz održavanje od 149 KM mjesečno.',
    sections: [
      ['Šta asistent radi', `<ul>
<li><strong>Odgovara 24/7.</strong> Pitanja o uslugama, cijenama, radnom vremenu i lokaciji dobijaju odgovor i kad niko nije u kancelariji.</li>
<li><strong>Koristi vaš sadržaj i ton.</strong> Odgovara iz odobrenih informacija o vašoj firmi, ne iz nagađanja.</li>
<li><strong>Kvalifikuje upit.</strong> Pita ono što bi pitao vaš prodavač: šta treba, kada i u kojem obimu.</li>
<li><strong>Predaje razgovor čovjeku.</strong> Kad pitanje traži osobu, vaš tim dobija sažetak i nastavlja razgovor.</li></ul>
<p>Asistenta možete isprobati u ${a('/ai-concierge-preview/', 'demo razgovoru')}. Detalji paketa su na stranici ${a('/shop/product/ai-concierge/', 'AI prodajni asistent')}.</p>`],
      ['Cijena i održavanje', `<div class="table-wrap"><table><thead><tr><th scope="col">Opcija</th><th scope="col">Cijena</th></tr></thead><tbody>
<tr><th scope="row">${a('/shop/product/ai-concierge/', 'AI prodajni asistent')}</th><td>od 490 KM</td></tr>
<tr><th scope="row">${a('/shop/product/site-care/', 'Održavanje stranice s AI asistentom')}</th><td>149 KM mjesečno</td></tr>
<tr><th scope="row">${a('/shop/product/smart-website-launch/', 'Smart Website Launch')} (nova stranica s asistentom)</th><td>499 KM, asistent uključen prva tri mjeseca</td></tr>
</tbody></table></div>
<p>Održavanje pokriva ažuriranje znanja asistenta kad se promijene usluge ili cijene. Konačan obim potvrđujemo pisano prije početka.</p>`],
      ['Pošteno prema posjetiocu', `<p>Posjetilac uvijek zna da razgovara s asistentom, a ne s osobom. Asistent ne daje obećanja koja vaša firma nije odobrila, a podatke iz razgovora koristite samo za odgovor na upit. Šta to znači za zaštitu podataka objašnjavamo u vodiču ${a('/znanje/gdpr-pristupacnost-web-stranice/', 'GDPR, kolačići i pristupačnost')}.</p>`],
      ['Za telefon i termine', `<p>Ako upiti stižu pozivom ili trebaju zakazivanje termina, pogledajte ${a('/usluge/ai-receptionist/', 'AI recepcionara')}. Šta je chatbot i kad se isplati objašnjava ${a('/blog/ai-chatbot-vodic.html', 'vodič o AI chatbotu za biznis')}.</p>`],
      ['AI prodajni asistent vs. obični chatbot', `<div class="table-wrap"><table><thead><tr><th scope="col">Kriterij</th><th scope="col">Digital X AI asistent</th><th scope="col">Obični „klikni dugme“ chatbot</th></tr></thead><tbody>
<tr><th scope="row">Izvor odgovora</th><td>Vaši odobreni dokumenti, cjenovnik i FAQ</td><td>Unaprijed zaključana stabla dugmadi</td></tr>
<tr><th scope="row">Jezici</th><td>BS / HR / SR / EN / DE prirodan razgovor</td><td>Ručno prevođenje svakog koraka</td></tr>
<tr><th scope="row">Kvalifikacija i predaja</th><td>Prikuplja kontekst i šalje sažetak timu</td><td>Često ostavlja korisnika bez odgovora</td></tr></tbody></table></div>`],
    ],
    faq: [
      ['Koliko košta AI chatbot za web stranicu?', 'AI prodajni asistent kod Digital X kreće od 490 KM, uz održavanje od 149 KM mjesečno. Uz novu stranicu, Smart Website Launch od 499 KM uključuje asistenta prva tri mjeseca.'],
      ['Da li chatbot izmišlja odgovore?', 'Asistent odgovara iz informacija koje vi odobrite. Kad ne zna odgovor ili pitanje traži osobu, predaje razgovor vašem timu.'],
      ['Na kojim jezicima radi?', 'Na bosanskom, hrvatskom, srpskom, engleskom i njemačkom, prema tome koje jezike koriste vaši kupci.'],
      ['Može li raditi i na Instagramu ili WhatsAppu?', 'Asistent je namijenjen webu i kanalima komunikacije. Koje kanale povezujemo dogovaramo u ponudi, prema obimu.'],
      ['Koliko traje postavljanje AI asistenta?', 'Osnovno postavljanje na postojeću stranicu traje 5 do 10 radnih dana nakon prijema vaših odobrenih materijala i cjenovnika.'],
    ],
    related: [['/ai-concierge-preview/', 'Isprobajte demo razgovor'], ['/blog/ai-chatbot-vodic.html', 'Vodič: AI chatbot za biznis'], ['/usluge/ai-receptionist/', 'AI recepcionar']],
  },
  {
    path: '/znanje/gdpr-pristupacnost-web-stranice/',
    article: true,
    crumbs: [['Blog', '/blog/'], ['GDPR i pristupačnost web stranice', '/znanje/gdpr-pristupacnost-web-stranice/']],
    eyebrow: 'VODIČ · PRIVATNOST I PRISTUPAČNOST',
    title: 'GDPR, kolačići i pristupačnost web stranice: vodič za firme u BiH | Digital X',
    h1: 'GDPR, kolačići i pristupačnost: šta web stranica firme iz BiH treba',
    desc: 'Kada GDPR važi za firmu iz BiH, šta treba za kolačiće, šta traži Evropski akt o pristupačnosti i šta s AI chatbotom. Praktičan pregled, bez pravnog žargona.',
    keywords: ['gdpr bih', 'gdpr web stranica', 'kolačići pristanak', 'pristupačnost web stranice', 'wcag', 'zaštita ličnih podataka bih'],
    answer: 'Firma iz BiH prati domaći zakon o zaštiti ličnih podataka, a GDPR dodatno kad nudi robu ili usluge ljudima u EU. Stranica treba politiku privatnosti, pristanak za kolačiće koji nisu nužni i formu koja traži samo potrebne podatke. Prodaja potrošačima u EU donosi i pravila o pristupačnosti.',
    sections: [
      ['Kada GDPR važi za firmu iz BiH', `<p>U Bosni i Hercegovini važi domaći zakon o zaštiti ličnih podataka, a nadzor vrši Agencija za zaštitu ličnih podataka u BiH. Opća uredba o zaštiti podataka EU (GDPR) dodatno važi i za firme izvan EU kada nude robu ili usluge ljudima u EU ili prate njihovo ponašanje na internetu. Hotel koji prima goste iz Njemačke ili web shop koji šalje u Hrvatsku spadaju u tu grupu.</p>`],
      ['Šta stranica treba imati', `<ul>
<li><strong>Politiku privatnosti.</strong> Koje podatke prikupljate, zašto, koliko ih čuvate i kome se posjetilac javlja.</li>
<li><strong>Pristanak za kolačiće.</strong> Analitika i oglasni kolačići za posjetioce iz EU traže pristanak prije postavljanja. Nužni kolačići, npr. za korpu, ne traže.</li>
<li><strong>Forme sa minimumom podataka.</strong> Pitajte samo ono što vam treba za odgovor.</li>
<li><strong>Siguran prenos.</strong> HTTPS na cijeloj stranici.</li></ul>`],
      ['Pristupačnost i Evropski akt o pristupačnosti', `<p>Od 28. 6. 2025. Evropski akt o pristupačnosti traži da određene usluge za potrošače u EU, uključujući online prodaju, budu pristupačne osobama s invaliditetom. Mikropreduzeća koja pružaju usluge (manje od 10 zaposlenih i do 2 miliona eura prometa) izuzeta su. Tehnička osnova je standard koji se oslanja na WCAG smjernice: dovoljan kontrast, opis slika, upotreba tastaturom i jasne oznake u formama.</p>
<p>I kada zakon ne obavezuje, pristupačna stranica je lakša za sve, a Google i AI alati bolje razumiju njen sadržaj.</p>`],
      ['AI chatbot i podaci', `<p>Evropski propisi o umjetnoj inteligenciji traže da ljudi znaju kada razgovaraju s AI sistemom. Asistent zato treba to jasno reći, prikupljati samo podatke potrebne za upit i biti opisan u politici privatnosti. Kako mi postavljamo asistenta opisano je na stranici ${a('/usluge/ai-chatbot-za-web-stranicu/', 'AI chatbot za web stranicu')}.</p>`],
      ['Važna napomena', `<p>Ovaj vodič je praktičan pregled, a ne pravni savjet. Za vašu konkretnu situaciju, posebno ako obrađujete zdravstvene ili finansijske podatke, konsultujte pravnika.</p>`],
    ],
    faq: [
      ['Da li GDPR važi za firme u BiH?', 'Važi kada firma iz BiH nudi robu ili usluge ljudima u EU ili prati njihovo ponašanje na internetu. Za ostalo važi domaći zakon o zaštiti ličnih podataka.'],
      ['Treba li mi baner za kolačiće?', 'Ako koristite analitičke ili oglasne kolačiće i imate posjetioce iz EU, treba vam pristanak prije postavljanja tih kolačića. Nužni kolačići ne traže pristanak.'],
      ['Šta je WCAG?', 'WCAG su međunarodne smjernice za pristupačnost web sadržaja: kontrast, tekstualni opisi slika, upotreba tastaturom i razumljive forme.'],
      ['Da li je ovaj vodič pravni savjet?', 'Nije. To je praktičan pregled za vlasnike firmi. Za konkretnu situaciju konsultujte pravnika.'],
    ],
    related: [['/usluge/web-dizajn/', 'Web dizajn i cijene'], ['/usluge/ai-chatbot-za-web-stranicu/', 'AI chatbot za web stranicu'], ['/pravne-informacije.html', 'Pravne informacije Digital X']],
  },
  {
    path: '/usluge/optimizacija-meta-oglasa/',
    crumbs: [['Usluge', '/usluge/'], ['Optimizacija Meta oglasa', '/usluge/optimizacija-meta-oglasa/']],
    eyebrow: 'META OGLASI · FACEBOOK I INSTAGRAM',
    title: 'Optimizacija Facebook i Instagram oglasa: niža cijena upita | Digital X',
    h1: 'Optimizacija Facebook i Instagram oglasa: niža cijena upita, bolja publika',
    desc: 'Pregled i optimizacija Meta kampanja: mjerenje (Pixel i Conversions API), publika, retargeting, testiranje kreativa i cijena po upitu. Od 249 KM mjesečno plus budžet.',
    keywords: ['optimizacija facebook oglasa', 'optimizacija meta oglasa', 'optimizacija instagram oglasa', 'facebook oglasi ne rade', 'ciljanje publike facebook', 'meta pixel postavljanje'],
    service: { name: 'Optimizacija Meta oglasa', serviceType: 'Paid social advertising optimization', areaServed: [{ '@type': 'Country', name: 'Bosna i Hercegovina' }], offers: [['Kampanje za rast', 249, 'mjesečno plus budžet za oglase']] },
    answer: 'Digital X optimizuje postojeće Facebook i Instagram kampanje: provjerimo mjerenje, cilj kampanje, publiku i kreative, pa mijenjamo ono što diže cijenu upita ili prodaje. Rezultat pratimo kroz cijenu po upitu, ne kroz lajkove. Vođenje i optimizacija kreću od 249 KM mjesečno plus budžet za oglase.',
    sections: [
      ['Šta provjeravamo i popravljamo', `<div class="table-wrap"><table><thead><tr><th scope="col">Područje</th><th scope="col">Česti problem</th><th scope="col">Šta radimo</th></tr></thead><tbody>
<tr><th scope="row">Mjerenje</th><td>Pixel ne bilježi upite ili prodaje, pa Meta optimizuje naslijepo</td><td>Postavljamo Meta Pixel i Conversions API, provjeravamo događaje</td></tr>
<tr><th scope="row">Cilj kampanje</th><td>Kampanja cilja klikove ili preglede umjesto upita</td><td>Biramo cilj koji odgovara poslovnom rezultatu</td></tr>
<tr><th scope="row">Publika</th><td>Preusko ili preširoko ciljanje, publike se preklapaju</td><td>Gradimo publike iz posjetilaca, kupaca i sličnih ljudi, bez preklapanja</td></tr>
<tr><th scope="row">Retargeting</th><td>Ljudi koji su bili na sajtu nikad više ne vide ponudu</td><td>Postavljamo kampanju za posjetioce koji nisu poslali upit</td></tr>
<tr><th scope="row">Kreativa</th><td>Isti oglas mjesecima, pa cijena raste</td><td>Testiramo nove slike, video i naslove i gasimo slabe</td></tr>
<tr><th scope="row">Stranica nakon klika</th><td>Oglas dobar, a stranica spora ili nejasna</td><td>Predlažemo ili radimo ${a('/shop/product/landing-starter/', 'landing stranicu')} za kampanju</td></tr>
</tbody></table></div>`],
      ['Kako smanjujemo cijenu po upitu', `<p>Cijenu po upitu ne spuštamo rezanjem budžeta, nego time da Meta dobije bolje signale i bolji oglas. Zato redoslijed uvijek ide: mjerenje, pa cilj, pa publika, pa kreativa. Detaljno objašnjenje je u vodiču ${a('/znanje/kako-smanjiti-cijenu-facebook-oglasa/', 'kako smanjiti cijenu Facebook oglasa')}.</p>`],
      ['Šta dobijate svaki mjesec', `<ul>
<li><strong>Izvještaj s brojkama koje se računaju.</strong> Potrošnja, broj upita ili prodaja i cijena po rezultatu.</li>
<li><strong>Nove kreative za test.</strong> Svaki mjesec barem jedna nova varijanta oglasa.</li>
<li><strong>Preporuku za budžet.</strong> Gdje dodati, a gdje stati.</li></ul>
<p>Paket je ${a('/shop/product/growth-campaigns/', 'Kampanje za rast')}, od 249 KM mjesečno. Budžet za oglase plaćate direktno Meti. Ako tek pokrećete oglase, pogledajte ${a('/usluge/meta-ads/', 'vođenje Facebook i Instagram oglasa')}.</p>`],
    ],
    faq: [
      ['Koliko košta optimizacija Facebook oglasa?', 'Vođenje i optimizacija kreću od 249 KM mjesečno. Budžet za oglase je odvojen i plaća se direktno Meti.'],
      ['Zašto moji Facebook oglasi ne donose upite?', 'Najčešći razlozi su pogrešan cilj kampanje, mjerenje koje ne bilježi upite, preširoka publika, stara kreativa ili spora stranica nakon klika. Provjeravamo svaki od tih koraka redom.'],
      ['Šta je Conversions API?', 'To je način da vaša stranica šalje Meti podatke o upitima i kupovinama direktno sa servera. Uz Pixel daje pouzdanije mjerenje, pa Meta bolje uči koga treba ciljati.'],
      ['Da li morate imati pristup mom oglasnom nalogu?', 'Da, kao partner u vašem Business Manageru. Nalog, stranica i podaci ostaju vaši, a pristup možete ukinuti u bilo kojem trenutku.'],
    ],
    related: [['/usluge/meta-ads/', 'Facebook i Instagram oglasi'], ['/znanje/kako-smanjiti-cijenu-facebook-oglasa/', 'Kako smanjiti cijenu Facebook oglasa'], ['/znanje/instagram-facebook-reklama-cijena/', 'Cijena reklame na Instagramu i Facebooku']],
  },
  {
    path: '/znanje/kako-smanjiti-cijenu-facebook-oglasa/',
    article: true,
    crumbs: [['Blog', '/blog/'], ['Kako smanjiti cijenu Facebook oglasa', '/znanje/kako-smanjiti-cijenu-facebook-oglasa/']],
    eyebrow: 'VODIČ · META OGLASI',
    title: 'Kako smanjiti cijenu Facebook i Instagram oglasa: 7 koraka | Digital X',
    h1: 'Kako smanjiti cijenu Facebook i Instagram oglasa: 7 koraka koji stvarno rade',
    desc: 'Zašto Facebook oglasi poskupljuju i kako smanjiti cijenu po upitu: mjerenje, cilj kampanje, publika, retargeting, kreativa i stranica nakon klika.',
    keywords: ['kako smanjiti cijenu facebook oglasa', 'skupi facebook oglasi', 'cijena po upitu', 'lookalike publika', 'retargeting facebook', 'testiranje kreativa'],
    answer: 'Cijena Facebook i Instagram oglasa pada kada Meta dobija tačne podatke o upitima, kada kampanja cilja upit a ne klik, kada publike nisu preuske i kada se kreativa redovno mijenja. Najveće uštede obično dolaze iz popravke mjerenja i boljeg oglasa, a ne iz manjeg budžeta.',
    sections: [
      ['1. Popravite mjerenje', `<p>Ako Meta Pixel ne bilježi upite ili kupovine, algoritam ne zna ko je dobar kupac. Postavite događaje za upit, poziv i kupovinu, a uz Pixel dodajte Conversions API za pouzdaniji prenos podataka.</p>`],
      ['2. Birajte cilj prema rezultatu', `<p>Kampanja za promet traži ljude koji klikaju, a kampanja za potencijalne kupce traži ljude koji šalju upit. Ako vam treba upit, birajte cilj koji ga mjeri. Dugme Promoviši objavu najčešće optimizuje za interakcije.</p>`],
      ['3. Ne sužavajte publiku previše', `<p>Preusko ciljanje diže cijenu prikaza. Za većinu malih firmi bolje radi šira publika uz dobar oglas, plus publike iz vlastitih podataka: posjetioci stranice, ljudi koji su gledali video i slični postojećim kupcima (lookalike).</p>`],
      ['4. Uključite retargeting', `<p>Posjetilac koji je bio na stranici a nije poslao upit je najjeftiniji sljedeći kupac. Kratka kampanja koja mu ponovo pokaže ponudu često ima najnižu cijenu po upitu.</p>`],
      ['5. Mijenjajte kreativu', `<p>Kad ista publika predugo gleda isti oglas, učestalost raste, a s njom i cijena. Testirajte više slika, kratkih videa i naslova, pa zadržite one koji donose upite.</p>`],
      ['6. Popravite stranicu nakon klika', `<p>Spora ili nejasna stranica gubi ljude koje ste već platili. Jedna stranica s jednom ponudom i jednim pozivom na akciju obično radi bolje od početne stranice sajta.</p>`],
      ['7. Mjerite cijenu po upitu, ne po kliku', `<p>Jeftin klik bez upita je skup. Pratite potrošnju podijeljenu s brojem upita ili prodaja i odluke o budžetu donosite prema tom broju.</p>
<p>Ako želite da neko provjeri vaše kampanje, pogledajte ${a('/usluge/optimizacija-meta-oglasa/', 'optimizaciju Meta oglasa')}.</p>`],
    ],
    faq: [
      ['Zašto su Facebook oglasi poskupili?', 'Cijena raste kad je više oglašivača za istu publiku, kad mjerenje ne radi, kad je publika preuska ili kad ljudi predugo gledaju isti oglas.'],
      ['Koliki budžet treba za Facebook oglase?', 'Ne postoji jedan iznos. Budžet treba biti dovoljan da kampanja dobije više rezultata sedmično kako bi Meta mogla učiti. Kreće se od cilja i cijene jednog upita.'],
      ['Šta je lookalike publika?', 'To je publika ljudi sličnih vašim postojećim kupcima ili posjetiocima, koju Meta pravi iz vaših podataka.'],
      ['Da li je Promoviši objavu dovoljno?', 'Za vidljivost objave može biti. Za upite i prodaju Ads Manager daje bolji izbor cilja, publike i mjerenja.'],
    ],
    related: [['/usluge/optimizacija-meta-oglasa/', 'Optimizacija Meta oglasa'], ['/usluge/meta-ads/', 'Facebook i Instagram oglasi'], ['/znanje/instagram-facebook-reklama-cijena/', 'Cijena reklame na Instagramu i Facebooku']],
  },
  {
    // Fact sheet for AI answers and journalists: only verified company data and catalogue prices.
    path: '/cinjenice/',
    about: true,
    crumbs: [['Činjenice o Digital X', '/cinjenice/']],
    eyebrow: 'DIGITAL X · ČINJENICE',
    title: 'Digital X: činjenice o agenciji, usluge i cijene | Digital X',
    h1: 'Digital X u činjenicama: ko smo, šta radimo i koliko košta',
    desc: 'Provjerene činjenice o Digital X Marketing iz Sarajeva: adresa, kontakt, jezici, područje rada, usluge i početne cijene u KM. Jedna stranica za brz i tačan odgovor.',
    keywords: ['digital x', 'digital x marketing', 'digital x sarajevo', 'digitalna agencija sarajevo', 'marketing agencija sarajevo'],
    answer: 'Digital X Marketing je digitalna agencija iz Sarajeva (Stupska bb) koja izrađuje web stranice i web shopove, radi SEO i vidljivost u AI odgovorima, vodi Google i Meta kampanje i uvodi AI asistente i automatizacije. Radi na bosanskom, hrvatskom, srpskom, engleskom i njemačkom. Cijene kreću od 199 KM za landing stranicu.',
    sections: [
      ['Osnovni podaci', `<div class="table-wrap"><table><tbody>
<tr><th scope="row">Naziv</th><td>Digital X (pravni naziv: Digital X Marketing)</td></tr>
<tr><th scope="row">Sjedište</th><td>Stupska bb, Sarajevo, Bosna i Hercegovina</td></tr>
<tr><th scope="row">E-mail</th><td>${a('mailto:marketing@digital-x-marketing.com', 'marketing@digital-x-marketing.com')}</td></tr>
<tr><th scope="row">Telefon</th><td>${a('tel:+387644383566', '+387 64 438 3566')}</td></tr>
<tr><th scope="row">Jezici</th><td>bosanski, hrvatski, srpski, engleski, njemački</td></tr>
<tr><th scope="row">Područje rada</th><td>Bosna i Hercegovina, Hrvatska, Srbija, Crna Gora, Njemačka, Austrija i Švicarska</td></tr>
<tr><th scope="row">Web</th><td>${a('https://www.digital-x-marketing.com/', 'digital-x-marketing.com')}</td></tr>
<tr><th scope="row">Instagram</th><td>${a('https://www.instagram.com/digitalxmarketing.ba', '@digitalxmarketing.ba')}</td></tr>
</tbody></table></div>
<p>Pravni podaci su i na stranici ${a('/pravne-informacije.html', 'pravne informacije')}.</p>`],
      ['Usluge i početne cijene', `<div class="table-wrap"><table><thead><tr><th scope="col">Usluga</th><th scope="col">Cijena od</th><th scope="col">Plaćanje</th></tr></thead><tbody>
<tr><th scope="row">${a('/shop/product/landing-starter/', 'Landing stranica')}</th><td>199 KM</td><td>jednokratno</td></tr>
<tr><th scope="row">${a('/shop/product/web-presence/', 'Premium web prisustvo')}</th><td>449 KM</td><td>jednokratno</td></tr>
<tr><th scope="row">${a('/shop/product/smart-website-launch/', 'Smart Website Launch')} (web s AI asistentom)</th><td>499 KM</td><td>jednokratno</td></tr>
<tr><th scope="row">${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')} (web shop)</th><td>2.490 KM</td><td>jednokratno</td></tr>
<tr><th scope="row">${a('/shop/product/seo-aeo/', 'SEO · GEO · AEO')}</th><td>249 KM</td><td>mjesečno</td></tr>
<tr><th scope="row">${a('/shop/product/growth-campaigns/', 'Kampanje za rast')} (Google i Meta)</th><td>249 KM</td><td>mjesečno, plus budžet oglasa</td></tr>
<tr><th scope="row">${a('/shop/product/content-system/', 'Sistem sadržaja')}</th><td>249 KM</td><td>mjesečno</td></tr>
<tr><th scope="row">${a('/shop/product/ai-concierge/', 'AI prodajni asistent')}</th><td>490 KM</td><td>plus održavanje</td></tr>
<tr><th scope="row">${a('/shop/product/workflow-starter/', 'Automation Starter')}</th><td>349 KM</td><td>jednokratno</td></tr>
<tr><th scope="row">${a('/shop/product/review-engine/', 'Sistem recenzija')}</th><td>199 KM</td><td>plus održavanje</td></tr>
<tr><th scope="row">${a('/shop/product/speed-optimization/', 'Speed optimizacija')}</th><td>99 KM</td><td>jednokratno</td></tr>
<tr><th scope="row">${a('/shop/product/site-care/', 'Održavanje stranice')}</th><td>49 KM</td><td>mjesečno</td></tr>
<tr><th scope="row">${a('/shop/product/digital-partner/', 'Digitalni partner')}</th><td>899 KM</td><td>mjesečno</td></tr>
</tbody></table></div>
<p>Cijene su početne. Konačnu cijenu i obim potvrđujemo pisano prije početka rada.</p>`],
      ['Kako radimo', `<ul>
<li><strong>Cijena i rok pisano unaprijed.</strong> Nema skrivenih troškova nakon potpisane ponude.</li>
<li><strong>Vlasništvo ostaje na klijentu.</strong> Domena, nalozi i podaci pripadaju firmi klijenta.</li>
<li><strong>Koncepti su označeni.</strong> Demo stranice na sajtu su ${a('/primjeri-web-stranica/', 'interaktivni koncepti')}, a ne stranice stvarnih klijenata.</li>
<li><strong>Bez izmišljenih rezultata.</strong> Ne objavljujemo statistike ni recenzije koje ne možemo dokazati.</li>
</ul>`],
      ['Logo i vizuelni identitet', `<p><img src="/assets/brand/digital-x-logo.webp" width="1200" height="400" loading="lazy" decoding="async" alt="Digital X logo"></p>
<p>Za medije i partnere: ${a('/assets/brand/digital-x-logo.png', 'logo (PNG, providna pozadina)')}, ${a('/assets/brand/digital-x-profile.jpg', 'profilna slika')} i ${a('/assets/brand/digital-x-cover.jpg', 'naslovna slika')}. Logo koristite bez izmjena boja i proporcija.</p>`],
      ['Gdje saznati više', `<ul>
<li>${a('/usluge/web-dizajn/', 'Web dizajn: paketi i cijene')}</li>
<li>${a('/usluge/izrada-web-shopa/', 'Izrada web shopa')}</li>
<li>${a('/usluge/lokalni-seo-sarajevo/', 'Lokalni SEO Sarajevo')}</li>
<li>${a('/industrije/', 'Rješenja po djelatnostima')}</li>
<li>${a('/blog/', 'Vodiči i odgovori na česta pitanja')}</li>
</ul>`],
    ],
    faq: [
      ['Gdje se nalazi Digital X?', 'Digital X Marketing ima sjedište na adresi Stupska bb u Sarajevu, Bosna i Hercegovina. Sastanci su mogući uživo u Sarajevu ili online.'],
      ['Koliko košta web stranica kod Digital X?', 'Landing stranica kreće od 199 KM, prezentacijska stranica od 449 KM, web s AI asistentom 499 KM, a web shop od 2.490 KM.'],
      ['Na kojim jezicima radi Digital X?', 'Na bosanskom, hrvatskom, srpskom, engleskom i njemačkom jeziku.'],
      ['Kako kontaktirati Digital X?', 'E-mailom na marketing@digital-x-marketing.com, telefonom na +387 64 438 3566 ili preko kontakt stranice.'],
    ],
    related: [['/kontakt.html', 'Kontakt'], ['/usluge/web-dizajn/', 'Web dizajn i cijene'], ['/pravne-informacije.html', 'Pravne informacije']],
  },
];

export const industryHub = {
  path: '/industrije/',
  title: 'Web stranice i marketing po djelatnostima | Digital X',
  h1: 'Web stranice i marketing za vašu djelatnost',
  desc: 'Digital X web stranice, lokalni SEO i AI asistenti prilagođeni djelatnostima: stomatološke ordinacije, privatne klinike, advokati, računovodstvo, hoteli, nekretnine, restorani i luksuzni brendovi.',
  answer: 'Svaka djelatnost ima svoja pitanja kupaca. Pacijent traži tretman i tim, gost prostor i lokaciju, klijent advokata ili računovođe područje rada. Odaberite svoju djelatnost i pogledajte šta stranica treba, koji koncept možete isprobati i koliko košta.',
};
