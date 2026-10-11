// Stable entry point for Vercel function discovery; implementation is compiled server-side.
module.exports = (req, res) => require('../../.concierge/session.cjs').default(req, res);
