// Centar znanja: clusters, the customer journey and every guide.
// Prices quoted here are the published starting prices from the shop catalogue; keep them in sync.
export const origin = 'https://digital-x-marketing.com';
export const published = '2026-11-21';

export const stages = [
  ['razumjeti', 'Razumjeti', 'Šta vam zaista treba i zašto.'],
  ['planirati', 'Planirati', 'Budžet, partner i redoslijed koraka.'],
  ['izgraditi', 'Izgraditi', 'Web stranica ili trgovina koja radi.'],
  ['pronadjen', 'Biti pronađen', 'Google, mape i AI odgovori.'],
  ['privuci', 'Privući', 'Oglasi i sadržaj koji dovode prave ljude.'],
  ['automatizovati', 'Automatizovati', 'Manje ručnog rada, brži odgovori.'],
  ['mjeriti', 'Mjeriti', 'Brojevi koji vode sljedeću odluku.'],
];

// pos: where the cluster sits inside the brain (x = left/right, y = up, z = front).
export const clusters = [
  { id: 'strategija', name: 'Strategija i mjerenje', color: '#e8ecf4', pos: [0, 0.2, 0.02],
    blurb: 'Jezgro svega: plan, izbor partnera i brojevi koji pokazuju šta radi.',
    service: ['/usluge/', 'Sve usluge'], blog: [] },
  { id: 'web', name: 'Web stranice i dizajn', color: '#9fc4ff', pos: [-0.36, 0.3, 0.62],
    blurb: 'Od prve ideje do stranice koja se brzo učitava i vodi posjetioca do upita.',
    service: ['/usluge/izrada-web-stranica/', 'Izrada web stranica'],
    blog: [['/blog/koliko-kosta-web-stranica-bih.html', 'Koliko košta web stranica u BiH'], ['/blog/landing-stranica-vodic.html', 'Landing stranica: od oglasa do upita'], ['/blog/brzina-sajta.html', 'Zašto spor sajt ubija prodaju'], ['/blog/odrzavanje-sigurnost-vodic.html', 'Održavanje i sigurnost sajta'], ['/blog/uiux-rebranding-vodic.html', 'Rebranding i UI/UX dizajn']] },
  { id: 'shop', name: 'Web shop i e-commerce', color: '#8fe3d0', pos: [0.36, 0.3, 0.62],
    blurb: 'Platforma, plaćanje, dostava i sve što trgovina treba prije prve narudžbe.',
    service: ['/usluge/izrada-web-shopa/', 'Izrada web shopa'],
    blog: [['/blog/foto-video-produkcija.html', 'Foto i video produkcija proizvoda']] },
  { id: 'seo', name: 'SEO i lokalna vidljivost', color: '#b9a7ff', pos: [-0.44, 0.52, -0.08],
    blurb: 'Kako vas Google pronalazi, razumije i prikazuje — u pretrazi i na mapi.',
    service: ['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO'],
    blog: [['/blog/lokalni-seo-google-mapa.html', 'Kako biti prvi na Google mapi'], ['/blog/automatizacija-recenzija.html', 'Google recenzije na autopilotu']] },
  { id: 'ai-pretraga', name: 'AEO, GEO i AI pretraga', color: '#ffb1e3', pos: [0.44, 0.52, -0.08],
    blurb: 'Kako da vas ChatGPT, Gemini i AI pregledi navode kao izvor.',
    service: ['/usluge/ai-visibility-tracker/', 'AI Visibility Tracker'],
    blog: [['/blog/aeo-vodic.html', 'Kako da vas ChatGPT preporuči']] },
  { id: 'oglasi', name: 'Google i Meta oglasi', color: '#ffc98a', pos: [-0.6, -0.08, 0.16],
    blurb: 'Budžet, klikovi i kampanje koje se mjere upitima, a ne lajkovima.',
    service: ['/usluge/digitalne-kampanje/', 'Digitalne kampanje'],
    blog: [['/blog/google-meta-oglasi-vodic.html', 'Oglasi: budžet u upite, ne u lajkove']] },
  { id: 'sadrzaj', name: 'Društvene mreže i sadržaj', color: '#ff9f9f', pos: [0.6, -0.08, 0.16],
    blurb: 'Plan objava, formati i sadržaj koji gradi povjerenje prije prodaje.',
    service: ['/usluge/drustvene-mreze/', 'Upravljanje društvenim mrežama'],
    blog: [['/blog/vodjenje-drustvenih-mreza.html', 'Vođenje mreža: šta zapravo plaćate'], ['/blog/content-marketing-vodic.html', 'Content marketing']] },
  { id: 'ai', name: 'AI i automatizacija', color: '#8fd4ff', pos: [0, 0.22, -0.78],
    blurb: 'Asistenti, tokovi rada i znanje firme koje radi i kad vi ne radite.',
    service: ['/usluge/ai-automatizacija/', 'AI automatizacija'],
    blog: [['/blog/ai-chatbot-vodic.html', 'AI chatbot za male biznise'], ['/blog/ai-automatizacija-vodic.html', 'Šta se sve može automatizovati'], ['/blog/aplikacije-po-mjeri.html', 'Aplikacija po mjeri']] },
];

export const paths = [
  { id: 'od-nule', name: 'Krećem od nule', text: 'Nemate web stranicu ili je zastarjela.',
    steps: ['digitalni-marketing-za-male-firme', 'izrada-web-stranica-vodic', 'wordpress-shopify-ili-custom', 'sta-je-seo-optimizacija', 'kako-mjeriti-rezultate-marketinga'] },
  { id: 'nema-upita', name: 'Imam sajt, nemam upite', text: 'Stranica postoji, ali telefon ne zvoni.',
    steps: ['sta-je-seo-optimizacija', 'seo-aeo-geo-razlika', 'google-oglasi-cijena', 'instagram-facebook-reklama-cijena', 'kako-mjeriti-rezultate-marketinga'] },
  { id: 'prodaja-online', name: 'Želim prodavati online', text: 'Planirate web shop ili ga želite ubrzati.',
    steps: ['kako-otvoriti-web-shop-bih', 'wordpress-shopify-ili-custom', 'instagram-facebook-reklama-cijena', 'plan-sadrzaja-drustvene-mreze', 'kako-mjeriti-rezultate-marketinga'] },
  { id: 'manje-rada', name: 'Želim manje ručnog rada', text: 'Upiti, termini i odgovori oduzimaju dan.',
    steps: ['ai-za-male-firme', 'kako-odabrati-digitalnu-agenciju', 'kako-mjeriti-rezultate-marketinga'] },
];

const a = (href, text) => `<a href="${href}">${text}</a>`;

// Guides are listed in journey order: this order drives "previous / next step".
export const guides = [
  {
    slug: 'digitalni-marketing-za-male-firme', cluster: 'strategija', stage: 'razumjeti', minutes: 6,
    title: 'Digitalni marketing za male firme: plan za prvih 90 dana',
    h1: 'Digitalni marketing za male firme: odakle početi i šta raditi prvih 90 dana',
    desc: 'Šta je digitalni marketing, koje kanale mala firma u BiH zaista treba i kako izgleda realan plan za prvih 90 dana — bez bacanja budžeta.',
    keywords: ['digitalni marketing', 'digitalni marketing za male firme', 'šta je digitalni marketing', 'internet marketing'],
    answer: 'Digitalni marketing je sve što firma radi na internetu da bi je pravi ljudi pronašli, stekli povjerenje i poslali upit: web stranica, vidljivost na Googleu, oglasi, društvene mreže i e-mail. Mala firma ne treba sve odjednom. Treba jednu jasnu ponudu, stranicu koja je objašnjava, jedan kanal koji dovodi ljude i mjerenje koje pokazuje šta radi.',
    sections: [
      ['Pet dijelova koji čine sistem', `<p>Većina firmi kupuje pojedinačne usluge — „treba nam Instagram“, „treba nam sajt“ — pa se čudi što nema rezultata. Dijelovi rade tek kad su povezani:</p>
<ul><li><strong>Ponuda</strong> — šta prodajete, kome i zašto baš vi. Bez ovoga nijedan kanal ne pomaže.</li>
<li><strong>Web stranica</strong> — mjesto gdje se ponuda objašnjava i gdje nastaje upit. ${a('/znanje/izrada-web-stranica-vodic/', 'Vodič kroz izradu web stranice')} pokazuje šta ona mora imati.</li>
<li><strong>Vidljivost</strong> — ${a('/znanje/sta-je-seo-optimizacija/', 'SEO')}, Google mapa i sve češće AI odgovori.</li>
<li><strong>Promet</strong> — ${a('/znanje/google-oglasi-cijena/', 'Google oglasi')}, ${a('/znanje/instagram-facebook-reklama-cijena/', 'Meta reklame')} i sadržaj na mrežama.</li>
<li><strong>Mjerenje</strong> — koliko upita je stiglo, odakle i koliko je koštao svaki.</li></ul>`],
      ['Plan za prvih 90 dana', `<ol><li><strong>Dani 1–30: temelj.</strong> Zapišite ponudu u tri rečenice. Sredite ili napravite web stranicu, otvorite Google Business profil, postavite Google Analytics i Search Console.</li>
<li><strong>Dani 31–60: prvi kanal.</strong> Odaberite jedan izvor prometa. Ako ljudi već traže vašu uslugu na Googleu, krenite s pretragom. Ako prodajete nešto što ljudi ne traže aktivno, krenite s Meta oglasima i sadržajem.</li>
<li><strong>Dani 61–90: mjerenje i popravke.</strong> Pogledajte koje stranice i oglasi donose upite. Ugasite ono što ne radi, pojačajte ono što radi, pa tek onda dodajte drugi kanal.</li></ol>
<p>Ovaj redoslijed je namjerno spor. Firma koja prvo plati oglase, a tek onda primijeti da stranica ne objašnjava ponudu, plaća isti klik dvaput.</p>`],
      ['Koliko budžeta je realno', `<p>Ne postoji jedinstven broj, ali postoji pravilo: prvo platite ono što ostaje vaše (stranica, sadržaj, profil na mapi), pa ono što se troši (oglasi). Za orijentaciju, Digital X početne cijene su javne: ${a('/shop/product/landing-starter/', 'landing stranica od 199 KM')}, ${a('/shop/product/web-presence/', 'prezentacijska stranica od 449 KM')}, ${a('/shop/product/seo-aeo/', 'SEO · GEO · AEO od 249 KM mjesečno')} i ${a('/shop/product/growth-campaigns/', 'vođenje kampanja od 249 KM mjesečno')} uz budžet za oglase. Sve cijene su u ${a('/cjenovnik/', 'cjenovniku')}.</p>`],
      ['Najčešće greške', `<ul><li>Pet kanala odjednom, nijedan dovoljno dugo da pokaže rezultat.</li><li>Oglasi koji vode na početnu stranicu umjesto na stranicu s jednom ponudom.</li><li>Mjerenje lajkova i pregleda umjesto upita i prodaje.</li><li>Sadržaj bez plana — objava kad se neko sjeti.</li></ul>`],
    ],
    faq: [
      ['Šta je digitalni marketing, najkraće rečeno?', 'To je promocija i prodaja putem interneta: web stranica, pretraživači, oglasi, društvene mreže i e-mail, povezani tako da stranac postane kupac.'],
      ['Koji kanal je najbolji za malu firmu?', 'Onaj na kojem vaši kupci već traže rješenje. Za usluge koje ljudi aktivno traže (majstor, stomatolog, advokat) to je Google pretraga i mapa. Za proizvode i impulsivnu kupovinu to su Instagram i Facebook.'],
      ['Mogu li sve raditi sam?', 'Dio možete: Google Business profil, osnovne objave i odgovaranje na upite. Za web stranicu, SEO i kampanje obično se isplati partner, jer se greške tu plaćaju izgubljenim upitima.'],
    ],
    related: [['/usluge/', 'Sve usluge Digital X'], ['/usluge/x-signal/', 'Besplatna analiza sajta'], ['/cjenovnik/', 'Cjenovnik']],
  },
  {
    slug: 'kako-odabrati-digitalnu-agenciju', cluster: 'strategija', stage: 'planirati', minutes: 5,
    title: 'Kako odabrati digitalnu agenciju u BiH: 9 pitanja prije potpisa',
    h1: 'Kako odabrati digitalnu ili marketing agenciju: pitanja koja vrijedi postaviti',
    desc: 'Praktična lista za izbor digitalne agencije u Sarajevu i BiH: šta pitati, koje odgovore tražiti i koji su znakovi da treba otići.',
    keywords: ['marketing agencija', 'marketing agencija sarajevo', 'digitalna agencija', 'kako odabrati agenciju'],
    answer: 'Dobru agenciju prepoznajete po tome što prvo pita o vašem poslu i ciljevima, jasno kaže šta je uključeno u cijenu, pokaže radove i brojeve s izvorom, i ne obećava ono što ne kontroliše — poput prvog mjesta na Googleu. Tražite pisani obim rada, vlasništvo nad domenom i nalozima i dogovoreno mjerenje prije početka.',
    sections: [
      ['Devet pitanja koja razdvajaju ozbiljne od ostalih', `<ol><li><strong>Šta je tačno uključeno u cijenu?</strong> Tražite popis: broj stranica, tekstovi, slike, SEO osnova, izmjene.</li>
<li><strong>Ko je vlasnik domene, hostinga i naloga?</strong> Odgovor mora biti: vi.</li>
<li><strong>Mogu li vidjeti slične projekte?</strong> Ne samo slike — pitajte šta je bio cilj i šta se promijenilo.</li>
<li><strong>Kako mjerite uspjeh?</strong> Upiti, pozivi i prodaja, a ne pregledi i lajkovi.</li>
<li><strong>Ko radi na mom projektu?</strong> Osoba s kojom razgovarate ili neko koga nećete upoznati?</li>
<li><strong>Šta se dešava nakon objave?</strong> Održavanje, sigurnosne kopije, izmjene.</li>
<li><strong>Koliko traje i od čega zavisi rok?</strong> Najčešće od vašeg sadržaja, ne od dizajna.</li>
<li><strong>Šta ako želim prekinuti saradnju?</strong> Otkazni rok i šta ostaje vama.</li>
<li><strong>Šta ne možete garantovati?</strong> Iskren odgovor ovdje vrijedi više od svih obećanja.</li></ol>`],
      ['Znakovi upozorenja', `<ul><li>„Garantujemo prvo mjesto na Googleu.“ Niko ne kontroliše Googleov poredak.</li><li>Cijena bez popisa šta dobijate.</li><li>Domena i oglasni nalozi registrovani na agenciju.</li><li>Izvještaji puni pregleda i dosega, bez ijednog upita.</li><li>Ugovor na godinu dana bez mogućnosti izlaska.</li></ul>`],
      ['Agencija, freelancer ili sam?', `<p><strong>Freelancer</strong> je dobar izbor za jedan jasan zadatak — logo, jednu stranicu, fotografisanje. <strong>Agencija</strong> ima smisla kad dijelovi moraju raditi zajedno: stranica, vidljivost, oglasi i automatizacija. <strong>Sami</strong> možete voditi ono što traži vaše znanje o poslu, poput odgovaranja na upite i recenzija.</p>
<p>Ako upoređujete ponude, uporedite ih po istom obimu. Ponuda od 300 KM i ponuda od 900 KM rijetko opisuju istu stvar — ${a('/blog/koliko-kosta-web-stranica-bih.html', 'vodič kroz cijene web stranica')} pokazuje od čega se razlika sastoji.</p>`],
      ['Kako to radi Digital X', `<p>Početne cijene su javne u ${a('/cjenovnik/', 'cjenovniku')}, obim i dostupnost potvrđujemo pisano prije početka, a domena i nalozi ostaju vaši. Ne garantujemo pozicije ni AI spominjanja; dogovaramo obim rada i mjerila, a rezultate prikazujemo uz izvor i datum. Prvi korak može biti ${a('/usluge/x-signal/', 'besplatna analiza postojeće stranice')} ili ${a('/kontakt.html', 'razgovor bez obaveze')}.</p>`],
    ],
    faq: [
      ['Koliko košta marketing agencija u BiH?', 'Zavisi od obima. Jednokratni poslovi poput landing stranice kreću od nekoliko stotina KM, a mjesečno vođenje SEO-a ili kampanja obično od 249 KM naviše, uz poseban budžet za oglase.'],
      ['Da li je bolje uzeti agenciju iz mog grada?', 'Lokalno poznavanje tržišta pomaže, ali važniji su jasna komunikacija i dokazani radovi. Većina saradnje danas se odvija online.'],
      ['Koliko brzo mogu očekivati rezultate?', 'Oglasi mogu donijeti prve upite za nekoliko dana. SEO i sadržaj obično traže nekoliko mjeseci prije nego što se vidi stabilan rast.'],
    ],
    related: [['/o-nama.html', 'O nama'], ['/projekti/', 'Odabrani radovi'], ['/kontakt.html', 'Kontakt']],
  },
  {
    slug: 'izrada-web-stranica-vodic', cluster: 'web', stage: 'izgraditi', minutes: 7,
    title: 'Izrada web stranica: kompletan vodič za firme u BiH (2026)',
    h1: 'Izrada web stranice za firmu: koraci, rokovi i šta stranica mora imati',
    desc: 'Kako napraviti web stranicu za firmu: koraci izrade, šta pripremiti, koliko traje, koliko košta i po čemu prepoznati stranicu koja donosi upite.',
    keywords: ['izrada web stranica', 'izrada web stranica sarajevo', 'kako napraviti web stranicu za firmu', 'izrada web stranice'],
    answer: 'Izrada web stranice za firmu ima pet koraka: definisanje cilja i ponude, struktura i tekstovi, dizajn, izrada s tehničkom SEO osnovom, te objava i mjerenje. Jednostavna prezentacijska stranica obično je gotova za jednu do tri sedmice. Najveći uticaj na rok i rezultat ima sadržaj — jasna ponuda, tekstovi i fotografije — a ne sam dizajn.',
    sections: [
      ['Pet koraka izrade', `<ol><li><strong>Cilj.</strong> Šta posjetilac treba uraditi: pozvati, poslati upit, rezervisati, kupiti? Jedna stranica, jedan glavni cilj.</li>
<li><strong>Struktura i tekst.</strong> Koje stranice trebate i šta na svakoj piše. Tekst dolazi prije dizajna.</li>
<li><strong>Dizajn.</strong> Izgled koji prati brend i vodi oko prema sljedećem koraku, prvo na mobitelu.</li>
<li><strong>Izrada.</strong> Brz kod, optimizovane slike, ispravni naslovi, meta opisi i strukturirani podaci.</li>
<li><strong>Objava i mjerenje.</strong> Domena, SSL, Analytics, Search Console i provjera svih formi.</li></ol>`],
      ['Šta svaka poslovna stranica mora imati', `<ul><li>Jasan naslov koji u jednoj rečenici kaže šta radite i za koga.</li><li>Kontakt vidljiv na svakoj stranici — telefon, forma, WhatsApp.</li><li>Dokaz: radovi, recenzije, brojevi s izvorom.</li><li>Stranicu za svaku uslugu, ne jednu stranicu „Usluge“ za sve.</li><li>Odgovore na česta pitanja — pomažu i ljudima i ${a('/znanje/seo-aeo-geo-razlika/', 'AI pretrazi')}.</li><li>Brzo učitavanje. ${a('/blog/brzina-sajta.html', 'Spor sajt tiho gubi posjetioce')}.</li><li>Politiku privatnosti i postavke kolačića.</li></ul>`],
      ['Šta pripremiti prije početka', `<p>Projekti najčešće kasne zbog sadržaja. Prije prvog sastanka pripremite: opis usluga i cijena (makar okvirno), fotografije prostora, tima ili proizvoda, logo u dobroj rezoluciji, pristup domeni ako je imate i tri stranice koje vam se sviđaju uz objašnjenje zašto.</p>`],
      ['Koliko košta i koliko traje', `<p>Cijena prati obim. Kod Digital X ${a('/shop/product/landing-starter/', 'landing stranica')} kreće od 199 KM, ${a('/shop/product/web-presence/', 'prezentacijska stranica')} od 449 KM, a ${a('/shop/product/smart-website-launch/', 'Smart Website Launch')} — cinematic web do pet stranica s AI asistentom prva tri mjeseca — košta 499 KM uz plan isporuke 7–14 radnih dana. Detaljno poređenje tržišnih raspona je u vodiču ${a('/blog/koliko-kosta-web-stranica-bih.html', 'koliko košta web stranica u BiH')}.</p>
<p>Nakon objave računajte na ${a('/blog/odrzavanje-sigurnost-vodic.html', 'održavanje')}: ažuriranja, sigurnosne kopije i sitne izmjene.</p>`],
      ['Obična ili cinematic stranica?', `<p>Klasična stranica je dovoljna kad kupac već zna šta traži. ${a('/usluge/cinematic-web-stranice/', 'Cinematic web stranica')} — film koji se kreće dok skrolate — ima smisla kad prodajete iskustvo: hotel, nekretninu, premium proizvod, ordinaciju. Pogledajte ${a('/primjeri-web-stranica/', 'primjere po branšama')} i procijenite sami.</p>`],
    ],
    faq: [
      ['Koliko traje izrada web stranice?', 'Landing stranica nekoliko dana, prezentacijska stranica jednu do tri sedmice, web shop ili aplikacija više sedmica. Rok najviše zavisi od toga koliko brzo stignu tekstovi i fotografije.'],
      ['Mogu li sam napraviti web stranicu besplatno?', 'Možete, uz alate poput WordPressa ili gotovih buildera. Besplatna rješenja obično znače reklame, poddomenu i ograničenja. Za firmu se isplati vlastita domena i stranica koju neko tehnički održava.'],
      ['Da li mi treba web stranica ako imam Instagram?', 'Da. Profil na mreži nije vaš — pravila i doseg se mijenjaju. Web stranica je jedino mjesto koje u potpunosti kontrolišete i koje Google i AI sistemi mogu citirati.'],
      ['Šta je s domenom i hostingom?', 'Domena je adresa (npr. vasafirma.ba), hosting je prostor na kojem stranica živi. Oboje se plaća godišnje i oboje treba biti registrovano na vas.'],
    ],
    related: [['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/usluge/izrada-web-stranica/sarajevo/', 'Izrada web stranica u Sarajevu'], ['/usluge/cinematic-web-stranice/', 'Cinematic web stranice'], ['/shop/product/smart-website-launch/', 'Smart Website Launch — 499 KM']],
  },
  {
    slug: 'wordpress-shopify-ili-custom', cluster: 'web', stage: 'izgraditi', minutes: 5,
    title: 'WordPress, Shopify ili custom web: šta odabrati za firmu',
    h1: 'WordPress, Shopify ili stranica po mjeri: kako odabrati platformu',
    desc: 'Poređenje WordPressa, Shopifyja i stranice po mjeri: kome koja platforma odgovara, šta košta dugoročno i kako donijeti odluku bez kajanja.',
    keywords: ['wordpress', 'shopify', 'woocommerce', 'wordpress ili shopify', 'izrada web stranica wordpress'],
    answer: 'WordPress je najbolji izbor za prezentacijske stranice i blogove koje želite sami uređivati. Shopify je najbrži put do pouzdane web trgovine. Stranica po mjeri isplati se kad su brzina, poseban dizajn ili nestandardne funkcije dio vaše prednosti. Birajte prema tome ko će stranicu održavati i šta ona treba raditi za tri godine, a ne prema početnoj cijeni.',
    sections: [
      ['Poređenje na jednom mjestu', `<div class="table-wrap"><table><thead><tr><th>Kriterij</th><th>WordPress</th><th>Shopify</th><th>Po mjeri</th></tr></thead><tbody>
<tr><th>Najbolje za</th><td>Prezentacije, blog, manje trgovine</td><td>Web trgovine</td><td>Poseban dizajn, brzinu, aplikacije</td></tr>
<tr><th>Samostalno uređivanje</th><td>Lako</td><td>Lako</td><td>Prema dogovoru</td></tr>
<tr><th>Stalni troškovi</th><td>Hosting, dodaci, održavanje</td><td>Mjesečna pretplata i naknade</td><td>Hosting, održavanje</td></tr>
<tr><th>Održavanje</th><td>Redovna ažuriranja su obavezna</td><td>Brine platforma</td><td>Malo dijelova koji se kvare</td></tr>
<tr><th>Brzina</th><td>Zavisi od teme i dodataka</td><td>Dobra</td><td>Najbolja kad je dobro urađena</td></tr>
<tr><th>Rizik</th><td>Zastarjeli dodaci</td><td>Vezanost za platformu</td><td>Vezanost za izvođača</td></tr></tbody></table></div>`],
      ['Kada odabrati WordPress', `<p>Kad želite sami dodavati tekstove i stranice, kad vam treba blog i kad budžet traži provjereno rješenje. Uslov je ${a('/blog/odrzavanje-sigurnost-vodic.html', 'redovno održavanje')} — WordPress bez ažuriranja postaje sigurnosni problem. Za trgovinu postoji WooCommerce, koji daje slobodu, ali traži više brige.</p>`],
      ['Kada odabrati Shopify', `<p>Kad je prodaja glavni posao i želite da plaćanje, korpa i sigurnost jednostavno rade. Platite pretplatu, ali ne brinete o serveru. Prije odluke provjerite koje načine plaćanja i dostave trebate — detalji su u vodiču ${a('/znanje/kako-otvoriti-web-shop-bih/', 'kako otvoriti web shop u BiH')}.</p>`],
      ['Kada se isplati stranica po mjeri', `<p>Kad je prvi dojam dio proizvoda (hotel, nekretnine, premium brend), kad vam treba funkcija koju gotove platforme nemaju ili kad je brzina presudna. Ovako nastaju ${a('/usluge/cinematic-web-stranice/', 'cinematic web stranice')} i ${a('/blog/aplikacije-po-mjeri.html', 'aplikacije po mjeri')}.</p>`],
      ['Tri pitanja za odluku', `<ol><li>Ko će mijenjati sadržaj i koliko često?</li><li>Šta stranica mora raditi osim prikaza — prodaja, rezervacije, prijave?</li><li>Koliki je ukupni trošak za tri godine, ne samo za izradu?</li></ol><p>Ako niste sigurni, ${a('/kontakt.html', 'opišite nam cilj')} i dobićete preporuku s obrazloženjem.</p>`],
    ],
    faq: [
      ['Da li je WordPress besplatan?', 'Sam softver jeste, ali plaćate domenu, hosting, kvalitetnu temu ili izradu i održavanje.'],
      ['Mogu li kasnije promijeniti platformu?', 'Možete, ali selidba traži rad: prenos sadržaja, preusmjerenja starih adresa i provjeru SEO-a. Zato je bolje odabrati pažljivo na početku.'],
      ['Koja platforma je najbolja za SEO?', 'Sve tri mogu biti dobre. Razliku prave brzina, struktura sadržaja i tehnička izvedba, a ne ime platforme.'],
    ],
    related: [['/shop/product/web-presence/', 'Premium web prisustvo — od 449 KM'], ['/shop/product/ecommerce-launch/', 'E-commerce Launch — od 2.490 KM'], ['/shop/product/site-care/', 'Održavanje stranice — od 49 KM']],
  },
  {
    slug: 'kako-otvoriti-web-shop-bih', cluster: 'shop', stage: 'izgraditi', minutes: 7,
    title: 'Kako otvoriti web shop u BiH: koraci, troškovi i platforme',
    h1: 'Kako otvoriti web shop u BiH: od ideje do prve narudžbe',
    desc: 'Vodič za pokretanje web trgovine u BiH: platforma, plaćanje i dostava, fotografije proizvoda, pravne stranice, troškovi i prvi kupci.',
    keywords: ['kako napraviti web shop', 'web shop', 'izrada web shopa', 'online prodavnica', 'kako otvoriti web shop'],
    answer: 'Za web shop u BiH trebate registrovanu djelatnost, platformu (Shopify, WooCommerce ili rješenje po mjeri), dogovorene načine plaćanja i dostave, dobre fotografije i opise proizvoda te pravne stranice: uslove kupovine, povrat i privatnost. Tehnička izrada je lakši dio; teži su logistika, sadržaj i dovođenje prvih kupaca.',
    sections: [
      ['Sedam koraka do prve narudžbe', `<ol><li><strong>Provjerite potražnju.</strong> Traže li ljudi vaš proizvod? Prodajete li ga već uživo ili preko Instagrama?</li>
<li><strong>Riješite formalnosti.</strong> Registracija djelatnosti i fiskalne obaveze — posavjetujte se s knjigovođom, pravila se razlikuju po entitetu.</li>
<li><strong>Odaberite platformu.</strong> ${a('/znanje/wordpress-shopify-ili-custom/', 'WordPress, Shopify ili po mjeri')}.</li>
<li><strong>Dogovorite plaćanje i dostavu.</strong> Plaćanje pouzećem je i dalje važno u BiH; kartično plaćanje dogovarate s bankom ili procesorom plaćanja, a dostavu s kurirskom službom.</li>
<li><strong>Pripremite proizvode.</strong> Fotografije, opisi, cijene, zalihe, kategorije.</li>
<li><strong>Dodajte pravne stranice.</strong> Uslovi kupovine, reklamacije i povrat, privatnost, kolačići.</li>
<li><strong>Testirajte pa objavite.</strong> Prođite cijelu kupovinu na mobitelu prije nego što platite prvi oglas.</li></ol>`],
      ['Šta najviše utiče na prodaju', `<ul><li><strong>Fotografije.</strong> Kupac ne može dotaknuti proizvod. ${a('/blog/foto-video-produkcija.html', 'Amaterske fotografije koštaju kupaca')}.</li><li><strong>Jasna cijena dostave</strong> prije posljednjeg koraka.</li><li><strong>Brzina na mobitelu.</strong></li><li><strong>Povjerenje:</strong> recenzije, kontakt, adresa, jasna pravila povrata.</li><li><strong>Kratka kupovina</strong> — što manje polja, to više narudžbi.</li></ul>`],
      ['Koliko košta web shop', `<p>Troškovi imaju tri dijela: izrada, stalni troškovi (platforma ili hosting, naknade za plaćanje, održavanje) i dovođenje kupaca. Kod Digital X ${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')} kreće od 2.490 KM i uključuje kategorije, proizvode, dostavu, plaćanje i obuku. Budžet za ${a('/znanje/instagram-facebook-reklama-cijena/', 'oglase')} planirajte odvojeno — trgovina bez prometa je samo katalog.</p>`],
      ['Kako do prvih kupaca', `<p>Prvo postojeća publika: pratioci, stari kupci, poznanici. Zatim ${a('/znanje/instagram-facebook-reklama-cijena/', 'Meta oglasi')} s proizvodima koji se već prodaju, pa ${a('/znanje/sta-je-seo-optimizacija/', 'SEO')} za kategorije koje ljudi traže. ${a('/znanje/plan-sadrzaja-drustvene-mreze/', 'Plan sadržaja')} drži trgovinu vidljivom između kampanja.</p>`],
    ],
    faq: [
      ['Da li mi treba firma za web shop?', 'Za redovnu prodaju da — potrebna je registrovana djelatnost. Tačan oblik i obaveze provjerite s knjigovođom jer zavise od entiteta i vrste robe.'],
      ['Mogu li prodavati samo preko Instagrama?', 'Možete početi tako, ali narudžbe u porukama teško rastu. Web shop automatizuje korpu, plaćanje i evidenciju i ne zavisi od pravila jedne mreže.'],
      ['Koliko proizvoda trebam za početak?', 'Nema minimuma. Bolje je deset dobro predstavljenih proizvoda nego dvjesto bez fotografija i opisa.'],
      ['Shopify ili WooCommerce za BiH?', 'Oba rade. Shopify je jednostavniji za održavanje, WooCommerce daje više slobode. Prije odluke provjerite podršku za načine plaćanja i dostave koje želite koristiti.'],
    ],
    related: [['/usluge/izrada-web-shopa/', 'Izrada web shopa'], ['/shop/product/ecommerce-launch/', 'E-commerce Launch — od 2.490 KM'], ['/usluge/fotografija-proizvoda/', 'Fotografija proizvoda']],
  },
  {
    slug: 'sta-je-seo-optimizacija', cluster: 'seo', stage: 'pronadjen', minutes: 6,
    title: 'Šta je SEO optimizacija i koliko košta u BiH (2026)',
    h1: 'Šta je SEO optimizacija: kako radi, koliko košta i kada daje rezultate',
    desc: 'SEO optimizacija objašnjena jednostavno: tri dijela SEO-a, šta možete sami, koliko košta u BiH, koliko se čeka na rezultate i kako prepoznati lošu ponudu.',
    keywords: ['seo optimizacija', 'šta je seo', 'šta je seo optimizacija', 'seo optimizacija cijena', 'seo optimizacija sarajevo'],
    answer: 'SEO (optimizacija za pretraživače) je uređivanje web stranice tako da je Google razumije, smatra pouzdanom i prikaže ljudima koji traže ono što nudite. Sastoji se od tri dijela: tehničke osnove, sadržaja koji odgovara na pitanja i povjerenja koje grade linkovi i recenzije. Rezultati se obično vide nakon nekoliko mjeseci i ne nestaju kad prestanete plaćati oglase.',
    sections: [
      ['Tri dijela SEO-a', `<p>Svaki održiv SEO sistem oslanja se na tri povezana stuba: tehničku dostupnost za pretraživače, sadržaj koji direktno odgovara na pitanja kupaca i vanjske signale povjerenja. Prema zvaničnim smjernicama <a href="https://developers.google.com/search/docs/fundamentals/how-search-works" target="_blank" rel="noopener">Google Search Centrala</a>, nijedan od ova tri dijela ne može dugoročno nadoknaditi nedostatak ostalih.</p>
<ul><li><strong>Tehnički SEO.</strong> Može li Google otvoriti, pročitati i brzo učitati vaše stranice: Core Web Vitals brzina, mobilni prikaz, mapa sajta, ispravne adrese, strukturirani podaci.</li>
<li><strong>Sadržaj.</strong> Posebna stranica za svaku uslugu i temu, napisana riječima koje kupci koriste, s jasnim naslovima i odgovorima od 40–80 riječi.</li>
<li><strong>Povjerenje.</strong> Linkovi s drugih relevantnih stranica, ${a('/blog/automatizacija-recenzija.html', 'recenzije')}, spominjanja firme i dosljedni podaci o firmi svuda na internetu.</li></ul>`],
      ['Lokalni SEO: mapa i „blizu mene“', `<p>Za ordinacije, salone, majstore i restorane najvažniji je Google Business profil. Tačna kategorija, radno vrijeme, fotografije i redovne recenzije često donesu više poziva nego sama web stranica. Korake nalazite u vodiču ${a('/blog/lokalni-seo-google-mapa.html', 'kako biti prvi na Google mapi')}.</p>`],
      ['Šta možete uraditi sami', `<p>Prije angažovanja agencije možete sami provjeriti osnovne tehničke i lokalne signale koji direktno utiču na indeksiranje i vidljivost na mapi. Sljedećih pet koraka ne traži programiranje i daje jasnu sliku trenutnog stanja:</p>
<ol><li>Otvorite i popunite Google Business profil.</li><li>Prijavite stranicu u Google Search Console i pošaljite mapu sajta.</li><li>Za svaku uslugu napišite posebnu stranicu s jasnim naslovom.</li><li>Tražite recenziju nakon svake završene usluge.</li><li>Provjerite brzinu i HTML signale — ${a('/usluge/x-signal/', 'besplatna X Signal analiza')} pokazuje odakle početi.</li></ol>`],
      ['Koliko košta SEO optimizacija', `<p>SEO se plaća kao jednokratno sređivanje ili kao mjesečni rad. Cijena zavisi od veličine stranice, konkurencije i toga ko piše sadržaj. Kod Digital X paket ${a('/shop/product/seo-aeo/', 'SEO · GEO · AEO')} kreće od 249 KM mjesečno i obuhvata tehničku osnovu, lokalnu vidljivost, sadržaj i strukturu za Google i AI odgovore. Jednokratna ${a('/shop/product/speed-optimization/', 'speed optimizacija')} kreće od 99 KM, a poređenje modela je na stranici ${a('/usluge/seo-aeo-geo-cijena/', 'SEO, GEO i AEO cijene')}.</p>`],
      ['Kada stižu rezultati', `<p>Tehničke popravke Google primijeti za nekoliko dana do sedmica. Rast za konkurentne pojmove obično traje tri do šest mjeseci, ponekad duže. Zato se SEO i ${a('/znanje/google-oglasi-cijena/', 'Google oglasi')} često kombinuju: oglasi donose upite odmah, SEO gradi vidljivost koja ostaje.</p>`],
      ['SEO više nije samo Google', `<p>Sve više ljudi pitanje postavi ChatGPT-u ili pročita AI pregled iznad rezultata. Isti temelji važe, ali se dodaju nova pravila — objašnjena u vodiču ${a('/znanje/seo-aeo-geo-razlika/', 'SEO, AEO i GEO: u čemu je razlika')} i u našem ${a('/znanje/ai-spremnost-web-stranica-bih-2026/', 'X Signal 2026 benchmarku')}.</p>`],
    ],
    faq: [
      ['Da li neko može garantovati prvo mjesto na Googleu?', 'Ne. Poredak određuje Google prema stotinama signala i konkurenciji. Ozbiljan izvođač garantuje obim rada i transparentno mjerenje, ne poziciju.'],
      ['Koliko dugo traje SEO?', 'Prve promjene vide se za nekoliko sedmica, stabilan rast obično za tri do šest mjeseci. SEO nije jednokratan posao jer se i konkurencija i pretraga mijenjaju.'],
      ['Šta je bolje: SEO ili Google oglasi?', 'Nisu zamjena jedno drugom. Oglasi daju upite odmah dok plaćate, SEO gradi trajnu vidljivost. Većini firmi treba oboje, različitim redoslijedom.'],
      ['Šta su ključne riječi?', 'To su izrazi koje ljudi upisuju u pretragu, na primjer „stomatolog Sarajevo“. Dobar SEO počinje od toga da saznate koje izraze vaši kupci stvarno koriste.'],
    ],
    related: [['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga'], ['/shop/product/seo-aeo/', 'SEO paket — od 249 KM mjesečno'], ['/usluge/x-signal/', 'Besplatna analiza sajta']],
  },
  {
    slug: 'seo-aeo-geo-razlika', cluster: 'ai-pretraga', stage: 'pronadjen', minutes: 6,
    title: 'SEO, AEO i GEO: razlika i kako se pojaviti u AI odgovorima',
    h1: 'SEO, AEO i GEO: u čemu je razlika i šta od toga treba vašoj firmi',
    desc: 'Šta znače SEO, AEO i GEO, kako ChatGPT, Gemini i Google AI pregledi biraju izvore i šta konkretno uraditi da AI preporuči vašu firmu.',
    keywords: ['aeo', 'geo optimizacija', 'seo aeo geo', 'ai pretraga', 'kako se pojaviti u chatgpt', 'answer engine optimization'],
    answer: 'SEO vas dovodi u rezultate Google pretrage. AEO (Answer Engine Optimization) oblikuje sadržaj tako da ga sistemi mogu preuzeti kao direktan odgovor. GEO (Generative Engine Optimization) povećava šanse da vas AI asistenti poput ChatGPT-a, Geminija i Perplexityja navedu kao izvor. Nisu tri odvojena posla: AEO i GEO su nadogradnja na dobar SEO.',
    sections: [
      ['Tri pojma, jedna tabela', `<p>SEO, AEO i GEO nisu tri odvojena budžeta nego tri sloja iste vidljivosti: tehnička dostupnost za pretraživače, jasni pasusi za direktne odgovore i provjerljivi podaci za generativne AI sisteme. Tabela ispod sažima gdje se svaki sloj vidi i kako se mjeri.</p>
<div class="table-wrap"><table><thead><tr><th></th><th>SEO</th><th>AEO</th><th>GEO</th></tr></thead><tbody>
<tr><th>Gdje se vidite</th><td>Google rezultati i mapa</td><td>Istaknuti odgovori, glasovna pretraga</td><td>ChatGPT, Gemini, Perplexity, AI pregledi</td></tr>
<tr><th>Šta sistem traži</th><td>Relevantnu, brzu, pouzdanu stranicu</td><td>Kratak, jasan odgovor na pitanje</td><td>Provjerljive činjenice i izvor kojem vjeruje</td></tr>
<tr><th>Ključni posao</th><td>Tehnika, sadržaj, linkovi</td><td>Pitanja i odgovori, struktura, schema</td><td>Dosljedni podaci o firmi, spominjanja, citabilnost</td></tr>
<tr><th>Kako se mjeri</th><td>Pozicije, klikovi, upiti</td><td>Prikazi u odgovorima</td><td>Spominjanja i citati u AI odgovorima</td></tr></tbody></table></div>`],
      ['Kako AI bira koga će navesti', `<p>AI asistenti i Google AI Mode razlažu složene upite na paralelne podupite (query fan-out) i izdvajaju konkretne pasuse umjesto cijelih stranica. Recenzirano KDD 2024 istraživanje (<a href="https://arxiv.org/pdf/2311.09735" target="_blank" rel="noopener">Aggarwal et al., GEO-bench</a>) pokazalo je da provjerljive statistike, citati i izvori podižu generativnu vidljivost do 40%, dok studija Chen et al. (2025) potvrđuje prednost nezavisnih publikacija nad samopromotivnim blogovima.</p>
<div class="table-wrap"><table><thead><tr><th>AI sistem</th><th>Odakle najčešće povlači podatke</th><th>Šta najviše pomaže citiranju</th></tr></thead><tbody>
<tr><th>Google AI Overviews</th><td>Google indeks, Core Web Vitals, lokalni signali</td><td>Odgovor-prvo struktura, jasni H2/H3 naslovi, tehnički SEO</td></tr>
<tr><th>ChatGPT Search</th><td>Bing/web pretraga, OAI-SearchBot, javne činjenice</td><td>Dozvoljen pristup u robots.txt, tabele cijena, vanjska spominjanja</td></tr>
<tr><th>Perplexity &amp; Gemini</th><td>Direktni izvori, Google Business Profile, recenzije</td><td>Dosljedan NAP, Schema.org entiteti, stranica činjenica i pojmovnik</td></tr></tbody></table></div>`],
      ['Sedam konkretnih koraka', `<p>Prema zvaničnoj dokumentaciji <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener">Google Search Central: AI Features</a>, za AI Overviews i AI Mode nisu potrebni posebni AI fajlovi ni eksperimentalna schema, već uredan HTML, Core Web Vitals i tačni strukturirani podaci. Sljedećih sedam koraka spaja Googleove standarde i GEO praksu:</p>
<ol><li><strong>Odgovorite odmah.</strong> Svaki H2 otvorite samostalnim pasusom od 40–80 riječi koji direktno odgovara na podupit.</li>
<li><strong>Pišite pitanja kao naslove.</strong> Onako kako ih ljudi postavljaju u pretrazi i AI chatu.</li>
<li><strong>Navedite činjenice i izvore.</strong> Cijene, rokove, lokaciju i primarne izvore — s datumom i jasnom ${a('/uredjivacka-politika/', 'uredničkom metodologijom')}.</li>
<li><strong>Dodajte aktuelne strukturirane podatke.</strong> Organization, LocalBusiness, Service, Article i BreadcrumbList koji tačno prate vidljivi tekst (Google od 2023. ograničava FAQ rich rezultate na državne i zdravstvene sajtove).</li>
<li><strong>Uskladite podatke o firmi.</strong> Isto ime, adresa, telefon i e-mail na stranici, mapi, direktorijima i mrežama.</li>
<li><strong>Provjerite robots.txt i snippet direktive</strong> (<code>max-snippet:-1, max-image-preview:large</code>); po želji dodajte opcionalni llms.txt za treće AI alate (Google ga ne zahtijeva).</li>
<li><strong>Budite spomenuti drugdje.</strong> Portali, poslovni direktoriji, recenzije, studije slučaja i originalni podaci poput našeg ${a('/znanje/ai-spremnost-web-stranica-bih-2026/', 'X Signal 2026 benchmarka')}.</li></ol>`],
      ['Provjera spremnosti vaše stranice za AI pretragu', `<p>Brza samoprovjera pokazuje da li vaša stranica daje dovoljno jasnih signala i klasičnom Googleu i AI asistentima. Ako na više od dva pitanja ispod odgovorite negativno, krenite od ${a('/usluge/x-signal/', 'besplatne X Signal analize')}:</p>
<ul><li>Imate li posebnu stranicu za svaku ključnu uslugu s jasnim cijenama ili rasponima?</li><li>Postoji li na stranici kratak odgovor od 40–80 riječi odmah ispod glavnog naslova i svakog H2?</li><li>Jesu li naziv firme, adresa i telefon identični na webu, Google Business profilu i društvenim mrežama?</li><li>Imate li jasnu uredničku odgovornost, datum ažuriranja i provjerljive izvore na stranici?</li></ul>
<p>Osnovne pojmove iz ove oblasti možete provjeriti i u našem ${a('/pojmovnik/', 'pojmovniku za SEO, AEO, GEO i AI')}.</p>`],
      ['Šta od ovoga treba maloj firmi', `<p>Prvo ${a('/znanje/sta-je-seo-optimizacija/', 'SEO osnova')} i Google Business profil. Zatim stranice s jasnim odgovorima i čestim pitanjima — to je AEO. GEO dolazi prirodno kad su podaci o firmi dosljedni i kad vas drugi spominju. Više o praktičnoj strani je u vodiču ${a('/blog/aeo-vodic.html', 'kako da vas ChatGPT preporuči')} i na stranici ${a('/usluge/seo-aeo-geo-cijena/', 'SEO, GEO i AEO cijene')}.</p>`],
      ['Šta se ne može obećati', `<p>AI odgovori nisu isti za svakog korisnika i mijenjaju se iz dana u dan. Niko ne može garantovati da će vas ChatGPT spomenuti. Može se pratiti koliko često i u kojim odgovorima se pojavljujete — tome služi ${a('/usluge/ai-visibility-tracker/', 'AI Visibility Tracker')} — i sistematski povećavati šanse.</p>`],
    ],
    faq: [
      ['Šta je AEO?', 'AEO je Answer Engine Optimization: oblikovanje sadržaja tako da ga pretraživači i asistenti mogu preuzeti kao direktan odgovor na pitanje.'],
      ['Šta je GEO?', 'GEO je Generative Engine Optimization: rad na tome da generativni AI sistemi poput ChatGPT-a i Geminija vašu firmu prepoznaju i navode kao izvor.'],
      ['Da li AEO i GEO zamjenjuju SEO?', 'Ne. Grade se na njemu. AI sistemi velikim dijelom koriste iste signale kao pretraživači: jasan sadržaj, tehničku ispravnost i povjerenje.'],
      ['Šta je llms.txt?', 'To je tekstualna datoteka u korijenu stranice sa sažetkom ko ste, šta nudite i gdje su najvažnije stranice, napisana tako da je AI sistemi lako pročitaju.'],
    ],
    related: [['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga'], ['/usluge/ai-visibility-tracker/', 'AI Visibility Tracker'], ['/usluge/x-signal/', 'Besplatna analiza sajta']],
  },
  {
    slug: 'google-oglasi-cijena', cluster: 'oglasi', stage: 'privuci', minutes: 6,
    title: 'Google oglasi: cijena, budžet i kako rade (vodič 2026)',
    h1: 'Google oglasi: koliko koštaju i kako odrediti budžet',
    desc: 'Kako se formira cijena Google oglasa, koliki budžet je razuman za firmu u BiH, koje vrste kampanja postoje i kako izbjeći bacanje novca.',
    keywords: ['google oglasi', 'google oglasi cijena', 'google ads', 'oglašavanje na googlu', 'google ads cijena'],
    answer: 'Google oglasi nemaju fiksnu cijenu. Plaćate svaki klik, a cijena klika se formira na aukciji i zavisi od konkurencije, ključne riječi i kvaliteta vašeg oglasa i stranice. Sami određujete dnevni budžet i možete stati kad želite. Ukupan trošak čine budžet za oglase, koji ide Googleu, i naknada za postavljanje i vođenje kampanja.',
    sections: [
      ['Kako se formira cijena klika', `<p>Svaki put kad neko pretražuje, Google održi aukciju među oglašivačima. Ne pobjeđuje uvijek onaj ko ponudi najviše: računa se i ocjena kvaliteta — koliko su oglas i odredišna stranica relevantni za pretragu. Bolji oglas i ${a('/blog/landing-stranica-vodic.html', 'bolja landing stranica')} znače nižu cijenu klika za istu poziciju.</p>`],
      ['Kako odrediti budžet', `<p>Krenite unazad, od cilja:</p><ol><li>Koliko novih upita mjesečno želite?</li><li>Koliki dio posjetilaca pošalje upit? To je stopa konverzije vaše stranice.</li><li>Koliko klikova vam onda treba?</li><li>Pomnožite s prosječnom cijenom klika u vašoj branši — vidi se u Google Keyword Planneru.</li></ol>
<p><em>Ilustracija računa:</em> ako od 100 posjetilaca 5 pošalje upit, za 20 upita treba vam 400 klikova. Stvarne cijene klika razlikuju se po branši i gradu, zato prve dvije do četiri sedmice služe za mjerenje, ne za zaključke.</p>`],
      ['Vrste kampanja', `<ul><li><strong>Pretraga.</strong> Tekstualni oglasi kad neko traži vašu uslugu. Najbolji početak za uslužne firme.</li><li><strong>Performance Max.</strong> Google sam raspoređuje oglase po svim kanalima; traži dobro mjerenje konverzija.</li><li><strong>Shopping.</strong> Proizvodi sa slikom i cijenom, za web trgovine.</li><li><strong>YouTube i Display.</strong> Za prepoznatljivost i ponovno obraćanje posjetiocima.</li></ul>`],
      ['Gdje budžet najčešće curi', `<ul><li>Preširoke ključne riječi bez liste isključenih pojmova.</li><li>Oglasi vode na početnu stranicu umjesto na stranicu ponude.</li><li>Konverzije se ne mjere, pa se optimizuje „na osjećaj“.</li><li>Kampanja se prikazuje u cijeloj državi, a radite u jednom gradu.</li><li>Niko ne pregleda izvještaj o stvarnim pojmovima pretrage.</li></ul>`],
      ['Koliko košta vođenje kampanja', `<p>Vođenje se plaća odvojeno od budžeta za oglase. Kod Digital X ${a('/shop/product/growth-campaigns/', 'Kampanje za rast')} kreću od 249 KM mjesečno plus budžet, a obuhvataju Meta i Google kampanje povezane s landing stranicom, analitikom i prodajnim ciljem. Detalji su na stranici ${a('/usluge/google-ads/', 'Google Ads usluge')}.</p>`],
    ],
    faq: [
      ['Koliki je minimalni budžet za Google oglase?', 'Google ne propisuje minimum. Budžet treba biti dovoljan da kampanja dnevno skupi smislen broj klikova, inače nema podataka za odluke.'],
      ['Koliko brzo Google oglasi daju rezultate?', 'Oglasi se mogu prikazivati isti dan. Prve dvije do četiri sedmice služe za prikupljanje podataka i podešavanje.'],
      ['Mogu li sam voditi Google oglase?', 'Možete. Rizik je plaćanje nerelevantnih klikova dok učite. Ako vodite sami, obavezno postavite mjerenje konverzija i sedmično pregledajte pojmove pretrage.'],
      ['Google oglasi ili Facebook i Instagram oglasi?', 'Google hvata ljude koji već traže rješenje. Meta oglasi stvaraju interes kod ljudi koji još ne traže. Izbor zavisi od toga kako se vaš proizvod kupuje.'],
    ],
    related: [['/usluge/google-ads/', 'Google Ads usluga'], ['/usluge/digitalne-kampanje/', 'Digitalne kampanje'], ['/shop/product/landing-starter/', 'Landing stranica — od 199 KM']],
  },
  {
    slug: 'instagram-facebook-reklama-cijena', cluster: 'oglasi', stage: 'privuci', minutes: 6,
    title: 'Instagram i Facebook reklama: cijena i kako početi (2026)',
    h1: 'Instagram i Facebook reklama: koliko košta i kako je postaviti da radi',
    desc: 'Koliko košta reklama na Instagramu i Facebooku, razlika između „Promoviši objavu“ i Ads Managera, kako odabrati cilj, publiku i kreativu.',
    keywords: ['instagram reklama', 'instagram reklama cijena', 'facebook oglasi', 'cijena reklame na instagramu', 'sponzorisane objave'],
    answer: 'Reklama na Instagramu i Facebooku nema fiksnu cijenu. Sami birate dnevni ili ukupni budžet, a Meta naplaćuje prikaze prema konkurenciji za vašu publiku. Na rezultat najviše utiču kreativa (slika ili video), ponuda i stranica na koju oglas vodi — mnogo više nego sitna podešavanja publike.',
    sections: [
      ['„Promoviši objavu“ ili Ads Manager', `<p>Dugme <strong>Promoviši</strong> je najbrži način, ali daje malo kontrole i najčešće optimizuje za lajkove i preglede. <strong>Meta Ads Manager</strong> traži više učenja, ali omogućava cilj „upiti“ ili „prodaja“, testiranje više kreativa i mjerenje onoga što se desi nakon klika. Za ozbiljno oglašavanje koristite Ads Manager.</p>`],
      ['Odaberite cilj koji odgovara poslu', `<ul><li><strong>Upiti (leads)</strong> — za usluge: forma, poruka ili poziv.</li><li><strong>Prodaja</strong> — za web trgovine, uz ispravno postavljen Meta Pixel.</li><li><strong>Promet</strong> — kad želite posjete određenoj stranici.</li><li><strong>Svijest</strong> — za otvaranje, događaje i nove brendove.</li></ul><p>Meta isporučuje ono što tražite. Ako tražite angažman, dobićete lajkove, ne kupce.</p>`],
      ['Od čega zavisi cijena', `<ul><li>Koliko oglašivača cilja istu publiku i u koje doba godine.</li><li>Kvalitet kreative — oglasi koje ljudi gledaju i klikaju plaćaju manje.</li><li>Veličina publike: premala publika brzo poskupi.</li><li>Cilj kampanje: prodaja je skuplja od pregleda jer je vrednija.</li></ul><p>Zato pitanje nije „koliko košta reklama“, nego „koliko me košta jedan upit ili narudžba“. To saznate tek kad mjerite — vidi ${a('/znanje/kako-mjeriti-rezultate-marketinga/', 'kako mjeriti rezultate')}.</p>`],
      ['Kreativa odlučuje', `<p>Prve dvije sekunde videa ili prvi pogled na sliku odlučuju da li će se neko zaustaviti. Pokažite proizvod u upotrebi, recite za koga je i šta treba uraditi. Testirajte tri do pet različitih kreativa umjesto jedne „savršene“. Kvalitetan materijal dolazi iz ${a('/usluge/produkcija-sadrzaja/', 'planirane produkcije')}, ne iz slučajnih fotografija.</p>`],
      ['Najčešće greške', `<ul><li>Oglas vodi na profil ili početnu stranicu umjesto na ponudu.</li><li>Nema Pixela, pa Meta ne zna ko je kupio.</li><li>Kampanja se mijenja svaki dan i nikad ne završi fazu učenja.</li><li>Budžet se dijeli na previše malih kampanja.</li></ul>`],
      ['Koliko košta vođenje', `<p>Budžet za oglase ide Meti, a postavljanje i vođenje plaća se odvojeno. Digital X ${a('/shop/product/growth-campaigns/', 'Kampanje za rast')} kreću od 249 KM mjesečno plus budžet. Šta je uključeno piše na stranici ${a('/usluge/meta-ads/', 'Meta Ads usluge')}, a širu sliku daje vodič ${a('/blog/google-meta-oglasi-vodic.html', 'budžet u upite, ne u lajkove')}.</p>`],
    ],
    faq: [
      ['Koliko košta reklama na Instagramu?', 'Koliko odredite. Sami postavljate dnevni ili ukupni budžet. Stvarna mjera je cijena jednog upita ili prodaje, koja zavisi od publike, kreative i ponude.'],
      ['Da li je bolje oglašavati na Instagramu ili Facebooku?', 'Oba se vode iz istog alata. Najčešće je najbolje pustiti Metu da sama raspodijeli prikaze i pratiti gdje dolaze rezultati.'],
      ['Koliko dugo treba da reklama „proradi“?', 'Kampanji treba nekoliko dana da izađe iz faze učenja. Zaključke donosite nakon jedne do dvije sedmice, ne nakon jednog dana.'],
      ['Treba li mi web stranica za Instagram reklame?', 'Nije obavezna, ali pomaže. Stranica s jednom jasnom ponudom obično pretvara više klikova u upite i omogućava tačno mjerenje.'],
    ],
    related: [['/usluge/meta-ads/', 'Meta Ads usluga'], ['/usluge/optimizacija-meta-oglasa/', 'Optimizacija Meta oglasa'], ['/znanje/kako-smanjiti-cijenu-facebook-oglasa/', 'Kako smanjiti cijenu Facebook oglasa'], ['/usluge/digitalne-kampanje/', 'Digitalne kampanje'], ['/usluge/video-proizvoda/', 'Video proizvoda']],
  },
  {
    slug: 'plan-sadrzaja-drustvene-mreze', cluster: 'sadrzaj', stage: 'privuci', minutes: 5,
    title: 'Plan sadržaja za društvene mreže: šta objavljivati i koliko često',
    h1: 'Plan sadržaja za društvene mreže: jednostavan sistem za mjesec dana objava',
    desc: 'Kako napraviti plan sadržaja za Instagram, Facebook i TikTok: stubovi sadržaja, formati, učestalost objava i mjesečni kalendar koji se može održati.',
    keywords: ['plan sadržaja', 'društvene mreže', 'vođenje društvenih mreža', 'šta objavljivati na instagramu', 'kalendar objava'],
    answer: 'Dobar plan sadržaja počiva na tri do pet stalnih tema („stubova“) koje se ponavljaju: stručnost, dokaz, proces, ponuda i ljudi. Za svaku temu unaprijed pripremite nekoliko objava, snimite ih u jednom danu i rasporedite kroz mjesec. Dosljednost od dvije do tri kvalitetne objave sedmično vrijedi više od svakodnevnih objava bez plana.',
    sections: [
      ['Pet stubova sadržaja', `<ul><li><strong>Stručnost.</strong> Savjeti i odgovori na pitanja koja stalno dobijate.</li><li><strong>Dokaz.</strong> Rezultati, recenzije, prije i poslije.</li><li><strong>Proces.</strong> Kako radite — iza scene.</li><li><strong>Ponuda.</strong> Šta prodajete, kome i kako naručiti.</li><li><strong>Ljudi.</strong> Tim, vrijednosti, priča firme.</li></ul><p>Ponuda treba biti otprilike svaka četvrta ili peta objava. Ostalo gradi razlog da vas neko uopšte prati.</p>`],
      ['Koji format za šta', `<ul><li><strong>Kratki video (Reels, TikTok)</strong> — doseg do novih ljudi.</li><li><strong>Karusel</strong> — objašnjenja i liste koje se čuvaju.</li><li><strong>Story</strong> — svakodnevni kontakt s postojećim pratiocima.</li><li><strong>Fotografija</strong> — proizvod, prostor, rezultat.</li></ul>`],
      ['Mjesečni sistem u četiri koraka', `<ol><li><strong>Planiranje (1 sat).</strong> Za svaki stub zapišite dvije do tri ideje.</li><li><strong>Snimanje (pola dana).</strong> Sve fotografije i video snimite odjednom.</li><li><strong>Priprema.</strong> Montaža, tekstovi i raspored objava unaprijed.</li><li><strong>Pregled na kraju mjeseca.</strong> Koje su objave donijele poruke, posjete profilu i upite? Njih ponovite u novom obliku.</li></ol>`],
      ['Koliko često objavljivati', `<p>Onoliko koliko možete održati šest mjeseci. Za većinu malih firmi to su dvije do tri objave sedmično i story nekoliko puta sedmično. Bolje rjeđe i dobro nego svaki dan na silu.</p>`],
      ['Organski sadržaj i oglasi', `<p>Objave koje same dobro prođu najbolji su kandidati za ${a('/znanje/instagram-facebook-reklama-cijena/', 'plaćenu promociju')}. Sadržaj gradi povjerenje, oglasi ga dovode pred nove ljude, a ${a('/znanje/izrada-web-stranica-vodic/', 'web stranica')} pretvara pažnju u upit.</p><p>Ako nemate vremena, ${a('/usluge/drustvene-mreze/', 'vođenje mreža')} možete prepustiti — prije toga pročitajte ${a('/blog/vodjenje-drustvenih-mreza.html', 'šta zapravo plaćate')} i ${a('/blog/content-marketing-vodic.html', 'kako sadržaj prodaje')}.</p>`],
    ],
    faq: [
      ['Koliko puta sedmično treba objavljivati?', 'Dvije do tri kvalitetne objave sedmično dovoljne su većini malih firmi. Važnija je redovnost nego broj.'],
      ['Koja mreža je najbolja za moju firmu?', 'Ona na kojoj su vaši kupci. Instagram i Facebook pokrivaju većinu lokalnih firmi, TikTok mlađu publiku, LinkedIn poslovne usluge.'],
      ['Koliko košta vođenje društvenih mreža?', 'Zavisi od broja objava, snimanja i da li je uključeno oglašavanje. Digital X Sistem sadržaja kreće od 249 KM mjesečno.'],
    ],
    related: [['/usluge/drustvene-mreze/', 'Upravljanje društvenim mrežama'], ['/usluge/produkcija-sadrzaja/', 'Produkcija sadržaja'], ['/shop/product/content-system/', 'Sistem sadržaja — od 249 KM mjesečno']],
  },
  {
    slug: 'ai-za-male-firme', cluster: 'ai', stage: 'automatizovati', minutes: 6,
    title: 'AI za male firme: 7 primjena koje se isplate i odakle početi',
    h1: 'AI u maloj firmi: gdje umjetna inteligencija stvarno štedi vrijeme',
    desc: 'Praktičan vodič za AI u maloj firmi: gdje umjetna inteligencija pomaže, šta košta, koji su rizici i kako uvesti prvi AI alat bez haosa.',
    keywords: ['umjetna inteligencija', 'ai alati', 'ai za firme', 'ai asistent', 'automatizacija poslovanja', 'chatgpt za posao'],
    answer: 'Mala firma od AI-ja ima najviše koristi tamo gdje se isti posao stalno ponavlja: odgovaranje na česta pitanja, zakazivanje termina, prvi odgovor na upit, pisanje nacrta tekstova i sažimanje dokumenata. Počnite od jednog procesa koji vam sedmično oduzima najviše vremena, automatizujte ga i izmjerite uštedu prije nego što dodate sljedeći.',
    sections: [
      ['Sedam primjena koje se najbrže isplate', `<ol><li><strong>Asistent na web stranici</strong> koji odgovara na pitanja i prikuplja upite i van radnog vremena — ${a('/blog/ai-chatbot-vodic.html', 'vodič kroz AI chatbot')}.</li>
<li><strong>AI recepcionar</strong> za pozive i zakazivanje — ${a('/usluge/ai-receptionist/', 'kako radi')}.</li>
<li><strong>Prvi odgovor na upit</strong> za nekoliko minuta umjesto sutradan.</li>
<li><strong>Podsjetnici za termine</strong> i potvrde dolaska.</li>
<li><strong>Zahtjevi za recenziju</strong> nakon usluge — ${a('/blog/automatizacija-recenzija.html', 'recenzije na autopilotu')}.</li>
<li><strong>Nacrti tekstova</strong>: objave, ponude, opisi proizvoda, koje čovjek pregleda.</li>
<li><strong>Znanje firme na jednom mjestu</strong> — ${a('/usluge/ai-second-brain/', 'AI Second Brain')} pretražuje vaše dokumente i procedure.</li></ol>`],
      ['Alat ili sistem?', `<p>ChatGPT, Claude ili Gemini kao <strong>alat</strong> pomažu jednoj osobi da brže piše i razmišlja. <strong>Sistem</strong> je kad AI radi sam unutar procesa: primi upit, postavi pitanja, upiše podatke i obavijesti odgovornu osobu. Alat košta pretplatu. Sistem traži postavljanje, ali radi i kad niko nije za računarom. Šta se sve može povezati pokazuje vodič ${a('/blog/ai-automatizacija-vodic.html', 'šta se može automatizovati')}.</p>`],
      ['Kako uvesti prvi AI proces', `<ol><li>Popišite poslove koji se ponavljaju i koliko vremena uzimaju.</li><li>Odaberite jedan: čest, jednostavan i s jasnim pravilima.</li><li>Zapišite pravila — šta asistent smije reći, a kada predaje čovjeku.</li><li>Pokrenite na malom uzorku i čitajte razgovore.</li><li>Izmjerite: koliko upita, koliko brže, koliko grešaka.</li></ol>`],
      ['Rizici o kojima treba misliti', `<ul><li><strong>Tačnost.</strong> AI može zvučati sigurno i pogriješiti. Asistent treba odgovarati samo iz odobrenih informacija.</li><li><strong>Privatnost.</strong> Lični podaci klijenata ne unose se u alate bez provjere uslova i saglasnosti.</li><li><strong>Predaja čovjeku.</strong> Uvijek mora postojati jasan put do stvarne osobe.</li><li><strong>Iskrenost.</strong> Ljudi trebaju znati da razgovaraju s asistentom.</li></ul>`],
      ['Koliko košta', `<p>Digital X početne cijene: ${a('/shop/product/ai-concierge/', 'AI prodajni asistent')} od 490 KM uz održavanje, ${a('/shop/product/workflow-starter/', 'Automation Starter')} — jedan prioritetni tok rada — od 349 KM, i ${a('/shop/product/review-engine/', 'Sistem recenzija')} od 199 KM uz održavanje. Asistenta možete ${a('/ai-concierge-preview/', 'isprobati uživo')} prije odluke.</p>`],
    ],
    faq: [
      ['Da li će AI zamijeniti moje zaposlenike?', 'U maloj firmi AI najčešće preuzima ponavljajuće zadatke, a ljudima ostavlja razgovore i odluke koje traže procjenu. Cilj je brži odgovor i manje propuštenih upita.'],
      ['Koliko košta AI chatbot za firmu?', 'Zavisi od obima znanja i kanala. Kod Digital X AI prodajni asistent kreće od 490 KM uz mjesečno održavanje.'],
      ['Da li je sigurno koristiti AI s podacima klijenata?', 'Jeste ako su pravila jasna: asistent koristi samo odobrene informacije, lični podaci se obrađuju uz saglasnost i postoji evidencija šta se čuva.'],
      ['Mogu li koristiti samo ChatGPT?', 'Za pisanje i ideje da. Za odgovaranje klijentima, termine i unos u CRM treba povezan sistem s pravilima i nadzorom.'],
    ],
    related: [['/usluge/ai-automatizacija/', 'AI automatizacija'], ['/ai-concierge-preview/', 'Isprobajte AI Concierge'], ['/usluge/x-lead-desk/', 'X Lead Desk']],
  },
  {
    slug: 'kako-mjeriti-rezultate-marketinga', cluster: 'strategija', stage: 'mjeriti', minutes: 5,
    title: 'Kako mjeriti rezultate marketinga: 6 brojeva koji su bitni',
    h1: 'Kako mjeriti rezultate digitalnog marketinga bez gubljenja u izvještajima',
    desc: 'Koje brojeve pratiti u Google Analyticsu i Search Consoleu, kako izračunati cijenu upita i povrat ulaganja te kako izgleda koristan mjesečni izvještaj.',
    keywords: ['google analytics', 'google search console', 'mjerenje marketinga', 'kpi', 'povrat ulaganja', 'roi marketinga'],
    answer: 'Maloj firmi dovoljno je šest brojeva: broj upita, cijena po upitu, stopa konverzije stranice, izvor iz kojeg upiti dolaze, broj upita koji postanu kupci i prihod po kupcu. Sve ostalo — pregledi, lajkovi, doseg — korisno je samo ako objašnjava zašto se ovih šest mijenja.',
    sections: [
      ['Šest brojeva', `<ol><li><strong>Upiti</strong> — pozivi, forme, poruke, rezervacije.</li><li><strong>Cijena po upitu</strong> — ukupan trošak kanala podijeljen s brojem upita.</li><li><strong>Stopa konverzije</strong> — koliki dio posjetilaca pošalje upit.</li><li><strong>Izvor</strong> — pretraga, mapa, oglasi, mreže, preporuka.</li><li><strong>Zatvoreni poslovi</strong> — koliko upita postane kupac.</li><li><strong>Prihod po kupcu</strong> — da znate koliko upit smije koštati.</li></ol>`],
      ['Alati koji su vam dovoljni', `<ul><li><strong>Google Analytics 4</strong> — ko dolazi, odakle i šta radi na stranici.</li><li><strong>Google Search Console</strong> — za koje pretrage se prikazujete i klikaju li ljudi.</li><li><strong>Google Business profil</strong> — pozivi, upute i pregledi s mape.</li><li><strong>Ads Manager i Google Ads</strong> — trošak i rezultati kampanja.</li><li><strong>Jednostavna tabela ili CRM</strong> — šta se desilo s upitom nakon što je stigao.</li></ul>`],
      ['Postavite mjerenje konverzija', `<p>Bez toga svi ostali brojevi su nagađanje. Označite kao konverziju slanje forme, klik na telefon i WhatsApp te narudžbu. Oglasne platforme tada uče ko su ljudi koji postaju kupci, pa isti budžet donosi više. Uz to dolazi i obaveza: mjerenje koje koristi kolačiće traži pristanak posjetioca.</p>`],
      ['Jednostavan račun povrata', `<p>Ako ste mjesečno uložili 500 KM, dobili 25 upita i 5 novih kupaca s prosječnim prihodom od 300 KM, cijena upita je 20 KM, cijena kupca 100 KM, a prihod 1.500 KM. Brojevi su ilustracija, ali račun je uvijek isti — i odmah pokazuje koji kanal zaslužuje više budžeta.</p>`],
      ['Kako izgleda koristan mjesečni izvještaj', `<p>Jedna stranica: šest brojeva, poređenje s prošlim mjesecom, tri stvari koje su urađene i tri koje slijede. Ako izvještaj ima dvadeset grafikona, a ne kaže koliko je upita stiglo, ne služi vama. Praćenje vidljivosti u AI odgovorima je zasebna tema — ${a('/usluge/ai-visibility-tracker/', 'AI Visibility Tracker')}.</p>
<p>Kod većih Google Core Update promjena čekamo najmanje sedam punih dana nakon završetka ažuriranja prije poređenja podataka u Search Consoleu (<a href="https://developers.google.com/search/docs/appearance/core-updates" target="_blank" rel="noopener">Google Core Updates</a>), kako je opisano u našoj ${a('/uredjivacka-politika/', 'uredničkoj metodologiji')}. Kad znate šta radi, vratite se na ${a('/znanje/digitalni-marketing-za-male-firme/', 'plan')} i dodajte sljedeći kanal.</p>`],
    ],
    faq: [
      ['Šta je konverzija?', 'Konverzija je željena radnja posjetioca: poslan upit, poziv, rezervacija ili kupovina.'],
      ['Da li je Google Analytics besplatan?', 'Da, Google Analytics 4 i Search Console su besplatni i dovoljni većini malih firmi.'],
      ['Koliko često gledati brojeve?', 'Kampanje sedmično, ukupnu sliku mjesečno. Svakodnevno gledanje vodi u prebrze odluke.'],
      ['Šta je dobra stopa konverzije?', 'Zavisi od branše i izvora posjeta. Korisnije od poređenja s drugima je pratiti vlastiti trend iz mjeseca u mjesec.'],
    ],
    related: [['/usluge/x-signal/', 'Besplatna analiza sajta'], ['/usluge/ai-visibility-tracker/', 'AI Visibility Tracker'], ['/shop/product/digital-partner/', 'Digitalni partner — od 899 KM mjesečno']],
  },
  {
    slug: 'koliko-kosta-seo-optimizacija-bih', cluster: 'seo', stage: 'pronadjen', minutes: 7,
    title: 'Koliko košta SEO, AEO i GEO optimizacija u BiH (2026/2027)',
    h1: 'Koliko košta SEO, AEO i GEO optimizacija u BiH: realne cijene i šta dobijate',
    desc: 'Realne cijene SEO, AEO i GEO optimizacije u BiH: od 249 KM do 1.500+ KM mjesečno. Šta ulazi u cijenu, kako prepoznati lošu ponudu i kako izračunati povrat.',
    keywords: ['koliko košta seo optimizacija bih', 'seo cijena sarajevo', 'seo paket cijena', 'aeo geo cijena', 'seo agencija bih'],
    answer: 'Mjesečna SEO optimizacija u Bosni i Hercegovini najčešće košta između 249 KM i 800 KM mjesečno za mala i srednja preduzeća, dok veći web shopovi i regionalni projekti koštaju 1.000 KM do 2.500+ KM mjesečno. Jednokratno ubrzanje ili tehnički pregled kreću od 99 KM. Kod Digital X paket SEO · GEO · AEO kreće od 249 KM mjesečno.',
    sections: [
      ['Pregled tržišnih cijena SEO usluga u BiH', `<p>Cijena SEO, AEO i GEO optimizacije u BiH zavisi od veličine sajta, konkurencije i toga da li radite lokalno ili na više jezika. Tabela ispod prikazuje realne tržišne raspone i šta svaki nivo obično uključuje, a detaljno poređenje modela pogledajte na stranici ${a('/usluge/seo-aeo-geo-cijena/', 'SEO, GEO i AEO cijene')}.</p>
<div class="table-wrap"><table><thead><tr><th>Nivo usluge</th><th>Okvirni raspon u BiH</th><th>Kome je namijenjeno</th><th>Šta obično uključuje</th></tr></thead><tbody>
<tr><th>Jednokratni tehnički popravak / Speed</th><td>99 – 600 KM jednokratno</td><td>Spori sajtovi ili greške indeksacije</td><td>Core Web Vitals, slike, cache, sitemap, robots.txt, osnovna schema</td></tr>
<tr><th>Lokalni SEO + AEO/GEO start</th><td>249 – 450 KM / mj</td><td>Ordinacije, advokati, saloni, servisi</td><td>Google Business Profile, lokalne stranice usluga, FAQ/AEO struktura, schema</td></tr>
<tr><th>Rast i sadržajni SEO (SME / Shop)</th><td>500 – 900 KM / mj</td><td>Web shopovi i firme za cijelu BiH</td><td>Tehnički SEO, 2–4 vodiča mjesečno, optimizacija kategorija, autoritet</td></tr>
<tr><th>Višejezični / DACH SEO + GEO</th><td>1.000 – 2.500+ KM / mj</td><td>Firme koje ciljaju BiH, EU i dijasporu</td><td>BS/EN/DE klasteri, digitalni citati, praćenje AI vidljivosti</td></tr></tbody></table></div>`],
      ['Zašto se ponude razlikuju od 249 KM do 1.200 KM', `<p>Cijenu ne određuje „tajna formula“, nego broj radnih sati i obim isporuka u četiri oblasti: tehničko stanje sajta (čist kod naspram sporog WordPressa s desetinama dodataka), pisanje novih stranica i vodiča, jačina konkurencije u vašoj niši i uključeni AEO/GEO sloj za AI pretraživače.</p>
<p>Kod Digital X paket ${a('/usluge/seo-aeo-geo/', 'SEO · GEO · AEO')} kreće od 249 KM mjesečno, a jednokratna ${a('/usluge/optimizacija-brzine-sajta/', 'Speed optimizacija')} od 99 KM.</p>`],
      ['Pet znakova da plaćate loš SEO', `<ol><li><strong>Garancija prvog mjesta za 30 dana.</strong> Niko ne kontroliše Googleov algoritam ni AI modele.</li>
<li><strong>Nema pristupa Search Consoleu i GA4.</strong> Svi nalozi moraju ostati u vlasništvu vaše firme.</li>
<li><strong>Izvještaj bez upita i poziva.</strong> Impresije ne plaćaju račune ako ne mjerite konverzije.</li>
<li><strong>Kopiranje istog teksta za 20 gradova.</strong> Masovne šablonske stranice krše Googleova pravila kvaliteta.</li>
<li><strong>Dugoročno zaključavanje bez pisanog mjesečnog plana rada.</strong></li></ol>`],
      ['Kako izračunati da li se SEO isplati', `<p>Ako je prosječna vrijednost jednog vašeg klijenta 500 KM, a mjesečni rad košta 249 KM, dovoljan je jedan novi klijent svaka dva mjeseca da pokrijete ulaganje. Za razliku od oglasa koji staju čim zaustavite budžet, optimizovane stranice i ${a('/usluge/lokalni-seo-sarajevo/', 'lokalni SEO')} nastavljaju donositi upite mjesecima.</p>`],
    ],
    faq: [
      ['Koliko košta najjeftiniji ozbiljan SEO paket u BiH?', 'Ozbiljan mjesečni rad koji uključuje tehničku osnovu, lokalni SEO, AEO/GEO strukturu i mjerenje u BiH kreće od 249 KM mjesečno kod Digital X.'],
      ['Da li je bolje uložiti u SEO ili u Google Ads?', 'Ako vam upiti trebaju odmah, krenite s Google Ads kampanjom i landing stranicom. Ako želite smanjiti cijenu po kupcu na duži rok, SEO/AEO/GEO gradite paralelno od prvog mjeseca.'],
      ['Šta je uključeno u jednokratnu Speed optimizaciju od 99 KM?', 'Mjerenje prije intervencije, optimizacija slika, čišćenje blokirajućih skripti i CSS-a, podešavanje cachea i stabilizacija mobilnog prikaza, uz izvještaj prije i poslije.'],
    ],
    related: [['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga'], ['/shop/product/seo-aeo/', 'SEO paket — od 249 KM mjesečno'], ['/znanje/seo-aeo-geo-razlika/', 'SEO, AEO i GEO: razlika']],
  },
  {
    slug: 'agencija-ili-freelancer-web-stranica', cluster: 'web', stage: 'planirati', minutes: 6,
    title: 'Agencija ili freelancer za izradu web stranice u BiH: pošteno poređenje',
    h1: 'Agencija ili freelancer za izradu web stranice: šta odabrati i kako ne pogriješiti',
    desc: 'Pošteno poređenje agencije i freelancera za izradu web stranice u BiH: cijene, rokovi, vlasništvo nad domenom, SEO, održavanje i kada je ko bolji izbor.',
    keywords: ['agencija ili freelancer', 'izrada web stranice bih', 'web agencija sarajevo', 'cijena web stranice freelancer'],
    answer: 'Freelancer je često dobar izbor za manji, jasno definisan zadatak poput jedne landing stranice ili grafičkog dizajna. Agencija je sigurniji izbor kada web stranica mora povezati dizajn, brzinu, tehnički SEO, AEO/GEO strukturu, analitiku i dugoročno održavanje pod jednim ugovorom i jasnim rokom.',
    sections: [
      ['Direktno poređenje: agencija vs. freelancer', `<div class="table-wrap"><table><thead><tr><th>Kriterij</th><th>Digitalna agencija (npr. Digital X)</th><th>Freelancer</th></tr></thead><tbody>
<tr><th>Cijena u BiH</th><td>Od 199 KM (landing) / 449 KM (web) do 2.490+ KM (shop)</td><td>Najčešće 250 – 1.500 KM zavisno od iskustva</td></tr>
<tr><th>Širina tima</th><td>Dizajn, razvoj, SEO/AEO/GEO, copy, analitika i AI na jednom mjestu</td><td>Jedna osoba — obično jaka u dizajnu ili kodu, rjeđe u SEO-u i mjerenju</td></tr>
<tr><th>Rok i kontinuitet</th><td>Pisani rok (7–14 radnih dana za Smart Website Launch) i podrška nakon objave</td><td>Zavisi od dostupnosti jedne osobe i drugih projekata</td></tr>
<tr><th>Vlasništvo i ugovor</th><td>Pisana ponuda, faktura, domena i nalozi na firmi klijenta</td><td>Često bez formalnog ugovora ako se ne traži unaprijed</td></tr></tbody></table></div>`],
      ['Kada odabrati freelancera, a kada agenciju', `<ul><li><strong>Odaberite freelancera</strong> ako već imate gotove tekstove, SEO plan i osobu za održavanje, a treba vam samo izvedba jednog jasnog zadatka.</li>
<li><strong>Odaberite agenciju</strong> ako želite da stranica od prvog dana bude brza, povezana s Google Business profilom, mjerena u GA4/Search Consoleu i spremna za oglase ili AI asistenta.</li></ul>
<p>Detaljan spisak pitanja prije potpisa nalazi se u vodiču ${a('/znanje/kako-odabrati-digitalnu-agenciju/', 'kako odabrati digitalnu agenciju u BiH')}.</p>`],
      ['Šta uvijek morate provjeriti prije uplate', `<ol><li>Da su domena, hosting i Google nalozi registrovani na vašu firmu.</li>
<li>Da je u cijenu uključena osnovna SEO struktura, SSL i mobilna optimizacija.</li>
<li>Koliko košta održavanje nakon objave — kod Digital X ${a('/shop/product/site-care/', 'održavanje stranice')} kreće od 49 KM mjesečno.</li></ol>`],
    ],
    faq: [
      ['Da li je agencija uvijek skuplja od freelancera?', 'Ne nužno. Kod Digital X landing stranica kreće od 199 KM, a prezentacijska stranica od 449 KM, što je često u rangu ili povoljnije od pojedinačnih ponuda freelancera, uz uključen osnovni SEO i 30 dana podrške.'],
      ['Šta ako sam već počeo s freelancerom i projekat je stao?', 'Možemo preuzeti postojeću stranicu ili domenu, uraditi besplatnu analizu stanja i predložiti najbrži put do objave ili redizajna.'],
      ['Ko ostaje vlasnik web stranice nakon završetka?', 'Uvijek vaša firma. Domena, kod, sadržaj i analitički nalozi pripadaju vama.'],
    ],
    related: [['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/usluge/web-dizajn/', 'Web dizajn: paketi i cijene'], ['/znanje/kako-odabrati-digitalnu-agenciju/', '9 pitanja prije potpisa']],
  },
  {
    slug: 'meta-capi-server-side-tracking', cluster: 'oglasi', stage: 'mjeriti', minutes: 6,
    title: 'Meta Conversions API (CAPI) i server-side mjerenje: vodič za firme u BiH',
    h1: 'Meta Conversions API (CAPI): zašto sam Pixel više nije dovoljan za oglase',
    desc: 'Šta je Meta Conversions API (CAPI), zašto preglednici i blokatori skrivaju konverzije od Pixela, šta je Event Match Quality (EMQ) i kako smanjiti cijenu upita.',
    keywords: ['meta conversions api', 'meta capi bih', 'server side tracking', 'meta pixel ne mjeri', 'facebook oglasi konverzije'],
    answer: 'Meta Conversions API (CAPI) šalje podatke o upitima i kupovinama direktno s vašeg servera prema Meti, paralelno s klasičnim Pixelom u pregledniku. Time nadoknađuje događaje koje blokiraju iOS ograničenja i ad-blockeri, poboljšava Event Match Quality (EMQ) i daje algoritmu tačnije podatke za nižu cijenu upita.',
    sections: [
      ['Zašto sam Meta Pixel gubi podatke', `<p>Klasični Meta Pixel radi u pregledniku posjetioca. Zbog blokatora oglasa, privatnih preglednika i ograničenja kolačića trećih strana, dio stvarnih upita i narudžbi nikada ne stigne do Ads Managera. Kada Meta ne vidi ko je poslao upit ili kupio proizvod, algoritam nastavlja trošiti budžet na pogrešnu publiku.</p>`],
      ['Pixel vs. Conversions API (CAPI)', `<div class="table-wrap"><table><thead><tr><th>Signal</th><th>Samo Meta Pixel (Browser)</th><th>Pixel + Conversions API (Server-side)</th></tr></thead><tbody>
<tr><th>Gdje se izvršava</th><td>U pregledniku korisnika</td><td>U pregledniku + direktno sa servera uz deduplikaciju</td></tr>
<tr><th>Otpornost na blokatore</th><td>Niska — dio događaja se gubi</td><td>Visoka — server šalje potvrđene događaje</td></tr>
<tr><th>Event Match Quality (EMQ)</th><td>Često nizak bez dodatnih parametara</td><td>Viši uz hashirane parametre i event_id deduplikaciju</td></tr>
<tr><th>Pristanak (GDPR)</th><td>Obavezan pristanak za marketinške kolačiće</td><td>Obavezan pristanak prije slanja marketinških događaja</td></tr></tbody></table></div>`],
      ['Tri pravila za ispravno postavljanje', `<ol><li><strong>Deduplikacija (event_id).</strong> Isti upit ili kupovina ne smije se brojati dvaput — i Pixel i CAPI moraju dijeliti isti identifikator događaja.</li>
<li><strong>Poštovanje pristanka.</strong> Server-side slanje ne služi za zaobilaženje pristanka korisnika; prati se ista odluka iz ${a('/znanje/gdpr-pristupacnost-web-stranice/', 'postavki kolačića')}.</li>
<li><strong>Mjerenje stvarnih leadova.</strong> Pratite slanje forme, klik na WhatsApp/telefon i završenu narudžbu, a ne samo otvaranje stranice.</li></ol>
<p>Više o optimizaciji kampanja pročitajte u vodiču ${a('/znanje/kako-smanjiti-cijenu-facebook-oglasa/', 'kako smanjiti cijenu Facebook oglasa')} i na stranici ${a('/usluge/optimizacija-meta-oglasa/', 'optimizacija Meta oglasa')}.</p>`],
    ],
    faq: [
      ['Da li CAPI zamjenjuje Meta Pixel?', 'Ne. Najbolje rade zajedno: Pixel pokriva interakcije u pregledniku, a CAPI dopunjuje događaje sa servera uz deduplikaciju kako se konverzije ne bi duplirale.'],
      ['Treba li mi CAPI ako imam mali budžet za oglase?', 'Ako vodite kampanje za upite ili web shop prodaju, tačno mjerenje je još važnije kod manjeg budžeta jer svaki pogrešno optimizovan klik košta više.'],
      ['Da li je CAPI dozvoljen po GDPR-u?', 'Da, pod uslovom da se marketinški događaji šalju tek nakon pristanka korisnika i da je obrada opisana u politici privatnosti.'],
    ],
    related: [['/usluge/optimizacija-meta-oglasa/', 'Optimizacija Meta oglasa'], ['/usluge/meta-ads/', 'Meta Ads usluga'], ['/znanje/kako-smanjiti-cijenu-facebook-oglasa/', 'Kako smanjiti cijenu oglasa']],
  },
  {
    slug: 'ai-spremnost-web-stranica-bih-2026', cluster: 'ai-pretraga', stage: 'mjeriti', minutes: 8,
    title: 'X Signal 2026 benchmark: tehnička i AI spremnost web stranica',
    h1: 'X Signal 2026 benchmark: šta zaista odlučuje o vidljivosti u Google AI Modeu i LLM odgovorima',
    desc: 'Empirijski vodič i X Signal metodologija za 2026: Google Search Central pravila za AI Overviews, KDD 2024 GEO-bench nalazi, Core Web Vitals pragovi i 18-tačkasta provjera.',
    keywords: ['ai spremnost web stranice', 'google ai overviews zahtjevi', 'geo benchmark 2026', 'x signal analiza', 'query fan out seo'],
    answer: 'Pojavljivanje u Google AI Overviews, AI Modeu, ChatGPT-u i Perplexityju ne traži posebne AI fajlove ni eksperimentalnu schemu, nego tehničku dostupnost, Core Web Vitals (LCP ≤ 2,5 s, INP < 200 ms, CLS < 0,1), samostalne pasuse od 40–80 riječi za query fan-out i provjerljive izvore. Recenzirano KDD 2024 istraživanje pokazuje da statistike, citati i izvori podižu generativnu vidljivost do 40%.',
    sections: [
      ['Šta Google zvanično traži za AI Overviews i AI Mode', `<p>Zvanična dokumentacija <a href="https://developers.google.com/search/docs/appearance/ai-features" target="_blank" rel="noopener">Google Search Central: AI Features</a> potvrđuje da za prikaz u AI pregledima i AI Modeu nisu potrebni posebni Schema.org tipovi niti fajlovi poput llms.txt. Stranica mora biti indeksirana, čitljiva u HTML-u, podobna za standardni Search snippet i usklađena s vidljivim tekstom u JSON-LD podacima.</p>
<ul><li><strong>Snippet direktive:</strong> koristite <code>index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1</code> na javnim stranicama.</li>
<li><strong>Core Web Vitals:</strong> ciljajte LCP ≤ 2,5 s, INP &lt; 200 ms i CLS &lt; 0,1 (<a href="https://developers.google.com/search/docs/appearance/core-web-vitals" target="_blank" rel="noopener">Google Core Web Vitals</a>).</li>
<li><strong>Aktuelna schema (2025–2026):</strong> Google je 2023. ograničio FAQ rich rezultate na državne i zdravstvene sajtove, a u junu 2025. povukao sedam tipova (uključujući ClaimReview, CourseInfo i SpecialAnnouncement).</li></ul>`],
      ['Empirijski GEO nalazi: citati i query fan-out', `<p>Google AI Mode koristi Gemini modele za razlaganje složenih pitanja na paralelne podupite (query fan-out) i izdvajanje konkretnih pasusa umjesto cijelih stranica. U recenziranom KDD 2024 radu na 10.000 upita (<a href="https://arxiv.org/pdf/2311.09735" target="_blank" rel="noopener">Aggarwal et al., GEO-bench</a>), dodavanje provjerljivih statistika, stručnih citata i izvora povećalo je generativnu vidljivost do 40%, dok je gomilanje ključnih riječi ostalo bez efekta.</p>
<p>Komparativna studija iz septembra 2025. (Chen et al.) dodatno pokazuje da ChatGPT, Perplexity i Gemini sistematski preferiraju nezavisne publikacije u odnosu na samopromotivne tekstove brendova. Zato tehnički SEO mora pratiti jasna ${a('/uredjivacka-politika/', 'urednička metodologija')} i vanjska potvrda entiteta.</p>`],
      ['X Signal 2026 mjerenje na korpusu od 119 stranica', `<p>Pokrenuli smo naš deterministički ${a('/usluge/x-signal/', 'X Signal analizator')} na svih 119 indeksabilnih bosanskih stranica Digital X sajta prije novembarske nadogradnje 2026. godine. Rezultat pokazuje jasnu razliku između osnovnog SEO-a i pune AI spremnosti:</p>
<div class="table-wrap"><table><thead><tr><th scope="col">Signal provjere</th><th scope="col">Prije nadogradnje (119 stranica)</th><th scope="col">Ciljani standard</th></tr></thead><tbody>
<tr><th scope="row">HTTPS i jedan H1 naslov</th><td>119 / 119 (100%)</td><td>100% na svim javnim rutama</td></tr>
<tr><th scope="row">Validan JSON-LD bez grešaka</th><td>112 / 119 (94,1%)</td><td>100% bez povučenih tipova</td></tr>
<tr><th scope="row">Puni snippet (max-snippet:-1)</th><td>7 / 119 (5,9%)</td><td>100% na indeksabilnim stranicama</td></tr>
<tr><th scope="row">Porijeklo i byline (E-E-A-T)</th><td>17 / 119 (14,3%)</td><td>Veza na /tim/ i /uredjivacka-politika/</td></tr>
<tr><th scope="row">2+ samostalna pasusa (30–90 riječi)</th><td>56 / 119 (47,1%)</td><td>Svaki H2 otvoren odgovorom 40–80 riječi</td></tr></tbody></table></div>`],
      ['18-tačkasta provjera i Core Update protokol', `<p>Svaku stranicu provjeravamo kroz četiri grupe signala: dostupnost (robots.txt, sitemap, canonical, max-snippet:-1), performanse (LCP, INP, CLS), strukturu pasusa (40–80 riječi po H2, tabele, citati) i povjerenje (Organization/LocalBusiness, sameAs, urednička politika). Nakon završetka Google Core Updatea čekamo najmanje sedam punih dana prije poređenja podataka u Search Consoleu (<a href="https://developers.google.com/search/docs/appearance/core-updates" target="_blank" rel="noopener">Google Core Updates</a>).</p>`],
    ],
    faq: [
      ['Kako mogu besplatno provjeriti svoju stranicu po ovim kriterijima?', 'Otvorite besplatnu X Signal analizu na /usluge/x-signal/ i unesite URL svoje stranice. Alat provjerava javni HTML, meta direktive, JSON-LD, porijeklo sadržaja, spremnost pasusa, robots.txt i sitemap bez obaveznog e-maila.'],
      ['Da li je llms.txt obavezan za Google AI Overviews?', 'Ne. Google Search Central izričito navodi da posebni AI tekstualni fajlovi nisu potrebni za AI Overviews ni AI Mode. llms.txt je opcionalan sažetak za treće AI alate.'],
      ['Zašto su pasusi od 40–80 riječi važni za AI pretragu?', 'Zato što sistemi zasnovani na query fan-outu izdvajaju pojedinačne pasuse koji direktno odgovaraju na podupit, umjesto da prenose cijelu stranicu.'],
    ],
    related: [['/usluge/x-signal/', 'Pokrenite besplatnu X Signal analizu'], ['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga'], ['/uredjivacka-politika/', 'Urednička politika i metodologija']],
  },
];

export const hubFaq = [
  ['Šta je Digital X blog?', 'To je besplatna zbirka vodiča i članaka o web stranicama, SEO-u, AI pretrazi, oglašavanju, društvenim mrežama i AI automatizaciji, složena kao put od prvog pitanja do mjerljivog rezultata.'],
  ['Kojim redom čitati vodiče?', 'Vodiči prate sedam koraka: razumjeti, planirati, izgraditi, biti pronađen, privući, automatizovati i mjeriti. Možete krenuti od početka ili odabrati jedan od četiri puta prema svojoj situaciji.'],
  ['Da li su cijene u vodičima stvarne?', 'Da. Navedene Digital X cijene su javne početne cijene iz cjenovnika. Obim i dostupnost potvrđuju se prije ugovaranja.'],
  ['Za koga su vodiči pisani?', 'Za vlasnike i menadžere malih i srednjih firmi u BiH, regionu i dijaspori koji žele razumjeti šta kupuju prije nego što plate.'],
  ['Mogu li dobiti preporuku za svoju firmu?', 'Da. Besplatna analiza provjerava vašu postojeću stranicu, a u besplatnim konsultacijama dobijate prijedlog prvog koraka.'],
];
