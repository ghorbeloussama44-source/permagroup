/* Permagroup — interactions : parallaxe, révélations, curseur, magnétisme, WebGL */
(function () {
  'use strict';

  var d = document, w = window, root = d.documentElement;
  var reduce = w.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var store = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Images manquantes : repli élégant au lieu de l'icône cassée ---------- */
  function broken(img) {
    img.classList.add('is-broken');
    var g = img.closest('.gallery');
    if (g && $$('img', g).every(function (i) { return i.classList.contains('is-broken'); })) {
      var sec = g.closest('section'); if (sec) sec.hidden = true;
    }
  }
  $$('img').forEach(function (img) {
    if (img.complete && img.getAttribute('src') && !img.naturalWidth) broken(img);
    else img.addEventListener('error', function () { broken(img); });
  });

  /* ---------- Préchargeur (1re visite) ---------- */
  var first = !store.get('perma_seen') && !reduce;
  store.set('perma_seen', '1');
  var introDone = false;
  function finishIntro() {
    if (introDone) return;
    introDone = true;
    root.classList.remove('is-first', 'is-enter', 'is-loading');
    root.classList.add('is-ready');
    var pre = $('.pre');
    if (pre) setTimeout(function () { pre.remove(); }, 1400);
  }
  if (first) {
    root.classList.add('is-loading');
    var pre = d.createElement('div');
    pre.className = 'pre';
    pre.innerHTML = '<div class="pre__logo">Perma<span>.</span>doctor</div>' +
      '<div class="pre__tag">La renaissance de votre corps</div>' +
      '<div class="pre__n"><b>0</b>%</div><div class="pre__bar"><i></i></div>';
    d.body.appendChild(pre);
    root.classList.remove('is-first');
    var nEl = $('b', pre), bar = $('i', pre), t0 = performance.now(), D = 1500;
    (function tick(now) {
      var k = clamp((now - t0) / D, 0, 1), e = 1 - Math.pow(1 - k, 3);
      nEl.textContent = Math.round(e * 100);
      bar.style.transform = 'scaleX(' + e + ')';
      if (k < 1) requestAnimationFrame(tick);
      else { pre.classList.add('is-out'); setTimeout(finishIntro, 250); }
    })(t0);
    setTimeout(finishIntro, 5000);  /* garde-fou */
  } else {
    requestAnimationFrame(function () { requestAnimationFrame(finishIntro); });
  }

  /* ---------- Barre de progression + grain ---------- */
  var prog = d.createElement('div'); prog.className = 'progress'; prog.innerHTML = '<i></i>';
  d.body.appendChild(prog);
  var progBar = prog.firstChild;
  var grain = d.createElement('div'); grain.className = 'grain'; grain.setAttribute('aria-hidden', 'true');
  d.body.appendChild(grain);

  /* ---------- Navigation ---------- */
  var nav = $('.nav');
  var hamb = $('.nav__hamb');
  if (hamb) {
    hamb.setAttribute('role', 'button'); hamb.setAttribute('aria-label', 'Menu'); hamb.tabIndex = 0;
    var toggle = function () { root.classList.toggle('menu-open'); };
    hamb.addEventListener('click', toggle);
    hamb.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    $$('.nav__menu a').forEach(function (a) {
      a.addEventListener('click', function () { if (a.getAttribute('href') !== '#') root.classList.remove('menu-open'); });
    });
  }
  $$('.nav__item > .nav__link').forEach(function (a) {
    a.addEventListener('click', function (e) { if (a.getAttribute('href') === '#') { e.preventDefault(); a.parentNode.classList.toggle('open'); } });
  });

  /* ---------- Titres : découpe en mots (masque) ---------- */
  function splitWords(el) {
    var idx = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.nodeValue.split(/(\s+)/), frag = d.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            var o = d.createElement('span'); o.className = 'w';
            var i = d.createElement('span'); i.className = 'w__i'; i.style.setProperty('--i', idx++);
            i.textContent = p; o.appendChild(i); frag.appendChild(o);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.nodeName !== 'BR') walk(n);
      });
    })(el);
    el.classList.add('sw');
  }
  var splitTargets = $$('.phero h1, .hero h1, .section-head h2, .split h2, .cta-band h2, .contact-info h2');
  if (!reduce) splitTargets.forEach(splitWords);

  /* ---------- Révélations ---------- */
  var io = 'IntersectionObserver' in w ? new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: .14, rootMargin: '0px 0px -6% 0px' }) : null;
  function observe(el) { if (io) io.observe(el); else el.classList.add('in'); }

  $$('.reveal').forEach(function (el) {
    var sibs = el.parentNode ? $$(':scope > .reveal', el.parentNode) : [];
    var i = sibs.indexOf(el);
    if (i > 0) el.style.setProperty('--d', (Math.min(i, 6) * 0.09).toFixed(2) + 's');
    observe(el);
  });
  $$('.sw, .eyebrow, .phero__in p, .hero__tag, .hero p, .hero__btns').forEach(function (el) { observe(el); });
  /* H1 de page : révélés dès que le préchargeur est fini */

  /* ---------- Compteurs ---------- */
  var cio = io && new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', t = performance.now(), D = 2000;
      if (reduce) { el.textContent = to + suf; return; }
      (function step(now) {
        var k = clamp((now - t) / D, 0, 1), v = 1 - Math.pow(1 - k, 4);
        el.textContent = Math.round(to * v).toLocaleString('fr-FR') + (k === 1 ? suf : '');
        if (k < 1) requestAnimationFrame(step);
      })(t);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(function (el) { if (cio) cio.observe(el); else el.textContent = el.dataset.count + (el.dataset.suffix || ''); });

  /* ---------- 10 bonnes raisons : numéro épinglé ---------- */
  var why = $('.why');
  if (why) {
    var items = $$('.why__item', why), curEl = $('.why__cur', why), barI = $('.why__bar i', why), active = -1;
    var setWhy = function (k) {
      if (k === active) return;
      var up = k > active; active = k;
      items.forEach(function (it, j) { it.classList.toggle('is-on', j === k); it.classList.toggle('is-past', j < k); });
      if (barI) barI.style.transform = 'scaleY(' + ((k + 1) / items.length) + ')';
      if (!curEl) return;
      var nx = d.createElement('span'); nx.className = 'why__cur ' + (up ? 'from-down' : 'from-up'); nx.textContent = items[k].dataset.n;
      curEl.parentNode.appendChild(nx);
      curEl.classList.add(up ? 'to-up' : 'to-down');
      var old = curEl; setTimeout(function () { old.remove(); }, 700);
      curEl = nx;
    };
    if ('IntersectionObserver' in w) {
      var wio = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) setWhy(items.indexOf(e.target)); });
      }, { rootMargin: '-48% 0px -48% 0px' });
      items.forEach(function (it) { wio.observe(it); });
    }
    setWhy(0);
  }

  /* ---------- Valeurs : accordéon ---------- */
  $$('.vals').forEach(function (list) {
    list.addEventListener('click', function (e) {
      var b = e.target.closest('.val__btn'); if (!b) return;
      var li = b.parentNode, open = !li.classList.contains('is-open');
      $$('.val', list).forEach(function (v) { v.classList.remove('is-open'); $('.val__btn', v).setAttribute('aria-expanded', 'false'); });
      if (open) { li.classList.add('is-open'); b.setAttribute('aria-expanded', 'true'); }
    });
  });

  /* ---------- Avant / après (repris du prototype) ---------- */
  $$('.ba').forEach(function (ba) {
    var bSrc = ba.dataset.before, aSrc = ba.dataset.after;
    if (!bSrc || !aSrc) return;
    ba.innerHTML =
      '<div class="ba__img ba__img--after"><img alt="" draggable="false"></div>' +
      '<div class="ba__img ba__img--before"><img alt="" draggable="false"></div>' +
      '<span class="ba__lbl ba__lbl--b"></span><span class="ba__lbl ba__lbl--a"></span>' +
      '<div class="ba__line" aria-hidden="true"><span class="ba__knob"><i></i><i></i></span></div>' +
      '<input class="ba__range" type="range" min="0" max="100" value="50" aria-label="Comparer : glisser vers la gauche ou la droite">';
    var imgs = $$('img', ba), range = $('.ba__range', ba);
    $('.ba__lbl--b', ba).innerHTML = ba.dataset.labelBefore || 'Avant';
    $('.ba__lbl--a', ba).innerHTML = ba.dataset.labelAfter || 'Après';
    var fail = function () {
      var sec = ba.closest('[data-ba-sec]');
      if (sec) sec.hidden = true; else ba.hidden = true;
    };
    var loaded = 0;
    imgs.forEach(function (im, i) {
      im.addEventListener('load', function () { if (++loaded === 2) ba.classList.add('is-ready'); });
      im.addEventListener('error', fail);
      im.src = i ? bSrc : aSrc;
    });
    var cur = 50, tgt = 50, raf = 0;
    var paint = function () {
      cur = lerp(cur, tgt, reduce ? 1 : .2);
      if (Math.abs(cur - tgt) < .05) cur = tgt;
      ba.style.setProperty('--p', cur.toFixed(2) + '%');
      raf = cur !== tgt ? requestAnimationFrame(paint) : 0;
    };
    var set = function (v) { tgt = clamp(v, 0, 100); range.value = Math.round(tgt); if (!raf) raf = requestAnimationFrame(paint); };
    var fromX = function (x) { var r = ba.getBoundingClientRect(); return (x - r.left) / r.width * 100; };
    var drag = false;
    ba.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      drag = true; ba.classList.add('is-drag'); stopIntro();
      try { ba.setPointerCapture(e.pointerId); } catch (er) {}
      set(fromX(e.clientX));
    });
    ba.addEventListener('pointermove', function (e) { if (drag) set(fromX(e.clientX)); });
    var end = function () { drag = false; ba.classList.remove('is-drag'); };
    ba.addEventListener('pointerup', end); ba.addEventListener('pointercancel', end);
    range.addEventListener('input', function () { stopIntro(); set(+range.value); });
    /* balayage d'introduction : montre que ça se manipule */
    var introT = [], introDone = false;
    var stopIntro = function () { introDone = true; introT.forEach(clearTimeout); };
    if (!reduce && 'IntersectionObserver' in w) {
      var bio = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting || introDone) return;
        bio.disconnect();
        [[400, 22], [1300, 78], [2200, 50]].forEach(function (k) { introT.push(setTimeout(function () { if (!introDone) set(k[1]); }, k[0])); });
      }, { threshold: .6 });
      bio.observe(ba);
    }
    ba.style.setProperty('--p', '50%');
  });

  /* ---------- Dessins au trait (cygne, routes) ---------- */
  $$('.trust__swan').forEach(observe);

  /* ---------- Marquee ---------- */
  $$('.marquee__track').forEach(function (tr) { tr.innerHTML += tr.innerHTML; tr.setAttribute('aria-hidden', 'true'); });

  /* ---------- Héros WebGL ----------
   * La photo vit dans un conteneur dédié (.hero__media / .phero__media) :
   * plein cadre sur grand écran, posée au-dessus du texte sur mobile. */
  var fx = null, heroFx = null;
  var hero = $('.hero');
  if (hero) {
    var media = d.createElement('div'); media.className = 'hero__media';
    hero.insertBefore(media, hero.firstChild);
    var slides = $$('.hero__slide', hero);
    slides.forEach(function (s) { media.appendChild(s); });
    if (w.PermaGL && !reduce) {
      var urls = slides.map(function (s) {
        var m = /url\((['"]?)(.*?)\1\)/.exec(s.style.backgroundImage || ''); return m ? m[2] : null;
      });
      var cv = d.createElement('canvas'); cv.className = 'hero__gl'; cv.setAttribute('aria-hidden', 'true');
      media.appendChild(cv);
      fx = new PermaGL.FX(cv, urls, { host: media, dark: 0 });
      if (fx.ok) { hero.classList.add('has-gl'); heroFx = fx; } else cv.remove();
    }
  }
  var pheroFx = null, phero = $('.phero');
  if (phero && !hero) {
    var pm = d.createElement('div'); pm.className = 'phero__media';
    pm.style.backgroundImage = phero.style.backgroundImage;
    phero.insertBefore(pm, phero.firstChild);
    phero.classList.add('has-media');
    if (w.PermaGL && !reduce) {
      var m2 = /url\((['"]?)(.*?)\1\)/.exec(phero.style.backgroundImage || '');
      var cv2 = d.createElement('canvas'); cv2.className = 'phero__gl'; cv2.setAttribute('aria-hidden', 'true');
      pm.appendChild(cv2);
      pheroFx = new PermaGL.FX(cv2, [m2 ? m2[2] : null], { host: pm, dark: 1 });
      if (pheroFx.ok) phero.classList.add('has-gl'); else cv2.remove();
    }
  }

  /* Diaporama : points, compteur, autoplay */
  if (hero) {
    var slideEls = $$('.hero__slide', hero), dotsBox = $('.hero__dots', hero), cur = 0, timer;
    var cnt = d.createElement('div'); cnt.className = 'hero__count';
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    cnt.innerHTML = '<b>01</b><span>/ ' + pad(slideEls.length) + '</span>';
    if (dotsBox) {
      dotsBox.appendChild(cnt);
      slideEls.forEach(function (_, i) {
        var b = d.createElement('button'); b.className = 'hero__dot' + (i ? '' : ' active'); b.setAttribute('aria-label', 'Image ' + (i + 1));
        b.innerHTML = '<i></i>'; b.addEventListener('click', function () { goTo(i); });
        dotsBox.appendChild(b);
      });
    }
    var goTo = function (i) {
      i = (i + slideEls.length) % slideEls.length;
      if (i === cur) return;
      if (heroFx && !heroFx.go(i)) return;
      cur = i;
      slideEls.forEach(function (s, k) { s.classList.toggle('active', k === i); });
      $$('.hero__dot', hero).forEach(function (b, k) { b.classList.toggle('active', k === i); });
      $('b', cnt).textContent = pad(i + 1);
      setCopy(slideEls[i]);
      play();
    };
    /* texte propre à chaque diapositive : sortie des mots, échange, entrée */
    var inner = $('.hero__inner', hero), swapT;
    var setCopy = function (sl) {
      if (!inner || !sl.dataset.title) return;
      clearTimeout(swapT);
      inner.classList.add('is-swap');
      swapT = setTimeout(function () {
        $('.hero__tag', inner).innerHTML = sl.dataset.tag;
        var h1 = $('h1', inner); h1.innerHTML = sl.dataset.title; h1.classList.remove('in');
        if (!reduce) splitWords(h1);
        $('p', inner).innerHTML = sl.dataset.text;
        var lk = $('.hero__link', inner); if (lk) { lk.href = sl.dataset.link; lk.innerHTML = sl.dataset.label; }
        var qt = $('.hero__quote', inner); if (qt) qt.href = sl.dataset.quote;
        inner.classList.remove('is-swap');
        requestAnimationFrame(function () { requestAnimationFrame(function () { h1.classList.add('in'); }); });
      }, reduce ? 0 : 650);
    };
    var play = function () { clearInterval(timer); if (!reduce) timer = setInterval(function () { goTo(cur + 1); }, 6500); };
    play();
    d.addEventListener('visibilitychange', function () { d.hidden ? clearInterval(timer) : play(); });
  }

  /* ---------- Parallaxe + scroll fluide (valeurs interpolées) ---------- */
  var par = [];
  function addPar(el, speed, kind) { par.push({ el: el, s: speed, k: kind, y: 0 }); }
  if (!reduce) {
    $$('[data-parallax]').forEach(function (el) { addPar(el, parseFloat(el.dataset.parallax) || .1, 'move'); });
    $$('.proc__media img, .split__media img, .scard__img > img:first-child').forEach(function (img) { img.classList.add('par-img'); addPar(img, .12, 'img'); });
    $$('.cta-band').forEach(function (el) { addPar(el, .05, 'move'); });
  }

  var target = w.scrollY, smooth = w.scrollY, vel = 0;
  var heroContent = $('.hero__content'), pheroIn = $('.phero__in'), wm = $('.hero__wm');
  var skewEl = $$('.marquee__track');
  var vh = w.innerHeight;

  function frame() {
    requestAnimationFrame(frame);
    target = w.scrollY;
    var f = reduce ? 1 : .095;
    var prev = smooth;
    smooth = lerp(smooth, target, f);
    if (Math.abs(target - smooth) < .05) smooth = target;
    vel = lerp(vel, smooth - prev, .2);

    var max = Math.max(1, d.documentElement.scrollHeight - vh);
    progBar.style.transform = 'scaleX(' + clamp(target / max, 0, 1) + ')';
    nav && nav.classList.toggle('nav--top', target < 40);
    nav && nav.classList.toggle('nav--hide', target > 500 && target > lastY + 4 && !root.classList.contains('menu-open'));
    if (target < lastY - 4 || target < 500) nav && nav.classList.remove('nav--hide');
    lastY = target;

    var top = hero || phero;
    if (top) {
      var hh = top.offsetHeight, k = clamp(smooth / hh, 0, 1);
      (heroFx || pheroFx) && (heroFx || pheroFx).setScroll(k);
      if (!reduce) {
        if (heroContent) { heroContent.style.transform = 'translate3d(0,' + (smooth * .28).toFixed(1) + 'px,0)'; heroContent.style.opacity = 1 - k * 1.25; }
        if (pheroIn) { pheroIn.style.transform = 'translate3d(0,' + (smooth * .22).toFixed(1) + 'px,0)'; pheroIn.style.opacity = 1 - k * 1.3; }
        if (wm) wm.style.transform = 'translate3d(' + (-smooth * .18).toFixed(1) + 'px,' + (smooth * .12).toFixed(1) + 'px,0)';
      }
    }

    for (var i = 0; i < par.length; i++) {
      var p = par[i], host = p.k === 'img' ? p.el.parentNode : p.el, r = host.getBoundingClientRect();
      var base = p.k === 'img' ? 0 : p.y;   /* le rect de l'élément inclut sa propre translation */
      if (r.bottom < -300 || r.top > vh + 300) continue;
      var c = (r.top + r.height / 2 - base) - vh / 2;
      p.y = lerp(p.y, -c * p.s, .14);
      p.el.style.transform = p.k === 'img'
        ? 'translate3d(0,' + p.y.toFixed(1) + 'px,0) scale(1.22)'
        : 'translate3d(0,' + p.y.toFixed(1) + 'px,0)';
    }
    if (skewEl.length) skewEl.forEach(function (t) { t.style.setProperty('--skew', clamp(vel * -.25, -8, 8).toFixed(2) + 'deg'); });
    hpinUpdate();
  }
  var lastY = 0;

  /* ---------- Défilement horizontal épinglé (#poles) ---------- */
  var hp = null;
  function hpinBuild() {
    var sec = $('#poles'); if (!sec || reduce) return;
    var track = $('.grid-cards', sec), cont = $('.container', sec);
    if (!track || !cont) return;
    if (w.innerWidth < 1000) { if (hp) hpinDestroy(); return; }
    if (hp) { hpinMeasure(); return; }
    var stick = d.createElement('div'); stick.className = 'hpin__stick';
    while (sec.firstChild) stick.appendChild(sec.firstChild);
    sec.appendChild(stick);
    sec.classList.add('hpin');
    hp = { sec: sec, stick: stick, track: track, cont: cont, x: 0 };
    hpinMeasure();
  }
  function hpinMeasure() {
    var left = hp.cont.getBoundingClientRect().left;
    hp.dist = Math.max(0, hp.track.scrollWidth + left * 2 - w.innerWidth);
    hp.sec.style.height = (hp.dist + w.innerHeight * 1.15) + 'px';
  }
  function hpinDestroy() {
    var s = hp.sec; while (hp.stick.firstChild) s.insertBefore(hp.stick.firstChild, hp.stick);
    hp.stick.remove(); s.classList.remove('hpin'); s.style.height = '';
    hp.track.style.cssText = ''; hp = null;
  }
  function hpinUpdate() {
    if (!hp) return;
    var r = hp.sec.getBoundingClientRect(), span = hp.sec.offsetHeight - w.innerHeight;
    var k = clamp(-r.top / span, 0, 1);
    hp.x = lerp(hp.x, k * hp.dist, .12);
    hp.track.style.transform = 'translate3d(' + (-hp.x).toFixed(1) + 'px,0,0)';
    var bar = $('.hpin__bar i', hp.stick); if (bar) bar.style.transform = 'scaleX(' + k.toFixed(3) + ')';
  }
  if ($('#poles') && !reduce) {
    var hb = d.createElement('div'); hb.className = 'hpin__bar'; hb.innerHTML = '<i></i>';
    $('#poles .container').appendChild(hb);
  }

  /* ---------- Curseur personnalisé ---------- */
  if (fine && !reduce) {
    var dot = d.createElement('div'), ring = d.createElement('div');
    dot.className = 'cur'; ring.className = 'cur-ring'; ring.innerHTML = '<span></span>';
    d.body.appendChild(ring); d.body.appendChild(dot);
    root.classList.add('has-cursor');
    var mx = -100, my = -100, rx = -100, ry = -100;
    w.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)'; }, { passive: true });
    (function cl() { rx = lerp(rx, mx, .16); ry = lerp(ry, my, .16); ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)'; requestAnimationFrame(cl); })();
    var lab = $('span', ring);
    d.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target.closest('a,button,.btn,input,select,textarea,.hero__dot,.gallery a,.nav__hamb') : null;
      var g = t && t.closest && t.closest('.gallery');
      var cmp = e.target.closest && e.target.closest('.ba');
      ring.classList.toggle('is-link', !!t && !g && !cmp);
      ring.classList.toggle('is-view', !!g || !!cmp);
      lab.textContent = cmp ? 'Glisser' : g ? 'Voir' : '';
    });
    d.addEventListener('pointerdown', function () { ring.classList.add('is-down'); });
    d.addEventListener('pointerup', function () { ring.classList.remove('is-down'); });
    d.documentElement.addEventListener('pointerleave', function () { ring.classList.add('is-hidden'); dot.classList.add('is-hidden'); });
    d.documentElement.addEventListener('pointerenter', function () { ring.classList.remove('is-hidden'); dot.classList.remove('is-hidden'); });
  }

  /* ---------- Boutons magnétiques + tilt 3D ---------- */
  if (fine && !reduce) {
    $$('.btn, .fab, .footer__soc a').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .28, y = (e.clientY - r.top - r.height / 2) * .38;
        b.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
    $$('.scard, .doc-card, .step, .stat').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--rx', ((.5 - py) * 7).toFixed(2) + 'deg');
        c.style.setProperty('--ry', ((px - .5) * 9).toFixed(2) + 'deg');
        c.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        c.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        c.classList.add('tilt');
      });
      c.addEventListener('pointerleave', function () { c.classList.remove('tilt'); c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); });
    });
  }

  /* ---------- Galerie : lightbox ---------- */
  var gal = $$('.gallery a');
  if (gal.length) {
    var lb = d.createElement('div'); lb.className = 'lb'; lb.innerHTML = '<button class="lb__x" aria-label="Fermer">&times;</button><img alt="">';
    d.body.appendChild(lb);
    var lbi = $('img', lb), at = 0;
    var show = function (i) { at = (i + gal.length) % gal.length; lbi.src = gal[at].getAttribute('href'); lb.classList.add('on'); };
    gal.forEach(function (a, i) { a.addEventListener('click', function (e) { e.preventDefault(); show(i); }); });
    lb.addEventListener('click', function (e) { if (e.target !== lbi) lb.classList.remove('on'); else show(at + 1); });
    d.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') lb.classList.remove('on');
      if (e.key === 'ArrowRight') show(at + 1);
      if (e.key === 'ArrowLeft') show(at - 1);
    });
  }

  /* ---------- Transitions de page (rideau) ---------- */
  if (!reduce) {
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var h = a.getAttribute('href');
      if (!h || h.charAt(0) === '#' || /^(mailto:|tel:|https?:|javascript:)/i.test(h) || a.target === '_blank' || a.closest('.gallery')) return;
      e.preventDefault();
      root.classList.add('is-leave');
      setTimeout(function () { location.href = a.href; }, 620);
    });
    w.addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('is-leave'); });
  }

  /* ---------- Init ---------- */
  function measure() { vh = w.innerHeight; hpinBuild(); }
  w.addEventListener('resize', measure);
  w.addEventListener('load', function () { hpinBuild(); setTimeout(hpinBuild, 400); });
  measure();
  requestAnimationFrame(frame);
})();
