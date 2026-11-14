# Camo Tracker — Modern Warfare 4 · DMZ · Warzone

Web app para acompanhar o grind de camuflagens do **Call of Duty: Modern Warfare 4**, com foco em Multiplayer, **DMZ** e **Warzone**.

## Funcionalidades

- **Escada por arma** (33 armas de lançamento): 8 militares → 3 especiais → **Gold** → **Platinum** → **Harmonic Break**. Clique nos quadradinhos ou use `−`/`+`.
- **Pré-requisitos do jogo**: Platinum só libera com Gold em todas as armas da classe; Harmonic Break só com Platinum em todas. Dá para desligar em *Ajustes*.
- **Divergence** e **Flashpoint** calculadas automaticamente.
- **Maestrias por modo**, com contador e meta editável:
  - Multiplayer: Mercurial Drift → Polyatomic Reforged → Orion Reforged
  - DMZ: Chiral → Ripple Tide → Helio
  - Warzone: Parallax → Damascus Reforged → Empyros
- **Seletor de modo** (MW4 / DMZ / WZ): troca as dicas dos desafios e destaca a coluna de maestria do modo.
- **Grind atual**: fixe armas com ★ para vê-las no topo.
- Filtros por classe, status e busca; anotações por arma.
- **Armas de temporada**: adicione, renomeie, remova ou tire da contagem de Divergence.
- Progresso salvo no navegador (localStorage) + **exportar/importar JSON**.

> As camuflagens base são compartilhadas entre os modos; só as maestrias são separadas por modo.

## Sobre os dados

Lista de armas e requisitos vêm de guias públicos, que **divergem** em alguns pontos (contagem de armas, requisitos de Helio, Parallax, Chiral, desafios de classe em DMZ/Warzone). Itens incertos aparecem com um ponto amarelo — confirme no jogo. Tudo fica em [`src/data.ts`](src/data.ts) e as metas das maestrias são editáveis no app.

Projeto de fã, sem afiliação com a Activision.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

## Deploy

Site estático (`dist/`), funciona em qualquer host. O workflow em `.github/workflows/deploy.yml` publica no **GitHub Pages** a cada push na `main` — ative em *Settings → Pages → Source: GitHub Actions*.
