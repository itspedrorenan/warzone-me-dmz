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

## Dados e imagens

- Armas, desafios, maestrias e prestígio: [Divergence](https://github.com/ItchyBeard/Divergence) (MIT),
  importado com `npm run import:divergence -- <clone-do-Divergence>`.
- Fotos das armas e texturas principais: imagens oficiais de callofduty.com.
- Texturas das especiais: CodCentral, com autorização.
- Detalhes e planos: [docs/miniaturas.md](docs/miniaturas.md).

A versão anterior ao recomeço (15/11/2026) está no commit `a7d28ab`.
