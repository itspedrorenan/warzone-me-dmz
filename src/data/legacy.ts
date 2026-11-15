// Jogos antigos (MW 2019 por enquanto), com dados do CODMunity.
//
// USO LOCAL APENAS: os arquivos ficam em src/data/local/ (no .gitignore), gerados por
// `npm run import:codmunity -- <jogo>`. Sem o arquivo, o jogo simplesmente não aparece,
// então o build da Vercel e o GitHub não recebem esses dados.

import type { WeaponClass } from '.'

export type LegacyTier = 'base' | 'gold' | 'platinum' | 'damascus' | 'obsidian' | 'mastery'

export interface LegacyStep {
  index: number
  name: string
  tier: LegacyTier
  image: string
}

export interface LegacyWeapon {
  id: string
  name: string
  cls: WeaponClass
  icon: string
  unlock: string | null
  /** Texto do desafio de cada degrau (em inglês, como vem da fonte). */
  challenges: string[]
}

export interface LegacyGame {
  game: string
  label: string
  short: string
  source: { name: string; url: string; importedAt: string }
  ladder: LegacyStep[]
  weapons: LegacyWeapon[]
}

const files = import.meta.glob<LegacyGame>('./local/*.json', { eager: true, import: 'default' })

/** Jogos antigos disponíveis nesta máquina (vazio no build público). */
export const LEGACY_GAMES: LegacyGame[] = Object.values(files).sort((a, b) => a.game.localeCompare(b.game))

export const legacyGame = (id: string) => LEGACY_GAMES.find((g) => g.game === id) ?? null

// ---------------------------------------------------------------------------
// Regras de desbloqueio (MW 2019)
//   Base (10): livres · Gold: as 10 base desta arma · Platinum: Gold em todas as armas
//   da classe · Damascus: Platinum em todas as armas · Obsidian: Damascus desta arma.
// ---------------------------------------------------------------------------

export type LegacyProgress = Record<string, number>

const has = (p: LegacyProgress, weaponId: string, i: number) => ((p[weaponId] ?? 0) & (1 << i)) !== 0
const stepIndex = (g: LegacyGame, tier: LegacyTier) => g.ladder.findIndex((s) => s.tier === tier)

export const legacyDone = has

export function legacyDoneCount(p: LegacyProgress, weaponId: string) {
  let m = p[weaponId] ?? 0
  let n = 0
  while (m) {
    n += m & 1
    m >>= 1
  }
  return n
}

/** Quantas armas (da classe, se dada) têm o degrau marcado. */
export function legacyCount(g: LegacyGame, p: LegacyProgress, i: number, cls?: WeaponClass) {
  return g.weapons.filter((w) => (!cls || w.cls === cls) && has(p, w.id, i)).length
}

/** Pré-requisito do degrau, em texto (para "Abre com"). Null para as base. */
export function legacyUnlockText(g: LegacyGame, step: LegacyStep, w: LegacyWeapon): string | null {
  const total = (cls?: WeaponClass) => g.weapons.filter((x) => !cls || x.cls === cls).length
  switch (step.tier) {
    case 'gold':
      return `as ${g.ladder.filter((s) => s.tier === 'base').length} camuflagens base desta arma`
    case 'platinum':
      return `Gold nas ${total(w.cls)} armas da classe`
    case 'damascus':
      return `Platinum nas ${total()} armas`
    case 'obsidian':
      return 'Damascus desta arma'
    default:
      return null
  }
}

/** Motivo pelo qual o degrau ainda não pode ser marcado (ou null). */
export function legacyGate(g: LegacyGame, p: LegacyProgress, w: LegacyWeapon, i: number, enforce: boolean): string | null {
  if (!enforce) return null
  const step = g.ladder[i]
  const gold = stepIndex(g, 'gold')
  const plat = stepIndex(g, 'platinum')
  const dam = stepIndex(g, 'damascus')
  switch (step.tier) {
    case 'gold': {
      const base = g.ladder.filter((s) => s.tier === 'base')
      return base.every((s) => has(p, w.id, s.index)) ? null : `Termine as ${base.length} camuflagens base.`
    }
    case 'platinum': {
      const inClass = g.weapons.filter((x) => x.cls === w.cls)
      const missing = inClass.filter((x) => !has(p, x.id, gold)).length
      return missing === 0 ? null : `Termine o Gold nas ${inClass.length} armas da classe (faltam ${missing}).`
    }
    case 'damascus': {
      const missing = g.weapons.filter((x) => !has(p, x.id, plat)).length
      return missing === 0 ? null : `Termine o Platinum nas ${g.weapons.length} armas (faltam ${missing}).`
    }
    case 'obsidian':
      return has(p, w.id, dam) ? null : 'Termine o Damascus desta arma.'
    default:
      return null
  }
}

/** Marca/desmarca um degrau. Ao desmarcar, sai também o que dependia dele nesta arma. */
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
    for (let k = 0; k < g.ladder.length; k++) {
      if (has(out, w.id, k) && legacyGate(g, out, w, k, enforce)) {
        out = { ...out, [w.id]: (out[w.id] ?? 0) & ~(1 << k) }
        changed = true
        break
      }
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Tradução dos desafios (o texto vem em inglês). Padrões não reconhecidos ficam como estão.
// ---------------------------------------------------------------------------

const RULES: [RegExp, string][] = [
  [/^Kill (\S+) Enemies Without Dying (\S+) Times$/i, '$1 kills sem morrer, $2 vezes'],
  [/^Kill (\S+) Enemies with Headshots$/i, '$1 kills com headshot'],
  [/^Kill (\S+) Enemies$/i, '$1 kills'],
  [/^Get (\S+) Kills While your Gun is Using No Attachment Slots$/i, '$1 kills com a arma sem acessórios'],
  [/^Get (\S+) Kills While your Gun is Using All Attachment Slots$/i, '$1 kills com todos os acessórios na arma'],
  [/^Get (\S+) Kills while Crouch(ing|ed)$/i, '$1 kills agachado'],
  [/^Get (\S+) Longshot Kills$/i, '$1 kills de longa distância'],
  [/^Get (\S+) Kills Shortly After Reloading$/i, '$1 kills logo depois de recarregar'],
  [/^Get (\S+) Hipfire Kills$/i, '$1 kills sem mirar (hipfire)'],
  [/^Get (\S+) Kills While Mounted$/i, '$1 kills com a arma apoiada'],
  [/^Get (\S+) Double Kills$/i, '$1 kills duplos'],
  [/^Get (\S+) One Shot Kills$/i, '$1 kills com um tiro'],
  [/^Get (\S+) Point Blank Kills$/i, '$1 kills à queima-roupa'],
  [/^Kill (\S+) Attackers \(Enemy on your Team's Objective\)$/i, '$1 kills em atacantes (inimigo no seu objetivo)'],
  [/^Kill (\S+) Defenders \(Enemy on their Team's Objective\)$/i, '$1 kills em defensores (inimigo no objetivo dele)'],
  [/^Destroy (\S+) Aerial Killstreaks$/i, 'Destruir $1 killstreaks aéreas'],
  [/^Destroy (\S+) Ground Killstreaks$/i, 'Destruir $1 killstreaks terrestres'],
  [/^Destroy (\S+) Support Killstreaks$/i, 'Destruir $1 killstreaks de suporte'],
  [/^Destroy (\S+) Killstreaks$/i, 'Destruir $1 killstreaks'],
  [/^Destroy (\S+) Pieces of Equipment$/i, 'Destruir $1 equipamentos'],
  [/^Destroy (\S+) Vehicles$/i, 'Destruir $1 veículos'],
  [/^Get (\S+) Kills While Using the Amped Perk$/i, '$1 kills com a vantagem Amped'],
  [/^Get (\S+) Kills While Injured$/i, '$1 kills ferido'],
  [/^Get (\S+) Kills While Dead Silence is Active$/i, '$1 kills com Dead Silence ativo'],
  [/^Get (\S+) Kills While Near Smoke or Gas$/i, '$1 kills perto de fumaça ou gás'],
  [/^Get (\S+) Buzzkills$/i, '$1 buzzkills (encerrar killstreaks inimigas)'],
  [/^Complete (\S+) Finishing Moves$/i, '$1 finalizações'],
  [/^Get (\S+) Kills in a Single Match (\S+) Times$/i, '$1 kills em uma única partida, $2 vezes'],
  [/^Destroy a Killstreak or a Vehicle (\S+) Times$/i, 'Destruir uma killstreak ou um veículo, $1 vezes'],
  [/^Get (\S+) Kills$/i, '$1 kills'],
  [/^Complete all camo challenges for this weapon$/i, 'Completar todos os desafios de camuflagem desta arma'],
  [/^Unlock the Gold camo for every weapon of this class$/i, 'Gold em todas as armas da classe'],
  [/^Unlock the Platinum camo for all weapon classes$/i, 'Platinum em todas as classes'],
]

export function legacyText(en: string): string {
  const t = en.trim()
  for (const [re, pt] of RULES) if (re.test(t)) return t.replace(re, pt)
  return t
}
