# Third-party notices

## Divergence (ItchyBeard)

Os dados de armas e camuflagens em `src/data/divergence.generated.json` são derivados de
[ItchyBeard/Divergence](https://github.com/ItchyBeard/Divergence), distribuído sob a licença MIT:

```
MIT License

Copyright (c) 2025 ItchyBeard

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## CodCentral (codcentral.net)

As texturas de 91 camuflagens especiais em `public/camos/` vieram da biblioteca de imagens do
[CodCentral](https://codcentral.net/blog/mw4-dmz-camo-challenges/). O uso foi autorizado pela equipe
do CodCentral via Discord, segundo informou o dono deste projeto em 15/11/2026. Crédito exibido no
app onde as texturas aparecem. Se o CodCentral pedir, essas imagens serão removidas.

Arquivos: `anaconda.webp`, `ash-pine.webp`, `asphalt.webp`, `backcountry.webp`, `black-grip.webp`, `black-topo.webp`, `blackwell.webp`, `blue-tiger.webp`, `brown.webp`, `brushstroke.webp`, `bubblegum-ops.webp`, `carbonated.webp`, `chained.webp`, `corrupted-clay.webp`, `currents.webp`, `cyan.webp`, `dark-ichor.webp`, `dark-moss.webp`, `dark-tan.webp`, `deep-space.webp`, `desert-tactics.webp`, `digi-bark.webp`, `digital-fall.webp`, `disperse.webp`, `dread-plague.webp`, `dry-brush.webp`, `dune-sea.webp`, `fire-topo.webp`, `foxtrail.webp`, `fractal-snow.webp`, `frontier.webp`, `frosted.webp`, `fungal-grid.webp`, `garland.webp`, `ghast.webp`, `green-tiger.webp`, `green.webp`, `gunmetal.webp`, `hibiscus.webp`, `ice-sheer.webp`, `in-the-weeds.webp`, `iron.webp`, `jungle-shadow.webp`, `lime.webp`, `magma-ire.webp`, `mangrove.webp`, `miami.webp`, `mineral.webp`, `myriad.webp`, `night-ops.webp`, `night-snow.webp`, `off-grid.webp`, `oni.webp`, `optical-reverb.webp`, `outcrop.webp`, `phantom-flux.webp`, `polyhedron.webp`, `ponderosa.webp`, `raster-aux.webp`, `raster-lite.webp`, `rattlesnake.webp`, `recursive.webp`, `red-rain.webp`, `red-tiger.webp`, `redshift.webp`, `rind.webp`, `ripplewave.webp`, `samnim.webp`, `sandwash.webp`, `scorch.webp`, `shale.webp`, `smokescreen.webp`, `sniper-veil.webp`, `spidersilk.webp`, `splatter-ops.webp`, `splinter-rock.webp`, `stockpile.webp`, `stone-bits.webp`, `struck-oil.webp`, `sunset-tropic.webp`, `tectonic.webp`, `tension.webp`, `thicket.webp`, `thunderhead.webp`, `tiger-swipe.webp`, `treeline.webp`, `urban-smoke.webp`, `urban-standard.webp`, `wallpaper.webp`, `white-pine.webp`, `white.webp`.

### Fotos das armas com camuflagem

As 630 fotos de cada arma com cada camuflagem da escada e de prestígio também vieram da biblioteca
do CodCentral, com a mesma autorização. Baixadas uma vez, uma a cada 0,5 s, por
`scripts/codcentral/fetch-renders.sh`, e juntadas numa tira por arma em `public/renders/<arma>.webp`
por `scripts/codcentral/build-sprites.py`.

## Lucide (ícones)

Ícones do [Lucide](https://lucide.dev) (`lucide-react`), licença ISC. Copyright (c) Lucide Contributors.

## Imagens oficiais

Fotos das armas e as demais texturas foram recortadas de imagens oficiais publicadas em
callofduty.com.

Os logos de Modern Warfare 4, DMZ e Warzone em `public/modes/` foram enviados pelo dono deste
projeto. O do MW4 está nas cores originais; os de DMZ e Warzone viraram silhuetas brancas (o do
DMZ sem o "Call of Duty" de cima).

Os logos dos jogos em `public/games/` (MW4, Modern Warfare 2019 e Modern Warfare III) também
foram enviados pelo dono deste projeto: MW4 e MW III nas cores originais, MW 2019 em branco.

## CODMunity (codmunity.gg) — jogos antigos, uso local

Os desafios de camuflagem do Modern Warfare (2019), com as imagens das armas e das
camuflagens (carregadas direto de assets.codmunity.gg), vêm do CODMunity. O dono deste projeto
informou ter permissão do CODMunity **só para uso local** (15/11/2026). Por isso o script
`scripts/import-codmunity.mjs` grava os dados em `src/data/local/`, que está no `.gitignore`:
eles não são versionados nem publicados.

Call of Duty, Modern Warfare, Warzone e DMZ são marcas da Activision Publishing, Inc. Este projeto não tem afiliação com a Activision.
