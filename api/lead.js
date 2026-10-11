// Digital X — lead intake endpoint (Vercel serverless, Node runtime).
// Forwards form/audit leads to an n8n webhook set in the N8N_WEBHOOK_URL env var.
// The webhook URL stays server-side and is never exposed to the browser.
// Responds 503 {fallback:true} when unconfigured or n8n is unreachable, so the
// client can fall back to a mailto: and no lead is ever lost.
module.exports = async (req, res) => {
  // Concierge requests use a strict, consented contract. Legacy forms keep their existing contract.
  const payload = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : req.body;
  if (payload?.source === 'AI Concierge') {
    req.body = payload;
    return require('../.concierge/lead.cjs').default(req, res);
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      const raw = await new Promise((resolve, reject) => {
        let d = "";
        req.on("data", (c) => (d += c));
        req.on("end", () => resolve(d));
        req.on("error", reject);
      });
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = {};
    }
  }

  // Honeypot: pretend success so bots don't retry.
  if (body.website) {
    res.status(200).json({ ok: true });
    return;
  }

  const contact = String(body.kontakt || body.email || "").trim();
  if (!contact) {
    res.status(400).json({ error: "Nedostaje kontakt." });
    return;
  }

  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) {
    res.status(503).json({ fallback: true });
    return;
  }

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...body,
        primljeno: new Date().toISOString(),
        ua: req.headers["user-agent"] || "",
        ip: req.headers["x-forwarded-for"] || "",
      }),
    });
    if (!upstream.ok) throw new Error("n8n " + upstream.status);
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(503).json({ fallback: true });
  }
};
