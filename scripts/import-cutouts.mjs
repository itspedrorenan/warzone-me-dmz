#!/usr/bin/env node
// Recortes (fundo removido no Magnific) das fotos das armas, guardados no Blob privado da Vercel.
// USO LOCAL / SITE PRIVADO: extrai para public/cutouts/ e grava src/data/local/cutouts.json, os dois
// no .gitignore. Precisa de BLOB_READ_WRITE_TOKEN (a Vercel injeta no build). Sem ele, o app usa as
// fotos com fundo.
//
// Para gastar só 1 operação do Blob por build, os recortes ficam num pacote único
// (recortes/pacote.tar). Se o pacote ainda não existe, este script baixa os arquivos um a um uma vez,
// monta o pacote e o envia ao Blob; os builds seguintes baixam só o pacote.

import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const token = process.env.BLOB_READ_WRITE_TOKEN
if (!token) {
  console.warn('Sem BLOB_READ_WRITE_TOKEN: seguindo sem recortes')
  process.exit(0)
}
const store = token.split('_')[3]?.toLowerCase()
const base = `https://${store}.private.blob.vercel-storage.com/`
const auth = { Authorization: `Bearer ${token}` }
const PACK = 'recortes/pacote.tar'

async function get(path, attempt = 1) {
  const res = await fetch(base + path, { headers: auth }).catch((e) => ({ ok: false, status: e.message }))
  if (res.ok) return Buffer.from(await res.arrayBuffer())
  if (res.status === 404) return null
  if (attempt < 3) return get(path, attempt + 1)
  throw new Error(`HTTP ${res.status} em ${path}`)
}

async function put(path, body, type) {
  const res = await fetch(`https://blob.vercel-storage.com/?pathname=${encodeURIComponent(path)}`, {
    method: 'PUT',
    body,
    headers: {
      ...auth,
      'x-api-version': '11',
      'x-vercel-blob-access': 'private',
      'x-content-type': type,
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '1',
    },
  })
  if (!res.ok) throw new Error(`envio do pacote: HTTP ${res.status} ${await res.text()}`)
}

const pub = resolve(here, '../public/cutouts')
mkdirSync(pub, { recursive: true })
let map = null

const pack = await get(PACK)
if (pack) {
  const tar = resolve(tmpdir(), 'recortes.tar')
  writeFileSync(tar, pack)
  execFileSync('tar', ['-xf', tar, '-C', pub])
  map = JSON.parse(readFileSync(resolve(pub, 'map.json'), 'utf8'))
  rmSync(tar)
  console.log(`Recortes (pacote): ${Object.keys(map).length}`)
} else {
  // Primeira vez: baixa os arquivos um a um e monta o pacote.
  const index = JSON.parse((await get('recortes/index.json')).toString())
  map = {}
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
            const data = await get(path)
            if (!data) throw new Error(`não encontrado: ${path}`)
            mkdirSync(dirname(file), { recursive: true })
            writeFileSync(file, data)
          }
          map[key] = rel
        } catch (e) {
          failed++
          if (failed < 5) console.warn(e.message)
        }
      }
    }),
  )
  writeFileSync(resolve(pub, 'map.json'), JSON.stringify(map))
  const tar = resolve(tmpdir(), 'recortes.tar')
  execFileSync('tar', ['-cf', tar, '-C', pub, '.'])
  try {
    await put(PACK, readFileSync(tar), 'application/x-tar')
    console.log('Pacote dos recortes enviado ao Blob (próximos builds baixam só ele).')
  } catch (e) {
    console.warn(e.message)
  }
  rmSync(tar)
  console.log(`Recortes: ${Object.keys(map).length} (falhas: ${failed})`)
}

const dir = resolve(here, '../src/data/local')
mkdirSync(dir, { recursive: true })
const out = Object.fromEntries(Object.entries(map).map(([k, rel]) => [k, `./cutouts/${rel}`]))
writeFileSync(resolve(dir, 'cutouts.json'), JSON.stringify({ kind: 'cutouts', map: out }) + '\n')
