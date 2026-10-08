/* Permagroup — demande de devis en 4 étapes (repris du prototype Claude Design)
 * Pôle & intervention → consultation offerte (mode, date, créneau, séjour) → coordonnées → envoi.
 * Sans serveur : la demande part via WhatsApp ou e-mail, préremplie.
 */
(function () {
  'use strict';
  var root = document.querySelector('[data-booking]');
  if (!root) return;

  var WA = '21622929389', MAIL = 'contact@perma.doctor';
  var POLES = [
    { key: 'face', name: 'PermaFace', tag: 'Chirurgie du visage', color: '#8b8fd4', img: 'pole-face',
      items: ['Lifting cervico-facial', 'Blépharoplastie', 'Rhinoplastie', 'Génioplastie', 'Otoplastie', 'Lipofilling du visage', 'Réduction des boules de Bichat'] },
    { key: 'breast', name: 'PermaBreast', tag: 'Chirurgie des seins', color: '#c97b9a', img: 'pole-breast',
      items: ['Prothèse mammaire', 'Lifting des seins', 'Réduction mammaire', 'Lipofilling mammaire', 'Correction des mamelons', 'Reconstruction des seins'] },
    { key: 'shape', name: 'PermaShape', tag: 'Silhouette', color: '#c9a96a', img: 'pole-shape',
      items: ['Liposuccion', 'Abdominoplastie', 'Lipofilling des fesses (BBL)', 'Implant fessier', 'Lifting des cuisses', 'Lifting des bras'] },
    { key: 'thin', name: 'PermaThin', tag: "Chirurgie de l'obésité", color: '#d9637d', img: 'pole-thin',
      items: ['Anneau gastrique', 'Sleeve gastrectomie', 'Bypass gastrique'] },
    { key: 'cosmetic', name: 'PermaCosmetic', tag: 'Médecine esthétique', color: '#86b46f', img: 'pole-cosmetic',
      items: ['Injection de Botox', 'Acide hyaluronique', 'Injection PRP'] },
    { key: 'teeth', name: 'PermaTeeth', tag: 'Dentisterie esthétique', color: '#df7a4f', img: 'pole-teeth',
      items: ['Facettes dentaires', 'Blanchiment dentaire', 'Implant dentaire'] },
    { key: 'men', name: 'PermaMen', tag: 'Esthétique masculine', color: '#5f86a8', img: 'pole-men',
      items: ['Gynécomastie', 'Implant pectoral', 'Pénoplastie'] },
    { key: 'graft', name: 'PermaGraft', tag: 'Greffe capillaire', color: '#4f9d94', img: 'pole-graft',
      items: ['Greffe de cheveux homme', 'Greffe de cheveux femme'] }
  ];
  var UNSURE = 'Je ne sais pas encore, je souhaite un conseil';
  var MODES = [['video', 'Visio'], ['whatsapp', 'WhatsApp'], ['phone', 'Téléphone']];
  var SLOTS = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];
  var STAYS = ['Dans le mois', 'D’ici 1 à 3 mois', 'D’ici 3 à 6 mois', 'Pas encore décidé'];
  var DOW = ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'];
  var MON = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
  var DAYS_L = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MON_L = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  var $ = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };

  /* état + préremplissage par l'URL (?pole=face&i=Rhinoplastie) */
  var q = new URLSearchParams(location.search);
  var st = { step: 1, pole: 'face', item: '', mode: 'video', date: '', time: '', stay: '', name: '', phone: '', email: '', note: '', consent: false };
  if (q.get('pole') && POLES.some(function (p) { return p.key === q.get('pole'); })) st.pole = q.get('pole');
  if (q.get('i')) st.item = q.get('i') === 'conseil' ? UNSURE : q.get('i');
  var pole = function () { return POLES.filter(function (p) { return p.key === st.pole; })[0]; };

  /* ---------- construction ---------- */
  $('.bk__poles').innerHTML = POLES.map(function (p) {
    return '<button type="button" class="bk-pole" data-pole="' + p.key + '" style="--c:' + p.color + '">' +
      '<span class="bk-pole__img"><img src="static/img/' + p.img + '.webp" alt="" loading="lazy"></span>' +
      '<span class="bk-pole__bar"></span><b>' + p.name + '</b><small>' + p.tag + '</small></button>';
  }).join('');
  $('.bk__modes').innerHTML = MODES.map(function (m) {
    return '<button type="button" class="bk-chip" data-mode="' + m[0] + '">' + m[1] + '</button>';
  }).join('');
  var days = [], d0 = new Date(); d0.setHours(12, 0, 0, 0);
  for (var i = 1; days.length < 14; i++) {
    var d = new Date(d0); d.setDate(d0.getDate() + i);
    if (d.getDay() === 0) continue;
    days.push(d);
  }
  var iso = function (d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); };
  $('.bk__days').innerHTML = days.map(function (d) {
    return '<button type="button" class="bk-day" data-date="' + iso(d) + '"><small>' + DOW[d.getDay()] + '</small><b>' + d.getDate() + '</b><small>' + MON[d.getMonth()] + '</small></button>';
  }).join('');
  $('.bk__slots').innerHTML = SLOTS.map(function (t) { return '<button type="button" class="bk-chip" data-time="' + t + '">' + t + '</button>'; }).join('');
  $('.bk__stays').innerHTML = STAYS.map(function (t) { return '<button type="button" class="bk-chip" data-stay="' + esc(t) + '">' + t + '</button>'; }).join('');

  function fmtDate(s) {
    if (!s) return '';
    var p = s.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2]);
    return DAYS_L[d.getDay()] + ' ' + d.getDate() + ' ' + MON_L[d.getMonth()];
  }
  function renderItems() {
    var p = pole(), box = $('.bk__items');
    if (box.dataset.pole === p.key) return;
    box.dataset.pole = p.key;
    box.innerHTML = p.items.concat([UNSURE]).map(function (it) {
      return '<button type="button" class="bk-chip' + (it === UNSURE ? ' bk-chip--soft' : '') + '" data-item="' + esc(it) + '">' + esc(it) + '</button>';
    }).join('');
  }

  /* ---------- validation ---------- */
  var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); };
  function can(step) {
    if (step === 1) return !!st.item;
    if (step === 2) return !!(st.mode && st.date && st.time);
    if (step === 3) return !!(st.name.trim() && (emailOk(st.email) || st.phone.trim().length >= 8) && st.consent);
    return true;
  }
  var HINTS = { 1: 'Choisissez une intervention pour continuer.', 2: 'Choisissez un jour et un créneau.', 3: 'Indiquez votre nom, un e-mail ou un téléphone, et cochez le consentement.' };

  /* ---------- rendu ---------- */
  var lastStep = 0;
  function render() {
    var p = pole();
    root.style.setProperty('--acc', p.color);
    if (st.item && st.item !== UNSURE && p.items.indexOf(st.item) < 0) st.item = '';

    $$('.bk-pole').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.pole === st.pole); });
    renderItems();
    $$('[data-item]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.item === st.item); });
    $$('[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.mode === st.mode); });
    $$('[data-date]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.date === st.date); });
    $$('[data-time]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.time === st.time); });
    $$('[data-stay]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.stay === st.stay); });
    var ck = $('.bk-consent'); ck.setAttribute('aria-checked', st.consent);

    /* étapes */
    $$('.bk__steps li').forEach(function (li, i) {
      var n = i + 1;
      li.classList.toggle('is-done', st.step > n);
      li.classList.toggle('is-active', st.step === n);
      li.setAttribute('aria-current', st.step === n ? 'step' : 'false');
    });
    $('.bk__progress i').style.transform = 'scaleX(' + ((st.step - 1) / 3) + ')';
    $$('.bk__panel').forEach(function (pn) {
      var on = +pn.dataset.step === st.step;
      pn.hidden = !on;
      if (on && lastStep !== st.step) {
        pn.classList.remove('is-in', 'is-back');
        void pn.offsetWidth;
        pn.classList.add('is-in');
        if (st.step < lastStep) pn.classList.add('is-back');
      }
    });

    /* navigation */
    var ok = can(st.step);
    var next = $('.bk__next'), back = $('.bk__back');
    $('.bk__nav').hidden = st.step === 4;
    back.style.visibility = st.step === 1 ? 'hidden' : 'visible';
    next.setAttribute('aria-disabled', !ok);
    next.querySelector('span').textContent = st.step === 3 ? 'Vérifier ma demande' : 'Continuer';
    $('.bk__hint').textContent = ok ? '' : HINTS[st.step] || '';

    /* récapitulatif en direct */
    var rows = [
      ['Pôle', p.name],
      ['Intervention', st.item],
      ['Consultation', st.mode ? MODES.filter(function (m) { return m[0] === st.mode; })[0][1] + ' · offerte' : ''],
      ['Date', fmtDate(st.date) + (st.time ? ' · ' + st.time : '')],
      ['Séjour', st.stay],
      ['Au nom de', st.name.trim()]
    ];
    var aside = $('.bk__aside');
    $('.bk-sum__img img', aside).src = 'static/img/' + p.img + '.webp';
    $('.bk-sum__pole', aside).textContent = p.name;
    $('.bk-sum__tag', aside).textContent = p.tag;
    var rowsEl = $('.bk-sum__rows', aside), html = '';
    rows.forEach(function (r) {
      html += '<div class="bk-sum__row' + (r[1] ? '' : ' is-empty') + '"><span>' + r[0] + '</span><b>' + (r[1] ? esc(r[1]) : '—') + '</b></div>';
    });
    if (rowsEl.dataset.sig !== html) {
      var prev = rowsEl.dataset.sig ? rowsEl.querySelectorAll('b') : [];
      rowsEl.innerHTML = html;
      $$('b', rowsEl).forEach(function (b, i) { if (prev[i] && prev[i].textContent !== b.textContent) b.classList.add('flash'); });
      rowsEl.dataset.sig = html;
    }
    var filled = rows.filter(function (r) { return r[1]; }).length;
    $('.bk-sum__meter i', aside).style.transform = 'scaleX(' + (filled / rows.length) + ')';
    $('.bk-sum__pct', aside).textContent = Math.round(filled / rows.length * 100) + ' %';

    /* étape 4 : liens d'envoi */
    if (st.step === 4) {
      var msg = message();
      $('.bk-send--wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
      $('.bk-send--mail').href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Demande de devis — ' + p.name + ' · ' + st.item) + '&body=' + encodeURIComponent(msg);
      $('.bk-done__recap').innerHTML = rows.concat([['Téléphone', st.phone.trim()], ['E-mail', st.email.trim()]]).filter(function (r) { return r[1]; })
        .map(function (r) { return '<div><span>' + r[0] + '</span><b>' + esc(r[1]) + '</b></div>'; }).join('');
    }
    lastStep = st.step;
  }

  function message() {
    var p = pole(), mode = MODES.filter(function (m) { return m[0] === st.mode; })[0][1];
    var L = ['Bonjour Permagroup, je souhaite recevoir un devis gratuit.', '',
      '• Pôle : ' + p.name + ' (' + p.tag + ')',
      '• Intervention : ' + st.item,
      '• Consultation offerte : ' + mode + ', le ' + fmtDate(st.date) + ' à ' + st.time + ' (heure de Tunis)'];
    if (st.stay) L.push('• Séjour envisagé : ' + st.stay);
    L.push('', '• Nom : ' + st.name.trim());
    if (st.phone.trim()) L.push('• Téléphone : ' + st.phone.trim());
    if (st.email.trim()) L.push('• E-mail : ' + st.email.trim());
    if (st.note.trim()) L.push('', st.note.trim());
    return L.join('\n');
  }

  /* ---------- interactions ---------- */
  root.addEventListener('click', function (e) {
    var t = e.target.closest('button, [role=checkbox]');
    if (!t || !root.contains(t)) return;
    var ds = t.dataset;
    if (ds.pole) { if (st.pole !== ds.pole) { st.pole = ds.pole; st.item = ''; } }
    else if (ds.item) st.item = ds.item;
    else if (ds.mode) st.mode = ds.mode;
    else if (ds.date) st.date = ds.date;
    else if (ds.time) st.time = ds.time;
    else if (ds.stay) st.stay = st.stay === ds.stay ? '' : ds.stay;
    else if (t.classList.contains('bk-consent')) st.consent = !st.consent;
    else if (t.classList.contains('bk__next')) return go(1);
    else if (t.classList.contains('bk__back')) return go(-1);
    else if (t.classList.contains('bk-edit')) { st.step = 1; render(); return; }
    else return;
    render();
  });
  $('.bk-consent').addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); st.consent = !st.consent; render(); }
  });
  ['name', 'phone', 'email', 'note'].forEach(function (k) {
    var el = $('[name=bk-' + k + ']');
    el.value = st[k];
    el.addEventListener('input', function () { st[k] = el.value; render(); });
  });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); go(1); }
  });

  function go(dir) {
    if (dir > 0 && !can(st.step)) {
      var h = $('.bk__hint'); h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake');
      return;
    }
    st.step = Math.min(4, Math.max(1, st.step + dir));
    render();
    var top = root.getBoundingClientRect().top + window.scrollY - 110;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    var focus = $('.bk__panel[data-step="' + st.step + '"] h2');
    if (focus) { focus.tabIndex = -1; focus.focus({ preventScroll: true }); }
  }

  render();
})();
