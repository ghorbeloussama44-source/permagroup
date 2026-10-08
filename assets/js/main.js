/* PermaGroup — interactions communes (sans dépendance) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- En-tête : ombre au scroll ---------- */
  var hdr = $('.hdr');
  var onScroll = function () { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 20); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var burger = $('.burger');
  var mobile = window.matchMedia('(max-width: 960px)');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    });
    $$('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (a.parentElement.classList.contains('nav__item') && mobile.matches) return;
        document.body.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
  $$('.nav__item > .nav__link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!mobile.matches) return;
      e.preventDefault();
      var open = link.parentElement.classList.toggle('is-open');
      link.setAttribute('aria-expanded', open);
    });
  });

  /* ---------- Balayage tactile ---------- */
  function swipe(el, onLeft, onRight) {
    var x0 = null, y0 = null;
    el.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { (dx < 0 ? onLeft : onRight)(); }
      x0 = null;
    }, { passive: true });
  }

  /* ---------- Diaporama générique (fondu) ---------- */
  $$('[data-slider]').forEach(function (root) {
    var slides = $$('[data-slide]', root);
    if (slides.length < 2) return;
    var dotsBox = $('[data-dots]', root);
    var i = 0, timer = null, delay = parseInt(root.getAttribute('data-autoplay'), 10) || 0;
    var dots = slides.map(function (_, n) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Afficher l’élément ' + (n + 1));
      b.addEventListener('click', function () { go(n); restart(); });
      if (dotsBox) dotsBox.appendChild(b);
      return b;
    });
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        var on = k === i;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', !on);
        $$('a, button', s).forEach(function (el) { el.tabIndex = on ? 0 : -1; });
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-current', k === i); });
    }
    function restart() {
      if (!delay || reduce) return;
      clearInterval(timer);
      timer = setInterval(function () { go(i + 1); }, delay);
    }
    var prev = $('[data-prev]', root), next = $('[data-next]', root);
    if (prev) prev.addEventListener('click', function () { go(i - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(i + 1); restart(); });
    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', restart);
    root.addEventListener('focusin', function () { clearInterval(timer); });
    swipe(root, function () { go(i + 1); restart(); }, function () { go(i - 1); restart(); });
    go(0); restart();
  });

  /* ---------- Carrousel chirurgiens (défilement par pages) ---------- */
  $$('[data-carousel]').forEach(function (root) {
    var track = $('.carousel__track', root);
    var items = $$('.doc', track);
    var dotsBox = $('[data-dots]', root);
    var page = 0;
    if (!items.length) return;
    function perView() {
      var w = items[0].getBoundingClientRect().width;
      return Math.max(1, Math.floor((track.parentElement.clientWidth + 12) / (w + 12) + 0.05));
    }
    function pages() { return Math.max(1, Math.ceil(items.length / perView())); }
    function render() {
      var pv = perView(), max = pages() - 1;
      page = Math.min(Math.max(page, 0), max);
      var first = Math.max(0, Math.min(page * pv, items.length - pv));
      track.style.transform = 'translateX(' + (-items[first].offsetLeft) + 'px)';
      items.forEach(function (it, k) {
        var vis = k >= first && k < first + pv;
        $$('a', it).forEach(function (a) { a.tabIndex = vis ? 0 : -1; });
      });
      if (dotsBox) {
        if (dotsBox.children.length !== max + 1) {
          dotsBox.innerHTML = '';
          for (var n = 0; n <= max; n++) {
            var b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('aria-label', 'Page ' + (n + 1));
            b.addEventListener('click', (function (p) { return function () { page = p; render(); }; })(n));
            dotsBox.appendChild(b);
          }
        }
        Array.prototype.forEach.call(dotsBox.children, function (d, k) { d.setAttribute('aria-current', k === page); });
      }
    }
    $('[data-prev]', root).addEventListener('click', function () { page = page <= 0 ? pages() - 1 : page - 1; render(); });
    $('[data-next]', root).addEventListener('click', function () { page = page >= pages() - 1 ? 0 : page + 1; render(); });
    swipe(root, function () { page = Math.min(page + 1, pages() - 1); render(); }, function () { page = Math.max(page - 1, 0); render(); });
    window.addEventListener('resize', render);
    render();
  });

  /* ---------- Apparition au scroll + compteurs ---------- */
  function count(el) {
    var target = parseInt(el.getAttribute('data-count'), 10), suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suf; return; }
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(count);
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(function (el, k) {
      el.style.transitionDelay = (k % 3) * 80 + 'ms';
      io.observe(el);
    });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Année du copyright ---------- */
  var y = $('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
