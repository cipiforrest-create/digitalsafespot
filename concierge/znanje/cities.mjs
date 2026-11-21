// City landing pages for "izrada web stranica <grad>". Each page needs its own local content:
// who searches there, how local search behaves, which business types matter. No invented clients,
// statistics or market prices; Digital X prices come from the shop catalogue.
const a = (href, text) => `<a href="${href}">${text}</a>`;

export const cities = [
  {
    slug: 'sarajevo', city: 'Sarajevo', locative: 'Sarajevu',
    title: 'Izrada web stranica Sarajevo: cijene i rokovi | Digital X',
    h1: 'Izrada web stranica u Sarajevu: brze, jasne i pronađene na Googleu',
    desc: 'Izrada web stranica u Sarajevu: prezentacija od 449 KM, web s AI asistentom 499 KM, web shop od 2.490 KM. Lokalni SEO, Google mapa i sastanak uživo.',
    keywords: ['izrada web stranica sarajevo', 'web dizajn sarajevo', 'izrada sajta sarajevo', 'web stranica za firmu sarajevo'],
    answer: 'Digital X je agencija iz Sarajeva koja izrađuje web stranice, web shopove i cinematic web iskustva za firme u gradu i okolini. Prezentacijska stranica kreće od 449 KM, cinematic web s AI asistentom košta 499 KM, a web shop kreće od 2.490 KM. Sastanak može biti uživo u Sarajevu ili online.',
    sections: [
      ['Šta je drugačije kad se traži u Sarajevu', `<p>U Sarajevu se na malom prostoru takmiči mnogo firmi iste branše: ordinacije, saloni, advokatske kancelarije, apartmani i restorani često su udaljeni nekoliko ulica jedni od drugih. Kad neko upiše „stomatolog Sarajevo“ ili „frizer blizu mene“, Google bira između njih prema relevantnosti, udaljenosti i ugledu profila.</p>
<p>Zato web stranica u Sarajevu rijetko radi sama. Treba je povezati s Google Business profilom, dosljednim podacima o firmi i recenzijama. Kako se to radi, korak po korak, opisano je u vodiču ${a('/blog/lokalni-seo-google-mapa.html', 'kako biti prvi na Google mapi')}.</p>`],
      ['Kome treba kakva stranica', `<ul>
<li><strong>Ordinacije i klinike.</strong> Pacijenti porede usluge, cijene i iskustva prije poziva. Stranica treba jasne usluge, tim, lokaciju i jednostavno zakazivanje; ${a('/usluge/ai-receptionist/', 'AI recepcionar')} može primati upite i van radnog vremena.</li>
<li><strong>Apartmani, hosteli i hoteli.</strong> Gosti dolaze iz cijelog svijeta i rezervišu s mobitela. Stranica treba više jezika, fotografije koje prodaju prostor i direktan upit mimo provizija platformi. Za doživljaj prostora tu je ${a('/primjeri-web-stranica/', 'cinematic prikaz')}.</li>
<li><strong>Restorani i kafići.</strong> Meni, radno vrijeme, lokacija i rezervacija važniji su od dugih tekstova.</li>
<li><strong>Advokati, računovođe i konsultanti.</strong> Povjerenje se gradi stručnim odgovorima na pitanja klijenata i jasnim područjima rada.</li>
<li><strong>Trgovine i brendovi.</strong> ${a('/znanje/kako-otvoriti-web-shop-bih/', 'Web shop')} s dostavom po gradu i cijeloj BiH.</li>
<li><strong>Firme koje rade s dijasporom.</strong> Kupci iz Njemačke, Austrije i Švicarske traže na njemačkom i engleskom, pa stranica treba te jezike i jasne uslove saradnje na daljinu.</li></ul>`],
      ['Cijene izrade web stranice u Sarajevu', `<p>Ovo su javne početne cijene Digital X. Obim i rok potvrđujemo pisano prije početka.</p>
<div class="table-wrap"><table><thead><tr><th>Paket</th><th>Šta dobijate</th><th>Cijena</th></tr></thead><tbody>
<tr><th>${a('/shop/product/landing-starter/', 'Landing stranica')}</th><td>Jedna stranica s jednim ciljem, za kampanju ili jednu uslugu</td><td>od 199 KM</td></tr>
<tr><th>${a('/shop/product/web-presence/', 'Premium web prisustvo')}</th><td>Prezentacijska stranica, mobilni dizajn, osnovni SEO i kontakt</td><td>od 449 KM</td></tr>
<tr><th>${a('/shop/product/smart-website-launch/', 'Smart Website Launch')}</th><td>Cinematic web do pet stranica i AI asistent prva tri mjeseca</td><td>499 KM</td></tr>
<tr><th>${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')}</th><td>Web shop s kategorijama, plaćanjem, dostavom i obukom</td><td>od 2.490 KM</td></tr>
<tr><th>${a('/shop/product/site-care/', 'Održavanje')}</th><td>Ažuriranja, sigurnosne kopije i tehnička podrška</td><td>od 49 KM mjesečno</td></tr></tbody></table></div>
<p>Šira slika tržišnih cijena i od čega se razlike sastoje je u vodiču ${a('/blog/koliko-kosta-web-stranica-bih.html', 'koliko košta web stranica u BiH')}.</p>`],
      ['Kako izgleda saradnja', `<ol><li><strong>Razgovor.</strong> Uživo u Sarajevu ili online: cilj stranice, usluge, konkurencija i rok.</li>
<li><strong>Pisana ponuda.</strong> Popis stranica, šta je uključeno, cijena i rok.</li>
<li><strong>Sadržaj i dizajn.</strong> Tekstovi i fotografije, pa dizajn prvo za mobitel. Po potrebi organizujemo ${a('/usluge/fotografija-proizvoda/', 'fotografisanje')} na lokaciji.</li>
<li><strong>Izrada i lokalni SEO.</strong> Naslovi, opisi, strukturirani podaci s adresom, povezivanje s Google Business profilom i mjerenje upita.</li>
<li><strong>Objava i praćenje.</strong> Domena, SSL, Search Console i Analytics. Prvih nekoliko sedmica pratimo odakle dolaze upiti.</li></ol>
<p>Koraci izrade su detaljnije opisani u vodiču ${a('/znanje/izrada-web-stranica-vodic/', 'izrada web stranica za firme u BiH')}.</p>`],
      ['Lokalni SEO uključen od prvog dana', `<p>Za sarajevsku firmu stranica treba jasno reći gdje radi: adresu, dio grada, radno vrijeme i područje koje pokriva. Te podatke upisujemo na isti način na stranici, u strukturirane podatke i na Google Business profil, jer Google i AI asistenti vjeruju podacima koji se slažu na više mjesta.</p>
<p>Ako želite da vas preporučuju i ChatGPT ili Google AI pregledi, pročitajte ${a('/znanje/seo-aeo-geo-razlika/', 'razliku između SEO, AEO i GEO')}. Dugoročnu vidljivost vodi ${a('/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga')}.</p>`],
    ],
    faq: [
      ['Koliko košta izrada web stranice u Sarajevu?', 'Kod Digital X landing stranica kreće od 199 KM, prezentacijska stranica od 449 KM, cinematic web s AI asistentom košta 499 KM, a web shop kreće od 2.490 KM. Konačna cijena zavisi od broja stranica i funkcija.'],
      ['Koliko traje izrada?', 'Smart Website Launch ima plan isporuke od 7 do 14 radnih dana nakon prijema sadržaja. Veći projekti i web shopovi traju duže i dijele se u faze.'],
      ['Možemo li se sastati uživo?', 'Da. Digital X je u Sarajevu, pa prvi razgovor može biti uživo ili online, kako vam više odgovara.'],
      ['Da li radite i za firme izvan Sarajeva?', 'Da. Radimo s firmama u cijeloj BiH, regionu i dijaspori. Saradnja na daljinu ide preko video poziva, e-maila i dijeljenih dokumenata.'],
      ['Da li je lokalni SEO uključen?', 'Tehnička SEO osnova, lokalni podaci u strukturiranim podacima i povezivanje s Google Business profilom dio su izrade. Kontinuirani SEO rad ugovara se posebno, od 249 KM mjesečno.'],
    ],
    related: [['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/usluge/web-dizajn/', 'Web dizajn: paketi i cijene'], ['/usluge/x-signal/', 'Besplatna analiza postojećeg sajta'], ['/kontakt.html', 'Kontakt i besplatne konzultacije']],
  },
  {
    slug: 'banja-luka', city: 'Banja Luka', locative: 'Banjoj Luci',
    title: 'Izrada web stranica Banja Luka: cijene i rokovi | Digital X',
    h1: 'Izrada web stranica u Banjoj Luci: brze, jasne i spremne za Google i AI pretragu',
    desc: 'Izrada web stranica za firme u Banjoj Luci: prezentacija od 449 KM, cinematic web s AI asistentom 499 KM, web shop od 2.490 KM. Lokalni SEO i online saradnja.',
    keywords: ['izrada web stranica banja luka', 'web dizajn banja luka', 'izrada sajta banja luka', 'web shop banja luka'],
    answer: 'Digital X izrađuje brze web stranice, web shopove i AI sisteme za firme u Banjoj Luci i regiji. Prezentacijska stranica kreće od 449 KM, cinematic web s AI asistentom košta 499 KM uz isporuku za 7–14 radnih dana, a web shop kreće od 2.490 KM. Saradnja ide online uz pisani obim i cijenu unaprijed.',
    sections: [
      ['Šta firme u Banjoj Luci najčešće traže od web stranice', `<p>Banjalučko tržište ima snažan sektor privatnih ordinacija, IT i konsultantskih firmi, građevinarstva, trgovine i ugostiteljstva. Kupci prije poziva porede ponude na mobitelu i provjeravaju Google Mape, pa stranica mora odmah pokazati usluge, lokaciju, cijene ili jasan put do ponude.</p>`],
      ['Cijene izrade web stranice za Banju Luku', `<div class="table-wrap"><table><thead><tr><th>Paket</th><th>Šta dobijate</th><th>Cijena</th></tr></thead><tbody>
<tr><th>${a('/shop/product/landing-starter/', 'Landing stranica')}</th><td>Jedna stranica s jednim ciljem, za kampanju ili jednu uslugu</td><td>od 199 KM</td></tr>
<tr><th>${a('/shop/product/web-presence/', 'Premium web prisustvo')}</th><td>Prezentacijska stranica, mobilni dizajn, osnovni SEO i kontakt</td><td>od 449 KM</td></tr>
<tr><th>${a('/shop/product/smart-website-launch/', 'Smart Website Launch')}</th><td>Cinematic web do pet stranica i AI asistent prva tri mjeseca</td><td>499 KM</td></tr>
<tr><th>${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')}</th><td>Web shop s kategorijama, plaćanjem, dostavom i obukom</td><td>od 2.490 KM</td></tr></tbody></table></div>`],
      ['Lokalni SEO i višejezičnost za izvoz i dijasporu', `<p>Mnoge firme iz Banje Luke rade i s klijentima iz Hrvatske, Slovenije, Austrije i Njemačke. Stranicu možemo postaviti na bosanskom/srpskom/hrvatskom, engleskom i njemačkom jeziku, uz ${a('/usluge/seo-aeo-geo/', 'SEO, AEO i GEO optimizaciju')} od 249 KM mjesečno.</p>`],
    ],
    faq: [
      ['Koliko košta izrada web stranice u Banjoj Luci?', 'Kod Digital X landing stranica kreće od 199 KM, prezentacijska stranica od 449 KM, Smart Website Launch s AI asistentom košta 499 KM, a web shop kreće od 2.490 KM.'],
      ['Kako funkcioniše saradnja na daljinu sa Sarajevom?', 'Prvi razgovor, prijedlog dizajna, izmjene i obuka idu preko video poziva, e-maila i dijeljenih dokumenata. Ugovor, faktura i vlasništvo nad domenom su isti kao kod sastanka uživo.'],
      ['Da li je uključen lokalni SEO za Banju Luku?', 'Tehnička SEO osnova, lokalni strukturirani podaci i povezivanje s Google Business profilom dio su izrade. Kontinuirani SEO rad ugovara se od 249 KM mjesečno.'],
    ],
    related: [['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/usluge/web-dizajn/', 'Web dizajn: paketi i cijene'], ['/usluge/seo-aeo-geo/', 'SEO · AEO · GEO usluga']],
  },
  {
    slug: 'mostar', city: 'Mostar', locative: 'Mostaru',
    title: 'Izrada web stranica Mostar: cijene i rokovi | Digital X',
    h1: 'Izrada web stranica u Mostaru: za turizam, ordinacije, trgovine i usluge',
    desc: 'Izrada web stranica u Mostaru i Hercegovini: prezentacija od 449 KM, cinematic web s AI asistentom 499 KM, web shop od 2.490 KM. Više jezika i lokalni SEO.',
    keywords: ['izrada web stranica mostar', 'web dizajn mostar', 'izrada sajta mostar', 'web stranica za apartmane mostar'],
    answer: 'Digital X izrađuje web stranice, višejezične turističke prezentacije i web shopove za firme u Mostaru i Hercegovini. Prezentacijska stranica kreće od 449 KM, cinematic web s AI asistentom košta 499 KM (isporuka 7–14 radnih dana), a web shop kreće od 2.490 KM.',
    sections: [
      ['Šta je specifično za web stranice u Mostaru i Hercegovini', `<p>U Mostaru i okolini snažnu ulogu imaju turizam, smještaj, restorani, privatne klinike, vinarije i trgovine koje prodaju širom BiH i Hrvatske. Stranica zato često treba više jezika (BS/HR, EN, DE), brzo učitavanje na mobilnom internetu i direktan upit bez posredničkih provizija.</p>`],
      ['Paketi i početne cijene za Mostar', `<div class="table-wrap"><table><thead><tr><th>Paket</th><th>Šta dobijate</th><th>Cijena</th></tr></thead><tbody>
<tr><th>${a('/shop/product/landing-starter/', 'Landing stranica')}</th><td>Jedna stranica za jednu ponudu ili kampanju</td><td>od 199 KM</td></tr>
<tr><th>${a('/shop/product/web-presence/', 'Premium web prisustvo')}</th><td>Do 5 stranica, mobilni dizajn, osnovni SEO i kontakt</td><td>od 449 KM</td></tr>
<tr><th>${a('/shop/product/smart-website-launch/', 'Smart Website Launch')}</th><td>Cinematic web i AI asistent prva tri mjeseca</td><td>499 KM</td></tr>
<tr><th>${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')}</th><td>Kompletan web shop s dostavom i plaćanjem</td><td>od 2.490 KM</td></tr></tbody></table></div>`],
      ['Direktne rezervacije i lokalna vidljivost', `<p>Za hotele, apartmane i restorane u Mostaru povezujemo web stranicu s Google Business profilom i ${a('/industrije/hoteli-i-turizam/', 'rješenjima za turizam')}, kako bi gosti lakše rezervisali direktno.</p>`],
    ],
    faq: [
      ['Koliko košta izrada web stranice u Mostaru?', 'Landing stranica kreće od 199 KM, prezentacijska od 449 KM, cinematic web s AI asistentom košta 499 KM, a web shop kreće od 2.490 KM.'],
      ['Možete li napraviti stranicu na hrvatskom, engleskom i njemačkom?', 'Da. Višejezične stranice radimo s posebnim URL-ovima i hreflang oznakama za svaki jezik.'],
      ['Koliko traje izrada?', 'Smart Website Launch ima plan isporuke od 7 do 14 radnih dana nakon prijema sadržaja.'],
    ],
    related: [['/industrije/hoteli-i-turizam/', 'Web za hotele i apartmane'], ['/usluge/izrada-web-shopa/', 'Izrada web shopa'], ['/usluge/x-signal/', 'Besplatna analiza sajta']],
  },
  {
    slug: 'tuzla', city: 'Tuzla', locative: 'Tuzli',
    title: 'Izrada web stranica Tuzla: cijene i rokovi | Digital X',
    h1: 'Izrada web stranica u Tuzli: brze poslovne stranice i web shopovi',
    desc: 'Izrada web stranica za firme u Tuzli i TK: prezentacija od 449 KM, cinematic web s AI asistentom 499 KM, web shop od 2.490 KM. Lokalni SEO i AI automatizacija.',
    keywords: ['izrada web stranica tuzla', 'web dizajn tuzla', 'izrada sajta tuzla', 'web shop tuzla'],
    answer: 'Digital X izrađuje poslovne web stranice, web shopove i AI automatizacije za firme u Tuzli i Tuzlanskom kantonu. Prezentacijska stranica kreće od 449 KM, Smart Website Launch s AI asistentom košta 499 KM, a web shop kreće od 2.490 KM uz pisani obim i rok prije početka.',
    sections: [
      ['Web stranice za proizvodne, uslužne i trgovačke firme u Tuzli', `<p>Firme u Tuzli i okolini često trebaju jasnu B2B prezentaciju, katalog proizvoda, web shop s dostavom po cijeloj BiH ili stranicu za ordinacije i servise. Fokus stavljamo na brzinu učitavanja, jasnu ponudu i mjerljive upite putem forme, telefona i WhatsAppa.</p>`],
      ['Početne cijene za Tuzlu', `<div class="table-wrap"><table><thead><tr><th>Paket</th><th>Šta dobijate</th><th>Cijena</th></tr></thead><tbody>
<tr><th>${a('/shop/product/landing-starter/', 'Landing stranica')}</th><td>Jedna stranica za kampanju ili jednu uslugu</td><td>od 199 KM</td></tr>
<tr><th>${a('/shop/product/web-presence/', 'Premium web prisustvo')}</th><td>Prezentacijska stranica, mobilni dizajn i osnovni SEO</td><td>od 449 KM</td></tr>
<tr><th>${a('/shop/product/smart-website-launch/', 'Smart Website Launch')}</th><td>Cinematic web do 5 stranica + AI asistent 3 mjeseca</td><td>499 KM</td></tr>
<tr><th>${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')}</th><td>Web shop s plaćanjem, dostavom i obukom</td><td>od 2.490 KM</td></tr></tbody></table></div>`],
      ['Automatizacija upita i Google Mape', `<p>Uz izradu stranice možemo povezati ${a('/usluge/ai-chatbot-za-web-stranicu/', 'AI chatbota')} koji odgovara na pitanja kupaca 24/7 i ${a('/usluge/seo-aeo-geo/', 'SEO · GEO · AEO')} paket za bolju vidljivost u Tuzli i cijeloj BiH.</p>`],
    ],
    faq: [
      ['Koliko košta izrada web stranice u Tuzli?', 'Landing stranica kreće od 199 KM, prezentacijska od 449 KM, Smart Website Launch košta 499 KM, a web shop kreće od 2.490 KM.'],
      ['Radite li i redizajn postojeće stranice?', 'Da. Redizajn radimo uz očuvanje postojećih korisnih adresa i preusmjerenja kako ne biste izgubili pozicije na Googleu.'],
      ['Ko ostaje vlasnik domene i stranice?', 'Vaša firma. Svi nalozi, domena i podaci ostaju u vašem vlasništvu.'],
    ],
    related: [['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/usluge/redizajn-web-stranice/', 'Redizajn web stranice'], ['/usluge/ai-chatbot-za-web-stranicu/', 'AI chatbot za web stranicu']],
  },
  {
    slug: 'zenica', city: 'Zenica', locative: 'Zenici',
    title: 'Izrada web stranica Zenica: cijene i rokovi | Digital X',
    h1: 'Izrada web stranica u Zenici: jasna ponuda, brz sajt i lokalni SEO',
    desc: 'Izrada web stranica za firme u Zenici i ZDK: prezentacija od 449 KM, cinematic web s AI asistentom 499 KM, web shop od 2.490 KM. Jasni rokovi i podrška.',
    keywords: ['izrada web stranica zenica', 'web dizajn zenica', 'izrada sajta zenica', 'seo zenica'],
    answer: 'Digital X izrađuje web stranice, web shopove i sisteme za prikupljanje upita za firme u Zenici i Zeničko-dobojskom kantonu. Prezentacijska stranica kreće od 449 KM, Smart Website Launch s AI asistentom košta 499 KM, a web shop kreće od 2.490 KM uz isporuku za 7–14 radnih dana za standardne pakete.',
    sections: [
      ['Zašto lokalne firme u Zenici trebaju brzu i jasnu stranicu', `<p>Bilo da vodite ordinaciju, servis, građevinsku firmu, obrt ili trgovinu u Zenici, kupci vas prvo provjeravaju na mobitelu. Stranica koja se učitava ispod dvije sekunde, jasno prikazuje usluge i povezana je s Google Business profilom daje vam prednost nad konkurencijom koja ima samo Facebook stranicu.</p>`],
      ['Početne cijene za Zenicu', `<div class="table-wrap"><table><thead><tr><th>Paket</th><th>Šta dobijate</th><th>Cijena</th></tr></thead><tbody>
<tr><th>${a('/shop/product/landing-starter/', 'Landing stranica')}</th><td>Jedna stranica s jednim ciljem</td><td>od 199 KM</td></tr>
<tr><th>${a('/shop/product/web-presence/', 'Premium web prisustvo')}</th><td>Prezentacijska stranica, mobilni dizajn i osnovni SEO</td><td>od 449 KM</td></tr>
<tr><th>${a('/shop/product/smart-website-launch/', 'Smart Website Launch')}</th><td>Cinematic web do 5 stranica + AI asistent 3 mjeseca</td><td>499 KM</td></tr>
<tr><th>${a('/shop/product/ecommerce-launch/', 'E-commerce Launch')}</th><td>Web shop s kategorijama, plaćanjem i dostavom</td><td>od 2.490 KM</td></tr></tbody></table></div>`],
      ['Podrška i održavanje nakon objave', `<p>Nakon objave dobijate obuku za samostalne izmjene i 30 dana podrške, a po želji možete uključiti ${a('/shop/product/site-care/', 'mjesečno održavanje')} od 49 KM.</p>`],
    ],
    faq: [
      ['Koliko košta izrada web stranice u Zenici?', 'Landing stranica kreće od 199 KM, prezentacijska od 449 KM, Smart Website Launch košta 499 KM, a web shop kreće od 2.490 KM.'],
      ['Možemo li se sastati uživo ili online?', 'Saradnja ide online preko video poziva i e-maila, a po dogovoru je moguć i sastanak uživo u Sarajevu.'],
      ['Koliko traje izrada?', 'Smart Website Launch ima plan isporuke od 7 do 14 radnih dana nakon prijema tekstova i fotografija.'],
    ],
    related: [['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/usluge/web-dizajn/', 'Web dizajn: paketi i cijene'], ['/kontakt.html', 'Kontakt i besplatne konzultacije']],
  },
];
