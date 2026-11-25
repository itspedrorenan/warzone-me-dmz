// Conquistas do app (MW4): metas sobre o progresso de camuflagens, para dar um "jogo" ao tracker.
// Cada uma calcula quanto falta a partir do progresso; quando a meta é batida pela primeira vez,
// a data fica guardada em state.achievements (assim ela não some se você desmarcar algo depois).
import {
  CLASSES,
  GOLD_STEP,
  HB_STEP,
  LAUNCH_WEAPONS,
  MASTERIES,
  PLAT_STEP,
  isReleased,
  type Mode,
  type Weapon,
} from './data'
import { allWeapons, hbGateDone, maskOf, modeMasteryDone, prestigeOf, weaponTotals, type State } from './store'

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export const TIER_POINTS: Record<AchievementTier, number> = { bronze: 10, silver: 25, gold: 50, platinum: 100 }
export const TIER_LABEL: Record<AchievementTier, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
}

export type AchievementIcon =
  | 'footprints'
  | 'shield'
  | 'shield-check'
  | 'castle'
  | 'sparkles'
  | 'star'
  | 'coins'
  | 'medal'
  | 'crown'
  | 'layers'
  | 'gem'
  | 'diamond'
  | 'zap'
  | 'waves'
  | 'infinity'
  | 'orbit'
  | 'atom'
  | 'radiation'
  | 'mountain'
  | 'flame'
  | 'skull'
  | 'compass'
  | 'badge-check'
  | 'target'
  | 'crosshair'
  | 'trophy'

export interface Achievement {
  id: string
  group: string
  name: string
  desc: string
  tier: AchievementTier
  icon: AchievementIcon
  /** Quanto já tem e quanto precisa. */
  progress: (s: State) => { have: number; need: number }
}

// --- Contas sobre o progresso ----------------------------------------------------------------
const MIL = 0xff // bits 0–7: Militar 1–8
const SPEC = 0x700 // bits 8–10: as 3 especiais
const bit = (n: number) => 1 << n

const weapons = (s: State): Weapon[] => allWeapons(s).filter(isReleased)
const count = (s: State, ok: (w: Weapon) => boolean) => weapons(s).filter(ok).length
const total = (s: State) => weapons(s).length
const has = (s: State, w: Weapon, mask: number) => (maskOf(s, w.id) & mask) === mask

const chain = (mode: Mode) => MASTERIES.map((m, i) => ({ m, i })).filter((x) => x.m.mode === mode)
const firstOf = (mode: Mode) => chain(mode)[0]?.i ?? -1
const lastOf = (mode: Mode) => chain(mode).at(-1)?.i ?? -1
const masteryOn = (s: State, i: number) => (i < 0 ? 0 : count(s, (w) => modeMasteryDone(s, w.id, i)))

const anyCamo = (s: State, w: Weapon) =>
  maskOf(s, w.id) > 0 || prestigeOf(s, w.id) > 0 || (s.modeMastery[w.id] ?? 0) > 0
const classesTouched = (s: State) =>
  new Set(
    weapons(s)
      .filter((w) => anyCamo(s, w))
      .map((w) => w.cls),
  ).size
const classesInGame = (s: State) => new Set(weapons(s).map((w) => w.cls)).size
/** Classes com Gold em todas as armas dela. */
const goldClasses = (s: State) =>
  CLASSES.filter((c) => {
    const list = weapons(s).filter((w) => w.cls === c.id)
    return list.length > 0 && list.every((w) => has(s, w, bit(GOLD_STEP)))
  }).length
const counterTotal = (s: State) => Object.values(s.challengeCount).reduce((a, b) => a + (Number(b) || 0), 0)

const n = (have: number, need: number) => ({ have: Math.min(have, need), need })

// --- As 30 conquistas -------------------------------------------------------------------------
export const ACHIEVEMENTS: Achievement[] = [
  // Primeiros passos e militares
  {
    id: 'first-camo',
    group: 'Militares',
    name: 'Primeiro passo',
    desc: 'Conclua sua primeira camuflagem.',
    tier: 'bronze',
    icon: 'footprints',
    progress: (s) =>
      n(
        count(s, (w) => anyCamo(s, w)),
        1,
      ),
  },
  {
    id: 'mil-1',
    group: 'Militares',
    name: 'Recruta',
    desc: 'Todas as 8 militares em uma arma.',
    tier: 'bronze',
    icon: 'shield',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, MIL)),
        1,
      ),
  },
  {
    id: 'mil-5',
    group: 'Militares',
    name: 'Esquadrão',
    desc: 'Todas as militares em 5 armas.',
    tier: 'silver',
    icon: 'shield-check',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, MIL)),
        5,
      ),
  },
  {
    id: 'mil-15',
    group: 'Militares',
    name: 'Batalhão',
    desc: 'Todas as militares em 15 armas.',
    tier: 'gold',
    icon: 'castle',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, MIL)),
        15,
      ),
  },
  {
    id: 'mil-all',
    group: 'Militares',
    name: 'Arsenal upado',
    desc: 'Todas as militares em todas as armas.',
    tier: 'platinum',
    icon: 'castle',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, MIL)),
        total(s),
      ),
  },

  // Especiais
  {
    id: 'spec-1',
    group: 'Especiais',
    name: 'Especialista',
    desc: 'As 3 especiais em uma arma.',
    tier: 'bronze',
    icon: 'sparkles',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, SPEC)),
        1,
      ),
  },
  {
    id: 'spec-10',
    group: 'Especiais',
    name: 'Estilo próprio',
    desc: 'As especiais em 10 armas.',
    tier: 'silver',
    icon: 'star',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, SPEC)),
        10,
      ),
  },
  {
    id: 'spec-all',
    group: 'Especiais',
    name: 'Galeria completa',
    desc: 'As especiais em todas as armas.',
    tier: 'gold',
    icon: 'star',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, SPEC)),
        total(s),
      ),
  },

  // Gold
  {
    id: 'gold-1',
    group: 'Gold',
    name: 'Primeiro ouro',
    desc: 'Gold em uma arma.',
    tier: 'bronze',
    icon: 'coins',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, bit(GOLD_STEP))),
        1,
      ),
  },
  {
    id: 'gold-5',
    group: 'Gold',
    name: 'Corrida do ouro',
    desc: 'Gold em 5 armas.',
    tier: 'silver',
    icon: 'coins',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, bit(GOLD_STEP))),
        5,
      ),
  },
  {
    id: 'gold-class',
    group: 'Gold',
    name: 'Classe dourada',
    desc: 'Gold em todas as armas de uma classe.',
    tier: 'silver',
    icon: 'layers',
    progress: (s) => n(goldClasses(s), 1),
  },
  {
    id: 'gold-15',
    group: 'Gold',
    name: 'Reserva de ouro',
    desc: 'Gold em 15 armas.',
    tier: 'gold',
    icon: 'medal',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, bit(GOLD_STEP))),
        15,
      ),
  },
  {
    id: 'gold-all',
    group: 'Gold',
    name: 'Midas',
    desc: 'Gold em todas as armas.',
    tier: 'platinum',
    icon: 'crown',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, bit(GOLD_STEP))),
        total(s),
      ),
  },

  // Platinum
  {
    id: 'plat-1',
    group: 'Platinum',
    name: 'Platina',
    desc: 'Platinum em uma arma.',
    tier: 'silver',
    icon: 'gem',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, bit(PLAT_STEP))),
        1,
      ),
  },
  {
    id: 'plat-10',
    group: 'Platinum',
    name: 'Colecionador',
    desc: 'Platinum em 10 armas.',
    tier: 'gold',
    icon: 'gem',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, bit(PLAT_STEP))),
        10,
      ),
  },
  {
    id: 'plat-33',
    group: 'Platinum',
    name: 'Brilho total',
    desc: `Platinum em ${LAUNCH_WEAPONS} armas.`,
    tier: 'platinum',
    icon: 'diamond',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, bit(PLAT_STEP))),
        LAUNCH_WEAPONS,
      ),
  },

  // Harmonic Break e Divergence
  {
    id: 'hb-1',
    group: 'Harmonic Break',
    name: 'Harmonia',
    desc: 'Harmonic Break em uma arma.',
    tier: 'gold',
    icon: 'zap',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, bit(HB_STEP))),
        1,
      ),
  },
  {
    id: 'hb-10',
    group: 'Harmonic Break',
    name: 'Ressonância',
    desc: 'Harmonic Break em 10 armas.',
    tier: 'gold',
    icon: 'waves',
    progress: (s) =>
      n(
        count(s, (w) => has(s, w, bit(HB_STEP))),
        10,
      ),
  },
  {
    id: 'divergence',
    group: 'Harmonic Break',
    name: 'Divergente',
    desc: `Desbloqueie a Divergence (Harmonic Break em ${LAUNCH_WEAPONS} armas).`,
    tier: 'platinum',
    icon: 'infinity',
    progress: (s) => n(hbGateDone(s) ? LAUNCH_WEAPONS : count(s, (w) => has(s, w, bit(HB_STEP))), LAUNCH_WEAPONS),
  },

  // Maestrias de modo
  {
    id: 'mastery-mp',
    group: 'Maestrias',
    name: 'Mercurial',
    desc: `${MASTERIES[firstOf('mp')]?.name ?? 'Primeira maestria'} (Multiplayer) em uma arma.`,
    tier: 'gold',
    icon: 'orbit',
    progress: (s) => n(masteryOn(s, firstOf('mp')), 1),
  },
  {
    id: 'mastery-dmz',
    group: 'Maestrias',
    name: 'Operador DMZ',
    desc: `${MASTERIES[firstOf('dmz')]?.name ?? 'Primeira maestria'} (DMZ) em uma arma.`,
    tier: 'gold',
    icon: 'atom',
    progress: (s) => n(masteryOn(s, firstOf('dmz')), 1),
  },
  {
    id: 'mastery-wz',
    group: 'Maestrias',
    name: 'Lenda do Warzone',
    desc: `${MASTERIES[firstOf('wz')]?.name ?? 'Primeira maestria'} (Warzone) em uma arma.`,
    tier: 'gold',
    icon: 'radiation',
    progress: (s) => n(masteryOn(s, firstOf('wz')), 1),
  },
  {
    id: 'mastery-chain',
    group: 'Maestrias',
    name: 'Topo da cadeia',
    desc: 'A última maestria de um modo em uma arma.',
    tier: 'platinum',
    icon: 'mountain',
    progress: (s) => n(Math.max(...(['mp', 'dmz', 'wz'] as Mode[]).map((m) => masteryOn(s, lastOf(m)))), 1),
  },

  // Prestígio e armas completas
  {
    id: 'prestige-1',
    group: 'Prestígio',
    name: 'Prestígio',
    desc: 'A primeira camuflagem de prestígio em uma arma.',
    tier: 'silver',
    icon: 'flame',
    progress: (s) =>
      n(
        count(s, (w) => prestigeOf(s, w.id) > 0),
        1,
      ),
  },
  {
    id: 'prestige-all',
    group: 'Prestígio',
    name: 'Pyroclast total',
    desc: 'Todos os prestígios em uma arma.',
    tier: 'gold',
    icon: 'skull',
    progress: (s) =>
      n(
        count(s, (w) => w.prestige.length > 0 && prestigeOf(s, w.id) >= w.prestige.length),
        1,
      ),
  },
  {
    id: 'weapon-100',
    group: 'Prestígio',
    name: 'Obra-prima',
    desc: 'Todas as camuflagens de uma arma (100%).',
    tier: 'platinum',
    icon: 'badge-check',
    progress: (s) =>
      n(
        count(s, (w) => {
          const t = weaponTotals(s, w)
          return t.done >= t.total
        }),
        1,
      ),
  },

  // Variedade e grind
  {
    id: 'all-classes',
    group: 'Grind',
    name: 'Versátil',
    desc: 'Pelo menos uma camuflagem em cada classe de arma.',
    tier: 'silver',
    icon: 'compass',
    progress: (s) => n(classesTouched(s), classesInGame(s)),
  },
  {
    id: 'pin-3',
    group: 'Grind',
    name: 'Foco total',
    desc: '3 armas no grind ao mesmo tempo.',
    tier: 'bronze',
    icon: 'target',
    progress: (s) => n(s.pinned.filter((k) => !k.includes(':')).length, 3),
  },
  {
    id: 'counter-500',
    group: 'Grind',
    name: 'Na mira',
    desc: 'Some 500 nos contadores do grind.',
    tier: 'silver',
    icon: 'crosshair',
    progress: (s) => n(counterTotal(s), 500),
  },
  {
    id: 'all-done',
    group: 'Grind',
    name: 'Caçador de conquistas',
    desc: 'Desbloqueie todas as outras conquistas.',
    tier: 'platinum',
    icon: 'trophy',
    progress: () => ({ have: 0, need: 1 }),
  },
]

const META = 'all-done'

/** Situação de cada conquista: desbloqueada (guardada ou batida agora), progresso e data. */
export function achievementStatus(s: State) {
  const base = ACHIEVEMENTS.filter((a) => a.id !== META).map((a) => {
    const p = a.progress(s)
    const met = p.need > 0 && p.have >= p.need
    const at = s.achievements[a.id]
    return { a, ...p, unlocked: met || !!at, at: at ?? null }
  })
  const others = base.filter((x) => x.unlocked).length
  const metaDef = ACHIEVEMENTS.find((a) => a.id === META)!
  const metaAt = s.achievements[META]
  const meta = {
    a: metaDef,
    have: others,
    need: base.length,
    unlocked: others >= base.length || !!metaAt,
    at: metaAt ?? null,
  }
  return [...base, meta]
}

/** Conquistas batidas agora que ainda não têm data guardada. */
export const newlyUnlocked = (s: State) =>
  achievementStatus(s)
    .filter((x) => x.unlocked && !x.at)
    .map((x) => x.a)

export const points = (list: ReturnType<typeof achievementStatus>) =>
  list.filter((x) => x.unlocked).reduce((sum, x) => sum + TIER_POINTS[x.a.tier], 0)
export const maxPoints = ACHIEVEMENTS.reduce((sum, a) => sum + TIER_POINTS[a.tier], 0)
