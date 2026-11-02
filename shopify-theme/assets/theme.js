/* =====================================================================
   NOIR ATELIER — theme.js
   Vanilla JavaScript only. No frameworks or libraries.
   Motion: loader, custom cursor, magnetic + expensive buttons,
   IntersectionObserver reveals, glass header, scroll progress,
   3D tilt, horizontal lookbook, countdown, announcement rotation,
   liquid hover swap, 3D testimonial carousel.
   Shop: Shopify AJAX Cart API drawer, flying image, variant picker,
   predictive search, filters and sort, cart page.
   ===================================================================== */
(function () {
  'use strict';
  /* ---------- Shared helpers ---------- */
  var doc = document;
  var body = doc.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var state = { menuOpen: false, searchOpen: false, cartOpen: false, cart: null };
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    (children || []).forEach(function (c) {
      if (typeof c === 'string') node.appendChild(doc.createTextNode(c)); else if (c) node.appendChild(c);
    });
    return node;
  }
  function formatMoney(cents) {
    var format = body.getAttribute('data-money-format') || '{{amount}}';
    var amount = (Number(cents) / 100).toFixed(2);
    return format.replace(/\{\{\s*\w+\s*\}\}/, amount);
  }
  function onFrame(fn) {
    var q = false;
    return function () { if (q) return; q = true; requestAnimationFrame(function () { q = false; fn(); }); };
  }

  /* ---------- 1. Page loader ---------- */
  function initLoader() {
    var loader = $('#loader');
    if (!loader) { body.classList.add('is-loaded'); return; }
    var letters = $('.loader__letters', loader);
    if (letters && !letters.children.length) {
      'NOIR ATELIER'.split('').forEach(function (ch, i) {
        var s = el('span', { class: 'loader__letter', style: '--i:' + i }, [ch === ' ' ? '\u00a0' : ch]);
        letters.appendChild(s);
      });
    }
    if (reduceMotion) { loader.classList.add('is-done'); body.classList.add('is-loaded'); return; }
    var lifted = false;
    var lift = function () {
      if (lifted) return; lifted = true;
      loader.classList.add('is-leaving');
      body.classList.add('is-loaded');
      setTimeout(function () { loader.classList.add('is-done'); }, 1300);
    };
    window.addEventListener('load', function () { setTimeout(lift, 1100); });
    setTimeout(lift, 3000);
  }

  /* ---------- 2. Custom cursor ---------- */
  function initCursor() {
    var cursor = $('.cursor');
    if (!cursor || reduceMotion || !finePointer) { if (cursor) cursor.remove(); body.classList.remove('has-cursor'); return; }
    var dot = $('.cursor__dot', cursor), ring = $('.cursor__ring', cursor);
    var mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0) translate(-50%,-50%)';
      cursor.style.opacity = '1';
    }, { passive: true });
    (function animate() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(animate);
    })();
    doc.addEventListener('pointerover', function (e) {
      var t = e.target;
      cursor.classList.toggle('is-view', !!t.closest('[data-cursor="view"], .product-card__media'));
      cursor.classList.toggle('is-link', !!t.closest('a, button, input, select, label'));
    });
    doc.addEventListener('pointerleave', function () { cursor.style.opacity = '0'; });
  }

  /* ---------- 3. Magnetic + expensive buttons ---------- */
  function initButtons() {
    doc.addEventListener('pointerenter', function (e) {
      var btn = e.target.closest && e.target.closest('.btn');
      if (!btn || e.target !== btn) return;
      var r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', (e.clientX - r.left) + 'px');
      btn.style.setProperty('--y', (e.clientY - r.top) + 'px');
    }, true);
    doc.addEventListener('pointerout', function (e) {
      var btn = e.target.closest && e.target.closest('.btn');
      if (!btn || btn.contains(e.relatedTarget)) return;
      var r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', (e.clientX - r.left) + 'px');
      btn.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
    if (reduceMotion || !finePointer) return;
    $$('[data-magnetic]').forEach(function (btn) {
      var label = $('.btn__label', btn);
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        btn.style.transform = 'translate3d(' + x * 0.3 + 'px,' + y * 0.4 + 'px,0)';
        if (label) label.style.transform = 'translate3d(' + x * 0.12 + 'px,' + y * 0.15 + 'px,0)';
      });
      btn.addEventListener('pointerleave', function () {
        btn.style.transform = ''; if (label) label.style.transform = '';
      });
    });
  }

  /* ---------- 4. Scroll reveals ---------- */
  function initReveals() {
    var targets = $$('[data-reveal], .reveal-wipe');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('is-visible'); }); return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(function (t) {
      if (t.closest('[data-hero]')) return;
      io.observe(t);
    });
    // Hero reveals after the loader curtain lifts
    var hero = $('[data-hero] [data-reveal]');
    if (hero) {
      var show = function () { hero.classList.add('is-visible'); };
      if (body.classList.contains('is-loaded')) show();
      else new MutationObserver(function (m, o) { if (body.classList.contains('is-loaded')) { setTimeout(show, 350); o.disconnect(); } }).observe(body, { attributes: true });
    }
  }

  /* ---------- 5. Glass header hide/show ---------- */
  function initHeader() {
    var header = $('[data-header]');
    if (!header) return;
    var last = window.scrollY;
    window.addEventListener('scroll', onFrame(function () {
      var y = window.scrollY;
      var hide = y > last && y > 300 && !state.menuOpen && !state.searchOpen;
      header.classList.toggle('is-hidden', hide);
      last = y;
    }), { passive: true });
  }

  /* ---------- 6. Scroll progress + back to top ring ---------- */
  function initScrollProgress() {
    var bar = $('.scroll-progress__bar'), top = $('[data-to-top]');
    var circle = top && $('circle', top);
    var update = onFrame(function () {
      var max = doc.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
      if (bar) bar.style.transform = 'scaleX(' + p + ')';
      if (top) {
        top.classList.toggle('is-shown', window.scrollY > 600);
        circle.style.setProperty('--off', String(151 - 151 * p));
      }
    });
    window.addEventListener('scroll', update, { passive: true });
    update();
    if (top) top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); });
  }

  /* ---------- 7. 3D tilt cards with glare ---------- */
  function initTilt() {
    if (reduceMotion || !finePointer) return;
    $$('[data-tilt]').forEach(function (card) {
      var glare = $('.category-card__glare', card);
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = 'perspective(1000px) rotateX(' + (0.5 - py) * 10 + 'deg) rotateY(' + (px - 0.5) * 12 + 'deg)';
        if (glare) { card.style.setProperty('--gx', px * 100 + '%'); card.style.setProperty('--gy', py * 100 + '%'); }
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- 8. Horizontal lookbook (scroll-driven) ---------- */
  function initLookbook() {
    $$('[data-lookbook]').forEach(function (section) {
      var track = $('[data-lookbook-track]', section), counter = $('[data-lookbook-counter]', section);
      if (!track) return;
      if (reduceMotion) { section.classList.add('is-static'); return; }
      var items = track.children.length;
      var dist = 0;
      var measure = function () {
        dist = Math.max(0, track.scrollWidth - window.innerWidth);
        section.style.setProperty('--lookbook-h', (window.innerHeight + dist) + 'px');
      };
      var update = onFrame(function () {
        var r = section.getBoundingClientRect();
        var p = dist ? clamp(-r.top / dist, 0, 1) : 0;
        track.style.transform = 'translate3d(' + (-p * dist) + 'px,0,0)';
        if (counter) counter.textContent = ('0' + (Math.round(p * (items - 1)) + 1)).slice(-2) + ' / ' + ('0' + items).slice(-2);
      });
      measure(); update();
      window.addEventListener('resize', function () { measure(); update(); });
      window.addEventListener('load', function () { measure(); update(); });
      window.addEventListener('scroll', update, { passive: true });
    });
  }

  /* ---------- 9. Countdown ---------- */
  function initCountdowns() {
    $$('[data-countdown]').forEach(function (box) {
      var end = Date.parse(box.getAttribute('data-end') || '');
      if (isNaN(end)) {
        var key = 'noir-countdown-end', saved = Number(localStorage.getItem(key));
        end = saved > Date.now() ? saved : Date.now() + Number(box.getAttribute('data-days') || 3) * 864e5;
        try { localStorage.setItem(key, String(end)); } catch (e) {}
      }
      var units = { d: $('[data-unit="d"]', box), h: $('[data-unit="h"]', box), m: $('[data-unit="m"]', box), s: $('[data-unit="s"]', box) };
      var pad = function (n) { return ('0' + n).slice(-2); };
      var tick = function () {
        var left = Math.max(0, end - Date.now());
        units.d.textContent = pad(Math.floor(left / 864e5));
        units.h.textContent = pad(Math.floor(left / 36e5) % 24);
        units.m.textContent = pad(Math.floor(left / 6e4) % 60);
        units.s.textContent = pad(Math.floor(left / 1e3) % 60);
      };
      tick(); setInterval(tick, 1000);
    });
  }

  /* ---------- 10. Announcement rotation ---------- */
  function initAnnouncement() {
    var bar = $('[data-announcement]');
    if (!bar) return;
    var items = $$('.announcement__item', bar), i = 0;
    if (items.length < 2) return;
    setInterval(function () {
      items[i].classList.remove('is-active'); i = (i + 1) % items.length; items[i].classList.add('is-active');
    }, 4000);
  }

  /* ---------- 11. Mobile menu ---------- */
  function initMobileMenu() {
    var toggle = $('[data-menu-toggle]'), menu = $('[data-mobile-menu]');
    if (!toggle || !menu) return;
    var set = function (open) {
      state.menuOpen = open;
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      toggle.setAttribute('aria-expanded', String(open));
      body.classList.toggle('menu-open', open);
      body.classList.toggle('is-locked', open);
    };
    toggle.addEventListener('click', function () { set(!state.menuOpen); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.menuOpen) set(false); });
  }

  /* ---------- 12. Liquid hover image swap ---------- */
  function initLiquidHover() {
    doc.addEventListener('pointerover', function (e) {
      var media = e.target.closest && e.target.closest('.product-card__media');
      if (!media || media.contains(e.relatedTarget) || media._liquid) return;
      var hover = $('.product-card__img--hover', media);
      if (!hover) return;
      var r = media.getBoundingClientRect();
      media.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      media.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
      animateRadius(media, 150);
    });
    doc.addEventListener('pointerout', function (e) {
      var media = e.target.closest && e.target.closest('.product-card__media');
      if (!media || media.contains(e.relatedTarget)) return;
      animateRadius(media, 0);
    });
    function animateRadius(media, to) {
      var from = parseFloat(media.style.getPropertyValue('--r')) || 0;
      if (reduceMotion) { media.style.setProperty('--r', to + '%'); return; }
      var start = performance.now(), dur = 900;
      media.classList.add('is-liquid');
      cancelAnimationFrame(media._raf);
      (function step(now) {
        var t = clamp((now - start) / dur, 0, 1), k = 1 - Math.pow(1 - t, 3);
        media.style.setProperty('--r', (from + (to - from) * k) + '%');
        if (t < 1) media._raf = requestAnimationFrame(step); else media.classList.remove('is-liquid');
      })(start);
    }
  }

  /* ---------- 13. 3D testimonial carousel ---------- */
  function initCarousel3d() {
    $$('[data-carousel3d]').forEach(function (wrap) {
      var ring = $('[data-ring]', wrap), cards = $$('.review', ring);
      var n = cards.length, idx = 0;
      if (!n) return;
      var layout = function () {
        var w = ring.offsetWidth, radius = Math.round((w / 2) / Math.tan(Math.PI / n)) + 40;
        cards.forEach(function (c, i) { c.style.transform = 'rotateY(' + (360 / n) * i + 'deg) translateZ(' + radius + 'px)'; });
        ring.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + (-360 / n) * idx + 'deg)';
      };
      var nav = wrap.parentNode;
      var prev = $('[data-prev]', nav), next = $('[data-next]', nav);
      if (prev) prev.addEventListener('click', function () { idx--; layout(); });
      if (next) next.addEventListener('click', function () { idx++; layout(); });
      var timer = setInterval(function () { idx++; layout(); }, 5000);
      wrap.addEventListener('pointerenter', function () { clearInterval(timer); });
      layout(); window.addEventListener('resize', layout);
    });
  }

  /* ---------- 14. Toast ---------- */
  var toastTimer = null;
  function toast(message) {
    var t = $('[data-toast]');
    if (!t) return;
    t.textContent = message;
    t.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-shown'); }, 2600);
  }

  /* ---------- 15. Flying image to cart ---------- */
  function flyToCart(img) {
    var target = $('[data-cart-count]');
    if (!img || !target || reduceMotion || body.getAttribute('data-animations') === '') return Promise.resolve();
    return new Promise(function (resolve) {
      var a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
      var clone = img.cloneNode();
      clone.className = 'fly-img'; clone.removeAttribute('loading');
      clone.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px';
      body.appendChild(clone);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
          clone.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0) scale(0.08) rotate(20deg)';
          clone.style.opacity = '0.4';
        });
      });
      setTimeout(function () { clone.remove(); resolve(); }, 900);
    });
  }

  /* ---------- 16. Drawer open/close ---------- */
  function setDrawer(open) {
    var d = $('[data-cart-drawer]'), o = $('[data-drawer-overlay]');
    if (!d) return;
    state.cartOpen = open;
    d.classList.toggle('is-open', open); d.setAttribute('aria-hidden', String(!open));
    if (o) o.classList.toggle('is-open', open);
    body.classList.toggle('is-locked', open);
  }
  function initDrawer() {
    $$('[data-cart-toggle]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); if (state.menuOpen) { var mt = $('[data-menu-toggle]'); mt && mt.click(); } setDrawer(true); });
    });
    $$('[data-cart-close], [data-drawer-overlay]').forEach(function (b) { b.addEventListener('click', function () { setDrawer(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.cartOpen) setDrawer(false); });
  }

  /* ---------- 17. Newsletter ---------- */
  function initNewsletter() {
    $$('[data-newsletter]').forEach(function (form) {
      if (form.hasAttribute('data-native')) return;
      var msg = $('[data-newsletter-success]', form.parentNode);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = $('input[type="email"]', form);
        var ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value);
        msg.textContent = ok ? 'Welcome to the Atelier — your code NOIR10 is on its way.' : 'Please enter a valid email address.';
        msg.classList.add('is-shown');
        if (ok) form.reset();
      });
    });
  }

  /* ---------- Cart rendering (shared) ---------- */
  function renderCart(cart, handlers) {
    var list = $('[data-cart-items]'), total = $('[data-cart-total]'), count = $$('[data-cart-count]');
    if (!list) return;
    list.textContent = '';
    if (!cart.items.length) list.appendChild(el('li', { class: 'cart-drawer__empty' }, ['Your bag is empty.']));
    cart.items.forEach(function (item, i) {
      var minus = el('button', { type: 'button', 'aria-label': 'Decrease' }, ['−']);
      var plus = el('button', { type: 'button', 'aria-label': 'Increase' }, ['+']);
      var remove = el('button', { type: 'button', class: 'cart-item__remove' }, ['Remove']);
      minus.addEventListener('click', function () { handlers.change(i, item.quantity - 1); });
      plus.addEventListener('click', function () { handlers.change(i, item.quantity + 1); });
      remove.addEventListener('click', function () { handlers.change(i, 0); });
      list.appendChild(el('li', { class: 'cart-item' }, [
        el('img', { src: item.image, alt: item.title, width: '80', height: '100' }),
        el('div', null, [
          el('div', { class: 'cart-item__title' }, [item.title]),
          el('div', { class: 'cart-item__meta' }, [item.variant || '']),
          el('div', { class: 'qty' }, [minus, el('span', null, [String(item.quantity)]), plus]),
          el('div', null, [remove])
        ]),
        el('div', { class: 'price' }, [formatMoney(item.line_price)])
      ]));
    });
    if (total) total.textContent = formatMoney(cart.total_price);
    count.forEach(function (c) { c.textContent = cart.item_count; c.classList.remove('is-bump'); void c.offsetWidth; c.classList.add('is-bump'); });
    var bar = $('[data-shipping-bar]');
    if (bar) {
      var threshold = Number(body.getAttribute('data-free-threshold') || 0) * 100;
      var left = threshold - cart.total_price;
      $('.shipping-bar__fill', bar).style.setProperty('--p', threshold ? clamp(cart.total_price / threshold, 0, 1) : 1);
      $('[data-shipping-text]', bar).textContent = left > 0 ? 'You are ' + formatMoney(left) + ' away from free shipping' : 'You have unlocked complimentary shipping ✦';
    }
  }

  function bootMotion() {
    initLoader(); initCursor(); initButtons(); initReveals(); initHeader(); initScrollProgress();
    initTilt(); initLookbook(); initCountdowns(); initAnnouncement(); initMobileMenu();
    initLiquidHover(); initCarousel3d(); initDrawer(); initNewsletter();
  }
  /* ---------- Shopify: predictive search (/search/suggest.json) ---------- */
  function initPredictiveSearch() {
    var toggle = $('[data-search-toggle]'), panel = $('[data-search-panel]');
    if (!toggle || !panel) return;
    var input = $('[data-search-input]', panel), results = $('[data-search-results]', panel);
    var form = $('[data-search-form]', panel), closeButton = $('[data-search-close]', panel);
    var controller = null, debounce = null;
    var openSearch = function () {
      state.searchOpen = true; panel.hidden = false; toggle.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(function () { panel.classList.add('is-open'); input.focus(); });
    };
    var closeSearch = function () {
      state.searchOpen = false; panel.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false');
      setTimeout(function () { if (!state.searchOpen) panel.hidden = true; }, 400);
    };
    var renderResults = function (query, data) {
      results.textContent = '';
      var items = (data && data.resources && data.resources.results && data.resources.results.products) || [];
      if (!items.length) { results.appendChild(el('p', null, ['No results for “' + query + '”'])); return; }
      items.forEach(function (p) {
        results.appendChild(el('a', { class: 'predictive-item', href: p.url }, [
          p.image ? el('img', { src: p.image, alt: '', width: '56', height: '70', loading: 'lazy' }) : el('span'),
          el('span', { class: 'predictive-item__title' }, [p.title]),
          el('span', { class: 'predictive-item__price' }, [formatMoney(Math.round(parseFloat(p.price) * 100))])
        ]));
      });
      results.appendChild(el('a', { class: 'btn btn--ghost btn--small predictive-all', href: '/search?q=' + encodeURIComponent(query) + '&type=product' }, ['View all']));
    };
    var fetchSuggestions = function (query) {
      if (controller) controller.abort();
      controller = new AbortController();
      var url = '/search/suggest.json?q=' + encodeURIComponent(query) + '&resources[type]=product&resources[limit]=6&resources[options][unavailable_products]=last';
      fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (d) { renderResults(query, d); })
        .catch(function (e) { if (e.name !== 'AbortError') results.textContent = ''; });
    };
    toggle.addEventListener('click', function () { state.searchOpen ? closeSearch() : openSearch(); });
    if (closeButton) closeButton.addEventListener('click', closeSearch);
    if (form) form.addEventListener('submit', function (e) { if (!input.value.trim()) e.preventDefault(); });
    input.addEventListener('input', function () {
      clearTimeout(debounce);
      var q = input.value.trim();
      if (q.length < 2) { results.textContent = ''; return; }
      debounce = setTimeout(function () { fetchSuggestions(q); }, 220);
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.searchOpen) closeSearch(); });
  }

  /* ---------- Collection filters (mobile drawer) and sorting ---------- */
  function initCollectionControls() {
    var toggle = $('[data-filter-toggle]'), panel = $('[data-filters]');
    if (panel && toggle) {
      var overlay = el('div', { class: 'collection__filters-overlay' });
      body.appendChild(overlay);
      var closeButton = $('[data-filter-close]', panel);
      var openF = function () { panel.classList.add('is-open'); overlay.classList.add('is-open'); toggle.setAttribute('aria-expanded', 'true'); body.classList.add('is-locked'); };
      var closeF = function () { panel.classList.remove('is-open'); overlay.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); body.classList.remove('is-locked'); };
      toggle.addEventListener('click', function () { panel.classList.contains('is-open') ? closeF() : openF(); });
      overlay.addEventListener('click', closeF);
      if (closeButton) closeButton.addEventListener('click', closeF);
    }
    var sortSelect = $('[data-sort-select]');
    if (sortSelect) sortSelect.addEventListener('change', function () {
      var url = new URL(window.location.href);
      url.searchParams.set('sort_by', sortSelect.value); url.searchParams.delete('page');
      window.location.href = url.toString();
    });
  }

  /* ---------- Shopify AJAX cart (Cart API) ---------- */
  var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
  function cartRequest(path, payload) {
    var opts = payload ? { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) } : { headers: { Accept: 'application/json' } };
    return fetch(root + path, opts).then(function (r) {
      return r.json().then(function (d) { if (!r.ok) throw new Error(d.description || d.message || 'Cart error'); return d; });
    });
  }
  function mapCart(c) {
    state.cart = c;
    return {
      item_count: c.item_count, total_price: c.total_price,
      items: c.items.map(function (i) {
        return { key: i.key, title: i.product_title, variant: i.variant_title || '', quantity: i.quantity, line_price: i.final_line_price, image: i.image ? i.image.replace(/(\.[a-z]+)(\?|$)/i, '$1$2') + (i.image.indexOf('?') > -1 ? '&' : '?') + 'width=200' : '' };
      })
    };
  }
  function refreshCart() {
    return cartRequest('cart.js').then(function (c) { renderCart(mapCart(c), { change: changeLine }); return c; });
  }
  function changeLine(index, quantity) {
    return cartRequest('cart/change.js', { line: index + 1, quantity: Math.max(0, quantity) })
      .then(function (c) { renderCart(mapCart(c), { change: changeLine }); if (template === 'cart') location.reload(); })
      .catch(function (e) { toast(e.message); });
  }
  var template = (body.className.match(/template-(\w+)/) || [])[1];

  function initProductForms() {
    doc.addEventListener('submit', function (e) {
      var form = e.target.closest('[data-product-form]');
      if (!form || e.submitter && e.submitter.name === 'checkout') return;
      e.preventDefault();
      var btn = $('[type="submit"]', form);
      if (btn) btn.disabled = true;
      var data = new FormData(form);
      var payload = { items: [{ id: Number(data.get('id')), quantity: Number(data.get('quantity') || 1) }] };
      var scope = form.closest('.product-card, [data-product]');
      var image = scope && $('.product-card__img, [data-product-image]', scope);
      cartRequest('cart/add.js', payload)
        .then(function (res) { return flyToCart(image).then(function () { return res; }); })
        .then(function (res) {
          return refreshCart().then(function () { setDrawer(true); toast((res.items && res.items[0] ? res.items[0].product_title : 'Item') + ' added to your bag'); });
        })
        .catch(function (err) { toast(err.message); })
        .then(function () { if (btn) btn.disabled = false; });
    });
  }

  /* ---------- Product page: variant picker, gallery, size guide ---------- */
  function initProductPage() {
    $$('[data-product]').forEach(function (wrap) {
      var json = $('[data-product-json]', wrap);
      if (!json) return;
      var product = JSON.parse(json.textContent);
      var idInput = $('input[name="id"]', wrap), price = $('[data-price]', wrap), submit = $('[data-add-button]', wrap);
      var update = function () {
        var chosen = $$('[data-option-index]', wrap).filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
        var v = product.variants.filter(function (x) { return x.options.every(function (o, n) { return o === chosen[n]; }); })[0];
        if (!v) { submit.disabled = true; $('.btn__label', submit).textContent = submit.getAttribute('data-unavailable'); return; }
        idInput.value = v.id;
        submit.disabled = !v.available;
        $('.btn__label', submit).textContent = v.available ? submit.getAttribute('data-add') : submit.getAttribute('data-soldout');
        if (price) {
          price.textContent = '';
          if (v.compare_at_price > v.price) { price.classList.add('price--sale'); price.appendChild(el('s', null, [formatMoney(v.compare_at_price)])); price.appendChild(el('ins', null, [formatMoney(v.price)])); }
          else { price.classList.remove('price--sale'); price.appendChild(doc.createTextNode(formatMoney(v.price))); }
        }
        if (v.featured_image) { var main = $('[data-product-image]', wrap); if (main) { main.src = v.featured_image.src + (v.featured_image.src.indexOf('?') > -1 ? '&' : '?') + 'width=1200'; main.removeAttribute('srcset'); } }
        var url = new URL(location.href); url.searchParams.set('variant', v.id); history.replaceState(null, '', url.toString());
      };
      $$('[data-option-index]', wrap).forEach(function (i) { i.addEventListener('change', update); });
    });
    $$('[data-modal-open]').forEach(function (b) {
      var modal = doc.getElementById(b.getAttribute('data-modal-open'));
      if (!modal) return;
      b.addEventListener('click', function () { modal.hidden = false; body.classList.add('is-locked'); });
      modal.addEventListener('click', function (e) { if (e.target === modal || e.target.closest('[data-modal-close]')) { modal.hidden = true; body.classList.remove('is-locked'); } });
    });
    $$('[data-thumb]').forEach(function (t) {
      t.addEventListener('click', function () { var main = $('[data-product-image]'); if (main) { main.src = t.getAttribute('data-thumb'); main.removeAttribute('srcset'); } });
    });
  }

  /* ---------- Cart page quantity inputs ---------- */
  function initCartPage() {
    $$('[data-cart-qty]').forEach(function (input) {
      input.addEventListener('change', function () { changeLine(Number(input.getAttribute('data-line')) - 1, Number(input.value)); });
    });
  }

  /* ---------- Boot ---------- */
  bootMotion();
  initPredictiveSearch();
  initCollectionControls();
  initProductForms();
  initProductPage();
  initCartPage();
  refreshCart().catch(function () {});
  doc.documentElement.classList.remove('no-js');
})();
