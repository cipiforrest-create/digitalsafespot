// Warms the media a visitor will need further down this cinematic page, in the order the page itself asks for it
// (lists recorded per example and device by concierge/tools/record-cinematic-preload.mjs). Files land in the browser cache,
// so the page's own video and frame loaders find them locally and scrolling stays smooth.
// Skipped on data saver, 2G and reduced motion; three quiet requests at a time, paused while the tab is hidden.
(function () {
  var match = location.pathname.match(/\/cinematic-([a-z]+)\//);
  if (!match) return;
  var connection = navigator.connection;
  if ((connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var variant = innerWidth <= 768 ? 'mobile' : 'desktop';
  function start() {
    fetch('/cinematic-shared/preload/' + match[1] + '.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (manifest) {
      var list = (manifest && manifest[variant]) || [], index = 0, active = 0;
      var done = new Set(performance.getEntriesByType('resource').map(function (e) { return new URL(e.name).pathname; }));
      function next() {
        if (document.hidden) { document.addEventListener('visibilitychange', next, { once: true }); return; }
        while (active < 3 && index < list.length) {
          var url = list[index++].url;
          if (done.has(url)) continue;
          active++;
          fetch(url, { priority: 'low', mode: /^https?:/.test(url) ? 'no-cors' : 'same-origin' })
            .then(function (r) { return r.arrayBuffer(); })
            .catch(function () {})
            .then(function () { active--; next(); });
        }
      }
      next();
    }).catch(function () {});
  }
  if (document.readyState === 'complete') setTimeout(start, 800);
  else addEventListener('load', function () { setTimeout(start, 800); }, { once: true });
})();
