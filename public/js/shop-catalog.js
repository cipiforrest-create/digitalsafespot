(function (root, factory) {
  const catalog = factory();
  if (typeof module === "object" && module.exports) module.exports = catalog;
  if (root) root.DigitalXShopCatalog = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const origin = "https://www.digital-x-marketing.com";
  const categories = {
    web: {
      name: "Web & E-commerce",
      description: "Stranice, trgovine i aplikacije koje pretvaraju interes u upit ili kupovinu.",
    },
    ai: {
      name: "AI sistemi",
      description: "Privatno poslovno znanje, razgovorni asistenti i sistemi koji rade s vašim kontekstom.",
    },
    automation: {
      name: "Automatizacija",
      description: "Workflowi koji povezuju upite, CRM, termine, dokumente, obavijesti i izvještaje.",
    },
    growth: {
      name: "Vidljivost & rast",
      description: "SEO, GEO, AEO, oglašavanje i optimizacija mjerljivog korisničkog puta.",
    },
    content: {
      name: "Sadržaj & brend",
      description: "Vizuali, video, copy i sistemi sadržaja koji izgledaju kao jedan dosljedan brend.",
    },
  };

  const products = [
    {
      id: "web-presence",
      category: "web",
      name: "Premium web prisustvo",
      priceMinor: 44900,
      billing: "jednokratno",
      image: "service-web.webp",
      gallery: ["service-web.webp", "portfolio-legal.webp", "portfolio-dental.webp"],
      summary: "Prezentacijska stranica s jasnom ponudom, mobilnim dizajnom, osnovnim SEO-om i kontakt tokom.",
      features: ["Strategija i struktura", "Dizajn i razvoj", "Mobilna optimizacija", "Osnovni SEO i analitika"],
    },
    {
      id: "ecommerce-launch",
      category: "web",
      name: "E-commerce Launch",
      priceMinor: 249000,
      billing: "jednokratno",
      image: "portfolio-commerce.webp",
      gallery: ["portfolio-commerce.webp", "service-web.webp", "application-suite.webp"],
      summary: "Kompletna trgovina s kategorijama, proizvodima, dostavom, plaćanjem i obukom.",
      features: ["Do 50 proizvoda", "Kategorije i galerije", "Plaćanje i dostava", "Obuka i podrška"],
    },
    {
      id: "application-mvp",
      category: "web",
      name: "Aplikacija po mjeri",
      priceMinor: null,
      billing: "procjena",
      image: "service-apps.webp",
      gallery: ["service-apps.webp", "application-suite.webp", "automation-workflows.webp"],
      summary: "Portal, booking, dashboard ili operativni alat prilagođen vašem procesu.",
      features: ["Mapiranje procesa", "Interaktivni prototip", "Razvoj po fazama", "Integracije po potrebi"],
    },
    {
      id: "second-brain-os",
      category: "ai",
      name: "AI Second Brain OS",
      priceMinor: null,
      billing: "procjena",
      image: "second-brain-galaxy.webp",
      gallery: ["second-brain-galaxy.webp", "jarvis-avatar.webp", "custom-project-planning.webp"],
      summary: "Privatna poslovna memorija s Co-Pilot asistentom, povezanim izvorima i odobrenim komandama.",
      features: ["Povezano poslovno znanje", "Co-Pilot razgovor i komande", "Izvori i prava pristupa", "Integracije i automatizacije"],
    },
    {
      id: "ai-concierge",
      category: "ai",
      name: "AI prodajni asistent",
      priceMinor: 49000,
      billing: "+ održavanje",
      image: "blog-ai-assistant.webp",
      gallery: ["blog-ai-assistant.webp", "jarvis-avatar.webp", "service-automation.webp"],
      summary: "Asistent za web i kanale komunikacije koji odgovara, kvalifikuje i prikuplja upite.",
      features: ["Odgovori 24/7", "Vaš sadržaj i ton", "Kvalifikacija leadova", "Predaja razgovora čovjeku"],
    },
    {
      id: "workflow-starter",
      category: "automation",
      name: "Automation Starter",
      priceMinor: 34900,
      billing: "jednokratno",
      image: "automation-workflows.webp",
      gallery: ["automation-workflows.webp", "service-automation.webp", "custom-project-planning.webp"],
      summary: "Jedan prioritetni workflow od upita do zadatka, obavijesti ili CRM zapisa.",
      features: ["Mapiranje toka", "Jedna ključna automatizacija", "Testiranje i kontrola", "Uputstvo za tim"],
    },
    {
      id: "review-engine",
      category: "automation",
      name: "Sistem recenzija",
      priceMinor: 19900,
      billing: "+ održavanje",
      image: "blog-aeo.webp",
      gallery: ["blog-aeo.webp", "automation-workflows.webp", "service-growth.webp"],
      summary: "Automatski zahtjev za recenziju nakon završene usluge, uz praćenje odgovora.",
      features: ["Okidač nakon usluge", "Personalizovana poruka", "Link za recenziju", "Pregled rezultata"],
    },
    {
      id: "seo-aeo",
      category: "growth",
      name: "SEO · GEO · AEO",
      priceMinor: 24900,
      billing: "mjesečno",
      image: "service-seo.webp",
      gallery: ["service-seo.webp", "blog-aeo.webp", "service-growth.webp"],
      summary: "Tehnička osnova, lokalna vidljivost, sadržaj i struktura za Google i AI odgovore.",
      features: ["Tehnički pregled", "Google Business i mape", "Sadržaj i strukturirani podaci", "Jasan mjesečni izvještaj"],
    },
    {
      id: "growth-campaigns",
      category: "growth",
      name: "Kampanje za rast",
      priceMinor: 24900,
      billing: "mjesečno + budžet",
      image: "service-growth.webp",
      gallery: ["service-growth.webp", "service-content.webp", "service-web.webp"],
      summary: "Meta i Google kampanje povezane s landing stranicom, analitikom i prodajnim ciljem.",
      features: ["Plan kampanje", "Kreative i oglasi", "Praćenje konverzija", "Optimizacija i izvještaj"],
    },
    {
      id: "speed-optimization",
      category: "growth",
      name: "Speed optimizacija",
      priceMinor: 9900,
      billing: "jednokratno",
      image: "blog-web-cost-v2.webp",
      gallery: ["blog-web-cost-v2.webp", "service-web.webp", "application-suite.webp"],
      summary: "Brže učitavanje, stabilniji prikaz i tehničko čišćenje postojećeg sajta.",
      features: ["Mjerenje prije intervencije", "Slike, kod i cache", "Mobilna stabilnost", "Izvještaj prije/poslije"],
    },
    {
      id: "content-system",
      category: "content",
      name: "Sistem sadržaja",
      priceMinor: 24900,
      billing: "mjesečno",
      image: "service-content.webp",
      gallery: ["service-content.webp", "blog-web-cost.webp", "blog-ai-assistant.webp"],
      summary: "Plan, copy, vizuali i kratki video formatirani kao jedan dosljedan sadržajni sistem.",
      features: ["Mjesečni plan", "Copy i vizuali", "Reels/video format", "Distribucija po kanalima"],
    },
    {
      id: "digital-partner",
      category: "content",
      name: "Digitalni partner",
      priceMinor: 89900,
      billing: "mjesečno",
      image: "custom-project-planning.webp",
      gallery: ["custom-project-planning.webp", "application-suite.webp", "automation-workflows.webp"],
      summary: "Kombinovana saradnja za web, rast, sadržaj, automatizaciju i kontinuirano poboljšanje.",
      features: ["Jedan odgovoran tim", "Prioritetni mjesečni plan", "Kombinovane discipline", "Redovni pregled napretka"],
    },
  ];

  const categoryPath = (id) => `shop/category/${id}/`;
  const productPath = (id) => `shop/product/${id}/`;
  const money = (minor) => minor == null
    ? "Procjena po zahtjevu"
    : `od ${(minor / 100).toLocaleString("bs-BA")} KM`;

  return Object.freeze({
    origin,
    categories: Object.freeze(categories),
    products: Object.freeze(products),
    categoryPath,
    productPath,
    money,
  });
});
