"""Junta as fotos arma+camuflagem de cada arma numa tira vertical (uma imagem por arma).

Entrada: .cache/renders/<arma>/<camuflagem>.webp (baixadas por fetch-renders.sh).
Saída:   public/renders/<arma>.webp e src/data/renderImages.generated.json
         ({arma: [camuflagens na ordem das faixas]}).

  pip install pillow
  python scripts/codcentral/build-sprites.py
"""
import json, os, sys
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, '.cache', 'renders')
OUT = os.path.join(ROOT, 'public', 'renders')
W, H = 720, 307

os.makedirs(OUT, exist_ok=True)
index = {}
for weapon in sorted(os.listdir(SRC)):
    d = os.path.join(SRC, weapon)
    keys = sorted(f[:-5] for f in os.listdir(d) if f.endswith('.webp'))
    if not keys:
        continue
    strip = Image.new('RGB', (W, H * len(keys)))
    for i, k in enumerate(keys):
        im = Image.open(os.path.join(d, k + '.webp')).convert('RGB')
        if im.size != (W, H):
            im = im.resize((W, H), Image.LANCZOS)
        strip.paste(im, (0, i * H))
    strip.save(os.path.join(OUT, weapon + '.webp'), 'WEBP', quality=82, method=6)
    index[weapon] = keys
with open(os.path.join(ROOT, 'src', 'data', 'renderImages.generated.json'), 'w') as f:
    json.dump(index, f)
print(len(index), 'armas,', sum(map(len, index.values())), 'fotos')
