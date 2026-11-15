#!/bin/bash
# Baixa as fotos arma+camuflagem do CodCentral (uso autorizado, ver THIRD_PARTY_NOTICES.md),
# uma a cada 0,5 s, para .cache/renders/<arma>/<camuflagem>.webp. Pula as que já existem.
# Lista: scripts/codcentral/renders-todo.txt ("<arma> <camuflagem>" por linha).
# Depois rode: python scripts/codcentral/build-sprites.py
cd "$(dirname "$0")/../.."
B=https://codcentral.net/assets/library/mw4/dmz/camos
while read w c; do
  mkdir -p .cache/renders/$w
  [ -s .cache/renders/$w/$c.webp ] && continue
  code=$(curl -sS --max-time 20 -o .cache/renders/$w/$c.webp -w "%{http_code}" "$B/$w/$c.webp")
  [ "$code" != "200" ] && { echo "falhou ($code): $w $c"; rm -f .cache/renders/$w/$c.webp; }
  sleep 0.5
done < scripts/codcentral/renders-todo.txt
