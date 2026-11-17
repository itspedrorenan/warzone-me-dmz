# Instruções para o Claude

- Responda sempre em português.
- **Preview de app:** sempre que o usuário disser que vamos fazer (ou mostrar) um app, mostre o
  app dentro da moldura de celular de `tools/phone-preview/` (veja o README.md de lá): a página
  publicada é a moldura e o app roda num iframe (`app.html`).
- Versão do app em `src/version.ts` (mostrada na tela inicial): some 1 no último número a cada
  atualização publicada.
- Dados do CODMunity, do Game8 e os recortes do Magnific são só para uso local: ficam em
  `src/data/local/` e `public/cutouts/` (no .gitignore) ou no Blob privado da Vercel; nunca no GitHub.
