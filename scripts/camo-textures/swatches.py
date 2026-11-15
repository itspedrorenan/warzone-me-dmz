"""Recorta amostras de textura das camuflagens a partir das imagens oficiais do MW4.

Fonte: post "Ready for Launch: Modern Warfare 4 Progression and Prestige" (callofduty.com).
Baixe as imagens MW4-RFL-PROGRESSION-0NN.webp listadas em SOURCES para uma pasta e rode:

  pip install pillow
  python scripts/camo-textures/swatches.py PASTA_DAS_IMAGENS public/camos

Gera public/camos/<id>.webp (128x128). Imagens © Activision.
"""
import sys
from PIL import Image

BASE = 'https://imgs.callofduty.com/content/dam/atvi/callofduty/cod-touchui/blog/body/mw4/rfl-progression/'
SOURCES = ['019', '020', '021', '024', '025', '026', '027', '029', '030', '031', '033', '034', '035', '037', '038', '039',
           '044', '045', '046', '047']
SIZE = 128


def main(src, out):
    def img(n):
        return Image.open(f'{src}/MW4-RFL-PROGRESSION-{n}.webp').convert('RGB')

    crops = {}
    # Grade 4x2 de fuzis (militares e especiais de exemplo): recorte no corpo do receptor.
    def grid4(im, names):
        cols, rows = [35, 263, 492, 722], [52, 297]
        for i, name in enumerate(names):
            x0, y0 = cols[i % 4] * 2, rows[i // 4] * 2
            crops[name] = (im, (x0 + 170, y0 + 60, x0 + 370, y0 + 260))

    grid4(img('019'), [f'military-{i}' for i in range(1, 9)])
    grid4(img('020'), ['stellation', 'hot-rod', 'sticker-shock', 'kitty-kaos',
                       'deathbed', 'sunburn', 'urban-flamingo', 'yellow'])
    # Grade 3x2: HAN 86 em cima, Sang 9mm embaixo.
    im = img('021')
    for i, name in enumerate(['smoke', 'stormwave', 'red']):
        x0, y0 = [145, 373, 601][i] * 2, 52 * 2
        crops[name] = (im, (x0 + 170, y0 + 60, x0 + 370, y0 + 260))
    for i, name in enumerate(['autumn', 'snakeskin', 'space-time']):
        x0, y0 = [145, 373, 601][i] * 2, 297 * 2
        crops[name] = (im, (x0 + 60, y0 + 60, x0 + 260, y0 + 260))
    # Completionist, maestrias e prestígio: close-up do receptor no painel de cima à direita.
    for n, name in [('024', 'gold'), ('025', 'platinum'), ('026', 'harmonic-break'), ('027', 'divergence'),
                    ('029', 'mercurial-drift'), ('030', 'polyatomic-reforged'), ('031', 'orion-reforged'),
                    ('033', 'chiral'), ('034', 'ripple-tide'), ('035', 'helio'),
                    ('037', 'parallax'), ('038', 'damascus-reforged'), ('039', 'empyros'),
                    ('044', 'pyroclast'), ('045', 'pyroclast-terminus'), ('046', 'pyroclast-scatter'),
                    ('047', 'pyroclast-cascade')]:
        crops[name] = (img(n), (1560, 370, 1760, 570))

    for name, (im, box) in crops.items():
        im.crop(box).resize((SIZE, SIZE), Image.LANCZOS).save(f'{out}/{name}.webp', 'WEBP', quality=86, method=6)
    print(len(crops), 'texturas')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
