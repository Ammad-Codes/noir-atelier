/* NOIR ATELIER — luxe motion layer (Lenis + GSAP ScrollTrigger, graceful fallback) */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  // 1. Smooth scroll
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
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
  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
})();
