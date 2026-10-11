// Stable entry point for Vercel function discovery; implementation is compiled server-side.
module.exports = (req, res) => require('../../.concierge/execution.cjs').default(req, res);
