// Jogos antigos (MW 2019, MW III), com dados do CODMunity.
//
// USO LOCAL / SITE PRIVADO: os arquivos ficam em src/data/local/ (no .gitignore), gerados por
// `npm run import:codmunity -- <jogo…>`. Sem o arquivo, o jogo simplesmente não aparece, então o
// GitHub nunca recebe esses dados; a Vercel (privada) os baixa no build.

export { legacyText, legacyFixed } from './legacyText'

/** Base = camuflagens próprias da arma; o resto são as de maestria do jogo. */
export type LegacyTier = 'base' | 'gold' | 'platinum' | 'damascus' | 'obsidian' | 'gilded' | 'forged' | 'priceless'

export interface LegacyStep {
  name: string
  tier: LegacyTier
  image: string | null
  /** Texto do desafio em inglês, como vem da fonte (null se a fonte não informa). */
  challenge: string | null
}

export interface LegacyWeapon {
  id: string
  name: string
  cls: string
  icon: string
  unlock: string | null
  steps: LegacyStep[]
}

export type LegacyRules =
  | { kind: 'mw19' }
  | {
      kind: 'mw3'
      /** Forged: quantas armas da classe com Gilded. */
      forgedNeed: Record<string, number>
      /** Priceless: quantas armas com Forged. */
      pricelessNeed: number
      /** Interstellar: vem sozinha com Priceless em N armas. */
      finale: { name: string; image: string; need: number } | null
    }

export interface LegacyGame {
  game: string
  label: string
  short: string
  source: { name: string; url: string; importedAt: string }
  rules: LegacyRules
  classes: { id: string; label: string; short: string }[]
  tiers: { tier: LegacyTier; label: string }[]
  weapons: LegacyWeapon[]
}

const files = import.meta.glob<LegacyGame>('./local/*.json', { eager: true, import: 'default' })

/** Ordem no seletor: do mais antigo ao mais novo. */
const ORDER = ['mw19', 'mw2', 'mw3']

/** Jogos antigos disponíveis (vazio no build sem os dados). */
export const LEGACY_GAMES: LegacyGame[] = Object.values(files)
  .filter((g) => Array.isArray(g.weapons) && g.weapons[0]?.steps)
  .sort((a, b) => ORDER.indexOf(a.game) - ORDER.indexOf(b.game))

export const legacyGame = (id: string) => LEGACY_GAMES.find((g) => g.game === id) ?? null

/** Versão reduzida de uma imagem do CODMunity (o servidor deles redimensiona: ~10 KB em vez de ~400 KB). */
export function legacyImg(url: string | null, size: 'thumb' | 'hero' | 'swatch'): string | null {
  if (!url) return null
  const dims = { thumb: '400x160', hero: '800x320', swatch: '120x48' }[size]
  return url.includes('assets.codmunity.gg') ? `${url}${url.includes('?') ? '&' : '?'}size=${dims}&quality=80&format=webp` : url
}

// ---------------------------------------------------------------------------
// Progresso: jogo → arma → máscara de bits (bit i = steps[i] daquela arma).
// ---------------------------------------------------------------------------

export type LegacyProgress = Record<string, number>

export const legacyDone = (p: LegacyProgress, weaponId: string, i: number) => ((p[weaponId] ?? 0) & (1 << i)) !== 0

export function legacyDoneCount(p: LegacyProgress, weaponId: string) {
  let m = p[weaponId] ?? 0
  let n = 0
  while (m) {
    n += m & 1
    m >>= 1
  }
  return n
}

const tierIndex = (w: LegacyWeapon, tier: LegacyTier) => w.steps.findIndex((s) => s.tier === tier)
const hasTier = (p: LegacyProgress, w: LegacyWeapon, tier: LegacyTier) => {
  const i = tierIndex(w, tier)
  return i >= 0 && legacyDone(p, w.id, i)
}

/** Quantas armas (da classe, se dada) têm a camuflagem de maestria `tier`. */
export function legacyCount(g: LegacyGame, p: LegacyProgress, tier: LegacyTier, cls?: string) {
  return g.weapons.filter((w) => (!cls || w.cls === cls) && hasTier(p, w, tier)).length
}

const classSize = (g: LegacyGame, cls: string) => g.weapons.filter((w) => w.cls === cls).length
const baseCount = (w: LegacyWeapon) => w.steps.filter((s) => s.tier === 'base').length
/** No MW III a meta da classe nunca passa do número de armas da classe que existem aqui. */
const forgedNeed = (g: LegacyGame, cls: string) =>
  g.rules.kind === 'mw3' ? Math.min(g.rules.forgedNeed[cls] ?? classSize(g, cls), classSize(g, cls)) : 0

/** Pré-requisito em texto (para "Abre com"). Null para as base. */
export function legacyUnlockText(g: LegacyGame, step: LegacyStep, w: LegacyWeapon): string | null {
  const plural = (n: number) => (n === 1 ? 'a camuflagem base desta arma' : `as ${n} camuflagens base desta arma`)
  switch (step.tier) {
    case 'gold':
    case 'gilded':
      return plural(baseCount(w))
    case 'platinum':
      return `Gold nas ${classSize(g, w.cls)} armas da classe`
    case 'damascus':
      return `Platinum nas ${g.weapons.length} armas`
    case 'obsidian':
      return 'Damascus desta arma'
    case 'forged':
      return `Gilded desta arma e em ${forgedNeed(g, w.cls)} armas da classe`
    case 'priceless':
      return g.rules.kind === 'mw3' ? `Forged desta arma e em ${g.rules.pricelessNeed} armas` : null
    default:
      return null
  }
}

/** Motivo pelo qual a camuflagem ainda não pode ser marcada (ou null). */
export function legacyGate(g: LegacyGame, p: LegacyProgress, w: LegacyWeapon, i: number, enforce: boolean): string | null {
  if (!enforce) return null
  const step = w.steps[i]
  const allBase = () => w.steps.every((s, k) => s.tier !== 'base' || legacyDone(p, w.id, k))
  const baseMsg = () => (baseCount(w) === 1 ? 'Termine a camuflagem base.' : `Termine as ${baseCount(w)} camuflagens base.`)
  switch (step.tier) {
    case 'gold':
    case 'gilded':
      return allBase() ? null : baseMsg()
    case 'platinum': {
      const missing = classSize(g, w.cls) - legacyCount(g, p, 'gold', w.cls)
      return missing <= 0 ? null : `Termine o Gold nas ${classSize(g, w.cls)} armas da classe (faltam ${missing}).`
    }
    case 'damascus': {
      const missing = g.weapons.length - legacyCount(g, p, 'platinum')
      return missing <= 0 ? null : `Termine o Platinum nas ${g.weapons.length} armas (faltam ${missing}).`
    }
    case 'obsidian':
      return hasTier(p, w, 'damascus') ? null : 'Termine o Damascus desta arma.'
    case 'forged': {
      if (!hasTier(p, w, 'gilded')) return 'Termine o Gilded desta arma.'
      const need = forgedNeed(g, w.cls)
      const missing = need - legacyCount(g, p, 'gilded', w.cls)
      return missing <= 0 ? null : `Termine o Gilded em ${need} armas da classe (faltam ${missing}).`
    }
    case 'priceless': {
      if (!hasTier(p, w, 'forged')) return 'Termine o Forged desta arma.'
      if (g.rules.kind !== 'mw3') return null
      const missing = g.rules.pricelessNeed - legacyCount(g, p, 'forged')
      return missing <= 0 ? null : `Termine o Forged em ${g.rules.pricelessNeed} armas (faltam ${missing}).`
    }
    default:
      return null
  }
}

/** Camuflagem final que vem sozinha (Interstellar no MW III), se houver. */
export function legacyFinale(g: LegacyGame, p: LegacyProgress) {
  if (g.rules.kind !== 'mw3' || !g.rules.finale) return null
  const { name, image, need } = g.rules.finale
  const have = legacyCount(g, p, 'priceless')
  return { name, image, need, have, done: have >= need }
}

/** Marca/desmarca. Ao desmarcar, sai também o que dependia disso nesta arma. */
export function legacyToggle(g: LegacyGame, p: LegacyProgress, w: LegacyWeapon, i: number, enforce: boolean) {
  const mask = p[w.id] ?? 0
  const bit = 1 << i
  if (!(mask & bit)) {
    if (legacyGate(g, p, w, i, enforce)) return p
    return { ...p, [w.id]: mask | bit }
  }
  let out: LegacyProgress = { ...p, [w.id]: mask & ~bit }
  for (let changed = enforce; changed; ) {
    changed = false
    for (let k = 0; k < w.steps.length; k++) {
      if (legacyDone(out, w.id, k) && legacyGate(g, out, w, k, enforce)) {
        out = { ...out, [w.id]: (out[w.id] ?? 0) & ~(1 << k) }
        changed = true
        break
      }
    }
  }
  return out
}
