#!/usr/bin/env node
// Baixa os desafios de camuflagem de um jogo antigo do CODMunity e gera
// src/data/local/<jogo>.json no formato usado por este app.
//
// USO LOCAL APENAS: o dono deste projeto tem permissão do CODMunity só para uso
// local. O arquivo gerado fica no .gitignore e não vai para o GitHub nem para a
// Vercel; o app só mostra o jogo quando o arquivo existe na máquina.
//
// Uso:
//   npm run import:codmunity -- mw19
//
// Faz uma única requisição por jogo (o endpoint devolve o jogo inteiro).

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

// Jogos suportados: id no app → id do grind no CODMunity e nome exibido.
const GAMES = {
  mw19: { grind: 'mw19', label: 'Modern Warfare (2019)', short: 'MW 2019' },
}

const CLASS = {
  'Assault Rifle': 'ar',
  SMG: 'smg',
  Shotgun: 'shotgun',
  LMG: 'lmg',
  'Marksman Rifle': 'marksman',
  'Sniper Rifle': 'sniper',
  Pistol: 'pistol',
  Launcher: 'launcher',
  Melee: 'melee',
}

const TIER = { Gold: 'gold', Platinum: 'platinum', Damascus: 'damascus', Obsidian: 'obsidian' }

const id = process.argv[2]
const game = GAMES[id]
if (!game) {
  console.error(`Uso: npm run import:codmunity -- <jogo>   (jogos: ${Object.keys(GAMES).join(', ')})`)
  process.exit(1)
}

const url = `https://codmunity.gg/api/public/camo-tracker/${encodeURIComponent(game.grind)}`
console.log(`Baixando ${url} …`)
const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'camo-tracker (uso local)' } })
if (!res.ok) {
  console.error(`Falhou: HTTP ${res.status}`)
  process.exit(1)
}
const raw = await res.json()
const page = raw.page

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// Escada: a mesma ordem para todas as armas (base 1..10, depois as de maestria).
const byWeapon = new Map()
for (const c of page.challenges) {
  if (!byWeapon.has(c.WeaponName)) byWeapon.set(c.WeaponName, [])
  byWeapon.get(c.WeaponName).push(c)
}
const first = [...byWeapon.values()][0].sort((a, b) => a.Order - b.Order)
const ladder = first.map((c, index) => ({
  index,
  name: c.Name,
  tier: c.SubCategory === 'Mastery' ? (TIER[c.Name] ?? 'mastery') : 'base',
  image: c.Image,
}))

const weapons = page.weapons.map((w) => {
  const list = (byWeapon.get(w.WeaponName) ?? []).sort((a, b) => a.Order - b.Order)
  const names = list.map((c) => c.Name).join('|')
  if (names !== ladder.map((s) => s.name).join('|')) {
    console.warn(`Aviso: escada diferente em ${w.WeaponName}: ${names}`)
  }
  return {
    id: w.slug || slug(w.WeaponName),
    name: w.WeaponName,
    cls: CLASS[w.Category] ?? 'ar',
    icon: w.Icon,
    unlock: w.Unlock ?? null,
    challenges: list.map((c) => c.Challenge),
  }
})

const out = {
  source: { name: 'CODMunity', url: `https://codmunity.gg/camo-tracker/${game.grind}`, importedAt: new Date().toISOString() },
  game: id,
  label: game.label,
  short: game.short,
  ladder,
  weapons,
}

const dir = resolve(here, '../src/data/local')
mkdirSync(dir, { recursive: true })
const file = resolve(dir, `${id}.json`)
writeFileSync(file, JSON.stringify(out, null, 1) + '\n')
console.log(`OK: ${weapons.length} armas, ${ladder.length} camuflagens por arma → ${file}`)
