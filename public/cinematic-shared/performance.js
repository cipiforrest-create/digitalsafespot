/* Shared lifecycle for non-scrub cinematic video: lazy network use and hidden-page pause. */
(() => {
  'use strict';

  const lazyVideos = new Set();
  const resumeVideos = new Set();

  function hydrate(video) {
    if (!video?.dataset.src) return;
    video.src = video.dataset.src;
    delete video.dataset.src;
    video.load();
  }

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          hydrate(entry.target);
          observer.unobserve(entry.target);
          lazyVideos.delete(entry.target);
        }
      }, { rootMargin: '100% 0px' })
    : null;

  function observe(root = document) {
    root.querySelectorAll?.('video[data-src]').forEach((video) => {
      if (lazyVideos.has(video)) return;
      lazyVideos.add(video);
      if (observer) observer.observe(video);
      else hydrate(video);
    });
  }

  const mutations = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) observe(node.matches?.('video[data-src]') ? node.parentElement : node);
      }
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.querySelectorAll('video').forEach((video) => {
        if (!video.paused) {
          resumeVideos.add(video);
          video.pause();
        }
      });
      return;
    }
    for (const video of resumeVideos) {
      const rect = video.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight) video.play().catch(() => {});
    }
    resumeVideos.clear();
  });

  window.CinematicMedia = { hydrate, observe };
  observe();
  mutations.observe(document.documentElement, { childList: true, subtree: true });
})();