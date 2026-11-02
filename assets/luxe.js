/* NOIR ATELIER — luxe motion layer (Lenis + GSAP ScrollTrigger, graceful fallback) */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  // 1. Smooth scroll
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.4, syncTouch: false, prevent: function (n) { var h = n.closest && n.closest('[data-hscroll]'); return !!(h && h.scrollWidth > h.clientWidth + 2); } });
    window.__lenis = lenis;
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) { var id = a.getAttribute('href'); if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -80 }); } });
    });
  }
  var hasGsap = !reduce && window.gsap && window.ScrollTrigger;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(function (t) { lenis.raf(t * 1000); }); gsap.ticker.lagSmoothing(0); }
  } else if (lenis) { (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0); }
  // 2. Reveals (clip-path images, line masks, staggered fade-ups)
  $$('[data-lx-stagger]').forEach(function (g) { [].slice.call(g.children).forEach(function (c, i) { c.classList.add('lx-up'); c.style.setProperty('--i', i); }); });
  $$('[data-lx-lines]').forEach(function (g) { $$('.lx-line', g).forEach(function (l, i) { l.style.setProperty('--i', i); }); });
  var targets = $$('.lx-clip, .lx-up, [data-lx-lines]');
  if (reduce || !('IntersectionObserver' in window)) targets.forEach(function (t) { t.classList.add('is-in'); });
  else {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
    targets.forEach(function (t) { io.observe(t); });
  }
  // 2b. Wipe reveals: observe the parent (clip-path on the target hides it from IntersectionObserver)
  $$('.reveal-wipe').forEach(function (w) {
    if (reduce || !('IntersectionObserver' in window)) { w.classList.add('is-visible'); return; }
    var o = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { w.classList.add('is-visible'); o.disconnect(); } }, { threshold: .1 });
    o.observe(w.parentElement);
  });
  // 3. Parallax
  if (hasGsap) {
    $$('[data-speed]').forEach(function (el) {
      var s = parseFloat(el.getAttribute('data-speed')) || .15;
      gsap.fromTo(el, { yPercent: -s * 50 }, { yPercent: s * 50, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.section-title').forEach(function (t) { gsap.fromTo(t, { letterSpacing: '.04em' }, { letterSpacing: '-.02em', ease: 'none', scrollTrigger: { trigger: t, start: 'top 95%', end: 'top 45%', scrub: true } }); });
  }
  // 4. Counters
  function count(el) {
    var end = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '', dur = 1800, t0 = null;
    if (reduce) { el.textContent = end.toLocaleString() + suf; return; }
    (function step(t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 4))); el.textContent = v.toLocaleString() + suf; if (p < 1) requestAnimationFrame(step); })(performance.now());
  }
  var cio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } }); }, { threshold: .5 }) : null;
  $$('[data-count]').forEach(function (c) { cio ? cio.observe(c) : count(c); });
  // 5. Sticky split-scroll story
  $$('[data-lx-story]').forEach(function (story) {
    var imgs = $$('.lx-story__media img', story), steps = $$('.lx-story__step', story);
    function set(i) { imgs.forEach(function (im, k) { im.classList.toggle('is-active', k === i); }); steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); }); }
    set(0);
    if (!('IntersectionObserver' in window)) return;
    var sio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) set(steps.indexOf(e.target)); }); }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { sio.observe(s); });
  });
  // 6. Smooth horizontal card scrollers: drag with momentum + wheel-to-horizontal
  function hscroll(el) {
    el.setAttribute('data-hscroll', '');
    var down = false, sx = 0, sl = 0, v = 0, lx = 0, lt = 0, raf = 0, moved = 0;
    el.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || el.scrollWidth <= el.clientWidth + 2) return; down = true; moved = 0; sx = lx = e.clientX; sl = el.scrollLeft; lt = performance.now(); v = 0; cancelAnimationFrame(raf); });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) { el.classList.add('is-dragging'); moved = 1; } el.scrollLeft = sl - dx; var t = performance.now(); v = (lx - e.clientX) / Math.max(1, t - lt) * 16; lx = e.clientX; lt = t; });
    window.addEventListener('pointerup', function () { if (!down) return; down = false;
      (function glide() { v *= 0.93; el.scrollLeft += v; if (Math.abs(v) > 0.4) raf = requestAnimationFrame(glide); else el.classList.remove('is-dragging'); })(); });
    el.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  }
  var mqMobile = window.matchMedia('(max-width: 749px)');
  $$('#shop .product-grid, .lx-insta__grid').forEach(function (g) { if (mqMobile.matches) hscroll(g); });
  $$('.lookbook.is-static .lookbook__track').forEach(hscroll);
  // 3D reviews: swipe/drag
  $$('[data-carousel3d]').forEach(function (c) {
    var x0 = null, root = c.parentElement;
    c.addEventListener('pointerdown', function (e) { x0 = e.clientX; });
    c.addEventListener('pointerup', function (e) { if (x0 === null) return; var dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) { var b = root.querySelector(dx < 0 ? '[data-next]' : '[data-prev]'); if (b) b.click(); } });
  });
  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
