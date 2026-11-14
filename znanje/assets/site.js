// Centar znanja: mobile menu, reading progress and table-of-contents highlight.
(() => {
  const toggle = document.querySelector('.zn-menu');
  const menu = document.getElementById('zn-mobile');
  if (toggle && menu) {
    const set = open => {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Zatvori navigaciju' : 'Otvori navigaciju');
    };
    toggle.addEventListener('click', () => set(menu.hidden));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { set(false); toggle.focus(); } });
  }

  const article = document.querySelector('.guide-body');
  if (!article) return;

  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = article.getBoundingClientRect();
    const done = Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - innerHeight)));
    bar.style.transform = `scaleX(${done})`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();

  const links = new Map([...document.querySelectorAll('.guide-toc a')].map(a => [a.getAttribute('href').slice(1), a]));
  if (!links.size || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach(a => a.classList.remove('is-active'));
      links.get(entry.target.id)?.classList.add('is-active');
    }
  }, { rootMargin: '-20% 0px -70% 0px' });
  article.querySelectorAll('section[id]').forEach(section => observer.observe(section));
})();
