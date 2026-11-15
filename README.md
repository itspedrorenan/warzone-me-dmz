# Camo Tracker — MW4 · DMZ · Warzone

Projeto pessoal de estudo e hobby: um camo tracker para usar no celular enquanto joga
Modern Warfare 4, DMZ e Warzone. **Uso local, não é publicado.** Sem afiliação com a Activision.

> O repositório deve ficar **privado**: ele contém imagens do jogo (© Activision) e texturas
> usadas com autorização do CodCentral apenas para este uso pessoal. Ver `THIRD_PARTY_NOTICES.md`.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173 (no celular: use o IP do computador na mesma rede)
npm run build    # gera dist/
```

## Jogos antigos (MW 2019) — só local

Os desafios do Modern Warfare (2019) vêm do CODMunity, com permissão **só para uso local**.
Por isso eles não ficam no repositório nem vão para a Vercel. Para ver o MW 2019 na sua
máquina:

```sh
npm run import:codmunity -- mw19   # gera src/data/local/mw19.json (no .gitignore)
npm run dev -- --host              # abra o endereço "Network" no celular, na mesma rede Wi-Fi
```

Com o arquivo presente, aparece um seletor de jogo no topo do app (MW4 / MW 2019). Sem ele,
o app mostra só o MW4.

## Dados e imagens

- Armas, desafios, maestrias e prestígio: [Divergence](https://github.com/ItchyBeard/Divergence) (MIT),
  importado com `npm run import:divergence -- <clone-do-Divergence>`.
- Fotos das armas e texturas principais: imagens oficiais de callofduty.com.
- Texturas das especiais: CodCentral, com autorização.
- Detalhes e planos: [docs/miniaturas.md](docs/miniaturas.md).

A versão anterior ao recomeço (15/11/2026) está no commit `a7d28ab`.
