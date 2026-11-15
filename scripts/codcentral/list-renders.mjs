#!/usr/bin/env node
// Gera src/data/renderImages.generated.json a partir das fotos em public/renders/<arma>/<camuflagem>.webp
// (fotos da arma com a camuflagem aplicada, do CodCentral, usadas com autorização).
import { readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const dir = join(root, 'public/renders')
const out = {}
if (existsSync(dir)) {
  for (const w of readdirSync(dir).sort()) {
    const files = readdirSync(join(dir, w)).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, ''))
    if (files.length) out[w] = files.sort()
  }
}
writeFileSync(join(root, 'src/data/renderImages.generated.json'), JSON.stringify(out) + '\n')
console.log(`${Object.keys(out).length} armas, ${Object.values(out).flat().length} fotos`)
