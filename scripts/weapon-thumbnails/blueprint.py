"""Converte a imagem de uma arma em traço preto e branco (estilo blueprint).

Saída: WebP (ou PNG) com linhas brancas e preenchimento leve sobre fundo transparente.
O app usa a imagem como máscara, então a cor final vem do token --text.

Requer: pip install opencv-python-headless pillow numpy

Uso:
  python scripts/weapon-thumbnails/blueprint.py ENTRADA SAIDA.webp [--style flat|line] [--crop y0,y1,x0,x1]

--crop recorta a área da arma em frações da imagem (0 a 1). O padrão
(0.085,0.645,0.02,0.98) serve para os cards oficiais 1920x1080 do post de lançamento.
Para prints do Gunsmith, ajuste para a região onde a arma aparece, ex.: --crop 0.2,0.8,0.1,0.9
"""
import argparse, cv2, numpy as np
from PIL import Image

DEFAULT_CROP = (0.085, 0.645, 0.02, 0.98)

def silhouette(crop):
    """Máscara da arma: detalhe local separa do fundo esfumaçado; GrabCut refina a borda."""
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    bg = cv2.GaussianBlur(gray, (0, 0), 25)
    diff = cv2.absdiff(gray, bg)
    sil = (cv2.GaussianBlur(diff, (0, 0), 1.5) > 12).astype(np.uint8) * 255
    sil = cv2.morphologyEx(sil, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    cnts, _ = cv2.findContours(sil, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    sil = np.zeros_like(sil); cv2.drawContours(sil, cnts, -1, 255, -1)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(sil)
    if n > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        keep = [i + 1 for i, a in enumerate(areas) if a > areas.max() * 0.05]
        sil = np.isin(lab, keep).astype(np.uint8) * 255
    # GrabCut: dentro da máscara erodida = arma provável; fora da dilatada = fundo.
    gc = np.full(sil.shape, cv2.GC_BGD, np.uint8)
    gc[cv2.dilate(sil, np.ones((9, 9), np.uint8)) > 0] = cv2.GC_PR_BGD
    gc[cv2.erode(sil, np.ones((7, 7), np.uint8)) > 0] = cv2.GC_PR_FGD
    gc[cv2.erode(sil, np.ones((21, 21), np.uint8)) > 0] = cv2.GC_FGD
    bgm, fgm = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(crop, gc, None, bgm, fgm, 6, cv2.GC_INIT_WITH_MASK)
    out = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    out = cv2.morphologyEx(out, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    cnts, _ = cv2.findContours(out, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if cnts:
        biggest = max(cv2.contourArea(c) for c in cnts)
        cnts = [c for c in cnts if cv2.contourArea(c) > max(400, biggest * 0.03)]
    final = np.zeros_like(out); cv2.drawContours(final, cnts, -1, 255, -1)
    # Tira a franja de fumaça que sobra na borda.
    return cv2.erode(final, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))

def flat(src, out, width=480, crop=DEFAULT_CROP):
    """Estilo dos ícones de build do jogo: arma em branco/cinza claro, detalhes em cinza."""
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    c = img[int(h * crop[0]):int(h * crop[1]), int(w * crop[2]):int(w * crop[3])]
    sil = silhouette(c)
    gray = cv2.cvtColor(c, cv2.COLOR_BGR2GRAY).astype(np.float32)
    gray = cv2.bilateralFilter(gray, 9, 30, 9)
    inside = sil > 0
    lo, hi = np.percentile(gray[inside], [3, 97])
    norm = np.clip((gray - lo) / max(hi - lo, 1), 0, 1)
    # Tons claros: 0.58 a 1.0, como o render branco do jogo.
    tone = 0.58 + 0.42 * norm
    edges = cv2.Canny(cv2.GaussianBlur(cv2.cvtColor(c, cv2.COLOR_BGR2GRAY), (3, 3), 0), 60, 150)
    edges = cv2.bitwise_and(edges, cv2.erode(sil, np.ones((5, 5), np.uint8)))
    tone[edges > 0] *= 0.55
    rgb = (np.clip(tone, 0, 1) * 255).astype(np.uint8)
    alpha = cv2.GaussianBlur(sil, (3, 3), 0)
    ys, xs = np.nonzero(alpha > 0)
    pad = 10
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, alpha.shape[1])
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, alpha.shape[0])
    rgba = np.dstack([rgb, rgb, rgb, alpha])[y0:y1, x0:x1]
    im = Image.fromarray(rgba, 'RGBA')
    im = im.resize((width, max(1, round(im.height * width / im.width))), Image.LANCZOS)
    if out.lower().endswith('.png'):
        im.save(out, optimize=True)
    else:
        im.save(out, 'WEBP', quality=85, method=6)
    return im.size

def convert(src, out, width=480, crop=DEFAULT_CROP):
    img = cv2.imread(src, cv2.IMREAD_COLOR)
    h, w = img.shape[:2]
    # Área da arma no card 1920x1080 (sem cabeçalho e sem os painéis de baixo).
    sy0, sy1 = int(h * crop[0]), int(h * crop[1])
    sx0, sx1 = int(w * crop[2]), int(w * crop[3])
    crop = img[sy0:sy1, sx0:sx1]
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
    # Separa a arma do fundo esfumaçado: fundo = desfoque forte.
    bg = cv2.GaussianBlur(gray, (0, 0), 25)
    diff = cv2.absdiff(gray, bg)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(gray)
    # Silhueta: pixels com detalhe local, unidos e filtrados pelo maior objeto.
    sil = (cv2.GaussianBlur(diff, (0, 0), 1.5) > 12).astype(np.uint8) * 255
    sil = cv2.morphologyEx(sil, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    # preenche buracos internos
    cnts, _ = cv2.findContours(sil, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    sil = np.zeros_like(sil); cv2.drawContours(sil, cnts, -1, 255, -1)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(sil)
    if n > 1:
        areas = stats[1:, cv2.CC_STAT_AREA]
        biggest = areas.max()
        keep = [i + 1 for i, a in enumerate(areas) if a > biggest * 0.05]
        sil = np.isin(lab, keep).astype(np.uint8) * 255
    sil = cv2.morphologyEx(sil, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    sil = cv2.erode(sil, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    # Linhas: Canny sobre a imagem realçada, só dentro da silhueta.
    smooth = cv2.bilateralFilter(clahe, 9, 60, 9)
    edges = cv2.Canny(smooth, 70, 170)
    inside = cv2.dilate(sil, np.ones((3, 3), np.uint8))
    edges = cv2.bitwise_and(edges, inside)
    # Contorno externo mais grosso.
    contour = cv2.morphologyEx(sil, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8))
    lines = cv2.max(edges, contour)
    lines = cv2.dilate(lines, np.ones((2, 2), np.uint8))
    # Remove pontinhos soltos.
    n, lab, stats, _ = cv2.connectedComponentsWithStats((lines > 0).astype(np.uint8))
    small = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] < 40]
    lines[np.isin(lab, small)] = 0
    alpha = np.maximum(lines, (sil > 0).astype(np.uint8) * 28)
    ys, xs = np.nonzero(alpha > 0)
    if len(xs) == 0:
        raise SystemExit(f'nada detectado em {src}')
    pad = 12
    x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, alpha.shape[1])
    y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, alpha.shape[0])
    a = alpha[y0:y1, x0:x1]
    rgba = np.dstack([np.full_like(a, 255)] * 3 + [a])
    im = Image.fromarray(rgba, 'RGBA')
    ratio = width / im.width
    im = im.resize((width, max(1, round(im.height * ratio))), Image.LANCZOS)
    if out.lower().endswith('.png'):
        im.save(out, optimize=True)
    else:
        im.save(out, 'WEBP', quality=82, method=6)
    return im.size

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('entrada')
    ap.add_argument('saida')
    ap.add_argument('--crop', default=','.join(map(str, DEFAULT_CROP)))
    ap.add_argument('--width', type=int, default=480)
    ap.add_argument('--style', choices=['flat', 'line'], default='flat',
                    help='flat: arma clara com detalhes em cinza (padrão, estilo do jogo); line: só o traço')
    a = ap.parse_args()
    fn = flat if a.style == 'flat' else convert
    print(fn(a.entrada, a.saida, a.width, tuple(float(x) for x in a.crop.split(','))))
