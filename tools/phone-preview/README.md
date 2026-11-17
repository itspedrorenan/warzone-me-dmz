# Preview no celular

Moldura de celular (390×844, estilo iPhone, com ilha e barra inferior) para mostrar um app mobile
numa página: no computador o app aparece dentro do celular, escalado para caber na janela; num
celular de verdade (até 500px) ele ocupa a tela toda, sem moldura.

Como usar:
1. Coloque o app (o `index.html` gerado pelo build) ao lado como `app.html`, ou passe outro
   arquivo com `?src=caminho.html`.
2. Publique `index.html` (esta moldura) + `app.html` + os arquivos do app.
3. Opcional: dentro do app, quando a URL tiver `frame=1`, reserve 44px no topo (ilha) e 20px na
   base (barra) — este projeto faz isso com as variáveis `--safe-t` e `--safe-b`.
