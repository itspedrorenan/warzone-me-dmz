# Miniaturas das armas

## Como está hoje (opção 2)

- As 33 armas de lançamento usam a arma das imagens oficiais, com as cores originais, só recortada
  do fundo (fundo transparente). Imagens
  oficiais do [post de lançamento do MW4](https://www.callofduty.com/blog/2026/10/call-of-duty-modern-warfare-4-launch-multiplayer-operators-weapons-equipment-create-a-class)
  (cards `MW4-RFL-OPS-WEAPONS-009.webp` a `-041.webp`, na ordem dos títulos do post).
- Arquivos: `public/weapons/<id-da-arma>.webp`. A lista de quais armas têm imagem fica em
  `src/data/weaponImages.ts`.
- Imagens © Activision. O crédito aparece em Ajustes → Fonte dos dados.
- **Sem imagem ainda** (mostram um espaço reservado com a classe): Cronen Osprey, CSG-35, JAK 12 e
  ZLR Talonhawk. Os posts oficiais da Season 1 não trazem imagem individual delas.
- **Podem melhorar com print do jogo:** Mosin-Nagant (a coronha escura de madeira se confunde com o
  fundo e pode sair incompleta).
- **Já testado e descartado:** traço automático, estilo "ícone de build" (arma clara com detalhes em
  cinza) e desenho técnico automático. Ficaram com cara de filtro. Um blueprint no nível de uma
  ilustração (linhas limpas desenhadas à mão) precisa ser desenhado manualmente, arma por arma.

## Para fazer depois (opção 3): prints do próprio jogo

Ideia: trocar ou completar as miniaturas usando prints tirados no jogo, recortados do fundo do
mesmo jeito. Serve para as armas sem imagem e para qualquer uma cuja miniatura atual
não ficou boa. As imagens continuam sendo da Activision, como na opção 2.

### Como tirar os prints

1. No jogo, abra o **Gunsmith** (ou a pré-visualização da arma) com a arma **sem acessórios** e
   **sem camuflagem**, se possível.
2. Arma de lado, inteira na tela, sobre fundo escuro e liso.
3. Celular ou console na horizontal, resolução cheia. Sem menus por cima da arma.
4. Um print por arma. Nomeie com o id da arma, ex.: `cronen-osprey.png`, `csg-35.png`
   (os ids estão em `src/data/divergence.generated.json`).

### Como converter

```bash
pip install opencv-python-headless pillow numpy
python scripts/weapon-thumbnails/blueprint.py prints/cronen-osprey.png public/weapons/cronen-osprey.webp --crop 0.2,0.8,0.1,0.9
```

- O estilo padrão é `--style original` (o do app). Os outros (`blueprint`, `flat`, `line`) ficaram
  só como teste.
- `--crop y0,y1,x0,x1` recorta a região da arma em frações da imagem (0 a 1). Ajuste até a arma
  ficar inteira e sem pedaços do menu. O padrão do script serve só para os cards oficiais.
- Depois de gerar, acrescente o id em `src/data/weaponImages.ts`.
- Ou mande os prints para o Claude numa sessão e peça para converter e incluir.

## Texturas das camuflagens

- Recortes de 128×128 das imagens oficiais do [post de progressão do MW4](https://www.callofduty.com/blog/2026/10/call-of-duty-modern-warfare-4-ready-for-launch-progression-prestige)
  (`MW4-RFL-PROGRESSION-019` a `-039`). Imagens © Activision.
- Arquivos: `public/camos/<id>.webp`; lista em `src/data/camoImages.ts`; gerador em
  `scripts/camo-textures/swatches.py`.
- Têm textura: militares 1–8, Gold, Platinum, Harmonic Break, Divergence, as 9 maestrias, as 4 de
  prestígio (Pyroclast, Terminus, Scatter, Cascade) e 14
  especiais que aparecem no post (HAN 86, Sang 9mm, Wz.55 Striga, Oden, Mosin-Nagant, Hyeon Burst,
  FSS Carbon Edge, Signal 50, Krait P68, Kastov 762). As demais especiais e o Flashpoint ficam brancos.
- Onde aparecem: escada da arma, barrinha de progresso, quadrado "Agora" no Grind, maestrias e
  Divergence. Concluída aparece em cores; pendente aparece em cinza e apagada.

## Texturas das especiais

- 14 especiais vêm do post oficial; as outras 91 vêm do CodCentral, com autorização (ver
  `THIRD_PARTY_NOTICES.md`). Baixadas uma vez, uma por segundo, de
  `codcentral.net/assets/library/mw4/dmz/camos/<arma>/swatch-<camuflagem>.webp`.
- Faltam: as 3 especiais da JAK 12 e as da ZLR Talonhawk (ainda sem nome publicado) e o Flashpoint.

## Se faltar alguma especial (prints do jogo)

1. No jogo, abra o menu de camuflagens de cada arma, na aba das especiais, com as 3 visíveis.
2. Um print por arma, sem nada por cima das camuflagens. Nomeie com o id da arma
   (ex.: `m4-especiais.png`).
3. Mande para o Claude numa sessão: ele recorta cada textura em `public/camos/<nome-da-camuflagem>.webp`
   (ex.: `myriad.webp`) e acrescenta o id em `src/data/camoImages.ts`. O nome de cada especial
   está em `src/data/divergence.generated.json`.

## Fotos da arma com cada camuflagem

- No painel da arma, tocar no quadrado de uma camuflagem mostra a arma com ela aplicada.
- 630 fotos (35 armas × 14 da escada + 4 de prestígio) do CodCentral, com autorização. Ficam numa
  tira por arma em `public/renders/<arma>.webp` (uma faixa por camuflagem); a ordem das faixas está em
  `src/data/renderImages.generated.json`. Para refazer: `scripts/codcentral/fetch-renders.sh` e
  `python scripts/codcentral/build-sprites.py`.
- Sem foto: JAK 12 e ZLR Talonhawk (ainda não lançadas).
