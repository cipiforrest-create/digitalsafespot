const a = (href, text) => `<a href="${href}">${text}</a>`;

export const cluster5Guides = [
  {
    slug: 'ai-chatbot-rag-za-web-stranicu', cluster: 'ai', stage: 'automatizovati', minutes: 7, published: '2026-11-23',
    title: 'AI chatbot za web (RAG): kako odgovara tačno bez izmišljanja',
    h1: 'AI chatbot za web stranicu s RAG arhitekturom: tačni odgovori iz vaših dokumenata bez halucinacija',
    desc: 'Kako RAG (Retrieval-Augmented Generation) sprječava izmišljanje cijena i usluga kod AI chatbota na web stranici, uz OWASP LLM zaštitu i predaju timu.',
    keywords: ['ai chatbot za web stranicu', 'rag chatbot', 'ai asistent bez halucinacija', 'ai prodajni asistent cijena', 'owasp llm sigurnost'],
    cover: {
      alt: 'RAG AI chatbot za web stranicu: pretraga odobrenih dokumenata, zaštita od halucinacija i predaja upita timu',
      caption: 'RAG arhitektura ograničava AI asistenta na vaše odobrene cjenovnike i FAQ dokumente uz jasnu predaju čovjeku.',
    },
    diagram: '/media/znanje/cluster5-rag-architecture-diagram.webp',
    answer: 'AI chatbot zasnovan na RAG (Retrieval-Augmented Generation) arhitekturi ne nagađa odgovore iz opšteg znanja modela, nego prije svakog odgovora pretražuje vaše odobrene cjenovnike, opise usluga i FAQ dokumente. Uz stroge granice dozvoljenih akcija i pregled sažetka prije slanja, asistent odgovara na pet jezika bez izmišljanja popusta ili rokova.',
    sections: [
      ['Zašto obični LLM chatbot izmišlja cijene i kako RAG to rješava', `<p>Generički chatbot bez kontrole izvora često pokušava biti „ljubazan“ tako što izmisli popust, obeća rok isporuke ili pogrešno opiše uslugu. RAG arhitektura razdvaja jezički model od vaših poslovnih činjenica: model smije formulisati odgovor isključivo na osnovu odobrenih dokumenata koje mu sistem dostavi za konkretno pitanje.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster5-rag-architecture-diagram.webp" srcset="/media/znanje/cluster5-rag-architecture-diagram-768.webp 768w, /media/znanje/cluster5-rag-architecture-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četiri sloja RAG AI asistenta: pitanje posjetioca, pretraga odobrenog korpusa, sigurnosne granice i predaja timu"><figcaption>Četiri sloja sigurnog AI asistenta: od pitanja na pet jezika do provjerenog odgovora i ljudske predaje.</figcaption></figure>
<div class="table-wrap"><table><thead><tr><th scope="col">Kriterij</th><th scope="col">Obični „klikni dugme“ bot</th><th scope="col">Neograničeni LLM chat</th><th scope="col">Digital X RAG asistent</th></tr></thead><tbody>
<tr><th scope="row">Izvor istine</th><td>Zaključana stabla dugmadi</td><td>Opšte znanje modela (rizik halucinacija)</td><td>Isključivo vaši odobreni dokumenti i cjenovnik</td></tr>
<tr><th scope="row">Jezici</th><td>Ručni prevod svakog koraka</td><td>Više jezika bez kontrole termina</td><td>BS / HR / SR / EN / DE uz usklađene pojmove</td></tr>
<tr><th scope="row">Sigurnost i akcije</th><td>Nema fleksibilnosti</td><td>Rizik prompt injectiona i curenja</td><td>Samo odobrene javne akcije i potvrda upita</td></tr></tbody></table></div>`],
      ['Sigurnosne granice prema OWASP Top 10 za LLM aplikacije', `<p>Prema standardu <a href="https://genai.owasp.org/llm-top-10/" target="_blank" rel="noopener">OWASP Top 10 for LLM Applications</a>, poslovni AI asistenti moraju biti zaštićeni od manipulacije uputama (<em>LLM01 Prompt Injection</em>), curenja internih podataka (<em>LLM02 Sensitive Information Disclosure</em>) i prekomjernih ovlaštenja (<em>LLM06 Excessive Agency</em>). Zato javni web asistent nikada nema pristup privatnim fajlovima firme niti može samostalno mijenjati cijene ili rezervacije bez potvrde.</p>
<ul><li><strong>Jasna oznaka da je asistent AI.</strong> Posjetilac uvijek zna da razgovara s automatizovanim vodičem, a ne s osobom.</li>
<li><strong>Pregled prije slanja.</strong> Kada posjetilac želi ponudu, pregleda pripremljeni sažetak i potvrđuje slanje vašem timu.</li>
<li><strong>Eskalacija na čovjeka.</strong> Pitanja izvan odobrenog opsega ili osjetljivi zahtjevi odmah se preusmjeravaju osobi.</li></ul>`],
      ['Cijena, rok postavljanja i demo uživo', `<p>Kod Digital X ${a('/shop/product/ai-concierge/', 'AI prodajni asistent')} kreće od 490 KM uz održavanje od 149 KM mjesečno, a osnovno postavljanje na postojeću stranicu traje 5 do 10 radnih dana nakon prijema odobrenih materijala. Ako pravite novu stranicu, ${a('/shop/product/smart-website-launch/', 'Smart Website Launch (499 KM)')} uključuje asistenta prva tri mjeseca. Detalje pogledajte na ${a('/usluge/ai-chatbot-za-web-stranicu/', 'AI chatbot za web stranicu')} ili isprobajte ${a('/ai-concierge-preview/', 'interaktivni AI Concierge')}.</p>`],
    ],
    faq: [
      ['Može li AI chatbot izmisliti cijenu ili obećati popust koji ne nudimo?', 'Ne ako je pravilno ograničen RAG korpusom i pravilima odgovora: asistent navodi samo objavljene početne cijene i napomenu da se konačan obim potvrđuje ponudom.'],
      ['Koliko traje postavljanje AI asistenta na postojeću web stranicu?', 'Osnovno postavljanje traje 5 do 10 radnih dana nakon što dostavite i odobrite cjenovnik, opise usluga i česta pitanja.'],
      ['Na kojim jezicima radi Digital X AI asistent?', 'Podržava bosanski, hrvatski, srpski, engleski i njemački jezik, što je posebno korisno za firme koje rade s dijasporom i DACH tržištem.'],
    ],
    related: [['/usluge/ai-chatbot-za-web-stranicu/', 'AI chatbot za web stranicu'], ['/shop/product/ai-concierge/', 'AI prodajni asistent — od 490 KM'], ['/ai-concierge-preview/', 'Isprobajte AI Concierge']],
  },
  {
    slug: 'ai-recepcionar-i-automatizacija-upita', cluster: 'ai', stage: 'automatizovati', minutes: 7, published: '2026-11-23',
    title: 'AI recepcionar i automatizacija upita: od poruke do CRM-a bez gubitka leada',
    h1: 'AI recepcionar i automatizacija upita (X Lead Desk): kako povezati web, WhatsApp i CRM',
    desc: 'Kako AI recepcionar i X Lead Desk kvalifikuju upite 24/7, sprječavaju duple zapise u CRM-u i predaju jasan sažetak timu uz ljudsku potvrdu termina.',
    keywords: ['ai recepcionar', 'automatizacija upita', 'x lead desk', 'crm automatizacija bih', 'automation starter'],
    cover: {
      alt: 'AI recepcionar i X Lead Desk automatizacija upita: prijem 24/7, kvalifikacija, idempotentni CRM zapis i potvrda tima',
      caption: 'Od prvog upita van radnog vremena do provjerenog zapisa u CRM-u bez dupliranja i izgubljenih poruka.',
    },
    diagram: '/media/znanje/cluster5-lead-automation-diagram.webp',
    answer: 'AI recepcionar i X Lead Desk rješavaju najčešći uzrok gubitka kupaca u BiH: upite koji stignu uveče ili vikendom i ostanu bez odgovora do sutradan. Sistem dočekuje upit, postavlja tri do četiri pitanja za kvalifikaciju, priprema strukturiran sažetak i šalje ga u vaš CRM ili e-mail uz provjeru grešaka i ljudsku potvrdu termina.',
    sections: [
      ['Zašto prihvaćen webhook nije dokaz da je upit stigao u CRM', `<p>Mnoge firme misle da je automatizacija gotova čim forma pošalje poruku na e-mail ili webhook. U praksi, mrežne greške, dupli klikovi i promjene polja u CRM-u dovode do izgubljenih ili dupliranih kontakata. Zato svaki tok u ${a('/usluge/x-lead-desk/', 'X Lead Desku')} koristi jedinstveni identifikator predaje, pravila ponovnog pokušaja i provjeru stvarnog zapisa u odredišnom sistemu.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster5-lead-automation-diagram.webp" srcset="/media/znanje/cluster5-lead-automation-diagram-768.webp 768w, /media/znanje/cluster5-lead-automation-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četiri faze automatizacije upita: prijem 24/7, kvalifikacija, testirana CRM sinhronizacija i ljudska potvrda"><figcaption>Četiri faze pouzdane automatizacije upita: od prijema 24/7 do potvrđenog zapisa i ljudske odluke.</figcaption></figure>
<ol><li><strong>Prijem 24/7 po kanalu.</strong> Web razgovor, kontakt forma, WhatsApp i kalendar provjeravaju se zasebno prema dostupnosti API-ja i troškovima dobavljača.</li>
<li><strong>Kvalifikacija u 3–4 pitanja.</strong> Sistem prikuplja uslugu, okvirni cilj, lokaciju i kontakt kako tim ne bi gubio vrijeme na nejasne poruke.</li>
<li><strong>Idempotentna predaja.</strong> Jedinstveni ID sprječava da isti upit napravi tri zadatka u CRM-u ako korisnik dvaput klikne dugme.</li>
<li><strong>Ljudska potvrda osjetljivih koraka.</strong> Termin nije rezervisan dok kalendar to ne potvrdi, a konačnu ponudu uvijek odobrava vaš tim.</li></ol>`],
      ['Šta automatizovati prvo, a šta ostaviti čovjeku', `<p>U skladu sa smjernicama <a href="https://genai.owasp.org/llm-top-10/" target="_blank" rel="noopener">OWASP LLM06 (Excessive Agency)</a>, automatizacija treba preuzeti ponavljajuće prikupljanje podataka i obavijesti, dok procjena složenih zahtjeva, cijena po mjeri i odnos s klijentom ostaju ljudski posao. Za ordinacije, hotele i B2B firme to znači da tim ujutro dobija uredan sažetak umjesto deset rasutih poruka.</p>`],
      ['Automation Starter: prvi prioritetni workflow za 5–7 dana', `<p>Ne morate automatizovati cijelu firmu odjednom. Kroz paket ${a('/shop/product/workflow-starter/', 'Automation Starter (od 349 KM jednokratno)')} postavljamo jedan prioritetni tok — od upita do zadatka, obavijesti ili CRM zapisa — za 5 do 7 dana uz testiranje i uputstvo za tim. Više pogledajte na ${a('/usluge/ai-receptionist/', 'AI recepcionar')} i ${a('/usluge/ai-automatizacija/', 'AI automatizacija poslovanja')}.</p>`],
    ],
    faq: [
      ['Može li AI recepcionar automatski zakazivati termine u našem kalendaru?', 'Može nakon što provjerimo i povežemo kompatibilan kalendar, pravila dostupnosti i potvrdu rezervacije. Termin se smatra zakazanim tek kada ga kalendar potvrdi.'],
      ['Koliko košta postavljanje prve automatizacije upita?', 'Automation Starter kreće od 349 KM jednokratno za jedan prioritetni workflow i postavlja se za 5 do 7 dana, dok održavanje automatizacija kreće od 249 KM mjesečno.'],
      ['Da li AI recepcionar zamjenjuje prodajni tim ili recepciju?', 'Ne. Preuzima prvi odgovor van radnog vremena i prikuplja osnovne podatke kako bi vaš tim dobio jasan sažetak i brže zaključio posao.'],
    ],
    related: [['/usluge/ai-receptionist/', 'AI recepcionar'], ['/usluge/x-lead-desk/', 'X Lead Desk'], ['/shop/product/workflow-starter/', 'Automation Starter — od 349 KM']],
  },
  {
    slug: 'ai-second-brain-baza-znanja-firme', cluster: 'ai', stage: 'automatizovati', minutes: 7, published: '2026-11-23',
    title: 'AI Second Brain za firme: interna baza znanja s kontrolom pristupa',
    h1: 'AI Second Brain i interna baza znanja: kako organizovati dokumente, SOP-ove i ponude firme',
    desc: 'Kako AI Second Brain OS razdvaja javnog web asistenta od privatnih SOP-ova, ponuda i procedura firme uz kontrolu pristupa i izvore na svakom odgovoru.',
    keywords: ['ai second brain', 'interna baza znanja ai', 'poslovna memorija ai', 'growthos second brain', 'kontrola pristupa ai'],
    cover: {
      alt: 'AI Second Brain za firme: odvajanje javnog web asistenta od privatne baze znanja, SOP-ova i kontrole pristupa',
      caption: 'Privatno znanje firme ostaje odvojeno od javnog web asistenta, uz izvore i kontrolu pristupa po ulogama.',
    },
    diagram: '/media/znanje/cluster5-second-brain-diagram.webp',
    answer: 'AI Second Brain je privatna poslovna baza znanja koja povezuje vaše odobrene procedure (SOP-ove), ponude, cjenovnike i prethodne odluke u pretraživ sistem s izvorima. Za razliku od javnog chatbota na web stranici, interno znanje ima strogu kontrolu pristupa po ulogama i nikada ne postaje dostupno posjetiocima sajta.',
    sections: [
      ['Zašto javni web asistent i interna baza znanja moraju biti odvojeni', `<p>Najveći sigurnosni rizik kod uvođenja AI-ja u firmu nastaje kada se interni dokumenti, ugovori ili bilješke o klijentima pomiješaju s javnim chatbotom. Prema <a href="https://genai.owasp.org/llm-top-10/" target="_blank" rel="noopener">OWASP Top 10 za LLM aplikacije (LLM02 i LLM08)</a>, vektorske baze i kontekst moraju imati jasne granice pristupa kako povjerljivi podaci nikada ne bi procurili u javni odgovor.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster5-second-brain-diagram.webp" srcset="/media/znanje/cluster5-second-brain-diagram-768.webp 768w, /media/znanje/cluster5-second-brain-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Poređenje privatnog AI Second Brain OS sistema i javnog web asistenta s jasnom granicom pristupa"><figcaption>Jasna granica između privatnog AI Second Brain OS-a za tim i javnog web asistenta za posjetioce.</figcaption></figure>
<div class="table-wrap"><table><thead><tr><th scope="col">Sloj sistema</th><th scope="col">Šta sadrži</th><th scope="col">Ko ima pristup</th></tr></thead><tbody>
<tr><th scope="row">Javni web asistent</th><td>Objavljene cijene, usluge, FAQ i javni vodiči</td><td>Posjetioci web stranice (24/7)</td></tr>
<tr><th scope="row">AI Second Brain OS</th><td>Interni SOP-ovi, šabloni ponuda, tehničke bilješke i odluke</td><td>Samo ovlašteni članovi tima po ulogama</td></tr>
<tr><th scope="row">Osjetljive akcije</th><td>Slanje ponuda, izmjene u CRM-u, finansijski zapisi</td><td>Isključivo uz ljudsku potvrdu i evidenciju</td></tr></tbody></table></div>`],
      ['Šta firma dobija kada organizuje znanje prije automatizacije', `<p>Kada novi zaposlenik ili prodajni tim traži tačnu proceduru, rok ili tehničko ograničenje, odgovor s direktnim linkom na izvorni dokument štedi sate pretrage po folderima i porukama. Prije povezivanja dokumenata definišemo ko održava izvore, šta je zastarjelo i koje informacije smiju ući u sistem.</p>`],
      ['Kako izgleda implementacija kroz Second Brain OS i GrowthOS', `<p>Kod Digital X ${a('/shop/product/second-brain-os/', 'AI Second Brain OS')} i ${a('/usluge/ai-second-brain/', 'AI Second Brain usluga')} procjenjuju se prema broju izvora, pravima pristupa i potrebnim integracijama. Interaktivni prikaz modula možete pogledati na stranicama ${a('/second-brain-os.html', 'Second Brain OS')} i ${a('/growthos.html', 'GrowthOS demo')}.</p>`],
    ],
    faq: [
      ['Da li javni chatbot na našoj stranici može vidjeti interne dokumente iz Second Braina?', 'Ne. Javni web asistent koristi isključivo odobreni javni katalog i FAQ, dok je privatni Second Brain odvojen sistem s kontrolom pristupa.'],
      ['Koliko košta AI Second Brain OS za firmu?', 'Cijena se procjenjuje prema broju izvora dokumenata, korisničkih uloga i integracija, a obim i rok potvrđujemo pisano nakon pregleda procesa.'],
      ['Smijemo li unositi povjerljive podatke klijenata u javni demo na sajtu?', 'Ne. Javni demo služi samo za upoznavanje javne ponude; privatni podaci obrađuju se isključivo u zasebno ugovorenom i zaštićenom okruženju.'],
    ],
    related: [['/usluge/ai-second-brain/', 'AI Second Brain usluga'], ['/second-brain-os.html', 'Second Brain OS pregled'], ['/growthos.html', 'GrowthOS interaktivni demo']],
  },
  {
    slug: 'ga4-consent-mode-v2-mjerenje-konverzija', cluster: 'strategija', stage: 'mjeriti', minutes: 7, published: '2026-11-23',
    title: 'GA4 i Consent Mode v2: mjerenje konverzija za BiH i EU tržište',
    h1: 'GA4, Google Consent Mode v2 i mjerenje stvarnih konverzija za firme u BiH i DACH regiji',
    desc: 'Kako podesiti GA4 ključne događaje i Google Consent Mode v2 za BiH i EU/DACH posjetioce: ad_storage, analytics_storage, ad_user_data i ad_personalization.',
    keywords: ['ga4 mjerenje konverzija', 'google consent mode v2', 'gdpr analitika bih', 'ga4 kljucni dogadjaji', 'mjerenje upita web stranica'],
    cover: {
      alt: 'GA4 i Google Consent Mode v2 mjerenje konverzija za BiH i EU: pristanak korisnika, ključni događaji i atribucija',
      caption: 'Consent Mode v2 i GA4 ključni događaji spajaju GDPR usklađenost s tačnim mjerenjem upita i narudžbi.',
    },
    diagram: '/media/znanje/cluster5-ga4-consent-diagram.webp',
    answer: 'Google Analytics 4 (GA4) i Google Consent Mode v2 omogućavaju firmama u BiH koje ciljaju domaće i EU/DACH kupce da mjere stvarne upite, pozive i narudžbe uz poštovanje pristanka za kolačiće. Označite slanje forme, klik na telefon, WhatsApp i kupovinu kao ključne događaje (Key Events) i povežite ih sa Search Consoleom i Meta CAPI-jem.',
    sections: [
      ['Šta je Google Consent Mode v2 i kada je obavezan za firme iz BiH', `<p>Prema dokumentaciji <a href="https://developers.google.com/tag-platform/security/guides/consent" target="_blank" rel="noopener">Google Tag Platform: Set up consent mode</a>, Consent Mode v2 kontroliše Google tagove kroz četiri signala: <code>ad_storage</code>, <code>analytics_storage</code>, <code>ad_user_data</code> i <code>ad_personalization</code>. Ako firma iz BiH prima posjetioce iz EU/EEA ili DACH dijaspore i koristi Google Ads ili GA4, ispravan pristanak je nužan za zakonito mjerenje.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster5-ga4-consent-diagram.webp" srcset="/media/znanje/cluster5-ga4-consent-diagram-768.webp 768w, /media/znanje/cluster5-ga4-consent-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četverokoračni tok mjerenja: Consent Mode v2 pristanak, GA4 ključni događaji, GSC i CAPI atribucija i šest poslovnih brojeva"><figcaption>Od pristanka korisnika do šest poslovnih brojeva: kako GA4, Consent Mode v2 i Search Console rade zajedno.</figcaption></figure>
<div class="table-wrap"><table><thead><tr><th scope="col">Signal</th><th scope="col">Šta kontroliše</th><th scope="col">Pravilo prije pristanka</th></tr></thead><tbody>
<tr><th scope="row"><code>analytics_storage</code></th><td>Kolačići za GA4 mjerenje posjeta</td><td><code>denied</code> dok posjetilac iz EU ne prihvati analitiku</td></tr>
<tr><th scope="row"><code>ad_storage</code></th><td>Kolačići za Google Ads konverzije</td><td><code>denied</code> dok posjetilac ne prihvati marketing</td></tr>
<tr><th scope="row"><code>ad_user_data</code></th><td>Slanje korisničkih podataka za oglase</td><td>Usklađeno s odlukom u banneru kolačića</td></tr>
<tr><th scope="row"><code>ad_personalization</code></th><td>Personalizovani oglasi i remarketing</td><td><code>denied</code> bez marketinškog pristanka</td></tr></tbody></table></div>`],
      ['Koji događaji u GA4 trebaju biti označeni kao Key Events', `<p>Prema vodiču <a href="https://support.google.com/analytics/answer/9267568" target="_blank" rel="noopener">Google Analytics Help: About key events</a>, ključni događaj treba mjeriti isključivo radnju koja ima poslovnu vrijednost. Nikada ne označavajte obično otvaranje stranice ili skrolanje kao ključni događaj jer to iskrivljuje izvještaje i učenje kampanja.</p>
<ol><li><strong>Slanje kontakt forme (<code>generate_lead</code>).</strong> Mjeri se tek nakon uspješnog odgovora servera, ne na prazan klik dugmeta.</li>
<li><strong>Klik na telefon i WhatsApp.</strong> Posebno važno za lokalne usluge, ordinacije i servise u BiH.</li>
<li><strong>Završena narudžba (<code>purchase</code>).</strong> Za web shopove s tačnom vrijednošću u KM/EUR i deduplikacijom.</li>
<li><strong>Search Console i 7-dnevno pravilo.</strong> Nakon Google Core Updatea sačekajte sedam punih dana prije poređenja trendova.</li></ol>`],
      ['Od podataka do mjesečne odluke bez suvišnih grafikona', `<p>Kada su GA4, Consent Mode v2 i ${a('/znanje/meta-capi-server-side-tracking/', 'Meta CAPI')} povezani, mjesečni izvještaj staje na jednu stranicu sa šest brojeva opisanih u vodiču ${a('/znanje/kako-mjeriti-rezultate-marketinga/', 'kako mjeriti rezultate marketinga')}. Za provjeru oznaka i GDPR osnova pogledajte ${a('/znanje/gdpr-pristupacnost-web-stranice/', 'GDPR i pristupačnost')} i pokrenite ${a('/usluge/x-signal/', 'besplatnu X Signal analizu')}.</p>`],
    ],
    faq: [
      ['Da li Consent Mode v2 treba firmi koja posluje samo u BiH?', 'Domaći zakon uređuje obradu u BiH, a ako imate posjetioce iz Hrvatske, Njemačke, Austrije ili Švicarske ili koristite Google Ads, Consent Mode v2 štiti tačnost mjerenja i usklađenost s EU pravilima.'],
      ['Zašto se broj upita u GA4 razlikuje od broja poruka u inboxu?', 'Dio korisnika odbije analitičke kolačiće ili koristi blokatore, dok dio pozove direktno s Google Business profila. Zato GA4 uvijek upoređujemo sa stvarnim upitima u CRM-u ili inboxu.'],
      ['Šta je razlika između običnog događaja i Key Eventa u GA4?', 'Običan događaj bilježi svaku interakciju, dok Key Event označava poslovne ciljeve poput upita, poziva ili kupovine.'],
    ],
    related: [['/znanje/kako-mjeriti-rezultate-marketinga/', '6 brojeva za mjerenje marketinga'], ['/znanje/gdpr-pristupacnost-web-stranice/', 'GDPR, kolačići i pristupačnost'], ['/usluge/x-signal/', 'Besplatna X Signal analiza']],
  },
];
