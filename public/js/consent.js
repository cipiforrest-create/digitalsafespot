// Digital X — cookie consent banner + Google Consent Mode v2 update.
// The Consent Mode DEFAULT (denied) is set inline in <head> before GTM loads.
// This file only renders the first-visit choice and updates consent on click.
(function () {
  var KEY = "dx-consent";
  var locale = document.documentElement.lang || "bs";
  var copy = locale === "en" ? {
    label: "Cookie settings",
    text: "We use cookies for analytics and measurement to improve your experience. You can accept or decline optional cookies. ",
    privacy: "Privacy Policy", decline: "Decline", accept: "Accept", privacyHref: "/en/privatnost.html"
  } : locale === "de" ? {
    label: "Cookie-Einstellungen",
    text: "Wir verwenden Cookies für Analysen und Messungen, um Ihre Erfahrung zu verbessern. Optionale Cookies können Sie akzeptieren oder ablehnen. ",
    privacy: "Datenschutzerklärung", decline: "Ablehnen", accept: "Akzeptieren", privacyHref: "/de/privatnost.html"
  } : {
    label: "Postavke kolačića",
    text: "Koristimo kolačiće za analitiku i mjerenje kako bismo poboljšali iskustvo. Neobavezne možete prihvatiti ili odbiti. ",
    privacy: "Politika privatnosti", decline: "Odbij", accept: "Prihvati", privacyHref: "/privatnost.html"
  };
  function gtag() { window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }

  var stored = null;
  try { stored = localStorage.getItem(KEY); } catch (e) {}
  if (stored === "granted" || stored === "denied") return; // already chosen; inline default handled it

  function apply(state) {
    gtag("consent", "update", {
      ad_storage: state, ad_user_data: state, ad_personalization: state, analytics_storage: state
    });
    window.dataLayer.push({ event: state === "granted" ? "consent_granted" : "consent_denied" });
    if (state === "granted" && typeof window.loadDigitalXGTM === "function") {
      window.loadDigitalXGTM();
    }
  }

  var style = document.createElement("style");
  style.textContent =
    ".dx-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:720px;margin:0 auto;" +
    "background:#0b1220;color:#e7eefc;border:1px solid rgba(95,201,255,.35);border-radius:14px;padding:16px 18px;" +
    "display:flex;gap:16px;align-items:center;flex-wrap:wrap;box-shadow:0 18px 50px rgba(0,0,0,.5);" +
    "font-family:Inter,system-ui,sans-serif}" +
    ".dx-consent p{margin:0;font-size:.85rem;line-height:1.5;flex:1 1 280px}.dx-consent a{color:#5fc9ff}" +
    ".dx-consent-actions{display:flex;gap:10px;flex:0 0 auto}" +
    ".dx-consent button{cursor:pointer;border-radius:9px;padding:10px 18px;font-size:.85rem;font-weight:600;border:1px solid transparent}" +
    ".dx-consent-decline{background:transparent;color:#e7eefc;border-color:rgba(255,255,255,.25)}" +
    ".dx-consent-accept{background:#5fc9ff;color:#05224a}" +
    "@media(max-width:640px){.dx-consent.dx-consent-audit{position:relative;left:auto;right:auto;bottom:auto;" +
    "max-width:none;margin:0 0 18px;padding:13px 14px;box-shadow:0 12px 32px rgba(0,0,0,.35)}" +
    ".dx-consent.dx-consent-audit .dx-consent-actions{width:100%}" +
    ".dx-consent.dx-consent-audit button{flex:1}}";
  document.head.appendChild(style);

  var bar = document.createElement("div");
  bar.className = "dx-consent";
  var auditForm = document.getElementById("audit-form");
  if (auditForm) bar.classList.add("dx-consent-audit");
  bar.setAttribute("role", "dialog");
  bar.setAttribute("aria-label", copy.label);
  bar.innerHTML =
    "<p>" + copy.text +
    '<a href="' + copy.privacyHref + '">' + copy.privacy + "</a>.</p>" +
    '<div class="dx-consent-actions">' +
    '<button type="button" data-consent="denied" class="dx-consent-decline">' + copy.decline + "</button>" +
    '<button type="button" data-consent="granted" class="dx-consent-accept">' + copy.accept + "</button>" +
    "</div>";
  bar.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-consent]");
    if (!btn) return;
    var state = btn.getAttribute("data-consent");
    try { localStorage.setItem(KEY, state); } catch (e2) {}
    apply(state);
    bar.remove();
  });

  if (auditForm && auditForm.parentNode) auditForm.parentNode.insertBefore(bar, auditForm);
  else (document.body || document.documentElement).appendChild(bar);
})();
