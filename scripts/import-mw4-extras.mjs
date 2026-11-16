#!/usr/bin/env node
// Extras do MW4 de fontes com autorização só para uso local:
//   - Game8: foto de cada arma com Divergence e com as maestrias de modo (MP e DMZ);
//   - CODMunity: ícone das armas (usado só quando o app não tem imagem da arma, ex.: JAK 12).
//
// USO LOCAL / SITE PRIVADO: grava src/data/local/mw4-extras.json (no .gitignore). Sem o arquivo,
// o app só fica sem essas fotos. A Vercel (privada) roda este script no build.
//
// Uso: npm run import:mw4-extras

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const UA = { 'User-Agent': 'camo-tracker (uso local)' }
const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// Uma página do Game8 por camuflagem; cada uma tem a foto das armas do lançamento com ela.
const GAME8 = 'https://game8.co/games/Call-of-Duty-Modern-Warfare-4/archives/'
const PAGES = {
  divergence: 632943,
  'mercurial-drift': 632944,
  'polyatomic-reforged': 632945,
  'orion-reforged': 632946,
  chiral: 632947,
  'ripple-tide': 632948,
  helio: 632949,
}

async function get(url, json = false) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: json ? { ...UA, Accept: 'application/json' } : UA }).catch((e) => ({
      ok: false,
      status: e.message,
    }))
    if (res.ok) return json ? res.json() : res.text()
    if (attempt >= 3) throw new Error(`HTTP ${res.status} em ${url}`)
    await new Promise((r) => setTimeout(r, attempt * 5000))
  }
}

const photos = {}
let found = 0
for (const [camo, id] of Object.entries(PAGES)) {
  try {
    const html = await get(GAME8 + id)
    // alt='Mercurial Drift (Kastov 762) Camo' data-src='https://img.game8.co/…'
    for (const [, weapon, src] of html.matchAll(
      /alt='[^'(]+ \(([^)]+)\) Camo' data-src='(https:\/\/img\.game8\.co\/[^']+)'/g,
    )) {
      const w = slug(weapon)
      photos[w] ??= {}
      if (!photos[w][camo]) {
        photos[w][camo] = src
        found++
      }
    }
    console.log(`Game8 ${camo}: ok`)
  } catch (e) {
    console.warn(`Game8 ${camo} indisponível (${e.message}): seguindo sem`)
  }
}

const icons = {}
try {
  const page = (await get('https://codmunity.gg/api/public/camo-tracker/mw4', true)).page
  for (const w of page.weapons ?? []) {
    if (typeof w.Icon === 'string' && w.Icon.startsWith('https://')) icons[w.slug || slug(w.WeaponName)] = w.Icon
  }
  console.log(`CODMunity: ícones de ${Object.keys(icons).length} armas`)
} catch (e) {
  console.warn(`CODMunity indisponível (${e.message}): seguindo sem ícones`)
}

if (!found && !Object.keys(icons).length) {
  console.error('Nada baixado: mantendo sem extras.')
  process.exit(1)
}
const dir = resolve(here, '../src/data/local')
mkdirSync(dir, { recursive: true })
const file = resolve(dir, 'mw4-extras.json')
writeFileSync(
  file,
  JSON.stringify(
    {
      kind: 'mw4-extras',
      importedAt: new Date().toISOString(),
      sources: {
        photos: 'https://game8.co/games/Call-of-Duty-Modern-Warfare-4/archives/630963',
        icons: 'https://codmunity.gg/camo-tracker/mw4',
      },
      photos,
      icons,
    },
    null,
    1,
  ) + '\n',
)
console.log(`OK: ${found} fotos de ${Object.keys(photos).length} armas → ${file}`)
