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
