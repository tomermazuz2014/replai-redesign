/* Hero film: shows the looping film over its own first frame, keeps the hero to one screen,
   and lets the scene drift a little slower than the page on scroll. The shared motion
   controller plays and pauses the video; with motion off the still simply stays. */
(() => {
  'use strict';
  const hero = document.querySelector('#hero.hero--film'); if (!hero) return;
  const root = document.documentElement, header = document.querySelector('header');
  const copy = hero.querySelector('.hero-copy'), film = hero.querySelector('.hero-film');
  const drift = hero.querySelector('.hero-film-drift'), video = hero.querySelector('.hero-film-video');
  const state = () => (window.WebsiteEffects && window.WebsiteEffects.state) || {};
  const still = () => { const s = state(); return !!(s.paused || s.reduced) || matchMedia('(prefers-reduced-motion: reduce)').matches; };

  const fit = () => {
    if (header) root.style.setProperty('--header-h', header.offsetHeight + 'px');
    film.toggleAttribute('data-bleed', film.getBoundingClientRect().width >= root.clientWidth - 1);
  };
  fit(); addEventListener('resize', fit, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  if (video) {
    const show = (on) => film.classList.toggle('is-filming', on);
    video.addEventListener('playing', () => show(true));
    video.addEventListener('pause', () => show(false));
    video.addEventListener('error', () => show(false));
    const start = () => { const s = state(); if (!s.paused && !s.reduced && !s.hidden && hero.dataset.inView !== 'false') video.play().catch(() => {}); };
    // the shared controller may already have started it before this script ran
    if (!video.paused && video.readyState >= 3 && video.currentTime > 0) show(true);
    video.addEventListener('timeupdate', () => { if (!video.paused) show(true); }, { once: true });
    if (video.readyState >= 3) start(); else video.addEventListener('canplay', start, { once: true });
  }

  let queued = false;
  const move = () => {
    queued = false;
    const y = still() ? 0 : Math.min(Math.max(scrollY, 0), hero.offsetHeight);
    drift.style.transform = y ? `translate3d(0,${(y * 0.1).toFixed(1)}px,0)` : '';
    copy.style.transform = y ? `translate3d(0,${(y * -0.05).toFixed(1)}px,0)` : '';
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(move); } };
  addEventListener('scroll', onScroll, { passive: true });
  if (window.WebsiteEffects && window.WebsiteEffects.subscribe) window.WebsiteEffects.subscribe(onScroll);
  move();
})();

/* Leaves on the wind: a few painted leaves cross the whole hero, behind the words and over the
   scene, and the pointer acts as a gust that pushes the ones near it. Decoration only, so it is
   created here (nothing without scripts) and stops whenever motion is off or the hero is off-screen. */
(() => {
  'use strict';
  const hero = document.querySelector('#hero.hero--film'); if (!hero) return;
  const NS = 'http://www.w3.org/2000/svg', FILLS = ['#91b3a5', '#f2dc93', '#e48268', '#c5e2e9', '#91b3a5'];
  const copy = hero.querySelector('.hero-copy');
  const layer = document.createElement('div'); layer.className = 'hero-wind'; layer.setAttribute('aria-hidden', 'true');
  hero.insertBefore(layer, hero.querySelector('.hero-copy'));
  const count = matchMedia('(max-width: 760px)').matches ? 6 : 11, leaves = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  const place = (l, anywhere) => {
    const under = (copy.offsetTop + copy.offsetHeight) / hero.clientHeight + 0.03;   // start below the copy when it sits on top
    l.x = anywhere ? rnd(0, hero.clientWidth) : -30; l.y = hero.clientHeight * rnd(under < 0.7 ? under : 0.15, 0.92);
    l.vx = l.vy = 0; l.base = rnd(60, 150); l.phase = rnd(0, 6.28); l.freq = rnd(0.7, 1.6); l.amp = rnd(12, 34);
    l.rot = rnd(0, 360); l.spin = (Math.random() < 0.5 ? -1 : 1) * rnd(40, 150);
  };
  for (let i = 0; i < count; i++) {
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '-1 -7 20 14'); svg.setAttribute('class', 'hero-leaf');
    const size = rnd(15, 26); svg.style.width = size + 'px'; svg.style.height = size * 0.7 + 'px';
    const blade = document.createElementNS(NS, 'path'); blade.setAttribute('d', 'M0 0C4 -6.5 13 -6 18 0C13 5.5 4 6 0 0Z');
    blade.setAttribute('fill', FILLS[i % FILLS.length]); blade.setAttribute('fill-opacity', '.78'); blade.setAttribute('stroke', '#172c39'); blade.setAttribute('stroke-width', '.9'); blade.setAttribute('stroke-linejoin', 'round');
    const rib = document.createElementNS(NS, 'path'); rib.setAttribute('d', 'M1.5 0H14'); rib.setAttribute('stroke', '#172c39'); rib.setAttribute('stroke-width', '.6'); rib.setAttribute('fill', 'none'); rib.setAttribute('stroke-linecap', 'round');
    svg.append(blade, rib); layer.append(svg);
    const l = { el: svg }; place(l, true); leaves.push(l);
  }
  const state = () => (window.WebsiteEffects && window.WebsiteEffects.state) || {};
  const active = () => { const s = state(); return !s.paused && !s.reduced && !s.hidden && hero.dataset.inView !== 'false' && !matchMedia('(prefers-reduced-motion: reduce)').matches; };

  // pointer gust: its speed is handed to the leaves around it
  let last = null;
  hero.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    const r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, t = e.timeStamp;
    if (last && t > last.t) {
      const dt = Math.min(0.08, (t - last.t) / 1000), cap = (v) => Math.max(-1400, Math.min(1400, v)), gx = cap((x - last.x) / dt), gy = cap((y - last.y) / dt);
      for (const l of leaves) { const d = Math.hypot(l.x - x, l.y - y); if (d < 210) { const f = (1 - d / 210) * 0.3; l.vx += gx * f; l.vy += gy * f; } }
    }
    last = { x, y, t };
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { last = null; });

  let frame = 0, then = 0;
  const tick = (now) => {
    frame = 0; if (!active()) { layer.classList.remove('is-live'); return; }
    const dt = Math.min(0.05, (now - then) / 1000 || 0.016); then = now;
    const w = hero.clientWidth, h = hero.clientHeight, ease = Math.exp(-2.4 * dt);
    for (const l of leaves) {
      l.phase += l.freq * dt; l.vx *= ease; l.vy *= ease;
      l.x += (l.base + l.vx) * dt; l.y += (Math.cos(l.phase) * l.amp + l.vy) * dt; l.rot += l.spin * dt * (1 + Math.abs(l.vx) / 260);
      if (l.x > w + 40 || l.x < -80 || l.y < -60 || l.y > h + 60) place(l, false);
      l.el.style.transform = `translate3d(${l.x.toFixed(1)}px,${l.y.toFixed(1)}px,0) rotate(${l.rot.toFixed(1)}deg)`;
    }
    frame = requestAnimationFrame(tick);
  };
  const start = () => { if (!frame && active()) { layer.classList.add('is-live'); then = performance.now(); frame = requestAnimationFrame(tick); } };
  if (window.WebsiteEffects && window.WebsiteEffects.subscribe) window.WebsiteEffects.subscribe(start);
  document.addEventListener('visibilitychange', start); addEventListener('scroll', start, { passive: true });
  start();
})();
