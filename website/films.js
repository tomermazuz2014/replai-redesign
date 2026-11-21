/* Painted scenes as looping film.
   A scene that has a <video class="scene-film" data-effects-media> keeps its original drawn still underneath.
   shared/effects.js already decides when such media may run (in view, motion allowed, tab visible);
   this only swaps what is shown: the film while it is really playing, the still the rest of the time. */
(() => {
  'use strict';
  document.querySelectorAll('.scene-film').forEach((film) => {
    const scene = film.closest('.animated-scene'); if (!scene) return;
    const show = (on) => scene.classList.toggle('is-filming', on);
    film.addEventListener('playing', () => show(true));
    film.addEventListener('pause', () => show(false));
    film.addEventListener('error', () => show(false));
    /* the first play request can arrive before any data exists: ask again once the film can start */
    film.addEventListener('canplay', () => {
      const s = window.WebsiteEffects && window.WebsiteEffects.state, region = film.closest('[data-motion-region]');
      if (s && !s.paused && !s.reduced && !s.hidden && (!region || region.dataset.inView !== 'false')) film.play().catch(() => {});
    }, { once: true });
  });
})();
