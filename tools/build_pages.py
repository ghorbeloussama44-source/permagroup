"""Génère toutes les pages du site à partir du design (static/css/site.css, static/js/site.js)
et des textes d'origine (content/site.json).

    python3 tools/build_pages.py
"""
import json, os
from html import escape as E

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
C = json.load(open(os.path.join(ROOT, 'content/site.json'), encoding='utf-8'))
PART = lambda n: open(os.path.join(ROOT, 'tools/partials', n), encoding='utf-8').read()
SITE = C['site']

# ---------------------------------------------------------------- pôles
ORDER = ['face', 'breast', 'shape', 'thin', 'cosmetic', 'teeth', 'men', 'graft']
COLORS = {'face': '#8282C6', 'breast': '#C8668A', 'shape': '#BFA15E', 'thin': '#D35C79',
          'cosmetic': '#7FAE68', 'teeth': '#DD7548', 'men': '#5E82A9', 'graft': '#479A8D'}
SHORT = {'shape': 'Silhouette'}
HERO = {'face': 'static/img/hero-2.webp', 'breast': 'static/img/hero-1.webp', 'shape': 'static/img/hero-3.webp',
        'cosmetic': 'static/img/hero-4.webp', 'thin': 'static/img/pole-thin.webp', 'teeth': 'static/img/pole-teeth.webp',
        'men': 'static/img/pole-men.webp', 'graft': 'static/img/pole-graft.webp'}
ICONS = {
 'face': '<circle cx="16" cy="14" r="8.5"/><path d="M12.5 13h.01M19.5 13h.01M13 18c1.8 1.4 4.2 1.4 6 0M10 24.5c1 3 3.5 4.5 6 4.5s5-1.5 6-4.5"/>',
 'breast': '<path d="M4 12c1.5 8 9.5 9 11 1M17 13c1.5 8 9.5 7 11-1M9 17.5h.01M23 17.5h.01M4 7c4 1 8 1 12-1 4 2 8 2 12 1"/>',
 'shape': '<path d="M11 3c0 6 4 7 4 13s-4 7-4 13M21 3c0 6-4 7-4 13s4 7 4 13"/>',
 'thin': '<path d="M12 3c-4 5 5 8 0 13s4 9 0 13M20 3c3 5-4 8 1 13s-3 9 0 13"/>',
 'cosmetic': '<path d="M3 16s5-8 13-8 13 8 13 8-5 8-13 8S3 16 3 16z"/><circle cx="16" cy="16" r="4"/><path d="M9 8 7.5 5.5M16 6.5V4M23 8l1.5-2.5"/>',
 'teeth': '<path d="M10 4c-3 0-5.5 2.6-5.5 6.5 0 5 2.6 6.5 2.6 11.6 0 2.6 1.3 5.4 2.6 5.4 2.6 0 2.6-7.8 6.3-7.8s3.7 7.8 6.3 7.8c1.3 0 2.6-2.8 2.6-5.4 0-5.1 2.6-6.6 2.6-11.6C27.5 6.6 25 4 22 4c-2.6 0-3.9 1.3-6 1.3S12.6 4 10 4z"/>',
 'men': '<path d="M10.5 9.5a5.5 5.5 0 1 1 11 0v4a5.5 5.5 0 0 1-11 0z"/><path d="M10.5 9c2 .3 4.5-.6 6-2.6 1 1.6 3 2.6 5 2.6M5 29c1.3-5 5.4-8 11-8s9.7 3 11 8"/>',
 'graft': '<path d="M6 28V15a10 10 0 0 1 20 0v13M11 28v-9M16 28V16M21 28v-9"/>'}
POLES = []
for k in ORDER:
    p = C['poles'][k]
    POLES.append({'id': k, 'name': p['name'], 'sub': SHORT.get(k, p['tag']), 'tag': p['tag'], 'color': COLORS[k],
                  'page': p['page'], 'img': 'static/img/d/pole-%s.webp' % k, 'items': [x['title'] for x in p['procedures']]})
PBY = {p['id']: p for p in POLES}

ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 8h12M9 3l5 5-5 5"/></svg>'
def ico(paths, cls='', vb='0 0 24 24', w='1.4'):
    return '<svg %sviewBox="%s" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>' % (
        ('class="%s" ' % cls) if cls else '', vb, w, paths)
def pole_ico(k): return ico(ICONS[k], 'ico', '0 0 32 32', '1.3')
I = {
 'shield': '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
 'plane': '<path d="M3 13.5 21 6l-4 15-5.5-5.5L9 19v-5.5"/><path d="m11.5 15.5 9.5-9.5"/>',
 'heart': '<path d="M12 21s-7-4.5-9.5-9C1 8 2.5 4.5 6 4.5c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3.5 0 5 3.5 3.5 6.5C19 15.5 12 21 12 21Z"/>',
 'star': '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
 'home': '<path d="M3 21V8l9-5 9 5v13M9 21v-6h6v6"/>',
 'compass': '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
 'phone': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"/>',
 'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
 'pin': '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
 'chat': '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z"/>',
 'lock': '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 'bed': '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/>',
}
WA_SVG = '<svg viewBox="0 0 32 32" fill="currentColor"><path d="M16 3.2C9 3.2 3.3 8.9 3.3 15.9c0 2.4.7 4.7 1.9 6.7L3.2 28.8l6.4-2c1.9 1.1 4.1 1.6 6.4 1.6 7 0 12.7-5.7 12.7-12.7S23 3.2 16 3.2zm0 23c-2.1 0-4.1-.6-5.8-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4a10.2 10.2 0 1 1 9.1 4.9zm5.6-7.6c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.4 8.4 0 0 1-4.2-3.7c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1.1-1.1 2.6s1.1 3 1.3 3.2c.2.2 2.2 3.4 5.4 4.7 2 .9 2.8.9 3.8.8.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4z"/></svg>'

# ---------------------------------------------------------------- gabarit commun
def head(title, desc):
    return '''<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>%s</title>
<meta name="description" content="%s">
<meta name="theme-color" content="#0E2427">
<link rel="icon" href="static/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,400..700&family=Manrope:wght@400;500;600;700&display=swap">
<script>try{if(sessionStorage.getItem("pd_seen"))document.documentElement.classList.add("pl-off")}catch(e){}</script>
<link rel="stylesheet" href="static/css/site.css">
</head>
<body>
''' % (E(title), E(desc))

NAV = [('index.html', 'Accueil', 'home'), (None, 'Nos pôles', 'poles'), ('medecins.html', 'Notre équipe', 'team'),
       ('sejour.html', 'Le séjour', 'stay'), ('contact.html', 'Contact', 'contact')]

def header(active, rdv='contact.html#rdv'):
    links = []
    for href, label, key in NAV:
        if href is None:
            links.append('<div class="dd"><button type="button" aria-haspopup="true"%s>Nos pôles <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg></button><div class="mega" id="mega"></div></div>' % (' class="on"' if active == key else ''))
        else:
            links.append('<a href="%s"%s>%s</a>' % (href, ' class="on" aria-current="page"' if active == key else '', label))
    drawer = ''.join('<a href="%s"><small>%02d</small>%s</a>' % (h or 'index.html#poles', i + 1, l) for i, (h, l, k) in enumerate(NAV))
    return PART('symbol.html') + PART('preloader.html') + '''<div class="progress" id="progress"></div>
<header class="site-header" id="hdr">
  <div class="wrap bar">
    <a class="logo" href="index.html" aria-label="Perma.doctor, accueil"><svg class="mk" viewBox="0 0 62.40 100" aria-hidden="true"><use href="#mk"/></svg><span class="wm">Perma<i>.</i><b>doctor</b></span></a>
    <nav class="nav" aria-label="Navigation principale">%s</nav>
    <a class="btn btn-teal hd-cta mag" href="%s">Prendre rendez-vous</a>
    <button class="burger" id="burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false"><span></span></button>
  </div>
</header>
<div class="drawer" id="drawer" aria-hidden="true" data-lenis-prevent>
  <nav aria-label="Menu mobile">%s</nav>
  <div class="chips" id="drawerPoles"></div>
  <a class="btn btn-gold" href="%s" style="align-self:flex-start">Prendre rendez-vous %s</a>
</div>
''' % (''.join(links), rdv, drawer, rdv, ARROW)

def footer():
    data = {'poles': POLES, 'site': {'whatsapp': SITE['whatsapp'], 'email': SITE['email']}, 'detail': 'static/img/d/detail.webp'}
    return '''<footer class="site-footer">
  <div class="wrap">
    <div class="ft-grid">
      <div>
        <a class="logo" href="index.html"><svg class="mk" viewBox="0 0 62.40 100" aria-hidden="true"><use href="#mk"/></svg><span class="wm">Perma<i>.</i><b>doctor</b></span></a>
        <p style="font-size:.88rem;max-width:34ch">%s</p>
      </div>
      <div><h4>Nos pôles</h4><ul id="ftPoles"></ul></div>
      <div><h4>Le groupe</h4><ul><li><a href="quisommesnous.html">Qui sommes-nous</a></li><li><a href="medecins.html">Notre équipe</a></li><li><a href="medecins.html#clinique">Nos cliniques</a></li><li><a href="sejour.html">Le séjour</a></li><li><a href="contact.html#rdv">Consultation offerte</a></li></ul></div>
      <div><h4>Contact</h4><ul><li>%s</li><li><a href="tel:+21622929389">%s</a></li><li><a href="mailto:%s">%s</a></li><li><a href="https://wa.me/%s" target="_blank" rel="noopener">WhatsApp</a></li></ul></div>
    </div>
    <div class="ft-giant" aria-hidden="true"><div class="ft-giant-in"><svg viewBox="0 0 62.40 100"><defs><linearGradient id="ftg" x1="0" y1="0" x2="0" y2="1"><stop offset=".1" stop-color="#F6F2EA" stop-opacity=".94"/><stop offset=".92" stop-color="#5FC9C9" stop-opacity=".22"/></linearGradient></defs><use href="#mk" fill="url(#ftg)"/></svg><span class="wm">Perma<i>.</i><b>doctor</b></span></div></div>
    <div class="ft-bottom"><span>© 2026 Permagroup. Tous droits réservés.</span><span class="tags"><i></i>Renaissance de votre corps</span></div>
  </div>
</footer>
<a class="wa" href="https://wa.me/%s?text=%s" target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp">%s</a>
<script>window.PERMA=%s;</script>
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="static/js/site.js"></script>
</body>
</html>
''' % (E(SITE['about_short']), E(SITE['address']), E(SITE['phone']), SITE['email'], SITE['email'], SITE['whatsapp'], SITE['whatsapp'],
       'Bonjour%20Perma.doctor%2C%20je%20souhaite%20un%20renseignement', WA_SVG, json.dumps(data, ensure_ascii=False))

# ---------------------------------------------------------------- blocs
def hero(img, alt, eyebrow, title, lead, ctas, crumbs=None, tag=None, page=True, gl=True):
    cr = ''
    if crumbs:
        cr = '<nav class="crumbs" aria-label="Fil d’Ariane">' + '<span>·</span>'.join(
            ('<a href="%s">%s</a>' % (h, E(l)) if h else '<b style="font-weight:500">%s</b>' % E(l)) for h, l in crumbs) + '</nav>'
    return '''<section class="hero%s">
    <div class="wrap hero-grid">
      <div class="hero-media" id="heroMedia" data-cursor="Explorer">
        <img src="%s" alt="%s">
        %s
        %s
      </div>
      <div class="hero-copy">
        %s
        <div class="eyebrow"><span class="rule" id="heroRule"></span>%s</div>
        <h1 class="split" id="heroTitle">%s</h1>
        <p class="lead">%s</p>
        <div class="hero-ctas">%s</div>
      </div>
      <div class="scroll-cue"><i></i>Défiler</div>
    </div>
  </section>
''' % (' hero--page' if page else '', img, E(alt), '<canvas data-gl="0" aria-hidden="true"></canvas>' if gl else '',
       ('<div class="media-tag"><span class="dot"></span><div><b>%s</b>%s</div></div>' % (E(tag[0]), E(tag[1]))) if tag else '',
       cr, E(eyebrow), title, E(lead), ctas)

def btn(href, label, cls='btn-teal', extra=''):
    return '<a class="btn %s mag" href="%s"%s>%s %s</a>' % (cls, href, extra, E(label), ARROW)
def link(href, label, extra=''):
    return '<a class="link-arrow" href="%s"%s>%s %s</a>' % (href, extra, E(label), ARROW)

def sec_head(eyebrow, title, lead=None, right=''):
    return '''<div class="sec-head">
        <div><div class="eyebrow rv"><span class="rule"></span>%s</div><h2 class="split">%s</h2>%s</div>
        %s
      </div>''' % (E(eyebrow), title, ('<p class="lead rv">%s</p>' % E(lead)) if lead else '', right)

def poles_grid(exclude=None, cursor='Découvrir'):
    out = []
    for i, p in enumerate([p for p in POLES if p['id'] != exclude]):
        out.append('''<a class="pole tilt rv %s" href="%s" data-cursor="%s" style="--c:%s" aria-label="%s, %s">
  <div class="ph ci"><img src="%s" alt="" loading="lazy" data-speed="-.06"></div>
  <div class="pb">%s<div class="meta"><h3>%s</h3><div class="sub">%s</div></div><span class="go">%s</span></div></a>''' % (
            ('rv-d%d' % (i % 4)) if i % 4 else '', p['page'], cursor, p['color'], E(p['name']), E(p['sub']), p['img'],
            pole_ico(p['id']), E(p['name']), E(p['sub']), ARROW))
    return '<div class="poles">' + '\n'.join(out) + '</div>'

def trust():
    items = [(I['shield'], 'Sécurité & expertise', 'Des chirurgiens renommés, des cliniques agréées'),
             (I['plane'], 'Séjour tout inclus', 'Clinique, hébergement, accompagnement'),
             (I['heart'], 'Écoute personnalisée', 'Une assistance de l’aéroport au retour'),
             (I['star'], 'Résultats naturels', 'Une beauté en harmonie avec vous')]
    return '''<div class="wrap trust">
    <div class="trust-card rv">%s</div>
  </div>
''' % ''.join('<div class="trust-item">%s<div><strong>%s</strong><span>%s</span></div></div>' % (ico(i), E(t), E(s)) for i, t, s in items)

def stats():
    return '<div class="stats rv">' + ''.join('<div class="stat"><b>%s</b><span>%s</span></div>' % (E(a), E(b)) for a, b in SITE['stats']) + '</div>'

def why_clinic(sec_id='equipe', title_btn=('medecins.html', 'Rencontrer notre équipe')):
    feats = [(I['user'], 'Médecins<br>experts'), (I['shield'], 'Cliniques<br>agréées'), (I['heart'], 'Suivi<br>personnalisé'), (I['star'], 'Résultats<br>naturels')]
    return '''<section class="sec" id="%s" style="padding-top:0">
    <div class="wrap why-grid">
      <article class="why rv">
        <div class="copy">
          <h2 class="split">Pourquoi choisir <span class="nw">Perma<span style="color:var(--teal)">.</span>doctor</span> ?</h2>
          <p class="lead">%s</p>
          <div class="feats">%s</div>
          %s
        </div>
        <div class="portrait ci"><img src="static/img/dr-feriel.webp" alt="Dr Feriel Ben Smida, de l’équipe Perma.doctor" loading="lazy" data-speed="-.08"></div>
      </article>
      <article class="clinic rv rv-d1" id="clinique">
        <div class="eyebrow">Nos cliniques</div>
        <h3 style="font-size:clamp(1.5rem,2.2vw,1.9rem);font-weight:400">Un cadre d’exception au cœur de la Tunisie</h3>
        <p style="color:var(--muted);font-size:.92rem">Des cliniques privées luxueuses, agréées par le ministère de la Santé et conformes aux normes d’hygiène les plus strictes, pour une intervention en toute sérénité.</p>
        %s
        <div class="frame ci"><img src="static/img/d/clinique.webp" alt="Hall d’accueil lumineux d’une clinique" loading="lazy" data-speed="-.1"></div>
      </article>
    </div>
  </section>
''' % (sec_id, E(SITE['home_about'] + ' Une expérience humaine et sur mesure, au service de votre bien-être.'),
       ''.join('<div class="feat">%s%s</div>' % (ico(i), t) for i, t in feats),
       btn(title_btn[0], title_btn[1], extra=' style="align-self:flex-start"'), link('sejour.html', 'Découvrir le séjour'))

def stay(lead, btn_href='sejour.html', btn_label='Découvrir le séjour'):
    svcs = [(I['plane'], 'Accueil aéroport', 'Une hôtesse vous accueille et vous remet un téléphone avec carte SIM'),
            (I['bed'], 'Hébergement & confort', 'Hôtels de 1 à 5 étoiles, en pension complète ou à la carte'),
            (I['heart'], 'Convalescence', 'Suivi médical complet et repos à l’hôtel'),
            (I['compass'], 'Découverte', 'Un programme touristique sur mesure en Tunisie')]
    return '''<section class="sec" id="sejour" style="padding-top:0">
    <div class="wrap stay-grid">
      <article class="stay rv" data-cursor="Tunisie">
        <img src="static/img/d/sidi-bou-said.webp" alt="Maison blanche aux portes bleues et bougainvilliers face à la mer, Sidi Bou Saïd">
        <canvas data-gl="1" aria-hidden="true"></canvas>
        <div class="geo">Sidi Bou Saïd<span>36,87° N · 10,35° E</span></div>
        <div class="copy">
          <div class="eyebrow"><span class="rule"></span>Le séjour en Tunisie</div>
          <h2 class="split">Un séjour inoubliable</h2>
          <p class="lead" style="font-size:.95rem">%s</p>
          %s
        </div>
      </article>
      <aside class="services rv rv-d1" id="services">
        <i class="svc-line"></i>
        %s
      </aside>
    </div>
  </section>
''' % (E(lead), btn(btn_href, btn_label, extra=' style="align-self:flex-start"'),
       '\n        '.join('<div class="svc"><span class="ic">%s</span><div><strong>%s</strong><span>%s</span></div></div>' % (ico(i, w='1.5'), E(t), E(s)) for i, t, s in svcs))

KINETIC = '''<section class="kinetic" aria-label="Nos valeurs : élégance, confiance, Méditerranée">
    <div class="k-row" id="k1" aria-hidden="true"></div>
    <div class="k-row" id="k2" aria-hidden="true"></div>
    <svg class="k-badge" id="kBadge" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="circ" d="M50 50m-44 0a44 44 0 1 1 88 0a44 44 0 1 1-88 0"/></defs><text><textPath href="#circ">Élégance · Confiance · Méditerranée · Perma.doctor ·</textPath></text></svg>
    <div class="k-orb"><img src="static/img/d/detail.webp" alt=""></div>
  </section>
'''

TESTI = '''<section class="sec" style="padding-top:clamp(40px,5vw,72px)">
    <div class="wrap">
      <div class="sec-head">
        <div><div class="eyebrow rv"><span class="rule"></span>Ils nous font confiance</div><h2 class="split">Leurs témoignages</h2><p class="lead rv">Des patients du monde entier partagent leur expérience avec Perma.doctor.</p></div>
        <div class="t-nav"><button type="button" id="tPrev" aria-label="Témoignage précédent"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 8H2M7 3 2 8l5 5"/></svg></button><button type="button" id="tNext" aria-label="Témoignage suivant"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 8h12M9 3l5 5-5 5"/></svg></button></div>
      </div>
      <!-- Témoignages : uniquement de VRAIS avis de patients, publiés avec leur accord.
           Un <figure class="t-card"> par avis, par exemple :
           <figure class="t-card"><div class="stars" aria-label="5 étoiles sur 5">★★★★★</div><q>Texte de l’avis</q>
             <figcaption class="t-who"><span class="t-av" style="background:#8282C6">SL</span><div><strong>Prénom N.</strong><span style="font-size:.76rem;color:var(--muted)">PermaFace</span></div></figcaption></figure>
           Sans avis, la section reste masquée. -->
      <div class="t-track" id="tTrack" data-cursor="Glisser" data-lenis-prevent></div>
    </div>
  </section>
'''

RDV = '''<section class="sec rdv" id="rdv">
    <div class="wrap">
      <div class="sec-head" style="margin-bottom:48px">
        <div><div class="eyebrow rv"><span class="rule"></span>Contact &amp; prise de rendez-vous</div><h2 class="split">Votre consultation offerte</h2><p class="lead rv">Un conseiller vous appelle pour échanger sur votre projet, sans engagement. Devis gratuit et personnalisé sous 24&nbsp;h.</p></div>
      </div>
      <div class="rdv-grid">
        <div class="rdv-main">
          <div class="summary" id="summary">
            <div class="sp"><img id="sumImg" src="static/img/d/detail.webp" alt=""></div>
            <div class="sc">
              <div class="row"><span class="lbl">Votre demande</span><span class="pct" id="sumPct">0 %%</span></div>
              <div class="trk"><i id="sumBar"></i></div>
              <div class="nm" id="sumName">Votre projet</div>
              <div class="sb" id="sumSub">Choisissez un pôle pour commencer</div>
            </div>
          </div>
          <div class="flow" id="flow">
            <div class="steps" id="bubbles"></div>
            <div class="s-line"><i id="sLine"></i></div>
            <h3 class="f-title" id="fTitle" tabindex="-1"></h3>
            <p class="f-sub" id="fSub"></p>
            <div class="f-body" id="fBody"></div>
            <div class="f-foot" id="fFoot">
              <button type="button" class="btn btn-ghost" id="fBack">Retour</button>
              <span class="hint" id="fHint" aria-live="polite"></span>
              <button type="button" class="btn btn-teal" id="fNext">Continuer</button>
            </div>
          </div>
        </div>
        <aside class="rdv-side">
          <div class="timeline" id="timeline"></div>
          <div class="reassure">
            <div>%s<span><b>Confidentiel</b>Vos informations restent entre vous et l’équipe médicale.</span></div>
            <div>%s<span><b>Réponse sous 24 h</b>Un conseiller vous rappelle au créneau choisi.</span></div>
          </div>
        </aside>
      </div>
    </div>
  </section>
''' % (ico(I['lock'], w='1.5'), ico(I['clock'], w='1.5'))

def cta(href='contact.html#rdv'):
    return '''<section class="cta">
    <svg class="leaves l" viewBox="0 0 300 300" aria-hidden="true"></svg>
    <svg class="leaves r" viewBox="0 0 300 300" aria-hidden="true"></svg>
    <div class="wrap inner">
      <span class="rule-long"></span>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div class="eyebrow">Votre projet, notre priorité</div>
        <h2 class="split">Prêt à révéler votre beauté ?</h2>
      </div>
      %s
    </div>
  </section>
''' % btn(href, 'Prendre rendez-vous', 'btn-gold')

def acc(items, big=False, open_first=False):
    rows = []
    for i, (q, a) in enumerate(items):
        o = open_first and i == 0
        rows.append('<div class="acc-it%s"><button type="button" aria-expanded="%s"><span class="n">%02d</span><span class="q">%s</span><span class="pl" aria-hidden="true"></span></button><div class="a"><div><p>%s</p></div></div></div>' % (
            ' open' if o else '', 'true' if o else 'false', i + 1, E(q), E(a)))
    return '<div class="acc%s rv">%s</div>' % (' acc--big' if big else '', ''.join(rows))

def faq():
    items = [(f['q'], f['a']) for f in C['pages']['sejour']['faq']]
    return '''<section class="sec" id="faq">
    <div class="wrap faq-grid">
      %s
      %s
    </div>
  </section>
''' % (sec_head('Questions fréquentes', 'Tout ce que vous vous <em>demandez</em>', 'Une autre question ? Nos conseillers vous répondent sous 24 h, en toute confidentialité.',
                link('https://wa.me/%s' % SITE['whatsapp'], 'Poser ma question')), acc(items))

def page(name, title, desc, active, body, rdv='contact.html#rdv', cta_href='contact.html#rdv'):
    html = head(title, desc) + header(active, rdv) + '<main id="top">\n  ' + body + cta(cta_href) + '</main>\n\n' + footer()
    open(os.path.join(ROOT, name), 'w', encoding='utf-8').write(html)
    print('écrit', name)

# ---------------------------------------------------------------- pages
def build_index():
    body = hero('static/img/d/hero.webp', 'Femme sereine, les yeux fermés, dans une lumière douce',
                'Chirurgie esthétique & tourisme médical', 'La renaissance de votre <em>corps</em>', SITE['home_lead'],
                btn('#poles', 'Découvrir nos pôles') + link('#rdv', 'Consultation offerte'),
                tag=('Tunis · Tunisie', 'Devis gratuit sous 24 h'), page=False)
    body += trust()
    body += '''<section class="sec" id="poles">
    <div class="wrap">
      %s
      %s
    </div>
  </section>
''' % (sec_head('Une expertise complète', 'Nos 8 pôles d’expertise', None, link('#rdv', 'Prendre rendez-vous', ' style="align-self:flex-end"')), poles_grid())
    body += why_clinic()
    body += '<section class="sec-sm" style="padding-top:0"><div class="wrap">' + stats() + '</div></section>\n'
    body += stay(C['pages']['sejour']['lead'])
    body += KINETIC + TESTI + RDV
    page('index.html', 'Perma.doctor — Chirurgie esthétique & tourisme médical en Tunisie',
         "Permagroup, groupe international de chirurgie esthétique en Tunisie. Chirurgiens d'excellence, cliniques agréées et séjour tout compris. Devis gratuit.",
         'home', body, rdv='#rdv', cta_href='#rdv')

def proc_img(pr):
    # photos par procédure à venir (brief ChatGPT) ; sans fichier, le fond dégradé + cygne prend le relais
    if not os.path.exists(os.path.join(ROOT, pr['img'])):
        return ''
    return '<img src="%s" alt="%s" loading="lazy">' % (pr['img'], E(pr['title']))

def build_poles():
    for p in POLES:
        k = p['id']; src = C['poles'][k]
        cards = []
        for i, pr in enumerate(src['procedures']):
            meta = ''.join('<span><b>%s</b> · %s</span>' % (E(a), E(b)) for a, b in pr['meta'])
            href = 'contact.html?pole=%s&amp;i=%s#rdv' % (k, E(pr['title']).replace(' ', '%20'))
            cards.append('''<article class="proc-card rv %s" style="--c:%s">
          <div class="pr-ph ci">%s<span class="num">%02d</span></div>
          <div class="pr-b"><h3>%s</h3><p>%s</p><div class="pr-meta">%s</div>%s</div>
        </article>''' % (('rv-d%d' % (i % 3)) if i % 3 else '', p['color'], proc_img(pr), i + 1,
                          E(pr['title']), E(pr['text']), meta, link(href, 'Demander un devis')))
        body = hero(HERO[k], '%s, %s' % (p['name'], src['tag']), src['tag'], E(p['name']), src['lead'],
                    btn('contact.html?pole=%s#rdv' % k, 'Prendre rendez-vous') + link('#procedures', 'Nos procédures'),
                    crumbs=[('index.html', 'Accueil'), ('index.html#poles', 'Nos pôles'), (None, p['name'])],
                    tag=(p['name'], '%d procédures' % len(src['procedures'])))
        body = body.replace('<section class="hero hero--page">', '<section class="hero hero--page" style="--pole:%s">' % p['color'])
        body += '''<section class="sec" id="procedures" style="--pole:%s">
    <div class="wrap">
      %s
      <div class="procs">%s</div>
    </div>
  </section>
''' % (p['color'], sec_head('Le pôle ' + p['name'], E(src['intro_title']), src['intro']), '\n        '.join(cards))
        body += '''<section class="sec" style="padding-top:0">
    <div class="wrap">
      %s
      %s
    </div>
  </section>
''' % (sec_head('Nos autres pôles', 'Une expertise complète'), poles_grid(exclude=k))
        page(p['page'], '%s — %s | Perma.doctor' % (p['name'], src['tag']), src['lead'], 'poles', body,
             cta_href='contact.html?pole=%s#rdv' % k)

def build_doctors():
    for d in C['doctors']:
        body = hero(d['img'], 'Portrait de %s' % d['name'], d['spec'], E(d['name']), d['summary'],
                    btn('contact.html#rdv', 'Prendre rendez-vous') + link('medecins.html', 'Toute l’équipe'),
                    crumbs=[('index.html', 'Accueil'), ('medecins.html', 'Notre équipe'), (None, d['name'])])
        body += '''<section class="sec">
    <div class="wrap prof">
      <div class="txt rv">
        <div class="eyebrow"><span class="rule"></span>Parcours</div>
        <h2 class="split">À propos du praticien</h2>
        %s
      </div>
      <aside class="dipl rv rv-d1">
        <h3>Diplômes &amp; formations</h3>
        <ul>%s</ul>
        %s
      </aside>
    </div>
  </section>
''' % (''.join('<p>%s</p>' % E(x) for x in d['about']), ''.join('<li>%s</li>' % E(x) for x in d['diplomas']),
       btn('contact.html#rdv', 'Prendre rendez-vous'))
        page(d['page'], '%s — %s | Perma.doctor' % (d['name'], d['spec']), d['summary'], 'team', body)

def build_team():
    cards = []
    for i, d in enumerate(C['doctors']):
        cards.append('''<a class="doc rv %s" href="%s" data-cursor="Profil">
          <div class="ph ci"><img src="%s" alt="%s" loading="lazy"></div>
          <div class="db"><span class="sp">%s</span><h3>%s</h3><p>%s</p>%s</div>
        </a>''' % (('rv-d%d' % (i % 4)) if i % 4 else '', d['page'], d['img'], E(d['name']), E(d['spec']), E(d['name']),
                   E(d['summary']), '<span class="link-arrow">Voir le profil %s</span>' % ARROW))
    body = hero('static/img/d/clinique.webp', 'Hall d’accueil lumineux d’une clinique', 'Notre équipe', 'Des chirurgiens d’<em>exception</em>',
                'Chirurgiens plasticiens, dentistes esthétiques et chirurgiens digestifs : une équipe pluridisciplinaire au service de votre transformation.',
                btn('contact.html#rdv', 'Prendre rendez-vous') + link('#medecins', 'Découvrir l’équipe'),
                crumbs=[('index.html', 'Accueil'), (None, 'Notre équipe')])
    body += '''<section class="sec" id="medecins">
    <div class="wrap">
      %s
      <div class="team">%s</div>
    </div>
  </section>
''' % (sec_head('Une équipe pluridisciplinaire', 'Des experts à votre écoute', 'Des chirurgiens et des dentistes reconnus, membres des plus grandes sociétés savantes internationales.'),
       '\n        '.join(cards))
    body += why_clinic('equipe', ('#medecins', 'Voir les profils'))
    page('medecins.html', 'Notre équipe — Chirurgiens d’exception | Perma.doctor',
         'Chirurgiens plasticiens, dentistes esthétiques et chirurgiens digestifs : une équipe pluridisciplinaire au service de votre transformation.', 'team', body)

def build_sejour():
    S = C['pages']['sejour']
    body = hero('static/img/d/sidi-bou-said.webp', 'Sidi Bou Saïd face à la mer', 'Tourisme médical', 'Votre séjour avec <em>Perma</em>', S['lead'],
                btn('contact.html#rdv', 'Préparer mon séjour') + link('#etapes', 'Le parcours'),
                crumbs=[('index.html', 'Accueil'), (None, 'Le séjour')], tag=('Sidi Bou Saïd', 'Accueil dès l’aéroport'))
    body += '''<section class="sec" id="etapes">
    <div class="wrap">
      %s
      <div class="steps4">%s</div>
    </div>
  </section>
''' % (sec_head('Comment ça marche', 'Un parcours en 4 étapes', 'De la première prise de contact à votre retour, nous nous occupons de tout.'),
       ''.join('<div class="step4 rv %s"><h3>%s</h3><p>%s</p></div>' % (('rv-d%d' % i) if i else '', E(s['title']), E(s['text'])) for i, s in enumerate(S['steps'])))
    body += stay(S['lead'], 'contact.html#rdv', 'Préparer mon séjour').replace('id="sejour"', 'id="sejour-services"')
    icons = [I['bed'], I['user'], I['compass'], I['shield']]
    body += '''<section class="sec" style="padding-top:0">
    <div class="wrap">
      %s
      <div class="cards4">%s</div>
    </div>
  </section>
''' % (sec_head('Inclus dans votre séjour', 'Tout est prévu pour vous'),
       ''.join('<div class="card4 rv %s">%s<h3>%s</h3><p>%s</p></div>' % (('rv-d%d' % i) if i else '', ico(icons[i % 4]), E(s['title']), E(s['text'])) for i, s in enumerate(S['included'])))
    body += faq()
    page('sejour.html', 'Le séjour — Tourisme médical en Tunisie | Perma.doctor', S['lead'], 'stay', body)

def build_about():
    A = C['pages']['about']
    body = hero('static/img/door-blue.webp', 'Porte traditionnelle bleue de Sidi Bou Saïd', 'Le groupe', 'Qui sommes-<em>nous</em> ?', A['lead'],
                btn('contact.html#rdv', 'Prendre rendez-vous') + link('#mission', 'Notre mission'),
                crumbs=[('index.html', 'Accueil'), (None, 'Qui sommes-nous')])
    body += '''<section class="sec" id="mission">
    <div class="wrap mission">
      <div class="txt rv">
        <div class="eyebrow"><span class="rule"></span>Notre mission</div>
        <h2 class="split">%s</h2>
        <p class="lead-lg">%s</p>
        %s
        <ul class="checks">%s</ul>
      </div>
      <div class="frame ci rv rv-d1" style="position:relative"><img src="static/img/door-blue.webp" alt="Porte traditionnelle bleue de Sidi Bou Saïd" loading="lazy" data-speed="-.08"><div class="badge"><b>%s</b><span>%s</span></div></div>
    </div>
    <div class="wrap">%s</div>
  </section>
''' % (E(A['mission_title']), E(A['mission'][0]), ''.join('<p>%s</p>' % E(x) for x in A['mission'][1:]),
       ''.join('<li>%s</li>' % E(x) for x in SITE['home_points']), E(A['badge'][0]), E(A['badge'][1]), stats())
    body += '''<section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="reasons rv">
        <div class="r-aside">
          <div class="eyebrow"><span class="rule"></span>Pourquoi nous</div>
          <div class="r-big" aria-hidden="true"><span>01</span></div>
          <p class="r-lbl"><em>bonnes</em> raisons<br>de nous faire confiance</p>
        </div>
        <ol class="r-list">%s</ol>
      </div>
    </div>
  </section>
''' % ''.join('<li><span class="n">%02d</span><p>%s</p></li>' % (i + 1, E(r)) for i, r in enumerate(A['reasons']))
    body += '''<section class="sec" style="padding-top:0">
    <div class="wrap">
      %s
      %s
    </div>
  </section>
''' % (sec_head('Nos valeurs', 'Ce qui nous <em>anime</em>'), acc([(v['title'], v['text']) for v in A['values']], big=True, open_first=True))
    cols = ['#0F8F93', '#C8668A', '#5E82A9', '#BFA15E', '#8282C6', '#479A8D']
    body += '''<section class="sec" style="padding-top:0">
    <div class="wrap">
      %s
      <div class="pledges">%s</div>
    </div>
  </section>
''' % (sec_head('Confiance totale', 'Entre de <em>bonnes</em> mains', 'Partir se faire opérer à l’étranger, c’est confier ce que vous avez de plus précieux. Voici nos six promesses.'),
       ''.join('<article class="pledge rv %s" style="--c:%s"><em>%s</em><h3>%s</h3><p>%s</p></article>' % (('rv-d%d' % (i % 3)) if i % 3 else '', cols[i % 6], E(x['note']), E(x['title']), E(x['text'])) for i, x in enumerate(A['pledges'])))
    body += KINETIC
    page('quisommesnous.html', 'Qui sommes-nous — Permagroup | Perma.doctor', A['lead'], 'about', body)

def build_contact():
    K = C['pages']['contact']
    body = hero('static/img/d/hero.webp', 'Femme sereine dans une lumière douce', 'Parlons de votre projet', 'Devis gratuit &amp; <em>sans engagement</em>', K['lead'],
                btn('#rdv', 'Prendre rendez-vous') + link('https://wa.me/%s' % SITE['whatsapp'], 'Écrire sur WhatsApp', ' target="_blank" rel="noopener"'),
                crumbs=[('index.html', 'Accueil'), (None, 'Contact')], tag=('Réponse sous 24 h', 'Consultation offerte'))
    body += RDV
    cards = [(I['phone'], 'Téléphone', SITE['phone'], 'tel:+21622929389'), (I['mail'], 'E-mail', SITE['email'], 'mailto:' + SITE['email']),
             (I['pin'], 'Adresse', SITE['address'], 'https://maps.google.com/?q=' + SITE['address'].replace(' ', '+')),
             (I['chat'], 'WhatsApp', 'Écrivez-nous directement', 'https://wa.me/' + SITE['whatsapp'])]
    body += '''<section class="sec" style="padding-top:0">
    <div class="wrap">
      %s
      <div class="contact-cards">%s</div>
    </div>
  </section>
''' % (sec_head('Nous contacter', 'Restons en contact'),
       ''.join('<a class="cc rv %s" href="%s"%s>%s<small>%s</small><b>%s</b></a>' % (('rv-d%d' % i) if i else '', h, ' target="_blank" rel="noopener"' if h.startswith('http') else '', ico(ic), E(t), E(v)) for i, (ic, t, v, h) in enumerate(cards)))
    body += faq()
    page('contact.html', 'Contact & devis gratuit | Perma.doctor', K['lead'], 'contact', body, rdv='#rdv', cta_href='#rdv')

if __name__ == '__main__':
    build_index(); build_poles(); build_doctors(); build_team(); build_sejour(); build_about(); build_contact()
