// Números da tela de Progresso, num formato comum para o MW4 e os jogos antigos.

import { CLASSES, GOLD_STEP, HB_STEP, LADDER, LAUNCH_WEAPONS, PLAT_STEP, goldRequired, isReleased } from './data'
import { camoImage } from './data/camoImages'
import {
  legacyCount,
  legacyDone,
  legacyDoneCount,
  legacyFinale,
  type LegacyGame,
  type LegacyTier,
} from './data/legacy'
import { allWeapons, countWithStep, doneCount, isDone, type State } from './store'

export interface Milestone {
  label: string
  image: string | null
  /** Armas com esta camuflagem. */
  have: number
  /** Total de armas. */
  of: number
}

export interface Finale {
  label: string
  image: string | null
  /** Progresso da meta global (ex.: Harmonic Break em 18 de 33 armas). */
  have: number
  need: number
  requirement: string
  done: boolean
}

export interface ClassRow {
  id: string
  label: string
  /** Armas da classe com o primeiro marco (Gold / Gilded). */
  have: number
  /** Quantas liberam o segundo marco (Platinum / Forged). */
  need: number
  total: number
}

export interface WeaponRow {
  id: string
  name: string
  done: number
  total: number
  /** Camuflagens base que faltam para o primeiro marco (0 = já tem). */
  missing: number
  /** Nome do próximo marco (ex.: "Gold"). */
  next: string
  pinned: boolean
}

export interface Summary {
  done: number
  total: number
  weapons: number
  milestones: Milestone[]
  finale: Finale | null
  firstLabel: string
  secondLabel: string
  classes: ClassRow[]
  closest: WeaponRow[]
  pinned: WeaponRow[]
}

const byClosest = (a: WeaponRow, b: WeaponRow) => a.missing - b.missing || b.done - a.done || a.name.localeCompare(b.name)

/** MW4: escada de 14 por arma (militares, especiais, Gold, Platinum, Harmonic Break). */
export function summaryMW4(s: State): Summary {
  const weapons = allWeapons(s).filter(isReleased)
  const n = weapons.length
  const rows: WeaponRow[] = weapons.map((w) => {
    const before = LADDER.filter((st) => st.index < GOLD_STEP)
    const missing = isDone(s, w.id, GOLD_STEP) ? 0 : before.filter((st) => !isDone(s, w.id, st.index)).length
    return {
      id: w.id,
      name: w.name,
      done: doneCount(s, w.id),
      total: LADDER.length,
      missing,
      next: 'Gold',
      pinned: s.pinned.includes(w.id),
    }
  })
  const hb = countWithStep(s, HB_STEP)
  return {
    done: rows.reduce((t, r) => t + r.done, 0),
    total: n * LADDER.length,
    weapons: n,
    milestones: [
      { label: 'Gold', image: camoImage('gold'), have: countWithStep(s, GOLD_STEP), of: n },
      { label: 'Platinum', image: camoImage('platinum'), have: countWithStep(s, PLAT_STEP), of: n },
      { label: 'Harmonic Break', image: camoImage('harmonic-break'), have: hb, of: n },
    ],
    finale: {
      label: 'Divergence',
      image: camoImage('divergence'),
      have: Math.min(hb, LAUNCH_WEAPONS),
      need: LAUNCH_WEAPONS,
      requirement: `Harmonic Break em ${LAUNCH_WEAPONS} armas`,
      done: hb >= LAUNCH_WEAPONS,
    },
    firstLabel: 'Gold',
    secondLabel: 'Platinum',
    classes: CLASSES.filter((c) => weapons.some((w) => w.cls === c.id)).map((c) => ({
      id: c.id,
      label: c.label,
      have: countWithStep(s, GOLD_STEP, c.id),
      need: goldRequired(c.id),
      total: weapons.filter((w) => w.cls === c.id).length,
    })),
    // Só armas já começadas: as zeradas não estão "perto" de nada.
    closest: rows.filter((r) => r.missing > 0 && r.done > 0).sort(byClosest).slice(0, 5),
    pinned: rows.filter((r) => r.pinned),
  }
}

/** Jogos antigos (MW 2019, MW II, MW III), com as regras e os nomes de cada um. */
export function summaryLegacy(g: LegacyGame, s: State): Summary {
  const p = s.legacy[g.game] ?? {}
  const n = g.weapons.length
  const tiers = g.tiers.map((t) => t.tier as LegacyTier)
  const first = tiers[0]
  const imageOf = (tier: LegacyTier) => {
    for (const w of g.weapons) {
      const st = w.steps.find((x) => x.tier === tier)
      if (st?.image) return st.image
    }
    return null
  }
  const rows: WeaponRow[] = g.weapons.map((w) => {
    const firstIndex = w.steps.findIndex((x) => x.tier === first)
    const missing =
      firstIndex >= 0 && legacyDone(p, w.id, firstIndex)
        ? 0
        : w.steps.filter((x, i) => x.tier === 'base' && !legacyDone(p, w.id, i)).length
    const pinKey = `${g.game}:${w.id}`
    return {
      id: w.id,
      name: w.name,
      done: legacyDoneCount(p, w.id),
      total: w.steps.length,
      missing,
      next: g.tiers[0]?.label ?? '',
      pinned: s.pinned.includes(pinKey),
    }
  })
  const fin = legacyFinale(g, p)
  const last = g.tiers[g.tiers.length - 1]
  // Meta da classe para o 2º marco: MW II/III vêm da configuração do tracker; no MW 2019 é a classe inteira.
  const need = (cls: string, total: number) =>
    g.rules.kind === 'tiered' ? Math.min(g.rules.secondNeed[cls] ?? total, total) : total
  return {
    done: rows.reduce((t, r) => t + r.done, 0),
    total: rows.reduce((t, r) => t + r.total, 0),
    weapons: n,
    milestones: g.tiers.map((t) => ({ label: t.label, image: imageOf(t.tier), have: legacyCount(g, p, t.tier), of: n })),
    finale: fin
      ? {
          label: fin.name,
          image: fin.image,
          have: Math.min(fin.have, fin.need),
          need: fin.need,
          requirement: `${last?.label} em ${fin.need} armas`,
          done: fin.done,
        }
      : null,
    firstLabel: g.tiers[0]?.label ?? '',
    secondLabel: g.tiers[1]?.label ?? '',
    classes: g.classes.map((c) => {
      const total = g.weapons.filter((w) => w.cls === c.id).length
      return { id: c.id, label: c.label, have: legacyCount(g, p, first, c.id), need: need(c.id, total), total }
    }),
    // Só armas já começadas: as zeradas não estão "perto" de nada.
    closest: rows.filter((r) => r.missing > 0 && r.done > 0).sort(byClosest).slice(0, 5),
    pinned: rows.filter((r) => r.pinned),
  }
}
