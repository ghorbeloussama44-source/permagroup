"""Extrait les textes d'origine du site (pages HTML actuelles) vers content/site.json.
À lancer une seule fois, avant la refonte des gabarits."""
import json, re, glob
from bs4 import BeautifulSoup

def soup(f): return BeautifulSoup(open(f, encoding='utf-8').read(), 'html.parser')
def txt(el): return re.sub(r'\s+', ' ', el.get_text(' ', strip=True)).replace(' ,', ',').replace(' .', '.').strip() if el else ''

POLES = {'face':'permaface','breast':'permabreast','shape':'permashape','thin':'permathin',
         'cosmetic':'permacosmetic','teeth':'permateeth','men':'permamen','graft':'permagraft'}
out = {'poles': {}, 'doctors': [], 'pages': {}}

for k, f in POLES.items():
    s = soup(f + '.html')
    ph = s.select_one('.phero')
    head = s.select_one('.section-head')
    procs = []
    for p in s.select('.proc'):
        procs.append({
            'title': txt(p.select_one('h3')),
            'text': txt(p.select_one('p')),
            'img': p.select_one('.proc__media img')['src'],
            'meta': [[txt(d.select_one('b')), txt(d).replace(txt(d.select_one('b')), '').strip()] for d in p.select('.meta > div')],
        })
    out['poles'][k] = {'page': f + '.html', 'name': txt(ph.select_one('h1')), 'tag': txt(ph.select_one('.eyebrow')),
                       'lead': txt(ph.select_one('p')), 'intro_title': txt(head.select_one('h2')),
                       'intro': txt(head.select_one('p')), 'procedures': procs}

# médecins (liste + profils)
s = soup('medecins.html')
for c in s.select('.doc-card'):
    href = c.select_one('a')['href']
    d = soup(href)
    sec = d.select('section.section')[0]
    cols = sec.select('.split > div')
    out['doctors'].append({
        'page': href, 'name': txt(c.select_one('h3')), 'spec': txt(c.select_one('.spec')),
        'summary': txt(c.select_one('p')), 'img': c.select_one('img')['src'],
        'about': [txt(p) for p in cols[0].select('p')],
        'diplomas': [txt(li) for li in cols[1].select('li')],
    })

# séjour
s = soup('sejour.html')
out['pages']['sejour'] = {
    'lead': txt(s.select_one('.phero p')),
    'steps': [{'title': txt(x.select_one('h3')), 'text': txt(x.select_one('p'))} for x in s.select('.step')],
    'included': [{'title': txt(x.select_one('h3')), 'text': txt(x.select_one('p'))} for x in s.select('.grid-cards .scard')],
    'faq': [{'q': txt(x.select_one('.val__t')), 'a': txt(x.select_one('.val__body p'))} for x in s.select('.vals--faq .val')],
}
# qui sommes-nous
s = soup('quisommesnous.html')
mission = s.select('section.section')[0]
out['pages']['about'] = {
    'lead': txt(s.select_one('.phero p')),
    'mission_title': txt(mission.select_one('h2')),
    'mission': [txt(p) for p in mission.select('p')],
    'badge': [txt(mission.select_one('.split__badge b')), txt(mission.select_one('.split__badge span'))],
    'values': [{'title': txt(x.select_one('.val__t')), 'text': txt(x.select_one('.val__body p'))} for x in s.select('.vals:not(.vals--faq) .val')],
    'reasons': [txt(x.select_one('p')) for x in s.select('.why__item')],
    'pledges': [{'title': txt(x.select_one('h3')), 'text': txt(x.select_one('p')), 'note': txt(x.select_one('.pledge__note'))} for x in s.select('.pledge')],
}
# accueil (texte d'origine) + contact
s = soup('contact.html')
out['pages']['contact'] = {
    'lead': txt(s.select_one('.phero p')),
    'info': [{'title': txt(x.select_one('h4')), 'text': txt(x.select_one('p'))} for x in s.select('.ci')],
}
out['site'] = {
    'phone': '(+216) 22 929 389', 'whatsapp': '21622929389', 'email': 'contact@perma.doctor',
    'address': 'Immeuble Perma, HI64 Hédi Nouira, Borj Louzir, Ariana, Tunisie',
    'about_short': "Permagroup, groupe international de chirurgie esthétique spécialisé dans le tourisme médical en Tunisie. Des chirurgiens d'excellence, des cliniques agréées et un séjour pensé pour vous.",
    'home_lead': "Permagroup réunit les meilleurs chirurgiens esthétiques de Tunisie, des cliniques agréées et un séjour pensé pour vous. Un résultat naturel, en toute sécurité.",
    'home_about': "Permagroup est une société de chirurgie esthétique à l'échelle internationale, spécialisée dans le tourisme médical en Tunisie.",
    'home_points': ["Des chirurgiens parmi les plus renommés, formés en Europe et en Amérique du Nord.",
                    "Des cliniques privées luxueuses, conformes aux normes d'hygiène les plus strictes.",
                    "Une assistance personnalisée, de l'aéroport au retour, et un séjour inoubliable."],
    'stats': [["15+", "ans d'expérience"], ["8", "pôles spécialisés"], ["5000+", "patients satisfaits"], ["4", "filiales internationales"]],
}
json.dump(out, open('content/site.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('pôles', len(out['poles']), '| procédures', sum(len(p['procedures']) for p in out['poles'].values()),
      '| médecins', len(out['doctors']), '| raisons', len(out['pages']['about']['reasons']))
