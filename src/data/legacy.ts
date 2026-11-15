// Jogos antigos (MW 2019, MW III), com dados do CODMunity.
//
// USO LOCAL / SITE PRIVADO: os arquivos ficam em src/data/local/ (no .gitignore), gerados por
// `npm run import:codmunity -- <jogo…>`. Sem o arquivo, o jogo simplesmente não aparece, então o
// GitHub nunca recebe esses dados; a Vercel (privada) os baixa no build.

export { legacyText, legacyFixed } from './legacyText'

/** Base = camuflagens próprias da arma; o resto são as de maestria do jogo. */
export type LegacyTier =
  | 'base'
  | 'gold'
  | 'platinum'
  | 'damascus'
  | 'obsidian'
  | 'polyatomic'
  | 'gilded'
  | 'forged'
  | 'priceless'

export interface LegacyStep {
  name: string
  tier: LegacyTier
  image: string | null
  /** Texto do desafio em inglês, como vem da fonte (null se a fonte não informa). */
  challenge: string | null
  /** Foto da arma com esta camuflagem aplicada (Game8), quando existe. */
  photo?: string | null
}

export interface LegacyWeapon {
  id: string
  name: string
  cls: string
  icon: string
  unlock: string | null
  /** Foto padrão da arma (Game8), usada quando a fonte não tem a imagem dela. */
  photo?: string | null
  steps: LegacyStep[]
}

export type LegacyRules =
  | { kind: 'mw19' }
  | {
      /** MW II / MW III: 3 de maestria em cadeia (Gold→Platinum→Polyatomic, Gilded→Forged→Priceless). */
      kind: 'tiered'
      tiers: [LegacyTier, LegacyTier, LegacyTier]
      /** 2ª: quantas armas da classe com a 1ª. */
      secondNeed: Record<string, number>
      /** 3ª: quantas armas com a 2ª. */
      thirdNeed: number
      /** Final automática (Orion, Interstellar): vem sozinha com a 3ª em N armas. */
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
  // Game8: "/show" é a foto inteira; "/thumb" é a versão menor (~13 KB).
  if (url.includes('img.game8.co')) return size === 'hero' ? url : url.replace(/\/show$/, '/thumb')
  return url.includes('assets.codmunity.gg')
    ? `${url}${url.includes('?') ? '&' : '?'}size=${dims}&quality=80&format=webp`
    : url
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
/** A meta da classe nunca passa do número de armas da classe que existem aqui. */
const secondNeed = (g: LegacyGame, cls: string) =>
  g.rules.kind === 'tiered' ? Math.min(g.rules.secondNeed[cls] ?? classSize(g, cls), classSize(g, cls)) : 0
const tierLabel = (g: LegacyGame, tier: LegacyTier) => g.tiers.find((t) => t.tier === tier)?.label ?? tier

/** Pré-requisito em texto (para "Abre com"). Null para as base. */
export function legacyUnlockText(g: LegacyGame, step: LegacyStep, w: LegacyWeapon): string | null {
  if (step.tier === 'base') return null
  const plural = (n: number) => (n === 1 ? 'a camuflagem base desta arma' : `as ${n} camuflagens base desta arma`)
  if (g.rules.kind === 'tiered') {
    const [first, second, third] = g.rules.tiers
    if (step.tier === first) return plural(baseCount(w))
    if (step.tier === second) return `${tierLabel(g, first)} desta arma e em ${secondNeed(g, w.cls)} armas da classe`
    if (step.tier === third) return `${tierLabel(g, second)} desta arma e em ${g.rules.thirdNeed} armas`
    return null
  }
  switch (step.tier) {
    case 'gold':
      return plural(baseCount(w))
    case 'platinum':
      return `Gold nas ${classSize(g, w.cls)} armas da classe`
    case 'damascus':
      return `Platinum nas ${g.weapons.length} armas`
    case 'obsidian':
      return 'Damascus desta arma'
    default:
      return null
  }
}

/** Motivo pelo qual a camuflagem ainda não pode ser marcada (ou null). */
export function legacyGate(
  g: LegacyGame,
  p: LegacyProgress,
  w: LegacyWeapon,
  i: number,
  enforce: boolean,
): string | null {
  if (!enforce) return null
  const step = w.steps[i]
  if (step.tier === 'base') return null
  const allBase = () => w.steps.every((s, k) => s.tier !== 'base' || legacyDone(p, w.id, k))
  const baseMsg = () =>
    baseCount(w) === 1 ? 'Termine a camuflagem base.' : `Termine as ${baseCount(w)} camuflagens base.`

  if (g.rules.kind === 'tiered') {
    const [first, second, third] = g.rules.tiers
    if (step.tier === first) return allBase() ? null : baseMsg()
    if (step.tier === second) {
      if (!hasTier(p, w, first)) return `Termine o ${tierLabel(g, first)} desta arma.`
      const need = secondNeed(g, w.cls)
      const missing = need - legacyCount(g, p, first, w.cls)
      return missing <= 0 ? null : `Termine o ${tierLabel(g, first)} em ${need} armas da classe (faltam ${missing}).`
    }
    if (step.tier === third) {
      if (!hasTier(p, w, second)) return `Termine o ${tierLabel(g, second)} desta arma.`
      const missing = g.rules.thirdNeed - legacyCount(g, p, second)
      return missing <= 0
        ? null
        : `Termine o ${tierLabel(g, second)} em ${g.rules.thirdNeed} armas (faltam ${missing}).`
    }
    return null
  }

  switch (step.tier) {
    case 'gold':
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
    default:
      return null
  }
}

/** Camuflagem final que vem sozinha (Interstellar no MW III), se houver. */
export function legacyFinale(g: LegacyGame, p: LegacyProgress) {
  if (g.rules.kind !== 'tiered' || !g.rules.finale) return null
  const { name, image, need } = g.rules.finale
  const have = legacyCount(g, p, g.rules.tiers[2])
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
