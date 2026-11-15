#!/usr/bin/env node
// Baixa os desafios de camuflagem de um jogo antigo do CODMunity e gera
// src/data/local/<jogo>.json no formato usado por este app.
//
// USO LOCAL / SITE PRIVADO: o dono deste projeto tem permissão do CODMunity só para uso
// local. O arquivo gerado fica no .gitignore e nunca vai para o GitHub; a Vercel (site
// privado, com login) roda este script no build (`npm run build:vercel`).
//
// Uso:
//   npm run import:codmunity -- mw19 mw3
//
// Faz uma única requisição por jogo (o endpoint devolve o jogo inteiro).

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))

const CLASS = {
  'Assault Rifle': ['ar', 'Fuzis de Assalto', 'AR'],
  SMG: ['smg', 'Submetralhadoras', 'SMG'],
  'Battle Rifle': ['battle', 'Fuzis de Batalha', 'BR'],
  Shotgun: ['shotgun', 'Escopetas', 'SG'],
  LMG: ['lmg', 'Metralhadoras Leves', 'LMG'],
  'Marksman Rifle': ['marksman', 'Fuzis de Precisão', 'DMR'],
  'Sniper Rifle': ['sniper', 'Fuzis de Sniper', 'SNP'],
  Sniper: ['sniper', 'Fuzis de Sniper', 'SNP'],
  Pistol: ['pistol', 'Pistolas', 'PST'],
  Launcher: ['launcher', 'Lançadores', 'LCH'],
  Melee: ['melee', 'Corpo a Corpo', 'MEL'],
}
const CLASS_ORDER = ['ar', 'smg', 'battle', 'shotgun', 'lmg', 'marksman', 'sniper', 'pistol', 'launcher', 'melee']

// Jogos suportados: id no app → grind no CODMunity, nomes e como ler a escada.
const GAMES = {
  mw19: {
    grind: 'mw19',
    label: 'Modern Warfare (2019)',
    short: 'MW 2019',
    rules: 'mw19',
    mastery: ['Gold', 'Platinum', 'Damascus', 'Obsidian'],
  },
  mw3: {
    grind: 'mw3_multi',
    label: 'Modern Warfare III',
    short: 'MW III',
    rules: 'mw3',
    mastery: ['Gilded', 'Forged', 'Priceless'],
  },
}

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

async function importGame(id) {
  const game = GAMES[id]
  if (!game) throw new Error(`jogo desconhecido: ${id} (jogos: ${Object.keys(GAMES).join(', ')})`)
  const url = `https://codmunity.gg/api/public/camo-tracker/${encodeURIComponent(game.grind)}`
  console.log(`Baixando ${url} …`)
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'camo-tracker (uso local)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const page = (await res.json()).page
  const grind = page.camoGrinds.find((g) => g.name === game.grind) ?? {}
  const config = grind.camoConfig ?? {}
  const masteryImage = Object.fromEntries((config.camos ?? []).map((c) => [c.name, c.image]))

  const byWeapon = new Map()
  for (const c of page.challenges) {
    if (!byWeapon.has(c.WeaponName)) byWeapon.set(c.WeaponName, [])
    byWeapon.get(c.WeaponName).push(c)
  }
  const order = (c) => c.Order ?? c.ID ?? 0
  const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const image = (v) => (typeof v === 'string' && v.startsWith('http') ? v : null)

  // Escada de cada arma: as camuflagens base dela (o número varia; no MW III algumas armas têm
  // só 1 ou 2) + as de maestria do jogo, nesta ordem.
  const weapons = []
  for (const w of page.weapons) {
    const list = (byWeapon.get(w.WeaponName) ?? []).sort((a, b) => order(a) - order(b))
    if (!list.length) continue // armas sem desafios (ex.: algumas corpo a corpo no MW III)
    const base = list.filter((c) => c.SubCategory !== 'Mastery')
    const mastery = game.mastery.map((name) => list.find((c) => c.SubCategory === 'Mastery' && c.Name === name))
    const cls = CLASS[w.Category]?.[0] ?? 'ar'
    weapons.push({
      id: w.slug || slug(w.WeaponName),
      name: w.WeaponName,
      cls,
      icon: w.Icon,
      unlock: text(w.Unlock),
      steps: [
        ...base.map((c) => ({ name: c.Name, tier: 'base', image: image(c.Image), challenge: text(c.Challenge) })),
        ...mastery.map((c, i) => ({
          name: game.mastery[i],
          tier: slug(game.mastery[i]),
          image: image(c?.Image) ?? masteryImage[game.mastery[i]] ?? null,
          challenge: text(c?.Challenge),
        })),
      ],
    })
  }
  const tiers = game.mastery.map((name) => ({ tier: slug(name), label: name }))
  const usedClasses = new Set(weapons.map((w) => w.cls))
  const classes = CLASS_ORDER.filter((c) => usedClasses.has(c)).map((c) => {
    const [, label, short] = Object.values(CLASS).find((v) => v[0] === c)
    return { id: c, label, short }
  })

  // Regras específicas do MW III (vêm da configuração do próprio tracker).
  let rules = { kind: game.rules }
  if (game.rules === 'mw3') {
    const forgedNeed = Object.fromEntries(
      Object.entries(config.categories ?? {}).map(([cat, v]) => [CLASS[cat]?.[0] ?? slug(cat), v.unlockSecond]),
    )
    const inter = (config.camos ?? []).find((c) => c.name === 'Interstellar')
    rules = {
      kind: 'mw3',
      forgedNeed,
      pricelessNeed: config.countUnlockThird ?? 36,
      finale: inter ? { name: 'Interstellar', image: inter.image, need: config.countUnlockMastery ?? 36 } : null,
    }
  }

  const out = {
    source: { name: 'CODMunity', url: `https://codmunity.gg/camo-tracker/${game.grind}`, importedAt: new Date().toISOString() },
    game: id,
    label: game.label,
    short: game.short,
    rules,
    classes,
    tiers,
    weapons,
  }
  const dir = resolve(here, '../src/data/local')
  mkdirSync(dir, { recursive: true })
  const file = resolve(dir, `${id}.json`)
  writeFileSync(file, JSON.stringify(out, null, 1) + '\n')
  const total = weapons.reduce((n, w) => n + w.steps.length, 0)
  console.log(`OK: ${weapons.length} armas, ${total} camuflagens → ${file}`)
}

const ids = process.argv.slice(2)
if (!ids.length) {
  console.error(`Uso: npm run import:codmunity -- <jogo…>   (jogos: ${Object.keys(GAMES).join(', ')})`)
  process.exit(1)
}
let failed = 0
for (const id of ids) {
  try {
    await importGame(id)
  } catch (e) {
    failed++
    console.error(`Falhou ${id}: ${e.message}`)
  }
}
process.exit(failed ? 1 : 0)
