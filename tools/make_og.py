"""Images de partage (Open Graph 1200×630, JPEG) pour chaque page.

    python3 tools/make_og.py
"""
import json, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'static/img/og')
W, H = 1200, 630

def crop(src, dst, top=0.35):
    im = Image.open(os.path.join(ROOT, src)).convert('RGB')
    s = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x = (im.width - W) // 2
    y = round((im.height - H) * top)
    im.crop((x, y, x + W, y + H)).save(os.path.join(OUT, dst), 'JPEG', quality=82, optimize=True, progressive=True)

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    C = json.load(open(os.path.join(ROOT, 'content/site.json'), encoding='utf-8'))
    crop('static/img/d/hero.webp', 'home.jpg')
    crop('static/img/d/clinique.webp', 'equipe.jpg')
    crop('static/img/d/sidi-bou-said.webp', 'sejour.jpg')
    crop('static/img/door-blue.webp', 'groupe.jpg')
    for k, src in {'face': 'hero-2', 'breast': 'hero-1', 'shape': 'hero-3', 'cosmetic': 'hero-4', 'thin': 'pole-thin',
                   'teeth': 'pole-teeth', 'men': 'pole-men', 'graft': 'pole-graft'}.items():
        crop('static/img/%s.webp' % src, 'pole-%s.jpg' % k)
    for d in C['doctors']:
        crop(d['img'], 'dr-' + os.path.basename(d['img']).replace('.webp', '.jpg')[3:], top=0.2)
    print(sorted(os.listdir(OUT)))
