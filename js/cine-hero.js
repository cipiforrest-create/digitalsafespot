/* ===========================================================================
   DIGITAL X — Award-winning scroll-driven 3D cinematic hero (self-bootstrapping)
   Framework-free. Auto-enhances the first hero of any cinematic landing page.

   Works two ways:
   1) Pre-marked hero: <section data-cine-hero> with the full cine-hero3d markup.
   2) Auto mode: any <section class="land-hero"> — the script injects the depth
      planes, particle field, media card wrapper, chips, scroll cue, rail,
      volumetric rays, film grain, lens flare, horizon glow and glassmorphism
      panel — so no per-page HTML surgery is needed.

   Drives depth-plane parallax, media dolly/tilt, particle drift, holographic
   border rotation, moving sheen, volumetric ray sway, and scroll-triggered
   class toggles from scroll position + pointer. Respects prefers-reduced-motion
   and pauses when off-screen. Injects its own stylesheet if missing.
   ===========================================================================*/
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ensure the stylesheet is present (idempotent).
  function ensureCss() {
    if (document.querySelector('link[href*="cine-hero.css"]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = '/css/cine-hero.css';
    document.head.appendChild(l);
  }

  // Build the enhanced 3D structure around an existing .land-hero if needed.
  function bootstrap() {
    var hero = document.querySelector('[data-cine-hero]');
    if (!hero) {
      hero = document.querySelector('.land-hero');
      if (!hero) return null;
      hero.classList.add('cine-hero3d');
      hero.setAttribute('data-cine-hero', '');

      var container = hero.querySelector('.container') || hero.firstElementChild;
      var flex = hero.querySelector('.land-flex');

      // Rail
      var rail = document.createElement('div');
      rail.className = 'cine-hero3d__rail';
      rail.setAttribute('aria-hidden', 'true');
      rail.innerHTML = '<i></i>';
      hero.insertBefore(rail, hero.firstChild);

      // Depth planes + particles (siblings behind the container)
      var depth = document.createElement('div');
      depth.className = 'cine-hero3d__depth';
      depth.setAttribute('aria-hidden', 'true');
      depth.innerHTML =
        '<div class="cine-hero3d__plane cine-hero3d__plane--far"></div>' +
        '<div class="cine-hero3d__plane cine-hero3d__plane--grid"></div>';
      var parts = document.createElement('div');
      parts.className = 'cine-hero3d__particles';
      parts.setAttribute('aria-hidden', 'true');
      if (container) {
        hero.insertBefore(depth, container);
        hero.insertBefore(parts, container);
      } else {
        hero.appendChild(depth); hero.appendChild(parts);
      }

      // Volumetric light rays
      var rays = document.createElement('div');
      rays.className = 'cine-hero3d__rays';
      rays.setAttribute('aria-hidden', 'true');
      for (var r = 0; r < 5; r++) {
        var ray = document.createElement('div');
        ray.className = 'cine-hero3d__ray';
        rays.appendChild(ray);
      }
      hero.insertBefore(rays, container);

      // Film grain overlay
      var grain = document.createElement('div');
      grain.className = 'cine-hero3d__grain';
      grain.setAttribute('aria-hidden', 'true');
      hero.appendChild(grain);

      // Anamorphic lens flare
      var flare = document.createElement('div');
      flare.className = 'cine-hero3d__flare';
      flare.setAttribute('aria-hidden', 'true');
      hero.appendChild(flare);

      // Horizon glow floor
      var horizon = document.createElement('div');
      horizon.className = 'cine-hero3d__horizon';
      horizon.setAttribute('aria-hidden', 'true');
      hero.appendChild(horizon);

      // Copy column = first child of flex; media column = the .hero-media (or 2nd child)
      if (flex) {
        var cols = flex.children;
        var copyCol = cols[0];
        var mediaCol = hero.querySelector('.hero-media') || cols[cols.length - 1];
        if (copyCol) copyCol.classList.add('cine-hero3d__copy');
        if (mediaCol && mediaCol !== copyCol) {
          mediaCol.classList.add('cine-hero3d__stage');
          var mImg = mediaCol.querySelector('img');
          if (mImg && !mediaCol.querySelector('.cine-hero3d__card')) {
            var card = document.createElement('div');
            card.className = 'cine-hero3d__card';
            mImg.parentNode.insertBefore(card, mImg);
            card.appendChild(mImg);
            var grade = document.createElement('span');
            grade.className = 'grade';
            card.appendChild(grade);

            // Glassmorphism info panel inside card
            var glass = document.createElement('div');
            glass.className = 'cine-hero3d__glass';
            var pageTitle = document.title.split(/[|\-]/)[0].trim();
            glass.innerHTML =
              '<p class="cine-hero3d__glass-title">' + (pageTitle || 'Digital X') + '</p>' +
              '<div class="cine-hero3d__glass-stats">' +
                '<div><strong>4K</strong>Cinematic</div>' +
                '<div><strong>60fps</strong>Smooth</div>' +
                '<div><strong>3D</strong>Depth</div>' +
              '</div>';
            card.appendChild(glass);

            // Floating chips derived from badge-row text, if any.
            var badges = hero.querySelectorAll('.badge-row span');
            var labelA = badges[0] ? badges[0].textContent.replace(/^[\u2713\s]+/, '').trim() : 'Cinematic';
            var labelB = badges[badges.length - 1] ? badges[badges.length - 1].textContent.replace(/^[\u2713\s]+/, '').trim() : 'Premium';
            var chipA = document.createElement('span');
            chipA.className = 'cine-hero3d__chip cine-hero3d__chip--a';
            chipA.textContent = labelA;
            var chipB = document.createElement('span');
            chipB.className = 'cine-hero3d__chip cine-hero3d__chip--b';
            chipB.textContent = labelB;
            mediaCol.appendChild(chipA);
            mediaCol.appendChild(chipB);
          }
        }
      }

      // Scroll cue
      var cue = document.createElement('div');
      cue.className = 'cine-hero3d__cue';
      cue.setAttribute('aria-hidden', 'true');
      cue.textContent = 'Skrolaj';
      hero.appendChild(cue);
    }

    // Expand / fullscreen button (always inject)
    if (!hero.querySelector('.cine-hero3d__expand')) {
      var exp = document.createElement('button');
      exp.className = 'cine-hero3d__expand';
      exp.type = 'button';
      exp.setAttribute('aria-label', 'Fullscreen cinematic experience');
      exp.setAttribute('aria-pressed', 'false');
      exp.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg><span>Fullscreen</span>';
      var stg = hero.querySelector('.cine-hero3d__stage') || hero.querySelector('.hero-media');
      if (stg) stg.appendChild(exp);
      var fallbackOpen = false;
      var previousOverflow = '';

      function setFullscreenState(open, fallback) {
        fallbackOpen = Boolean(open && fallback);
        hero.classList.toggle('cine-hero3d--immersive', open);
        exp.setAttribute('aria-pressed', open ? 'true' : 'false');
        exp.setAttribute('aria-label', open ? 'Close fullscreen cinematic experience' : 'Fullscreen cinematic experience');
        exp.querySelector('span').textContent = open ? 'Zatvori' : 'Fullscreen';
        if (open) {
          previousOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          hero.scrollTop = 0;
        } else {
          document.body.style.overflow = previousOverflow;
        }
      }

      exp.addEventListener('click', function () {
        if (document.fullscreenElement === hero) {
          document.exitFullscreen().catch(function () { setFullscreenState(false, false); });
          return;
        }
        if (fallbackOpen) {
          setFullscreenState(false, false);
          return;
        }
        if (!hero.requestFullscreen) {
          setFullscreenState(true, true);
          return;
        }
        var request;
        try { request = hero.requestFullscreen({ navigationUI: 'hide' }); }
        catch (error) { setFullscreenState(true, true); return; }
        Promise.resolve(request).catch(function () { setFullscreenState(true, true); });
      });
      document.addEventListener('fullscreenchange', function () {
        setFullscreenState(document.fullscreenElement === hero, false);
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && fallbackOpen) setFullscreenState(false, false);
      });
    }

    return hero;
  }

  ensureCss();
  var hero = bootstrap();
  if (!hero || reduce) return;

  // Add visibility class immediately
  hero.classList.add('cine--visible');

  var depth    = hero.querySelector('.cine-hero3d__depth');
  var far      = hero.querySelector('.cine-hero3d__plane--far');
  var grid     = hero.querySelector('.cine-hero3d__plane--grid');
  var particleWrap = hero.querySelector('.cine-hero3d__particles');
  var raysWrap = hero.querySelector('.cine-hero3d__rays');
  var copy     = hero.querySelector('.cine-hero3d__copy');
  var stage    = hero.querySelector('.cine-hero3d__stage');
  var card     = hero.querySelector('.cine-hero3d__card');
  var img      = card ? card.querySelector('img') : null;
  var chipA    = hero.querySelector('.cine-hero3d__chip--a');
  var chipB    = hero.querySelector('.cine-hero3d__chip--b');
  var railFill = hero.querySelector('.cine-hero3d__rail i');
  var flare    = hero.querySelector('.cine-hero3d__flare');

  // ---- particle field (enhanced with glow trails) -------------------------
  var particles = [];
  if (particleWrap) {
    var N = window.innerWidth < 768 ? 18 : 40;
    for (var i = 0; i < N; i++) {
      var p = document.createElement('i');
      var px = Math.random(), py = Math.random();
      var z = -500 + Math.random() * 700;
      var size = 2 + Math.random() * 3;
      p.style.left = (px * 100) + '%';
      p.style.top = (py * 100) + '%';
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      particleWrap.appendChild(p);
      particles.push({
        el: p, x: px, y: py, z: z,
        sp: 0.15 + Math.random() * 0.7,
        ph: Math.random() * Math.PI * 2,
        sz: size
      });
    }
  }

  // ---- pointer (eased) ----------------------------------------------------
  var pmx = 0, pmy = 0, mx = 0, my = 0;
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    pmx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pmy = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  hero.addEventListener('pointerleave', function () { pmx = 0; pmy = 0; });

  // ---- scroll progress (0 at top of hero, 1 when scrolled one viewport) ---
  var prog = 0;
  var scrolledClass = false;
  function readProgress() {
    var r = hero.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    prog = Math.min(1, Math.max(0, -r.top / vh));
    // Toggle scroll-triggered classes
    if (prog > 0.05 && !scrolledClass) {
      hero.classList.add('cine--scrolled');
      scrolledClass = true;
    } else if (prog <= 0.03 && scrolledClass) {
      hero.classList.remove('cine--scrolled');
      scrolledClass = false;
    }
  }

  // ---- visibility gate ----------------------------------------------------
  var visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (ents) {
      visible = ents[0].isIntersecting;
    }, { rootMargin: '10% 0px' }).observe(hero);
  }

  // ---- render loop (award-winning cinematic animation) --------------------
  var t = 0, sheen = -40, holoAngle = 0;

  // Smoothstep helper
  function smoothstep(x) { return x * x * (3 - 2 * x); }

  // Cinematic easing with elastic feel
  function cineEase(x) {
    var s = smoothstep(x);
    return s + Math.sin(s * Math.PI) * 0.08;
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    t += 0.016;
    readProgress();

    // Eased pointer with smooth lerp
    mx += (pmx - mx) * 0.05;
    my += (pmy - my) * 0.05;

    var p = prog;
    var ep = cineEase(p);

    // --- Depth planes: cinematic camera dolly effect ---
    if (far) {
      var farX = mx * 26 - ep * 35 + Math.sin(t * 0.3) * 4;
      var farY = my * 18 + ep * 25 + Math.cos(t * 0.25) * 3;
      far.style.transform = 'translateZ(-620px) scale(' + (1.55 + ep * 0.15) + ') translate3d(' + farX + 'px,' + farY + 'px,0)';
    }
    if (grid) {
      var gridScale = 1.3 + ep * 0.3;
      grid.style.transform = 'translateZ(-360px) scale(' + gridScale + ') translate3d(' + (mx * 16) + 'px,' + (my * 12 - ep * 50) + 'px,0)';
      grid.style.opacity = (0.5 + ep * 0.3).toFixed(2);
    }
    if (depth) {
      depth.style.transform = 'rotateX(' + (my * 2.5 + Math.sin(t * 0.4) * 0.5) + 'deg) rotateY(' + (mx * -3.5 + Math.cos(t * 0.35) * 0.4) + 'deg)';
    }

    // --- Copy column: cinematic recede on scroll ---
    if (copy) {
      copy.style.transform = 'translate3d(0,' + (-ep * 50) + 'px,' + (ep * -80) + 'px) rotateY(' + (mx * 2.5) + 'deg) rotateX(' + (my * 1) + 'deg)';
      copy.style.opacity = (1 - ep * 0.3).toFixed(2);
    }

    // --- Stage: full 3D dolly + orbit ---
    if (stage) {
      var rotY = mx * 11 - p * 5 + Math.sin(t * 0.2) * 1.5;
      var rotX = -my * 8 + ep * 4 + Math.cos(t * 0.25) * 0.8;
      var tz = 50 - ep * 140;
      var stageScale = 1 + ep * 0.05;
      stage.style.transform =
        'translate3d(' + (mx * 12) + 'px,' + (my * 10 - ep * 30) + 'px,' + tz + 'px) ' +
        'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale(' + stageScale + ')';
    }

    // --- Image: ken burns + parallax ---
    if (img) {
      var imgScale = 1.06 + ep * 0.14 + Math.sin(t * 0.15) * 0.01;
      img.style.transform = 'scale(' + imgScale + ') translate3d(' + (mx * -16) + 'px,' + (my * -12) + 'px,0)';
    }

    // --- Card: moving sheen + holographic border ---
    if (card) {
      sheen = -40 + ((t * 14) % 200) + ep * 50;
      card.style.setProperty('--sheen', sheen.toFixed(1) + '%');
      holoAngle = (holoAngle + 0.8) % 360;
      card.style.setProperty('--holo-angle', holoAngle.toFixed(0) + 'deg');
      // Dynamic box-shadow on scroll
      var shadowSpread = 40 + ep * 30;
      var glowOpacity = (0.14 + ep * 0.2).toFixed(2);
      card.style.boxShadow =
        '0 ' + shadowSpread + 'px ' + (shadowSpread * 2.2 | 0) + 'px -30px rgba(0,0,0,.85),' +
        '0 0 ' + (ep * 60 | 0) + 'px rgba(95,201,255,' + glowOpacity + '),' +
        '0 0 0 1px rgba(95,201,255,.14) inset';
    }

    // --- Chips: 3D float ---
    if (chipA) {
      chipA.style.transform = 'translateZ(' + (90 + ep * 80) + 'px) translate3d(' + (mx * -24 + Math.sin(t * 0.5) * 3) + 'px,' + (my * -18 - ep * 14) + 'px,0)';
    }
    if (chipB) {
      chipB.style.transform = 'translateZ(' + (110 + ep * 100) + 'px) translate3d(' + (mx * 26 + Math.cos(t * 0.45) * 3) + 'px,' + (my * 20 + ep * 16) + 'px,0)';
    }

    // --- Particles: enhanced drift with glow pulsing ---
    for (var i = 0; i < particles.length; i++) {
      var q = particles[i];
      var drift = (t * q.sp * 5) % 100;
      var yy = (q.y * 100 - drift + 100) % 100;
      var depthK = (q.z + 500) / 1200;
      var pxp = mx * (12 + depthK * 45);
      var pyp = my * (8 + depthK * 20);
      q.el.style.transform = 'translate3d(' + pxp + 'px,' + pyp + 'px,' + q.z + 'px)';
      q.el.style.top = yy + '%';
      var pulse = 0.5 + 0.5 * Math.sin(t * 1.5 + q.ph);
      var baseOpacity = 0.12 + 0.55 * depthK;
      var scrollBoost = ep * 0.5;
      q.el.style.opacity = ((baseOpacity + scrollBoost) * (0.3 + 0.7 * pulse)).toFixed(3);
    }

    // --- Volumetric rays: sway with scroll ---
    if (raysWrap) {
      raysWrap.style.transform = 'translate3d(' + (mx * 20) + 'px,0,0) rotateZ(' + (mx * 2 + Math.sin(t * 0.3) * 1.5) + 'deg)';
      raysWrap.style.opacity = (0.4 + ep * 0.6).toFixed(2);
    }

    // --- Lens flare: track pointer ---
    if (flare) {
      var flareY = 40 + my * 15;
      flare.style.top = flareY + '%';
      flare.style.transform = 'translate(-50%,-50%) scaleX(' + (1 + ep * 0.4) + ')';
    }

    // --- Rail fill ---
    if (railFill) railFill.style.width = (p * 100).toFixed(1) + '%';
  }
  requestAnimationFrame(frame);
})();
