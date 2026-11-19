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
      ['Shopify, WooCommerce ili po mjeri', `<p>Nema jedne platforme koja je najbolja za sve. Shopify je jednostavniji za održavanje, WooCommerce daje više slobode, a rješenje po mjeri ima smisla kad proces prodaje ne staje u gotov sistem. Razlike, troškove i ograničenja objašnjavamo u vodiču ${a('/znanje/wordpress-shopify-ili-custom/', 'WordPress, Shopify ili custom')}.</p>`],
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
    related: [['/shop/product/ecommerce-launch/', 'E-commerce Launch — od 2.490 KM'], ['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/kontakt.html', 'Kontakt i besplatne konzultacije']],
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
];

export const industryHub = {
  path: '/industrije/',
  title: 'Web stranice i marketing po djelatnostima | Digital X',
  h1: 'Web stranice i marketing za vašu djelatnost',
  desc: 'Digital X web stranice, lokalni SEO i AI asistenti prilagođeni djelatnostima: stomatološke ordinacije, advokati, hoteli i apartmani, nekretnine.',
  answer: 'Svaka djelatnost ima svoja pitanja kupaca. Pacijent traži tretman i tim, gost prostor i lokaciju, klijent advokata područje rada. Odaberite svoju djelatnost i pogledajte šta stranica treba, koji koncept možete isprobati i koliko košta.',
};
