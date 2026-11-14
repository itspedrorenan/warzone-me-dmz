#!/usr/bin/env node
// Importa os dados de camuflagens do MW4 do projeto open source Divergence
// (https://github.com/ItchyBeard/Divergence, licença MIT) e gera
// src/data/divergence.generated.json no formato usado por este app.
//
// Uso:
//   git clone --depth 1 https://github.com/ItchyBeard/Divergence.git /tmp/Divergence
//   node scripts/import-divergence.mjs /tmp/Divergence
//
// Os módulos de dados deles são ES modules com imports sem extensão, então são
// carregados pelo Vite (ssrLoadModule) em vez do Node puro.

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(here, '../src/data/divergence.generated.json')
const REPO = 'https://github.com/ItchyBeard/Divergence'

const src = process.argv[2] && resolve(process.argv[2])
if (!src || !existsSync(join(src, 'src/data/mw4/categories.js'))) {
  console.error('Uso: node scripts/import-divergence.mjs <caminho-do-clone-do-Divergence>')
  process.exit(1)
}

const license = readFileSync(join(src, 'LICENSE'), 'utf8')
if (!/MIT License/.test(license)) {
  console.error('A licença do repositório não é mais MIT — revise antes de importar.')
  process.exit(1)
}

let commit = 'desconhecido'
try {
  commit = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
} catch {
  /* clone sem .git */
}

const server = await createServer({
  root: src,
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
})

const load = (rel) => server.ssrLoadModule(join(src, rel))

try {
  const { categories } = await load('src/data/mw4/categories.js')
  const { completionistCamos } = await load('src/data/mw4/camos.js')
  const { modes } = await load('src/data/mw4/modes.js')
  const { launchRequirements } = await load('src/data/mw4/launchRequirements.js')

  const CATEGORY = {
    'assault-rifles': 'ar',
    'submachine-guns': 'smg',
    shotguns: 'shotgun',
    'light-machine-guns': 'lmg',
    'marksman-rifles': 'marksman',
    'sniper-rifles': 'sniper',
    pistols: 'pistol',
    launchers: 'launcher',
    melee: 'melee',
  }
  const MODE = { multiplayer: 'mp', dmz: 'dmz', warzone: 'wz' }
  const PENDING = 999

  const normChallenge = (c) => {
    if (!c || c.status !== 'available') {
      return { status: 'unavailable', ...(c?.reason ? { reason: c.reason } : {}) }
    }
    const out = { status: 'available', type: c.type, amount: c.amount, target: c.target }
    if (c.times !== undefined) out.times = c.times
    if (c.description) out.description = c.description
    return out
  }
  const byMode = (challenges = {}) =>
    Object.fromEntries(Object.entries(MODE).map(([theirs, ours]) => [ours, normChallenge(challenges[theirs])]))

  const normUnlock = (reqs) => {
    if (!Array.isArray(reqs) || !reqs.length) return null
    const r = reqs[0]
    if (r.type === 'weapon_unlocks' && r.count !== PENDING) return { type: 'unlocks', value: r.count }
    if (r.type === 'weapon_level' && r.level !== PENDING) return { type: 'level', value: r.level }
    return null
  }

  // Armas: um arquivo por arma em src/data/weapons/<categoria>/<id>.weapon.js
  const weaponsDir = join(src, 'src/data/weapons')
  const catOrder = categories.map((c) => c.id)
  const weapons = []
  for (const cat of readdirSync(weaponsDir, { withFileTypes: true })) {
    if (!cat.isDirectory()) continue
    for (const file of readdirSync(join(weaponsDir, cat.name))) {
      if (!file.endsWith('.weapon.js')) continue
      const def = (await load(`src/data/weapons/${cat.name}/${file}`)).default
      const cls = CATEGORY[def.category]
      if (!cls) throw new Error(`Categoria desconhecida: ${def.category} (${file})`)
      let military = null
      if (Array.isArray(def.militaryUnlockLevels)) military = { unit: 'level', values: def.militaryUnlockLevels }
      else if (Array.isArray(def.militaryUnlockCounts)) military = { unit: 'unlocks', values: def.militaryUnlockCounts }
      weapons.push({
        id: def.id,
        name: def.name,
        cls,
        season: def.season ?? 0,
        releaseDate: def.releaseDate ?? null,
        order: def.order ?? 0,
        catIndex: catOrder.indexOf(def.category),
        military,
        specials: (def.specialCamos ?? []).map((s) => ({
          name: s.name,
          unlock: normUnlock(s.unlockRequirements),
          challenges: byMode(s.challenges),
        })),
      })
    }
  }
  weapons.sort((a, b) => a.catIndex - b.catIndex || a.order - b.order || a.name.localeCompare(b.name))
  weapons.forEach((w) => {
    delete w.catIndex
    delete w.order
  })

  const gold = completionistCamos.find((c) => c.id === 'gold')
  const masteries = Object.fromEntries(
    Object.entries(modes).map(([theirs, m]) => [
      MODE[theirs],
      {
        availableFromSeason: m.availableFromSeason ?? 0,
        chain: m.mastery.map((x) => ({
          id: x.id,
          name: x.name,
          // Primeira maestria: pré-requisito global (Divergence ou Harmonic Break).
          requires: x.prerequisite.scope === 'arsenal' ? x.prerequisite.camoId : null,
          challenge: normChallenge(x.challenge),
        })),
      },
    ])
  )

  const data = {
    source: {
      name: 'Divergence (ItchyBeard)',
      repo: REPO,
      commit,
      license: 'MIT',
      importedAt: new Date().toISOString().slice(0, 10),
    },
    launch: {
      weapons: launchRequirements.weapons,
      categories: Object.fromEntries(
        Object.entries(launchRequirements.categories).map(([k, v]) => [CATEGORY[k], v])
      ),
    },
    gold: byMode(gold.challenges),
    classes: Object.fromEntries(
      categories.map((c) => [
        CATEGORY[c.id],
        { goldRequired: c.goldRequired, platinum: byMode(c.platinum.challenges), harmonic: byMode(c.harmonicBreak.challenges) },
      ])
    ),
    masteries,
    weapons,
  }

  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n')

  const types = new Set()
  const walk = (o) => {
    if (o && typeof o === 'object') {
      if (o.status === 'available' && o.type) types.add(o.type)
      Object.values(o).forEach(walk)
    }
  }
  walk(data)
  console.log(`OK: ${weapons.length} armas, commit ${commit.slice(0, 7)} → ${OUT}`)
  console.log(`Tipos de desafio: ${[...types].sort().join(', ')}`)
} finally {
  await server.close()
}
