const a = (href, text) => `<a href="${href}">${text}</a>`;

export const cluster2Guides = [
  {
    slug: 'google-business-profile-verifikacija-bih', cluster: 'seo', stage: 'pronadjen', minutes: 7, published: '2026-11-22',
    title: 'Google Business Profile verifikacija i suspenzija u BiH: kako riješiti',
    h1: 'Google Business Profile verifikacija i suspenzija u BiH: koraci za odobrenje profila',
    desc: 'Kako proći Google Business Profile video verifikaciju u BiH, razlika između lokacije i service-area profila i kako riješiti suspenziju bez gubitka recenzija.',
    keywords: ['google business profile verifikacija bih', 'google mapa suspenzija', 'google moj biznis sarajevo', 'lokalni seo bih'],
    cover: {
      alt: 'Google Business Profile verifikacija i oporavak u BiH: tačan naziv, primarna kategorija, NAP konzistentnost i video dokaz',
      caption: 'Usklađenost naziva, adrese, kategorije i video dokaza sprječava suspenziju i jača lokalne signale na Mapama i u AI odgovorima.',
    },
    diagram: '/media/znanje/cluster2-gbp-verification-diagram.webp',
    answer: 'Za uspješnu Google Business Profile verifikaciju u BiH firma mora ispunjavati Googleova pravila za fizičku lokaciju s oznakom ili service-area poslovanje s kontaktom uživo. Najčešći razlozi odbijanja i suspenzije su dodavanje ključnih riječi u naziv profila, virtuelne adrese i neusklađen NAP (naziv, adresa, telefon) između profila i web stranice.',
    sections: [
      ['Ko ima pravo na Google Business Profile (lokacija vs. service-area)', `<p>Prema zvaničnim <a href="https://support.google.com/business/answer/3038177" target="_blank" rel="noopener">Google Business Profile smjernicama</a>, profil mogu imati firme koje s klijentima rade uživo na svojoj adresi ili izlaze na teren kod klijenta. Čisto online biznisi bez kontakta uživo nisu podobni, dok terenske firme (majstori, servisi, dostava) trebaju sakriti kućnu adresu i navesti područje rada.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster2-gbp-verification-diagram.webp" srcset="/media/znanje/cluster2-gbp-verification-diagram-768.webp 768w, /media/znanje/cluster2-gbp-verification-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Poređenje ispravnog Google Business Profile podešavanja i najčešćih uzroka suspenzije u BiH"><figcaption>Ispravna priprema lokacije, kategorije i video dokaza smanjuje rizik odbijanja i suspenzije profila.</figcaption></figure>`],
      ['Kako proći video verifikaciju u BiH iz prvog pokušaja', `<p>Google u BiH najčešće traži jednokratni neprekinuti video snimak direktno kroz Google Maps ili Search aplikaciju, bez montaže i rezova. Snimak mora u 60–90 sekundi jasno povezati vanjsku lokaciju, ulaz s trajnom oznakom firme i unutrašnji radni prostor ili opremu kojom dokazujete stvarno poslovanje.</p>
<ol><li><strong>Ulica i broj zgrade.</strong> Počnite ispred objekta tako da se vide naziv ulice, kućni broj ili prepoznatljiva okolina.</li>
<li><strong>Trajna oznaka firme.</strong> Snimite tablu, izlog ili natpis na vratima (papirni natpisi zalijepljeni selotejpom često budu odbijeni).</li>
<li><strong>Pristup i radni prostor.</strong> Otključajte vrata ili pokažite radni sto, ordinaciju, opremu, fiskalni uređaj ili brendirano vozilo.</li></ol>`],
      ['Šta uraditi ako je profil suspendovan i kako povezati web stranicu', `<p>Kada Google suspenduje profil, nemojte otvarati novi duplikat jer to dodatno otežava oporavak i briše postojeće recenzije. Prvo uklonite kršenja smjernica (višak ključnih riječi u nazivu, pogrešna adresa ili dupli profili), uskladite podatke na web stranici i u <code>LocalBusiness</code> JSON-LD-u, pa pošaljite žalbu s rješenjem o registraciji firme i računom za režije. Detalje usluge pogledajte na ${a('/usluge/google-business-profile/', 'Google Business Profile optimizacija')} i ${a('/usluge/lokalni-seo-sarajevo/', 'Lokalni SEO Sarajevo')}.</p>`],
    ],
    faq: [
      ['Smijem li u naziv Google Business profila dodati grad ili ključnu riječ?', 'Ne, osim ako su grad ili djelatnost dio zvaničnog registrovanog naziva firme. Dodavanje ključnih riječi poput „najbolji stomatolog Sarajevo“ čest je razlog suspenzije.'],
      ['Mogu li koristiti virtuelnu kancelariju ili poštanski pretinac za Google Mapu?', 'Ne. Google zahtijeva stvarnu lokaciju s osobljem u radno vrijeme ili skrivenu adresu uz definisano područje usluge (service-area).'],
      ['Koliko traje pregled žalbe nakon suspenzije?', 'Zavisi od opterećenja Googleove podrške i kompletnosti dokaza (rješenje o registraciji, fotografije table, račun za komunalije); obično traje od nekoliko dana do nekoliko sedmica.'],
      ['Kako Google Business Profile pomaže i u AI odgovorima?', 'AI sistemi koriste javne podatke o firmi, kategorije, radno vrijeme, recenzije i usklađenost s web stranicom (hasMap i sameAs) za lokalne preporuke.'],
    ],
    related: [['/usluge/google-business-profile/', 'Google Business Profile optimizacija'], ['/usluge/lokalni-seo-sarajevo/', 'Lokalni SEO Sarajevo'], ['/blog/lokalni-seo-google-mapa.html', 'Kako biti prvi na Google mapi']],
  },
  {
    slug: 'lokalni-seo-vise-gradova-bih', cluster: 'seo', stage: 'pronadjen', minutes: 6, published: '2026-11-22',
    title: 'Lokalni SEO za više gradova u BiH bez doorway stranica',
    h1: 'Lokalni SEO za više gradova u BiH: kako rangirati bez doorway spam rizika',
    desc: 'Kako firme u BiH mogu pokriti Sarajevo, Banju Luku, Mostar, Tuzlu i Zenicu bez tankih doorway stranica koje krše Google Spam Policies.',
    keywords: ['lokalni seo vise gradova', 'doorway stranice google', 'seo sarajevo banja luka mostar', 'areaserved schema'],
    cover: {
      alt: 'Lokalni SEO za više gradova u BiH bez doorway stranica: provjereno sjedište, regionalni hub i areaServed schema',
      caption: 'Jedna jaka stranica usluge s jasnim regionalnim pokrićem i 301 konsolidacijom pobjeđuje klonirane gradske stranice.',
    },
    diagram: '/media/znanje/cluster2-multi-city-diagram.webp',
    answer: 'Firme koje rade u više gradova u BiH ne trebaju praviti deset identičnih stranica gdje se mijenja samo ime grada, jer Google takve šablone tretira kao doorway spam. Umjesto toga, objavite posebnu lokalnu stranicu samo za gradove gdje imate stvarnu poslovnicu ili tim, a ostale gradove pokrijte kroz jaku glavnu stranicu usluge, areaServed JSON-LD i stvarne projekte.',
    sections: [
      ['Zašto klonirane gradske stranice krše Google Spam Policies', `<p>Prema zvaničnim <a href="https://developers.google.com/search/docs/essentials/spam-policies#doorways" target="_blank" rel="noopener">Google Spam Policies za doorway stranice</a>, stranice napravljene isključivo da hvataju pretrage po gradovima s istim tekstom, istim cjenovnikom i istim FAQ-om nemaju samostalnu vrijednost za korisnika. Takve stranice razvodnjavaju autoritet domene, stvaraju kanibalizaciju i rizikuju pad vidljivosti nakon Core ili Spam updatea.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster2-multi-city-diagram.webp" srcset="/media/znanje/cluster2-multi-city-diagram-768.webp 768w, /media/znanje/cluster2-multi-city-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Poređenje čiste regionalne SEO arhitekture i rizičnih doorway stranica po gradovima"><figcaption>Čista regionalna arhitektura čuva posebnu stranicu za stvarno sjedište, a ostale gradove spaja u jedan jak hub.</figcaption></figure>`],
      ['Kada gradska stranica ima smisla, a kada je treba spojiti 301 preusmjerenjem', `<p>Posebna stranica za grad opravdana je samo kada u tom gradu imate fizičku adresu, lokalni tim, specifične projekte ili drugačiju ponudu i logistiku. Na primjer, Digital X ima sjedište u Sarajevu pa održava ${a('/usluge/izrada-web-stranica/sarajevo/', 'stranicu za Sarajevo')} i ${a('/usluge/lokalni-seo-sarajevo/', 'Lokalni SEO Sarajevo')}, dok smo tanke stranice za druge gradove trajno preusmjerili na glavni hub ${a('/usluge/izrada-web-stranica/', 'Izrada web stranica u BiH')}.</p>
<div class="table-wrap"><table><thead><tr><th scope="col">Situacija firme</th><th scope="col">Preporučena struktura</th><th scope="col">Schema i signali</th></tr></thead><tbody>
<tr><th scope="row">Jedno sjedište + online rad po BiH</th><td>1 lokalna stranica sjedišta + 1 nacionalni hub usluge</td><td><code>LocalBusiness</code> za sjedište + <code>areaServed</code> za BiH/DACH</td></tr>
<tr><th scope="row">Više fizičkih poslovnica</th><td>Posebna stranica po poslovnici s jedinstvenim timom i slikama</td><td>Zaseban <code>LocalBusiness</code> + zaseban Google Business Profile</td></tr>
<tr><th scope="row">Postojeće tanke gradske stranice</th><td>Trajni <code>301</code>/<code>308</code> redirect na glavni hub + uklanjanje iz sitemapa</td><td>Konsolidacija signala bez gubitka postojećih linkova</td></tr></tbody></table></div>`],
      ['Kako pokriti Banju Luku, Mostar, Tuzlu i Zenicu na jednoj stranici', `<p>Umjesto duplih URL-ova, na glavnoj stranici usluge dodajte jasnu sekciju o načinu saradnje na daljinu, rokovima isporuke, lokalnim platnim procesorima i stvarnim studijama slučaja iz različitih gradova. Time korisnik i AI pretraživači dobijaju jedan autoritativan izvor umjesto pet slabih kopija.</p>`],
    ],
    faq: [
      ['Da li brisanje tankih gradskih stranica smanjuje promet?', 'Ako se stare adrese trajno preusmjere (301/308) na jaku glavnu stranicu usluge i uklone iz sitemapa, autoritet se konsoliduje na jednom URL-u i smanjuje rizik od doorway filtera.'],
      ['Kako da me pronađu kupci iz drugog grada ako nemam poslovnicu tamo?', 'Kroz jaku glavnu stranicu usluge s jasno navedenim područjem rada (BiH, region, DACH), areaServed JSON-LD podacima, recenzijama klijenata i Google Ads kampanjama ciljanim po gradovima.'],
      ['Koliko jedinstvenog sadržaja treba imati stranica poslovnice?', 'Svaka stranica poslovnice treba imati stvarnu adresu, radno vrijeme, fotografije lokacije, lokalni tim, specifične usluge i jedinstvena česta pitanja — ne samo zamijenjeno ime grada.'],
    ],
    related: [['/usluge/izrada-web-stranica/', 'Izrada web stranica u BiH'], ['/usluge/izrada-web-stranica/sarajevo/', 'Izrada web stranica Sarajevo'], ['/usluge/lokalni-seo-sarajevo/', 'Lokalni SEO Sarajevo']],
  },
  {
    slug: 'google-recenzije-i-ai-preporuke', cluster: 'seo', stage: 'privuci', minutes: 6, published: '2026-11-22',
    title: 'Google recenzije, Maps i AI preporuke: kako tekst recenzija utiče na upite',
    h1: 'Kako Google recenzije utiču na Google Maps i AI preporuke u 2026.',
    desc: 'Zašto tekst recenzije, svježina i odgovori vlasnika vrijede više od same ocjene 5.0 na Google Mapama i u AI odgovorima, te kako ih prikupljati po pravilima.',
    keywords: ['google recenzije seo', 'google maps recenzije bih', 'ai preporuke recenzije', 'sistem recenzija'],
    cover: {
      alt: 'Google recenzije, Maps i AI preporuke: kontekst usluge, svježina, odgovori vlasnika i usklađenost s pravilima',
      caption: 'Konkretan opis usluge i grada u tekstu recenzije daje Googleu i AI asistentima jasan kontekst povjerenja.',
    },
    diagram: '/media/znanje/cluster2-reviews-signals-diagram.webp',
    answer: 'Google recenzije utiču na lokalnu vidljivost i AI preporuke kroz četiri signala: ukupan broj i prosjek ocjena, svježinu novih recenzija, konkretan tekst koji opisuje uslugu i grad, te redovne odgovore vlasnika. Kupovina lažnih recenzija ili filtriranje nezadovoljnih kupaca (review gating) krši Googleova pravila i može dovesti do uklanjanja recenzija ili suspenzije profila.',
    sections: [
      ['Zašto tekst recenzije vrijedi više od same ocjene bez komentara', `<p>Recenzija s pet zvjezdica bez teksta potvrđuje samo ocjenu, dok pisana recenzija koja spominje konkretnu uslugu, iskustvo i grad daje semantički kontekst i Google Mapama i AI asistentima. Kada kupac napiše „brza izrada web shopa u Sarajevu“ ili „bezbolna ugradnja implanta“, pretraživači lakše povezuju vaš profil s tim upitima.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster2-reviews-signals-diagram.webp" srcset="/media/znanje/cluster2-reviews-signals-diagram-768.webp 768w, /media/znanje/cluster2-reviews-signals-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Četiri signala Google recenzija za Google Maps i AI preporuke: pisani kontekst, svježina, odgovori vlasnika i poštivanje pravila"><figcaption>Četiri signala recenzija: pisani kontekst i kontinuirana svježina grade povjerenje bez kršenja Googleovih pravila.</figcaption></figure>`],
      ['Kako AI sistemi čitaju recenzije i vanjske potvrde', `<p>Istraživanje Chen et al. (2025) pokazuje da ChatGPT, Perplexity i Gemini pri lokalnim i komercijalnim preporukama snažno vrednuju nezavisne izvore i korisnički konsenzus izvan same web stranice brenda. Redovne, autentične recenzije na Google Business Profileu i stručnim direktorijima daju AI modelima provjerljiv dokaz kvaliteta usluge.</p>
<ul><li><strong>Odgovarajte na svaku recenziju.</strong> Kratak, ljubazan odgovor vlasnika potvrđuje aktivno upravljanje profilom i pojašnjava kontekst usluge.</li>
<li><strong>Ne nudite popuste za pozitivne ocjene.</strong> Prema <a href="https://support.google.com/contributionpolicy/answer/7400114" target="_blank" rel="noopener">Googleovim pravilima o sadržaju korisnika</a>, plaćene ili uslovljene recenzije su zabranjene.</li></ul>`],
      ['Etička automatizacija zahtjeva za recenziju nakon završene usluge', `<p>Najveći problem lokalnih firmi nije nezadovoljstvo klijenata, nego to što zadovoljni klijenti zaborave ostaviti recenziju ako ih niko ne podsjeti u pravom trenutku. Kroz ${a('/shop/product/review-engine/', 'Sistem recenzija (od 199 KM)')} i tok opisan u vodiču ${a('/blog/automatizacija-recenzija.html', 'automatizacija Google recenzija')}, zahtjev s direktnim linkom šalje se automatski nakon stvarno završene usluge, bez spamovanja i bez filtriranja kupaca.</p>`],
    ],
    faq: [
      ['Da li smijem tražiti od klijenta da napiše koju uslugu je koristio?', 'Da. Možete ljubazno zamoliti klijenta da u jednoj rečenici opiše svoje iskustvo i uslugu koju je koristio, bez diktiranja teksta ili uslovljavanja ocjene.'],
      ['Šta je review gating i zašto je zabranjen?', 'Review gating je praksa u kojoj firma prvo pita kupca da li je zadovoljan, pa link za Google recenziju šalje samo zadovoljnima. Google to izričito zabranjuje.'],
      ['Koliko košta postavljanje automatizovanog sistema za recenzije?', 'Kod Digital X Sistem recenzija kreće od 199 KM uz održavanje, a povezuje se sa završetkom usluge ili termina prema dogovorenom obimu.'],
    ],
    related: [['/shop/product/review-engine/', 'Sistem recenzija — od 199 KM'], ['/blog/automatizacija-recenzija.html', 'Vodič: automatizacija recenzija'], ['/usluge/google-business-profile/', 'Google Business Profile optimizacija']],
  },
  {
    slug: 'tehnicki-seo-audit-checklist', cluster: 'seo', stage: 'mjeriti', minutes: 8, published: '2026-11-22',
    title: 'Tehnički SEO audit u 15 minuta: 10 grešaka na BiH sajtovima',
    h1: 'Tehnički SEO audit u 15 minuta: 10 grešaka koje najčešće koče BiH web stranice',
    desc: 'Praktična 10-tačkasta provjera zasnovana na X Signal analizi 78 javnih BiH poslovnih sajtova: H1 greške (56,4%), nedostatak entity scheme (50%) i max-snippet:-1.',
    keywords: ['tehnicki seo audit', 'seo provjera sajta bih', 'x signal analiza', 'seo greske web stranica'],
    cover: {
      alt: 'Tehnički SEO audit u 15 minuta: 10 najčešćih grešaka na 78 analiziranih BiH poslovnih web stranica',
      caption: 'Naš X Signal benchmark na 78 BiH poslovnih sajtova pokazuje da su najveći problemi H1 struktura, entity schema i snippet direktive.',
    },
    diagram: '/media/znanje/cluster2-tech-audit-diagram.webp',
    answer: 'Brzi tehnički SEO audit u 15 minuta provjerava deset signala: HTTPS i kanonski host bez redirect petlji, robots.txt, XML sitemap, jedan H1 naslov, meta opis, canonical tag, Core Web Vitals, validan Organization/LocalBusiness JSON-LD, max-snippet:-1 direktivu i samostalne pasuse od 40–80 riječi. Na uzorku od 78 BiH poslovnih sajtova, 56,4% ima grešku s H1 naslovom, a 50,0% nema entity schemu.',
    sections: [
      ['Šta je pokazala X Signal analiza 78 BiH poslovnih sajtova', `<p>Dana 22. novembra 2026. testirali smo 95 javnih poslovnih web stranica u BiH (78 vratilo čitljiv HTTP 200 HTML) kroz naš ${a('/usluge/x-signal/', 'X Signal analizator')}. Dok 100% koristi HTTPS i 98,7% ima <code>&lt;html lang&gt;</code>, većina gubi vidljivost na osnovnim tehničkim i AI signalima: 56,4% nema tačno jedan H1, 50,0% nema <code>Organization</code> ili <code>LocalBusiness</code> schemu, a 69,2% nema eksplicitan <code>max-snippet:-1</code>.</p>
<figure class="guide-figure"><img src="/media/znanje/cluster2-tech-audit-diagram.webp" srcset="/media/znanje/cluster2-tech-audit-diagram-768.webp 768w, /media/znanje/cluster2-tech-audit-diagram.webp 1200w" sizes="(max-width:760px) 92vw, 740px" width="1200" height="675" loading="lazy" decoding="async" alt="Grafikon rezultata X Signal benchmarka na 78 javnih BiH poslovnih sajtova: od 100% HTTPS do 0% potpune autor-provenijencije"><figcaption>Rezultati X Signal skeniranja 78 javnih BiH poslovnih sajtova (novembar 2026): najveći pad je kod H1, entity scheme i pasusa.</figcaption></figure>`],
      ['Deset tačaka koje možete provjeriti za 15 minuta', `<p>Ovu provjeru možete uraditi sami bez plaćenih alata koristeći preglednik, Google Search Console i besplatni X Signal pregled. Svaka tačka direktno utiče na to da li Google i AI sistemi mogu indeksirati, razumjeti i citirati vašu ponudu prema <a href="https://developers.google.com/search/docs/fundamentals/seo-starter-guide" target="_blank" rel="noopener">Google SEO Starter Guide</a> standardima.</p>
<ol><li><strong>Jedan kanonski host (www ili bez www).</strong> Provjerite da preusmjerenje ide u jednom 301/308 skoku bez petlji.</li>
<li><strong>Dostupan <code>robots.txt</code> i XML sitemap.</strong> U BiH uzorku 15,4% sajtova nema ispravan <code>robots.txt</code>, a 25,6% nema sitemap.</li>
<li><strong>Samokanonski <code>&lt;link rel="canonical"&gt;</code>.</strong> Nedostaje na 26,9% analiziranih BiH sajtova.</li>
<li><strong>Tačno jedan <code>&lt;h1&gt;</code> naslov.</strong> Čak 56,4% sajtova ima 0 ili više H1 naslova.</li>
<li><strong>Naslov (15–65 znakova) i meta opis (70–165 znakova).</strong> Nedostaju ili su predugi na 43,6% sajtova.</li>
<li><strong>Eksplicitan <code>max-snippet:-1,max-image-preview:large</code>.</strong> Nedostaje na 69,2% sajtova.</li>
<li><strong>Validan <code>Organization</code> / <code>LocalBusiness</code> JSON-LD.</strong> Nedostaje na 50,0% sajtova.</li>
<li><strong>Core Web Vitals (LCP ≤ 2,5 s, INP &lt; 200 ms, CLS &lt; 0,1).</strong> Za ubrzanje pogledajte ${a('/usluge/optimizacija-brzine-sajta/', 'Speed optimizaciju od 99 KM')}.</li>
<li><strong>Dva ili više pasusa od 40–80 riječi.</strong> Nedostaje na 55,1% sajtova.</li>
<li><strong>Vidljivo autorstvo i kontakt putanja.</strong> Povežite stranicu s timom, metodologijom i jasnim kontaktom.</li></ol>`],
      ['Šta popraviti prvo ako imate ograničen budžet', `<p>Prvo riješite blokatore indeksiranja (redirect petlje, <code>noindex</code> greške, canonical i sitemap), zatim brzinu učitavanja (${a('/shop/product/speed-optimization/', 'Speed optimizacija od 99 KM')}), a potom strukturu H1/H2 odgovora i JSON-LD entitete. Za kompletnu provjeru pokrenite ${a('/usluge/x-signal/', 'besplatnu X Signal analizu')} ili pogledajte ${a('/usluge/seo-aeo-geo-cijena/', 'SEO, GEO i AEO pakete')}.</p>`],
    ],
    faq: [
      ['Koliko košta tehničko čišćenje i ubrzanje postojećeg sajta?', 'Kod Digital X jednokratna Speed optimizacija i tehničko čišćenje kreću od 99 KM uz izvještaj prije i poslije, dok kontinuirani SEO · GEO · AEO paket kreće od 249 KM mjesečno.'],
      ['Šta tačno provjerava besplatna X Signal analiza?', 'Provjerava javni HTML, HTTPS, naslove, opise, canonical, H1/H2 strukturu, alt opise, JSON-LD, snippet direktive, autorstvo, spremnost pasusa, robots.txt i sitemap.'],
      ['Da li tehnički SEO audit garantuje prvo mjesto na Googleu?', 'Ne. Tehnički audit uklanja prepreke koje sprečavaju Google i AI sisteme da pravilno pročitaju sajt, dok konačne pozicije zavise i od sadržaja, konkurencije i autoriteta.'],
    ],
    related: [['/usluge/x-signal/', 'Pokrenite besplatnu X Signal analizu'], ['/usluge/optimizacija-brzine-sajta/', 'Speed optimizacija — od 99 KM'], ['/znanje/ai-spremnost-web-stranica-bih-2026/', 'Kompletan X Signal 2026 benchmark']],
  },
];
