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
  mw2: {
    grind: 'mw2_multi',
    label: 'Modern Warfare II',
    short: 'MW II',
    rules: 'tiered',
    // Nome na fonte → nome exibido (a fonte escreve "platinium").
    mastery: ['Gold', 'Platinum', 'Polyatomic'],
    sourceNames: ['gold', 'platinium', 'polyatomic'],
    finale: 'orion',
  },
  mw3: {
    grind: 'mw3_multi',
    label: 'Modern Warfare III',
    short: 'MW III',
    rules: 'tiered',
    mastery: ['Gilded', 'Forged', 'Priceless'],
    finale: 'Interstellar',
  },
}

// Fotos das armas com cada camuflagem aplicada, do Game8 (o dono do projeto tem autorização para uso
// local). Uma página traz MW III e MW II; casamos por arma + nome da camuflagem.
const GAME8_URL = 'https://game8.co/games/MW3/archives/431223'
const GAME8_GAMES = new Set(['mw2', 'mw3'])
let game8Rows = null
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '')
async function game8() {
  if (game8Rows) return game8Rows
  game8Rows = new Map()
  try {
    console.log(`Baixando fotos do Game8 (${GAME8_URL}) …`)
    const res = await fetch(GAME8_URL, { headers: { 'User-Agent': 'camo-tracker (uso local)' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()
    const re = /<td class="Camo_cell[^"]*">([\s\S]*?)<\/td>\s*<td class="Weapon_cell[^"]*">([\s\S]*?)<\/td>/g
    const unescape = (t) => t.replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'").replace(/&quot;/g, '"')
    for (const [, camo, weapon] of html.matchAll(re)) {
      const src = camo.match(/data-src='([^']+)'/)?.[1]
      const name = camo.match(/<b class='a-bold'>([\s\S]*?)<\/b>/)?.[1]
      const w = unescape(weapon.replace(/<[^>]+>/g, '').trim())
      if (!src || !name || !src.startsWith('https://img.game8.co/')) continue
      const key = norm(w)
      if (!game8Rows.has(key)) game8Rows.set(key, new Map())
      game8Rows.get(key).set(norm(unescape(name)), src)
    }
    console.log(`Game8: fotos de ${game8Rows.size} armas`)
  } catch (e) {
    console.warn(`Game8 indisponível (${e.message}): seguindo sem as fotos`)
  }
  return game8Rows
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
  const photos = GAME8_GAMES.has(id) ? await game8() : new Map()
  // Foto da arma com a camuflagem: o Game8 nomeia "Razor Feather" ou "Gold MCPR-300".
  const photoOf = (weapon, camo) => {
    const m = photos.get(norm(weapon))
    return m?.get(norm(camo)) ?? m?.get(norm(`${camo} ${weapon}`)) ?? null
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
    const src = game.sourceNames ?? game.mastery
    const mastery = src.map((name) => list.find((c) => c.SubCategory === 'Mastery' && c.Name === name))
    const cls = CLASS[w.Category]?.[0] ?? 'ar'
    weapons.push({
      id: w.slug || slug(w.WeaponName),
      name: w.WeaponName,
      cls,
      icon: w.Icon,
      unlock: text(w.Unlock),
      steps: [
        ...base.map((c) => ({
          name: c.Name,
          tier: 'base',
          image: image(c.Image),
          photo: photoOf(w.WeaponName, c.Name),
          challenge: text(c.Challenge),
        })),
        ...mastery.map((c, i) => ({
          name: game.mastery[i],
          tier: slug(game.mastery[i]),
          image: image(c?.Image) ?? masteryImage[src[i]] ?? null,
          photo: photoOf(w.WeaponName, game.mastery[i]),
          challenge: text(c?.Challenge),
        })),
      ],
    })
    // Foto padrão da arma (para quando a fonte não tem a imagem dela, como no MW II):
    // a da primeira camuflagem base com foto, senão qualquer foto da arma.
    const last = weapons[weapons.length - 1]
    last.photo = last.steps.find((x) => x.photo)?.photo ?? [...(photos.get(norm(w.WeaponName))?.values() ?? [])][0] ?? null
  }
  const tiers = game.mastery.map((name) => ({ tier: slug(name), label: name }))
  const usedClasses = new Set(weapons.map((w) => w.cls))
  const classes = CLASS_ORDER.filter((c) => usedClasses.has(c)).map((c) => {
    const [, label, short] = Object.values(CLASS).find((v) => v[0] === c)
    return { id: c, label, short }
  })

  // MW II / MW III: 3 de maestria em cadeia + uma final automática (regras da configuração do tracker).
  //   1ª: as base da arma · 2ª: a 1ª desta arma + a 1ª em N armas da classe ·
  //   3ª: a 2ª desta arma + a 2ª em M armas · final: a 3ª em K armas (vem sozinha).
  let rules = { kind: game.rules }
  if (game.rules === 'tiered') {
    const secondNeed = Object.fromEntries(
      Object.entries(config.categories ?? {}).map(([cat, v]) => [CLASS[cat]?.[0] ?? slug(cat), v.unlockSecond]),
    )
    const fin = (config.camos ?? []).find((c) => c.name === game.finale)
    const title = (n) => n.charAt(0).toUpperCase() + n.slice(1)
    rules = {
      kind: 'tiered',
      tiers: game.mastery.map(slug),
      secondNeed,
      thirdNeed: config.countUnlockThird ?? 36,
      finale: fin ? { name: fin.title ?? title(fin.name), image: fin.image, need: config.countUnlockMastery ?? 36 } : null,
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
