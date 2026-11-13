// Centar znanja: clusters, the customer journey and every guide.
// Prices quoted here are the published starting prices from the shop catalogue; keep them in sync.
export const origin = 'https://www.digital-x-marketing.com';
export const published = '2026-11-13';

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
    service: ['/usluge/x-convert/', 'Web dizajn — X Convert'],
    blog: [['/blog/koliko-kosta-web-stranica-bih.html', 'Koliko košta web stranica u BiH'], ['/blog/landing-stranica-vodic.html', 'Landing stranica: od oglasa do upita'], ['/blog/brzina-sajta.html', 'Zašto spor sajt ubija prodaju'], ['/blog/odrzavanje-sigurnost-vodic.html', 'Održavanje i sigurnost sajta'], ['/blog/uiux-rebranding-vodic.html', 'Rebranding i UI/UX dizajn']] },
  { id: 'shop', name: 'Web shop i e-commerce', color: '#8fe3d0', pos: [0.36, 0.3, 0.62],
    blurb: 'Platforma, plaćanje, dostava i sve što trgovina treba prije prve narudžbe.',
    service: ['/usluge/smart-storefront/', 'Web & E-commerce'],
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
      ['Koliko košta i koliko traje', `<p>Cijena prati obim. Kod Digital X ${a('/shop/product/landing-starter/', 'landing stranica')} kreće od 199 KM, ${a('/shop/product/web-presence/', 'prezentacijska stranica')} od 449 KM, a ${a('/smart-website-launch/', 'Smart Website Launch')} — cinematic web do pet stranica s AI asistentom prva tri mjeseca — košta 499 KM uz plan isporuke 7–14 radnih dana. Detaljno poređenje tržišnih raspona je u vodiču ${a('/blog/koliko-kosta-web-stranica-bih.html', 'koliko košta web stranica u BiH')}.</p>
<p>Nakon objave računajte na ${a('/blog/odrzavanje-sigurnost-vodic.html', 'održavanje')}: ažuriranja, sigurnosne kopije i sitne izmjene.</p>`],
      ['Obična ili cinematic stranica?', `<p>Klasična stranica je dovoljna kad kupac već zna šta traži. ${a('/usluge/cinematic-web-stranice/', 'Cinematic web stranica')} — film koji se kreće dok skrolate — ima smisla kad prodajete iskustvo: hotel, nekretninu, premium proizvod, ordinaciju. Pogledajte ${a('/primjeri-web-stranica/', 'primjere po branšama')} i procijenite sami.</p>`],
    ],
    faq: [
      ['Koliko traje izrada web stranice?', 'Landing stranica nekoliko dana, prezentacijska stranica jednu do tri sedmice, web shop ili aplikacija više sedmica. Rok najviše zavisi od toga koliko brzo stignu tekstovi i fotografije.'],
      ['Mogu li sam napraviti web stranicu besplatno?', 'Možete, uz alate poput WordPressa ili gotovih buildera. Besplatna rješenja obično znače reklame, poddomenu i ograničenja. Za firmu se isplati vlastita domena i stranica koju neko tehnički održava.'],
      ['Da li mi treba web stranica ako imam Instagram?', 'Da. Profil na mreži nije vaš — pravila i doseg se mijenjaju. Web stranica je jedino mjesto koje u potpunosti kontrolišete i koje Google i AI sistemi mogu citirati.'],
      ['Šta je s domenom i hostingom?', 'Domena je adresa (npr. vasafirma.ba), hosting je prostor na kojem stranica živi. Oboje se plaća godišnje i oboje treba biti registrovano na vas.'],
    ],
    related: [['/usluge/x-convert/', 'Web dizajn — X Convert'], ['/usluge/cinematic-web-stranice/', 'Cinematic web stranice'], ['/smart-website-launch/', 'Smart Website Launch — 499 KM']],
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
    related: [['/usluge/smart-storefront/', 'Web & E-commerce'], ['/shop/product/ecommerce-launch/', 'E-commerce Launch — od 2.490 KM'], ['/usluge/fotografija-proizvoda/', 'Fotografija proizvoda']],
  },
  {
    slug: 'sta-je-seo-optimizacija', cluster: 'seo', stage: 'pronadjen', minutes: 6,
    title: 'Šta je SEO optimizacija i koliko košta u BiH (2026)',
    h1: 'Šta je SEO optimizacija: kako radi, koliko košta i kada daje rezultate',
    desc: 'SEO optimizacija objašnjena jednostavno: tri dijela SEO-a, šta možete sami, koliko košta u BiH, koliko se čeka na rezultate i kako prepoznati lošu ponudu.',
    keywords: ['seo optimizacija', 'šta je seo', 'šta je seo optimizacija', 'seo optimizacija cijena', 'seo optimizacija sarajevo'],
    answer: 'SEO (optimizacija za pretraživače) je uređivanje web stranice tako da je Google razumije, smatra pouzdanom i prikaže ljudima koji traže ono što nudite. Sastoji se od tri dijela: tehničke osnove, sadržaja koji odgovara na pitanja i povjerenja koje grade linkovi i recenzije. Rezultati se obično vide nakon nekoliko mjeseci i ne nestaju kad prestanete plaćati oglase.',
    sections: [
      ['Tri dijela SEO-a', `<ul><li><strong>Tehnički SEO.</strong> Može li Google otvoriti, pročitati i brzo učitati vaše stranice: brzina, mobilni prikaz, mapa sajta, ispravne adrese, strukturirani podaci.</li>
<li><strong>Sadržaj.</strong> Posebna stranica za svaku uslugu i temu, napisana riječima koje kupci koriste, s jasnim naslovima i odgovorima.</li>
<li><strong>Povjerenje.</strong> Linkovi s drugih relevantnih stranica, ${a('/blog/automatizacija-recenzija.html', 'recenzije')}, spominjanja firme i dosljedni podaci o firmi svuda na internetu.</li></ul>`],
      ['Lokalni SEO: mapa i „blizu mene“', `<p>Za ordinacije, salone, majstore i restorane najvažniji je Google Business profil. Tačna kategorija, radno vrijeme, fotografije i redovne recenzije često donesu više poziva nego sama web stranica. Korake nalazite u vodiču ${a('/blog/lokalni-seo-google-mapa.html', 'kako biti prvi na Google mapi')}.</p>`],
      ['Šta možete uraditi sami', `<ol><li>Otvorite i popunite Google Business profil.</li><li>Prijavite stranicu u Google Search Console i pošaljite mapu sajta.</li><li>Za svaku uslugu napišite posebnu stranicu s jasnim naslovom.</li><li>Tražite recenziju nakon svake završene usluge.</li><li>Provjerite brzinu — ${a('/usluge/x-signal/', 'besplatna analiza')} pokazuje osnovne tehničke signale.</li></ol>`],
      ['Koliko košta SEO optimizacija', `<p>SEO se plaća kao jednokratno sređivanje ili kao mjesečni rad. Cijena zavisi od veličine stranice, konkurencije i toga ko piše sadržaj. Kod Digital X paket ${a('/shop/product/seo-aeo/', 'SEO · GEO · AEO')} kreće od 249 KM mjesečno i obuhvata tehničku osnovu, lokalnu vidljivost, sadržaj i strukturu za Google i AI odgovore. Jednokratna ${a('/shop/product/speed-optimization/', 'speed optimizacija')} kreće od 99 KM.</p>`],
      ['Kada stižu rezultati', `<p>Tehničke popravke Google primijeti za nekoliko dana do sedmica. Rast za konkurentne pojmove obično traje tri do šest mjeseci, ponekad duže. Zato se SEO i ${a('/znanje/google-oglasi-cijena/', 'Google oglasi')} često kombinuju: oglasi donose upite odmah, SEO gradi vidljivost koja ostaje.</p>`],
      ['SEO više nije samo Google', `<p>Sve više ljudi pitanje postavi ChatGPT-u ili pročita AI pregled iznad rezultata. Isti temelji važe, ali se dodaju nova pravila — objašnjena u vodiču ${a('/znanje/seo-aeo-geo-razlika/', 'SEO, AEO i GEO: u čemu je razlika')}.</p>`],
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
      ['Tri pojma, jedna tabela', `<div class="table-wrap"><table><thead><tr><th></th><th>SEO</th><th>AEO</th><th>GEO</th></tr></thead><tbody>
<tr><th>Gdje se vidite</th><td>Google rezultati i mapa</td><td>Istaknuti odgovori, glasovna pretraga</td><td>ChatGPT, Gemini, Perplexity, AI pregledi</td></tr>
<tr><th>Šta sistem traži</th><td>Relevantnu, brzu, pouzdanu stranicu</td><td>Kratak, jasan odgovor na pitanje</td><td>Provjerljive činjenice i izvor kojem vjeruje</td></tr>
<tr><th>Ključni posao</th><td>Tehnika, sadržaj, linkovi</td><td>Pitanja i odgovori, struktura, schema</td><td>Dosljedni podaci o firmi, spominjanja, citabilnost</td></tr>
<tr><th>Kako se mjeri</th><td>Pozicije, klikovi, upiti</td><td>Prikazi u odgovorima</td><td>Spominjanja i citati u AI odgovorima</td></tr></tbody></table></div>`],
      ['Kako AI bira koga će navesti', `<p>AI asistenti odgovor sastavljaju iz onoga što su naučili i iz stranica koje u tom trenutku pronađu. Prednost imaju izvori koji su jasni, konkretni i potvrđeni na više mjesta. Stranica koja kaže „nudimo vrhunske usluge“ nema šta ponuditi. Stranica koja kaže „landing stranica od 199 KM, jedna stranica s jednim ciljem“ daje činjenicu koju AI može prenijeti.</p>`],
      ['Sedam konkretnih koraka', `<ol><li><strong>Odgovorite odmah.</strong> Prva dva pasusa svake stranice trebaju direktno odgovoriti na pitanje iz naslova.</li>
<li><strong>Pišite pitanja kao naslove.</strong> Onako kako ih ljudi postavljaju.</li>
<li><strong>Navedite činjenice.</strong> Cijene, rokove, lokaciju, uslove — s datumom.</li>
<li><strong>Dodajte strukturirane podatke.</strong> Organization, Service, FAQPage, Article.</li>
<li><strong>Uskladite podatke o firmi.</strong> Isto ime, adresa, telefon i e-mail na stranici, mapi i mrežama.</li>
<li><strong>Dozvolite AI botovima pristup</strong> u robots.txt i dodajte llms.txt sa sažetkom ponude.</li>
<li><strong>Budite spomenuti drugdje.</strong> Portali, direktoriji, recenzije, gostujući tekstovi.</li></ol>`],
      ['Šta od ovoga treba maloj firmi', `<p>Prvo ${a('/znanje/sta-je-seo-optimizacija/', 'SEO osnova')} i Google Business profil. Zatim stranice s jasnim odgovorima i čestim pitanjima — to je AEO. GEO dolazi prirodno kad su podaci o firmi dosljedni i kad vas drugi spominju. Više o praktičnoj strani je u vodiču ${a('/blog/aeo-vodic.html', 'kako da vas ChatGPT preporuči')}.</p>`],
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
    related: [['/usluge/meta-ads/', 'Meta Ads usluga'], ['/usluge/digitalne-kampanje/', 'Digitalne kampanje'], ['/usluge/video-proizvoda/', 'Video proizvoda']],
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
<p>Kad znate šta radi, vratite se na ${a('/znanje/digitalni-marketing-za-male-firme/', 'plan')} i dodajte sljedeći kanal. Tako se krug zatvara.</p>`],
    ],
    faq: [
      ['Šta je konverzija?', 'Konverzija je željena radnja posjetioca: poslan upit, poziv, rezervacija ili kupovina.'],
      ['Da li je Google Analytics besplatan?', 'Da, Google Analytics 4 i Search Console su besplatni i dovoljni većini malih firmi.'],
      ['Koliko često gledati brojeve?', 'Kampanje sedmično, ukupnu sliku mjesečno. Svakodnevno gledanje vodi u prebrze odluke.'],
      ['Šta je dobra stopa konverzije?', 'Zavisi od branše i izvora posjeta. Korisnije od poređenja s drugima je pratiti vlastiti trend iz mjeseca u mjesec.'],
    ],
    related: [['/usluge/x-signal/', 'Besplatna analiza sajta'], ['/usluge/ai-visibility-tracker/', 'AI Visibility Tracker'], ['/shop/product/digital-partner/', 'Digitalni partner — od 899 KM mjesečno']],
  },
];

export const hubFaq = [
  ['Šta je Digital X Centar znanja?', 'To je besplatna zbirka vodiča o web stranicama, SEO-u, AI pretrazi, oglašavanju, društvenim mrežama i AI automatizaciji, složena kao put od prvog pitanja do mjerljivog rezultata.'],
  ['Kojim redom čitati vodiče?', 'Vodiči prate sedam koraka: razumjeti, planirati, izgraditi, biti pronađen, privući, automatizovati i mjeriti. Možete krenuti od početka ili odabrati jedan od četiri puta prema svojoj situaciji.'],
  ['Da li su cijene u vodičima stvarne?', 'Da. Navedene Digital X cijene su javne početne cijene iz cjenovnika. Obim i dostupnost potvrđuju se prije ugovaranja.'],
  ['Za koga su vodiči pisani?', 'Za vlasnike i menadžere malih i srednjih firmi u BiH, regionu i dijaspori koji žele razumjeti šta kupuju prije nego što plate.'],
  ['Mogu li dobiti preporuku za svoju firmu?', 'Da. Besplatna analiza provjerava vašu postojeću stranicu, a u besplatnim konsultacijama dobijate prijedlog prvog koraka.'],
];
