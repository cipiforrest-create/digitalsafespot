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
<tr><th>${a('/smart-website-launch/', 'Smart Website Launch')}</th><td>Cinematic web do pet stranica i AI asistent prva tri mjeseca</td><td>499 KM</td></tr>
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
    related: [['/usluge/izrada-web-stranica/', 'Izrada web stranica'], ['/usluge/x-signal/', 'Besplatna analiza postojećeg sajta'], ['/kontakt.html', 'Kontakt i besplatne konzultacije']],
  },
];
