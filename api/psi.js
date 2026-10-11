// Digital X — PageSpeed Insights proxy (Vercel serverless, Node runtime).
//
// The audit tool used to call PageSpeed straight from the browser with no key.
// Unauthenticated PSI requests share one global quota across every anonymous
// caller on the internet, so the tool returned "429 Quota exceeded" to real
// visitors — the lead magnet silently failing at exactly the moment someone
// showed interest.
//
// Proxying it here means the key stays server-side (never shipped to the
// browser, so it cannot be lifted from view-source and burned by someone else)
// and the quota belongs to our own Google Cloud project.
//
// Requires PSI_API_KEY in the Vercel environment. Create it at
// console.cloud.google.com → APIs & Services → Credentials, with the
// PageSpeed Insights API enabled on the project.

const ALLOWED_STRATEGIES = new Set(["mobile", "desktop"]);
const ALLOWED_CATEGORIES = new Set([
  "PERFORMANCE",
  "SEO",
  "BEST_PRACTICES",
  "ACCESSIBILITY",
  "PWA",
]);

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { url, strategy = "mobile" } = req.query || {};

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "Nedostaje URL." });
    return;
  }

  // Only ever audit public http(s) pages. Without this the endpoint would
  // happily fetch internal addresses on our behalf.
  let target;
  try {
    target = new URL(url);
  } catch {
    res.status(400).json({ error: "Neispravan URL." });
    return;
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    res.status(400).json({ error: "Podržani su samo http i https URL-ovi." });
    return;
  }

  if (!ALLOWED_STRATEGIES.has(strategy)) {
    res.status(400).json({ error: "Neispravna strategija." });
    return;
  }

  const requested = []
    .concat(req.query.category || ["PERFORMANCE", "SEO", "BEST_PRACTICES"])
    .filter((c) => ALLOWED_CATEGORIES.has(c));
  const categories = requested.length ? requested : ["PERFORMANCE"];

  const key = process.env.PSI_API_KEY;
  if (!key) {
    // Say so plainly rather than falling back to the anonymous endpoint, which
    // is the broken behaviour this file exists to remove.
    res.status(503).json({
      error: "Analiza trenutno nije dostupna. Pokušajte ponovo za nekoliko minuta.",
      reason: "PSI_API_KEY not configured",
    });
    return;
  }

  const api =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" +
    "?url=" + encodeURIComponent(target.toString()) +
    categories.map((c) => "&category=" + encodeURIComponent(c)).join("") +
    "&strategy=" + encodeURIComponent(strategy) +
    "&key=" + encodeURIComponent(key);

  try {
    // PSI regularly takes 20-40s on a slow site; give it room but never hang.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55_000);
    const upstream = await fetch(api, { signal: controller.signal });
    clearTimeout(timer);

    const data = await upstream.json();

    if (!upstream.ok || !data.lighthouseResult) {
      const message = (data && data.error && data.error.message) || "Stranica nije dostupna za analizu.";
      res.status(upstream.status === 429 ? 429 : 502).json({ error: message });
      return;
    }

    // Same result the browser used to receive, so the client needs no reshaping.
    // Cached briefly: re-auditing the same URL twice in a minute is almost
    // always a double-click, and each call costs quota.
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=300");
    res.status(200).json(data);
  } catch (error) {
    const aborted = error && error.name === "AbortError";
    res.status(aborted ? 504 : 502).json({
      error: aborted
        ? "Analiza je trajala predugo. Pokušajte ponovo."
        : "Analiza trenutno nije dostupna.",
    });
  }
};
