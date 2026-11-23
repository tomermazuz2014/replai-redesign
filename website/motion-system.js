/* Awwwards-level motion for the Kite site, written as one self-contained module.
   It gives every section bold entrances, ambient drift, parallax, card activation
   and mobile press feedback. The hero and the per-scene films run elsewhere and are
   left alone. Pauses with window.WebsiteEffects and prefers-reduced-motion. */
(() => {
  'use strict';
  if (window.KiteMotion) return; window.KiteMotion = true;

  const doc = document, root = doc.documentElement, body = doc.body;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const effectsOff = () => { const s = (window.WebsiteEffects && window.WebsiteEffects.state) || {}; return !!(s.paused || s.reduced || reduced()); };

  /* ================================================================== lenis-like smooth scroll */
  // A tiny inertia-smoothed scroll: on wheel and trackpad, the page's scrollTop eases toward a target.
  // Native scroll stays on, so touch devices, keyboards and scrollbars keep their normal behaviour.
  // Off under reduced motion and when the user touches or focuses a scrollable element.
  const smoothScroll = () => {
    if (reduced() || matchMedia('(pointer:coarse)').matches) return;
    let target = scrollY, current = scrollY, raf = 0, active = false;
    const EASE = 0.14, THRESHOLD = 0.3;
    const max = () => doc.documentElement.scrollHeight - innerHeight;
    const tick = () => {
      current += (target - current) * EASE;
      if (Math.abs(target - current) < THRESHOLD) { current = target; active = false; raf = 0; scrollTo(0, current); return; }
      scrollTo(0, current); raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) return;      // let page-zoom through
      if (!active) { active = true; target = current = scrollY; }
      target = Math.max(0, Math.min(max(), target + e.deltaY));
      e.preventDefault(); start();
    }, { passive: false });
    // Reset on any other scroll source so nothing fights
    addEventListener('scroll', () => { if (!raf) current = target = scrollY; }, { passive: true });
    addEventListener('keydown', () => { active = false; cancelAnimationFrame(raf); raf = 0; current = target = scrollY; });
  };

  /* ================================================================== split headings into words */
  const splitHeadings = () => {
    doc.querySelectorAll('h1, h2').forEach((h) => {
      if (h.closest('#hero')) return;          // hero has its own entrance
      if (h.dataset.mSplit) return;
      // Walk the heading and replace plain text nodes with word wrappers;
      // leave existing tags (<br>, <em>, <span>) in place, re-wrapping their text too.
      const wrap = (node) => {
        if (node.nodeType === 3) {
          const text = node.nodeValue;
          const frag = doc.createDocumentFragment();
          text.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
            const outer = doc.createElement('span'); outer.className = 'm-word';
            const inner = doc.createElement('span'); inner.textContent = part;
            outer.appendChild(inner); frag.appendChild(outer);
          });
          node.replaceWith(frag);
          return;
        }
        if (node.nodeType === 1) [...node.childNodes].forEach(wrap);
      };
      [...h.childNodes].forEach(wrap);
      h.dataset.mSplit = '1';
    });
  };

  /* ================================================================== in-view observer */
  const once = new Map();            // el → fn to run on first entry
  const observe = (el, cb) => { once.set(el, cb); io.observe(el); };
  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting) return;
      const fn = once.get(e.target); if (fn) { once.delete(e.target); io.unobserve(e.target); fn(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  /* ================================================================== section entrance */
  const revealSection = (sec) => {
    // Heading reveal with stagger
    sec.querySelectorAll('h1, h2').forEach((h) => {
      const words = [...h.querySelectorAll('.m-word > span')];
      words.forEach((w, i) => { w.style.transitionDelay = (i * 0.045).toFixed(3) + 's'; });
      requestAnimationFrame(() => h.classList.add('m-ready'));
    });
    // Paragraphs
    sec.querySelectorAll('p[data-m-reveal]').forEach((p, i) => {
      p.style.transitionDelay = (0.15 + i * 0.06).toFixed(2) + 's';
      requestAnimationFrame(() => p.classList.add('m-ready'));
    });
    // Explicit stagger groups
    const group = sec.querySelector('[data-m-stagger]');
    if (group) [...group.children].forEach((ch, i) => { ch.style.setProperty('--m-i', i); ch.classList.add('m-stagger-item'); });
    sec.dataset.mState = 'in';
  };

  /* ================================================================== ambient wind band */
  // Three curling ink lines drifting across each major section.
  const windSVG = (seed) => {
    const svg = `<svg viewBox="0 0 2000 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M-20 60 C 220 20, 420 100, 640 60 S 1060 20, 1280 60 S 1700 100, 2020 60"
            fill="none" stroke="#172c39" stroke-width="1.1" stroke-linecap="round"
            stroke-dasharray="${seed === 0 ? '' : seed === 1 ? '6 6' : '2 7'}" opacity=".9"/>
      <path d="M-20 80 C 180 50, 400 110, 620 80 S 1040 50, 1260 80 S 1680 110, 2020 80"
            fill="none" stroke="#172c39" stroke-width=".7" stroke-linecap="round" opacity=".5"/>
    </svg>`;
    return svg;
  };
  const addWind = () => {
    const skip = new Set(['hero']);
    doc.querySelectorAll('main section').forEach((sec) => {
      if (skip.has(sec.id)) return;
      if (sec.querySelector(':scope > .m-wind')) return;
      const w = doc.createElement('div'); w.className = 'm-wind'; w.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < 3; i++) {
        const tmp = doc.createElement('div'); tmp.innerHTML = windSVG(i);
        w.appendChild(tmp.firstElementChild);
      }
      sec.prepend(w);
    });
  };

  /* ================================================================== parallax layers */
  const parallax = () => {
    // Promote illustrations as parallax layers: SVG scenes, the context birds, the agents nodes.
    const targets = [];
    doc.querySelectorAll('[data-object-scene]:not(#guided-scene), .opening-art, .product-stage, .closing-art, [data-m-parallax]').forEach((el) => {
      if (el.closest('#hero')) return;
      el.dataset.mParallax = el.dataset.mParallax || '1';
      targets.push({ el, strength: parseFloat(el.dataset.mParallax) * 0.14 });
    });
    if (!targets.length) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      if (effectsOff()) { targets.forEach((t) => (t.el.style.transform = '')); return; }
      const vh = innerHeight;
      targets.forEach((t) => {
        const r = t.el.getBoundingClientRect(); const c = r.top + r.height / 2;
        const p = (c - vh / 2) / vh;          // -1 above, 0 centre, 1 below
        if (Math.abs(p) > 1.5) { t.el.style.transform = ''; return; }
        const y = -p * 60 * t.strength * 10;  // up to ~90px drift
        t.el.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
      });
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req);
    req();
  };

  /* ================================================================== card activation */
  // Each card toggles .m-live when its centre is within the viewport's centre band.
  const cardActivation = () => {
    const sel = '.capability-list article, .question-card, [data-m-card]';
    const cards = [...doc.querySelectorAll(sel)];
    if (!cards.length) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = innerHeight, top = vh * 0.3, bot = vh * 0.72;
      cards.forEach((card) => {
        const r = card.getBoundingClientRect(); const c = r.top + r.height / 2;
        card.classList.toggle('m-live', c >= top && c <= bot);
      });
    };
    const req = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('scroll', req, { passive: true });
    addEventListener('resize', req); req();
  };

  /* ================================================================== marquee strip between sections */
  const addMarquee = () => {
    // Put a single quiet strip between the big wind and context sections, reusing Kite's own
    // commitment line: "Agreed scope · Fixed price · Extra effort is on us."
    const after = doc.querySelector('#wind'); if (!after) return;
    if (doc.querySelector('.m-marquee')) return;
    const bar = doc.createElement('div'); bar.className = 'm-marquee'; bar.setAttribute('aria-hidden', 'true');
    const line = ['Agreed scope', 'Fixed price', 'Extra effort is on us', 'Control the change', 'Agreed scope', 'Fixed price', 'Extra effort is on us', 'Control the change'];
    const track = doc.createElement('div'); track.className = 'm-marquee-track';
    // doubled so the loop wraps seamlessly
    const words = line.concat(line);
    words.forEach((t) => { const s = doc.createElement('span'); s.textContent = t; track.appendChild(s); });
    bar.appendChild(track); after.after(bar);
  };

  /* ================================================================== init */
  const init = () => {
    splitHeadings();
    doc.querySelectorAll('main section').forEach((sec) => {
      if (sec.id === 'hero') return;
      sec.dataset.mSection = '1';
      // paragraphs marked for reveal
      sec.querySelectorAll('.section-heading p, .section-heading + p, p.intro, p.lead').forEach((p) => p.dataset.mReveal = '1');
      observe(sec, revealSection);
    });
    addWind();
    addMarquee();
    parallax();
    cardActivation();
    smoothScroll();
  };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
