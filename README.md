# Camo Tracker — Modern Warfare 4 · DMZ · Warzone

App para **celular**, feito para ficar aberto ao lado enquanto você joga **Call of Duty: Modern Warfare 4**, **DMZ** e **Warzone** e acompanhar o grind de camuflagens.

## Durante o jogo

- **Grind**: as armas que você está upando, cada uma com a camuflagem atual, o desafio exato no modo escolhido e um **contador grande** (+1 / −1 / +5 / +10). Quando bate a meta, o card acende e vibra; um toque em **Concluir** passa para a próxima camuflagem e zera o contador.
- A **maestria ativa** do modo também aparece ali, com contador.
- **Tela sempre ligada** (botão ☀ no topo), **vibração** nos toques e botões grandes para usar com uma mão.
- **Instale na tela inicial** (Android: Chrome → “Instalar app”; iPhone: Safari → Compartilhar → “Adicionar à Tela de Início”). Abre em tela cheia e funciona **offline** depois da primeira visita.

## Funcionalidades

- **37 armas** (33 de lançamento + Season 1), cada uma com 8 militares → 3 especiais (com nome) → **Gold** → **Platinum** → **Harmonic Break**. Clique nos quadradinhos ou use `−`/`+`.
- **Desafio exato de cada camuflagem em cada modo** (MW4 / DMZ / WZ): desbloqueios das militares, pré-requisito e desafio das especiais, Gold e desafios de classe de Platinum/Harmonic Break.
- **Pré-requisitos do jogo**: Platinum libera com Gold em N armas da classe (8 ARs, 5 SMGs…); Harmonic Break com Platinum em 33 armas; armas de temporada contam no lugar de qualquer outra. Dá para desligar em *Ajustes*.
- **Divergence** e **Flashpoint** calculadas automaticamente.
- **Maestrias por modo**, com contador e meta editável:
  - Multiplayer: Mercurial Drift → Polyatomic Reforged → Orion Reforged
  - DMZ: Chiral → Ripple Tide → Helio
  - Warzone: Parallax → Damascus Reforged → Empyros
- **Seletor de modo** (MW4 / DMZ / WZ) sempre no topo: troca os desafios mostrados e a maestria ativa.
- Navegação inferior: **Grind**, **Armas** (toque numa arma para ver todos os desafios; ★ põe no grind), **Progresso** e **Ajustes**.
- Filtros por classe, status e busca; anotações por arma.
- **Armas novas** que ainda não estejam nos dados podem ser adicionadas à mão; as do jogo podem ser ocultadas.
- Progresso salvo no navegador (localStorage) + **exportar/importar JSON**.

> As camuflagens base são compartilhadas entre os modos; só as maestrias são separadas por modo.

## Sobre os dados

Armas, desafios e maestrias vêm do projeto open source [Divergence](https://github.com/ItchyBeard/Divergence) (ItchyBeard, licença MIT — veja [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)), que por sua vez se baseia numa planilha mantida pela comunidade. Requisitos ainda não publicados aparecem com um ponto amarelo — confirme no jogo.

O arquivo [`src/data/divergence.generated.json`](src/data/divergence.generated.json) é gerado por script; não edite à mão. Para atualizar quando sair temporada nova:

```bash
git clone --depth 1 https://github.com/ItchyBeard/Divergence.git /tmp/Divergence
npm run import:divergence -- /tmp/Divergence
```

O script confere se a licença continua MIT e registra o commit importado (aparece em *Ajustes → Fonte dos dados*).

Projeto de fã, sem afiliação com a Activision.

## Rodando localmente

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
```

## Deploy

Site estático (`dist/`), funciona em qualquer host. O workflow em `.github/workflows/deploy.yml` publica no **GitHub Pages** a cada push na `main` — ative em *Settings → Pages → Source: GitHub Actions*.
