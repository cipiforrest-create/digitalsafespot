// Public catalogue snapshot, 2026-09-12. Source: existing shop-catalog.js and public homepage/blog. Prices are integer minor KM units.
export const categories = {
  "web": {
    "name": "Web & E-commerce",
    "description": "Stranice, trgovine i aplikacije koje pretvaraju interes u upit ili kupovinu."
  },
  "ai": {
    "name": "AI sistemi",
    "description": "Privatno poslovno znanje, razgovorni asistenti i sistemi koji rade s vašim kontekstom."
  },
  "automation": {
    "name": "Automatizacija",
    "description": "Workflowi koji povezuju upite, CRM, termine, dokumente, obavijesti i izvještaje."
  },
  "growth": {
    "name": "Vidljivost & rast",
    "description": "SEO, GEO, AEO, oglašavanje i optimizacija mjerljivog korisničkog puta."
  },
  "content": {
    "name": "Sadržaj & brend",
    "description": "Vizuali, video, copy i sistemi sadržaja koji izgledaju kao jedan dosljedan brend."
  }
} as const;
export const products = [
  {
    "id": "web-presence",
    "category": "web",
    "name": "Premium web prisustvo",
    "priceMinor": 44900,
    "billing": "jednokratno",
    "image": "service-web.webp",
    "gallery": [
      "service-web.webp",
      "portfolio-legal.webp",
      "portfolio-dental.webp"
    ],
    "summary": "Prezentacijska stranica s jasnom ponudom, mobilnim dizajnom, osnovnim SEO-om i kontakt tokom.",
    "features": [
      "Strategija i struktura",
      "Dizajn i razvoj",
      "Mobilna optimizacija",
      "Osnovni SEO i analitika"
    ]
  },
  {
    "id": "ecommerce-launch",
    "category": "web",
    "name": "E-commerce Launch",
    "priceMinor": 249000,
    "billing": "jednokratno",
    "image": "portfolio-commerce.webp",
    "gallery": [
      "portfolio-commerce.webp",
      "service-web.webp",
      "application-suite.webp"
    ],
    "summary": "Kompletna trgovina s kategorijama, proizvodima, dostavom, plaćanjem i obukom.",
    "features": [
      "Do 50 proizvoda",
      "Kategorije i galerije",
      "Plaćanje i dostava",
      "Obuka i podrška"
    ]
  },
  {
    "id": "application-mvp",
    "category": "web",
    "name": "Aplikacija po mjeri",
    "priceMinor": null,
    "billing": "procjena",
    "image": "service-apps.webp",
    "gallery": [
      "service-apps.webp",
      "application-suite.webp",
      "automation-workflows.webp"
    ],
    "summary": "Portal, booking, dashboard ili operativni alat prilagođen vašem procesu.",
    "features": [
      "Mapiranje procesa",
      "Interaktivni prototip",
      "Razvoj po fazama",
      "Integracije po potrebi"
    ]
  },
  {
    "id": "second-brain-os",
    "category": "ai",
    "name": "AI Second Brain OS",
    "priceMinor": null,
    "billing": "procjena",
    "image": "second-brain-galaxy.webp",
    "gallery": [
      "second-brain-galaxy.webp",
      "jarvis-avatar.webp",
      "custom-project-planning.webp"
    ],
    "summary": "Privatna poslovna memorija s Co-Pilot asistentom, povezanim izvorima i odobrenim komandama.",
    "features": [
      "Povezano poslovno znanje",
      "Co-Pilot razgovor i komande",
      "Izvori i prava pristupa",
      "Integracije i automatizacije"
    ]
  },
  {
    "id": "ai-concierge",
    "category": "ai",
    "name": "AI prodajni asistent",
    "priceMinor": 49000,
    "billing": "+ održavanje",
    "image": "blog-ai-assistant.webp",
    "gallery": [
      "blog-ai-assistant.webp",
      "jarvis-avatar.webp",
      "service-automation.webp"
    ],
    "summary": "Asistent za web i kanale komunikacije koji odgovara, kvalifikuje i prikuplja upite.",
    "features": [
      "Odgovori 24/7",
      "Vaš sadržaj i ton",
      "Kvalifikacija leadova",
      "Predaja razgovora čovjeku"
    ]
  },
  {
    "id": "workflow-starter",
    "category": "automation",
    "name": "Automation Starter",
    "priceMinor": 34900,
    "billing": "jednokratno",
    "image": "automation-workflows.webp",
    "gallery": [
      "automation-workflows.webp",
      "service-automation.webp",
      "custom-project-planning.webp"
    ],
    "summary": "Jedan prioritetni workflow od upita do zadatka, obavijesti ili CRM zapisa.",
    "features": [
      "Mapiranje toka",
      "Jedna ključna automatizacija",
      "Testiranje i kontrola",
      "Uputstvo za tim"
    ]
  },
  {
    "id": "review-engine",
    "category": "automation",
    "name": "Sistem recenzija",
    "priceMinor": 19900,
    "billing": "+ održavanje",
    "image": "blog-aeo.webp",
    "gallery": [
      "blog-aeo.webp",
      "automation-workflows.webp",
      "service-growth.webp"
    ],
    "summary": "Automatski zahtjev za recenziju nakon završene usluge, uz praćenje odgovora.",
    "features": [
      "Okidač nakon usluge",
      "Personalizovana poruka",
      "Link za recenziju",
      "Pregled rezultata"
    ]
  },
  {
    "id": "seo-aeo",
    "category": "growth",
    "name": "SEO · GEO · AEO",
    "priceMinor": 24900,
    "billing": "mjesečno",
    "image": "service-seo.webp",
    "gallery": [
      "service-seo.webp",
      "blog-aeo.webp",
      "service-growth.webp"
    ],
    "summary": "Tehnička osnova, lokalna vidljivost, sadržaj i struktura za Google i AI odgovore.",
    "features": [
      "Tehnički pregled",
      "Google Business i mape",
      "Sadržaj i strukturirani podaci",
      "Jasan mjesečni izvještaj"
    ]
  },
  {
    "id": "growth-campaigns",
    "category": "growth",
    "name": "Kampanje za rast",
    "priceMinor": 24900,
    "billing": "mjesečno + budžet",
    "image": "service-growth.webp",
    "gallery": [
      "service-growth.webp",
      "service-content.webp",
      "service-web.webp"
    ],
    "summary": "Meta i Google kampanje povezane s landing stranicom, analitikom i prodajnim ciljem.",
    "features": [
      "Plan kampanje",
      "Kreative i oglasi",
      "Praćenje konverzija",
      "Optimizacija i izvještaj"
    ]
  },
  {
    "id": "speed-optimization",
    "category": "growth",
    "name": "Speed optimizacija",
    "priceMinor": 9900,
    "billing": "jednokratno",
    "image": "blog-web-cost-v2.webp",
    "gallery": [
      "blog-web-cost-v2.webp",
      "service-web.webp",
      "application-suite.webp"
    ],
    "summary": "Brže učitavanje, stabilniji prikaz i tehničko čišćenje postojećeg sajta.",
    "features": [
      "Mjerenje prije intervencije",
      "Slike, kod i cache",
      "Mobilna stabilnost",
      "Izvještaj prije/poslije"
    ]
  },
  {
    "id": "content-system",
    "category": "content",
    "name": "Sistem sadržaja",
    "priceMinor": 24900,
    "billing": "mjesečno",
    "image": "service-content.webp",
    "gallery": [
      "service-content.webp",
      "blog-web-cost.webp",
      "blog-ai-assistant.webp"
    ],
    "summary": "Plan, copy, vizuali i kratki video formatirani kao jedan dosljedan sadržajni sistem.",
    "features": [
      "Mjesečni plan",
      "Copy i vizuali",
      "Reels/video format",
      "Distribucija po kanalima"
    ]
  },
  {
    "id": "digital-partner",
    "category": "content",
    "name": "Digitalni partner",
    "priceMinor": 89900,
    "billing": "mjesečno",
    "image": "custom-project-planning.webp",
    "gallery": [
      "custom-project-planning.webp",
      "application-suite.webp",
      "automation-workflows.webp"
    ],
    "summary": "Kombinovana saradnja za web, rast, sadržaj, automatizaciju i kontinuirano poboljšanje.",
    "features": [
      "Jedan odgovoran tim",
      "Prioritetni mjesečni plan",
      "Kombinovane discipline",
      "Redovni pregled napretka"
    ]
  },
  {
    "id": "smart-website-launch",
    "category": "web",
    "name": "Smart Website Launch",
    "priceMinor": 49900,
    "billing": "jednokratno",
    "summary": "Cinematic web do pet stranica i AI Lead Assistant uključen prva tri mjeseca.",
    "features": [
      "Do 5 stranica",
      "Cinematic vizuelno iskustvo",
      "AI Lead Assistant · 3 mjeseca",
      "Plan isporuke 7–14 radnih dana"
    ],
    "image": "smart-website-launch-cinematic.webp"
  },
  {
    "id": "landing-starter",
    "category": "web",
    "name": "Landing stranica",
    "priceMinor": 19900,
    "billing": "jednokratno",
    "summary": "Jedna stranica, jedan cilj. Ponuda spremna za upit i kampanju.",
    "features": [
      "Copy i struktura",
      "Dizajn i kontakt forma",
      "Mobilni prikaz",
      "Osnovni SEO"
    ],
    "image": "service-web.webp"
  },
  {
    "id": "site-care",
    "category": "web",
    "name": "Održavanje stranice",
    "priceMinor": 4900,
    "billing": "mjesečno",
    "summary": "Tri paketa: 49 KM osnovno tehničko održavanje, 149 KM uz održavanje AI asistenta, 249 KM uz održavanje automatizacija.",
    "features": [
      "Osnovno tehničko održavanje — 49 KM",
      "+ održavanje AI asistenta — 149 KM",
      "+ održavanje automatizacija — 249 KM"
    ],
    "image": "service-web.webp"
  }
] as const;
export const posts = [
  {
    "id": "koliko-kosta-web-stranica-bih",
    "url": "/blog/koliko-kosta-web-stranica-bih.html",
    "title": "Koliko košta web stranica u BiH u 2026?",
    "description": "Realan vodič kroz cijene — i kako ne platiti dvaput.",
    "meta": "Web · 6 min"
  },
  {
    "id": "landing-stranica-vodic",
    "url": "/blog/landing-stranica-vodic.html",
    "title": "Landing stranica: od oglasa do upita",
    "description": "Jedna stranica, jedan cilj — od 199 KM.",
    "meta": "Web · 4 min"
  },
  {
    "id": "aplikacije-po-mjeri",
    "url": "/blog/aplikacije-po-mjeri.html",
    "title": "Aplikacija po mjeri",
    "description": "Kada Excel i sveske više nisu dovoljni.",
    "meta": "Aplikacije · 5 min"
  },
  {
    "id": "uiux-rebranding-vodic",
    "url": "/blog/uiux-rebranding-vodic.html",
    "title": "Rebranding i UI/UX dizajn",
    "description": "Prvi utisak se ne ponavlja.",
    "meta": "Dizajn · 4 min"
  },
  {
    "id": "brzina-sajta",
    "url": "/blog/brzina-sajta.html",
    "title": "Zašto spor sajt tiho ubija prodaju",
    "description": "Svaka sekunda čekanja povećava broj posjetilaca koji odu.",
    "meta": "Performanse · 4 min"
  },
  {
    "id": "odrzavanje-sigurnost-vodic",
    "url": "/blog/odrzavanje-sigurnost-vodic.html",
    "title": "Održavanje: polica osiguranja od 49 KM",
    "description": "Šta se dešava sa sajtom koji niko ne dira.",
    "meta": "Održavanje · 4 min"
  },
  {
    "id": "aeo-vodic",
    "url": "/blog/aeo-vodic.html",
    "title": "Kako da vas ChatGPT preporuči",
    "description": "Novo bojno polje vidljivosti.",
    "meta": "AEO · 6 min"
  },
  {
    "id": "lokalni-seo-google-mapa",
    "url": "/blog/lokalni-seo-google-mapa.html",
    "title": "Kako biti prvi na Google mapi",
    "description": "Top 3 na mapi dobijaju većinu poziva.",
    "meta": "Lokalni SEO · 5 min"
  },
  {
    "id": "google-meta-oglasi-vodic",
    "url": "/blog/google-meta-oglasi-vodic.html",
    "title": "Oglasi: budžet u upite, ne u lajkove",
    "description": "Kako izgleda profesionalno vođenje kampanja.",
    "meta": "Oglašavanje · 5 min"
  },
  {
    "id": "vodjenje-drustvenih-mreza",
    "url": "/blog/vodjenje-drustvenih-mreza.html",
    "title": "Vođenje mreža: šta zapravo plaćate",
    "description": "I kako prepoznati \"objavljivače sličica\".",
    "meta": "Mreže · 5 min"
  },
  {
    "id": "content-marketing-vodic",
    "url": "/blog/content-marketing-vodic.html",
    "title": "Content marketing",
    "description": "Prodaja koja ne izgleda kao prodaja.",
    "meta": "Sadržaj · 4 min"
  },
  {
    "id": "foto-video-produkcija",
    "url": "/blog/foto-video-produkcija.html",
    "title": "Foto i video produkcija",
    "description": "Zašto amaterske fotografije koštaju kupaca.",
    "meta": "Produkcija · 4 min"
  },
  {
    "id": "ai-chatbot-vodic",
    "url": "/blog/ai-chatbot-vodic.html",
    "title": "AI chatbot za male biznise",
    "description": "Radnik koji ne spava — šta je i koliko košta.",
    "meta": "AI · 5 min"
  },
  {
    "id": "ai-automatizacija-vodic",
    "url": "/blog/ai-automatizacija-vodic.html",
    "title": "Šta se sve može automatizovati",
    "description": "Šest automatizacija koje se najbrže isplate.",
    "meta": "Automatizacija · 5 min"
  },
  {
    "id": "automatizacija-recenzija",
    "url": "/blog/automatizacija-recenzija.html",
    "title": "Google recenzije na autopilotu",
    "description": "Više recenzija bez moljenja kupaca.",
    "meta": "Automatizacija · 4 min"
  }
] as const;
export const experiencePageIds = ["pricing","examples","contact","blog","shop","launch","shop-web","shop-ai","shop-automation","shop-growth","shop-content","product-web-presence","product-ecommerce-launch","product-application-mvp","product-second-brain-os","product-ai-concierge","product-workflow-starter","product-review-engine","product-seo-aeo","product-growth-campaigns","product-speed-optimization","product-content-system","product-digital-partner","product-smart-website-launch","product-landing-starter","product-site-care","article-koliko-kosta-web-stranica-bih","article-landing-stranica-vodic","article-aplikacije-po-mjeri","article-uiux-rebranding-vodic","article-brzina-sajta","article-odrzavanje-sigurnost-vodic","article-aeo-vodic","article-lokalni-seo-google-mapa","article-google-meta-oglasi-vodic","article-vodjenje-drustvenih-mreza","article-content-marketing-vodic","article-foto-video-produkcija","article-ai-chatbot-vodic","article-ai-automatizacija-vodic","article-automatizacija-recenzija"] as const;
