#!/usr/bin/env node
// Recortes (fundo removido no Magnific) das fotos das armas, guardados no Blob privado da Vercel.
// USO LOCAL / SITE PRIVADO: baixa para public/cutouts/ e grava src/data/local/cutouts.json, os dois
// no .gitignore. Precisa de BLOB_READ_WRITE_TOKEN (a Vercel injeta no build). Sem ele, o app usa as
// fotos com fundo.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const token = process.env.BLOB_READ_WRITE_TOKEN
if (!token) {
  console.warn('Sem BLOB_READ_WRITE_TOKEN: seguindo sem recortes')
  process.exit(0)
}
const store = token.split('_')[3]?.toLowerCase()
const base = `https://${store}.private.blob.vercel-storage.com/`
const auth = { Authorization: `Bearer ${token}` }

async function get(path, attempt = 1) {
  const res = await fetch(base + path, { headers: auth }).catch((e) => ({ ok: false, status: e.message }))
  if (res.ok) return Buffer.from(await res.arrayBuffer())
  if (attempt < 3) return get(path, attempt + 1)
  throw new Error(`HTTP ${res.status} em ${path}`)
}

const index = JSON.parse((await get('recortes/index.json')).toString())
const pub = resolve(here, '../public/cutouts')
const map = {}
const entries = Object.entries(index)
let i = 0
let failed = 0
await Promise.all(
  Array.from({ length: 16 }, async () => {
    while (i < entries.length) {
      const [key, { path }] = entries[i++]
      const rel = path.replace(/^recortes\//, '')
      const file = resolve(pub, rel)
      try {
        if (!existsSync(file)) {
          mkdirSync(dirname(file), { recursive: true })
          writeFileSync(file, await get(path))
        }
        map[key] = `./cutouts/${rel}`
      } catch (e) {
        failed++
        if (failed < 5) console.warn(e.message)
      }
    }
  }),
)
const dir = resolve(here, '../src/data/local')
mkdirSync(dir, { recursive: true })
writeFileSync(resolve(dir, 'cutouts.json'), JSON.stringify({ kind: 'cutouts', map }) + '\n')
console.log(`Recortes: ${Object.keys(map).length} (falhas: ${failed})`)
