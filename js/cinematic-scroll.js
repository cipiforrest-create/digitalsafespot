/* Shared scroll-scrub film runtime for Digital X cinematic landing pages. */
(function () {
  'use strict';

  var configs = {
    '/cinematic-clothes/': {
      accent: '#7fd8ff',
      label: 'Cinematic Clothes',
      clips: [
        { src: '/assets/primjeri/clothes/cloth-1.mp4', poster: '/assets/primjeri/clothes/cloth-1.jpg', eyebrow: 'Look 01 · Silhouette', title: 'Stil koji se <em>kreće.</em>', lede: 'Prvi kadar uvodi kolekciju kroz siluetu, teksturu i kontrolisano filmsko svjetlo.' },
        { src: '/assets/primjeri/clothes/cloth-2.mp4', poster: '/assets/primjeri/clothes/cloth-2.jpg', eyebrow: 'Look 02 · Texture', title: 'Materijal prije <em>opisa.</em>', lede: 'Skrol približava tkaninu i detalj, tako da kvalitet postaje vidljiv prije cijene.' },
        { src: '/assets/primjeri/clothes/cloth-3.mp4', poster: '/assets/primjeri/clothes/cloth-3.jpg', eyebrow: 'Look 03 · Campaign', title: 'Kolekcija dobija <em>ritam.</em>', lede: 'Završni film pretvara lookbook u kampanju i vodi posjetioca prema proizvodu.' }
      ]
    },
    '/cinematic-dentist/': {
      accent: '#8fe7ff',
      label: 'Cinematic Dentist',
      clips: [
        { src: '/assets/primjeri/dentist/builder.mp4', poster: '/assets/primjeri/dentist/builder_poster.jpg', eyebrow: 'Chapter 01 · Povjerenje', title: 'Mir počinje <em>prije termina.</em>', lede: 'Smirena filmska priča uvodi prostor, tim i preciznost bez kliničke hladnoće.' },
        { src: '/assets/primjeri/dentist/closer.mp4', poster: '/assets/primjeri/dentist/closer_poster.jpg', eyebrow: 'Chapter 02 · Rezultat', title: 'Detalj postaje <em>sigurnost.</em>', lede: 'Drugi film približava tretman i rezultat, a zatim prirodno vodi prema rezervaciji.' }
      ]
    },
    '/cinematic-penthouse/': {
      accent: '#e8cda0',
      label: 'Cinematic Penthouse',
      clips: [
        { src: '/assets/primjeri/penthouse/tour.mp4', mobileSrc: '/assets/primjeri/penthouse/tour-mobile.mp4', poster: '/assets/primjeri/penthouse/poster.jpg', eyebrow: 'Private tour · One continuous take', title: 'Prostor se <em>doživljava.</em>', lede: 'Skrol vas vodi kroz dolazak, dnevni boravak, materijale i pogled — kadar po kadar, vlastitim tempom.' }
      ]
    },
    '/cinematic-watch/': {
      accent: '#d8b36a',
      label: 'Cinematic Watch',
      clips: [
        { src: '/assets/primjeri/watch/macro.mp4', mobileSrc: '/assets/primjeri/watch/macro-mobile.mp4', poster: '/assets/primjeri/watch/macro-poster.webp', eyebrow: 'Chapter 01 · Macro', title: 'Vrijednost živi u <em>detalju.</em>', lede: 'Makro film otkriva površinu, rub i završnu obradu tempom koji posjetilac kontroliše skrolom.' },
        { src: '/assets/primjeri/watch/engineering.mp4', poster: '/assets/primjeri/watch/engineering-poster.webp', eyebrow: 'Chapter 02 · Engineering', title: 'Mehanizam dobija <em>pozornicu.</em>', lede: 'Cijeli engineering film nastavlja priču kroz zupčanike, balans i preciznost — ništa više nije skraćeno.' }
      ]
    }
  };

  var path = window.location.pathname.replace(/\/index\.html$/, '/');
  var config = configs[path];
  var main = document.querySelector('main');
  if (!config || !main) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia && window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;

  function ensureCss() {
    if (document.querySelector('link[href="/css/cinematic-scroll.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/css/cinematic-scroll.css';
    document.head.appendChild(link);
  }

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (typeof text === 'string') node.textContent = text;
    return node;
  }

  ensureCss();

  var section = element('section', 'dx-scroll-cinema');
  section.setAttribute('data-scroll-cinema', config.label);
  section.setAttribute('aria-label', config.label + ' scroll experience');
  section.style.setProperty('--dx-cinema-accent', config.accent);

  var track = element('div', 'dx-scroll-cinema__track');
  track.style.setProperty('--dx-cinema-track', Math.max(300, config.clips.length * 210 + 100) + 'vh');
  var sticky = element('div', 'dx-scroll-cinema__sticky');
  var media = element('div', 'dx-scroll-cinema__media');
  var grain = element('div', 'dx-scroll-cinema__grain');
  grain.setAttribute('aria-hidden', 'true');
  var top = element('div', 'dx-scroll-cinema__top');
  var back = element('a', 'dx-scroll-cinema__back', 'Digital X · Primjeri');
  back.href = '/primjeri-web-stranica/';
  var counter = element('span', 'dx-scroll-cinema__counter', '01 / 0' + config.clips.length);
  top.append(back, counter);

  var fullscreen = element('button', 'dx-scroll-cinema__fullscreen');
  fullscreen.type = 'button';
  fullscreen.setAttribute('aria-label', 'Otvori cinematic preko cijelog ekrana');
  fullscreen.setAttribute('aria-pressed', 'false');
  fullscreen.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg><span>Fullscreen</span>';

  var copy = element('div', 'dx-scroll-cinema__copy');
  var progress = element('div', 'dx-scroll-cinema__progress');
  var progressFill = element('i');
  progress.appendChild(progressFill);
  var cue = element('div', 'dx-scroll-cinema__cue', 'Skrol režira film');
  var videos = [];
  var chapters = [];
  var ready = [];
  var targets = [];

  config.clips.forEach(function (clip, index) {
    var video = element('video', 'dx-scroll-cinema__video' + (index === 0 ? ' is-active' : ''));
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.poster = clip.poster;
    video.setAttribute('aria-hidden', 'true');
    video.dataset.src = clip.src;
    if (clip.mobileSrc) video.dataset.mobileSrc = clip.mobileSrc;
    media.appendChild(video);
    videos.push(video);
    ready.push(false);
    targets.push(0);

    var chapter = element('article', 'dx-scroll-cinema__chapter' + (index === 0 ? ' is-active' : ''));
    var eyebrow = element('p', 'dx-scroll-cinema__eyebrow', clip.eyebrow);
    var title = element('h1', 'dx-scroll-cinema__title');
    title.innerHTML = clip.title;
    var lede = element('p', 'dx-scroll-cinema__lede', clip.lede);
    chapter.append(eyebrow, title, lede);
    copy.appendChild(chapter);
    chapters.push(chapter);

    var markReady = function () {
      ready[index] = video.readyState >= 1 && Number.isFinite(video.duration) && video.duration > 0;
      if (ready[index]) section.classList.add('dx-scroll-cinema--ready');
    };
    video.addEventListener('loadedmetadata', markReady);
    video.addEventListener('durationchange', markReady);
    video.src = mobile && clip.mobileSrc ? clip.mobileSrc : clip.src;
    video.load();
    if (video.readyState >= 1) markReady();
  });

  media.appendChild(grain);
  sticky.append(media, top, fullscreen, copy, progress, cue);
  track.appendChild(sticky);
  section.appendChild(track);
  main.insertBefore(section, main.firstChild);

  var active = 0;
  var progressValue = 0;
  var fallbackFullscreen = false;

  function setActive(next) {
    if (next === active) return;
    active = next;
    videos.forEach(function (video, index) {
      video.classList.toggle('is-active', index === active);
      video.pause();
    });
    chapters.forEach(function (chapter, index) {
      chapter.classList.toggle('is-active', index === active);
    });
    counter.textContent = String(active + 1).padStart(2, '0') + ' / ' + String(config.clips.length).padStart(2, '0');
  }

  function inFullscreenMode() {
    return document.fullscreenElement === section || fallbackFullscreen;
  }

  function readProgress() {
    var range;
    if (inFullscreenMode()) {
      range = Math.max(1, track.offsetHeight - section.clientHeight);
      return Math.max(0, Math.min(1, section.scrollTop / range));
    }
    var rect = section.getBoundingClientRect();
    range = Math.max(1, section.offsetHeight - window.innerHeight);
    return Math.max(0, Math.min(1, -rect.top / range));
  }

  function updateFromScroll() {
    if (reduce) return;
    progressValue = readProgress();
    var scaled = Math.min(config.clips.length - 0.0001, progressValue * config.clips.length);
    var next = Math.min(config.clips.length - 1, Math.floor(scaled));
    var local = scaled - next;
    setActive(next);
    var video = videos[next];
    if (ready[next]) targets[next] = local * Math.max(0, video.duration - 0.04);
    progressFill.style.transform = 'scaleX(' + progressValue.toFixed(4) + ')';
  }

  function render() {
    if (!reduce) {
      var video = videos[active];
      if (ready[active] && !video.seeking) {
        var delta = targets[active] - video.currentTime;
        if (Math.abs(delta) > 0.012) {
          try { video.currentTime += delta * 0.2; } catch (error) {}
        }
      }
    }
    requestAnimationFrame(render);
  }

  function setFullscreenState(open, fallback) {
    fallbackFullscreen = Boolean(open && fallback);
    section.classList.toggle('dx-scroll-cinema--fullscreen', fallbackFullscreen);
    document.body.classList.toggle('dx-cinema-lock', open);
    fullscreen.setAttribute('aria-pressed', open ? 'true' : 'false');
    fullscreen.querySelector('span').textContent = open ? 'Zatvori' : 'Fullscreen';
    fullscreen.setAttribute('aria-label', open ? 'Zatvori prikaz preko cijelog ekrana' : 'Otvori cinematic preko cijelog ekrana');
    if (open) section.scrollTop = progressValue * Math.max(1, track.offsetHeight - section.clientHeight);
  }

  function enterFallback() {
    setFullscreenState(true, true);
  }

  fullscreen.addEventListener('click', function () {
    if (document.fullscreenElement === section) {
      document.exitFullscreen().catch(function () { setFullscreenState(false, false); });
      return;
    }
    if (fallbackFullscreen) {
      setFullscreenState(false, false);
      return;
    }
    if (section.requestFullscreen) {
      var request;
      try { request = section.requestFullscreen({ navigationUI: 'hide' }); }
      catch (error) { enterFallback(); return; }
      Promise.resolve(request).catch(enterFallback);
    } else {
      enterFallback();
    }
  });

  document.addEventListener('fullscreenchange', function () {
    setFullscreenState(document.fullscreenElement === section, false);
  });
  document.addEventListener('fullscreenerror', function () {
    if (!document.fullscreenElement) enterFallback();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && fallbackFullscreen) setFullscreenState(false, false);
  });
  window.addEventListener('scroll', updateFromScroll, { passive: true });
  section.addEventListener('scroll', updateFromScroll, { passive: true });
  window.addEventListener('resize', updateFromScroll);
  updateFromScroll();
  requestAnimationFrame(render);
})();
