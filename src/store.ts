import { useEffect, useReducer } from 'react'
import {
  DEFAULT_WEAPONS,
  GOLD_LEVEL,
  HB_LEVEL,
  MASTERIES,
  MAX_LEVEL,
  PLAT_LEVEL,
  type Mode,
  type Weapon,
  type WeaponClass,
} from './data'

const STORAGE_KEY = 'camo-tracker:v1'

export interface MasteryState {
  count: number
  done: boolean
  /** Meta personalizada (sobrepõe a padrão). */
  target?: number
}

export interface State {
  version: 1
  weapons: Weapon[]
  progress: Record<string, number>
  notes: Record<string, string>
  pinned: string[]
  mastery: Record<string, MasteryState>
  mode: Mode
  /** Respeita os pré-requisitos do jogo (Platinum exige Gold na classe etc.). */
  enforceGates: boolean
}

export const initialState = (): State => ({
  version: 1,
  weapons: DEFAULT_WEAPONS.map((w) => ({ ...w })),
  progress: {},
  notes: {},
  pinned: [],
  mastery: {},
  mode: 'mp',
  enforceGates: true,
})

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    return sanitize(JSON.parse(raw))
  } catch {
    return initialState()
  }
}

/** Aceita dados salvos/importados e preenche o que faltar. */
export function sanitize(input: unknown): State {
  const base = initialState()
  if (!input || typeof input !== 'object') return base
  const s = input as Partial<State>
  const weapons = Array.isArray(s.weapons) && s.weapons.length
    ? s.weapons.filter((w) => w && typeof w.id === 'string' && typeof w.name === 'string')
    : base.weapons
  const clampLevel = (n: unknown) => Math.max(0, Math.min(MAX_LEVEL, Math.round(Number(n) || 0)))
  const progress: Record<string, number> = {}
  for (const [k, v] of Object.entries(s.progress ?? {})) progress[k] = clampLevel(v)
  return {
    version: 1,
    weapons: weapons.map((w) => ({ ...w, countsForMastery: w.countsForMastery !== false })),
    progress,
    notes: typeof s.notes === 'object' && s.notes ? { ...s.notes } : {},
    pinned: Array.isArray(s.pinned) ? s.pinned.filter((x) => typeof x === 'string') : [],
    mastery: typeof s.mastery === 'object' && s.mastery ? { ...s.mastery } : {},
    mode: s.mode === 'dmz' || s.mode === 'wz' ? s.mode : 'mp',
    enforceGates: s.enforceGates !== false,
  }
}

// ---------------------------------------------------------------------------
// Seletores
// ---------------------------------------------------------------------------

export const levelOf = (s: State, id: string) => s.progress[id] ?? 0

export const masteryWeapons = (s: State) => s.weapons.filter((w) => w.countsForMastery)

export function classGoldDone(s: State, cls: WeaponClass) {
  return s.weapons.filter((w) => w.cls === cls).every((w) => levelOf(s, w.id) >= GOLD_LEVEL)
}

export function allPlatinumDone(s: State) {
  return masteryWeapons(s).every((w) => levelOf(s, w.id) >= PLAT_LEVEL)
}

export function divergenceUnlocked(s: State) {
  const ws = masteryWeapons(s)
  return ws.length > 0 && ws.every((w) => levelOf(s, w.id) >= HB_LEVEL)
}

/** Motivo pelo qual um nível ainda não pode ser marcado (ou null). */
export function gateReason(s: State, weapon: Weapon, level: number): string | null {
  if (!s.enforceGates) return null
  if (level >= PLAT_LEVEL && !classGoldDone(s, weapon.cls)) {
    return 'Platinum exige Gold em todas as armas da classe.'
  }
  if (level >= HB_LEVEL && weapon.countsForMastery && !allPlatinumDone(s)) {
    return 'Harmonic Break exige Platinum em todas as armas.'
  }
  return null
}

export function masteryState(s: State, id: string): MasteryState {
  return s.mastery[id] ?? { count: 0, done: false }
}

export function masteryTarget(s: State, id: string) {
  const def = MASTERIES.find((m) => m.id === id)
  return masteryState(s, id).target ?? def?.target ?? 0
}

/** A maestria anterior da cadeia (ou Divergence, para a primeira) foi concluída? */
export function masteryUnlocked(s: State, id: string) {
  if (!s.enforceGates) return true
  const def = MASTERIES.find((m) => m.id === id)
  if (!def) return false
  const chain = MASTERIES.filter((m) => m.mode === def.mode)
  const idx = chain.findIndex((m) => m.id === id)
  if (idx === 0) return divergenceUnlocked(s)
  return masteryState(s, chain[idx - 1].id).done
}

export const flashpointUnlocked = (s: State) => MASTERIES.every((m) => masteryState(s, m.id).done)

// ---------------------------------------------------------------------------
// Ações
// ---------------------------------------------------------------------------

export type Action =
  | { type: 'setLevel'; id: string; level: number }
  | { type: 'setNote'; id: string; note: string }
  | { type: 'togglePin'; id: string }
  | { type: 'setMode'; mode: Mode }
  | { type: 'setMasteryCount'; id: string; count: number }
  | { type: 'setMasteryTarget'; id: string; target: number }
  | { type: 'toggleMasteryDone'; id: string }
  | { type: 'setEnforceGates'; value: boolean }
  | { type: 'addWeapon'; name: string; cls: WeaponClass }
  | { type: 'updateWeapon'; id: string; patch: Partial<Pick<Weapon, 'name' | 'cls' | 'countsForMastery'>> }
  | { type: 'removeWeapon'; id: string }
  | { type: 'restoreDefaultWeapons' }
  | { type: 'replace'; state: State }
  | { type: 'reset' }

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'arma'
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'setLevel': {
      const weapon = s.weapons.find((w) => w.id === a.id)
      if (!weapon) return s
      const level = Math.max(0, Math.min(MAX_LEVEL, a.level))
      if (level > levelOf(s, a.id) && gateReason(s, weapon, level)) return s
      return { ...s, progress: { ...s.progress, [a.id]: level } }
    }
    case 'setNote':
      return { ...s, notes: { ...s.notes, [a.id]: a.note } }
    case 'togglePin':
      return {
        ...s,
        pinned: s.pinned.includes(a.id) ? s.pinned.filter((x) => x !== a.id) : [...s.pinned, a.id],
      }
    case 'setMode':
      return { ...s, mode: a.mode }
    case 'setMasteryCount': {
      const cur = masteryState(s, a.id)
      const count = Math.max(0, Math.round(a.count) || 0)
      const target = masteryTarget(s, a.id)
      const done = target > 0 ? count >= target : cur.done
      return { ...s, mastery: { ...s.mastery, [a.id]: { ...cur, count, done } } }
    }
    case 'setMasteryTarget': {
      const cur = masteryState(s, a.id)
      const target = Math.max(0, Math.round(a.target) || 0)
      const done = target > 0 ? cur.count >= target : cur.done
      return { ...s, mastery: { ...s.mastery, [a.id]: { ...cur, target, done } } }
    }
    case 'toggleMasteryDone': {
      const cur = masteryState(s, a.id)
      if (!cur.done && !masteryUnlocked(s, a.id)) return s
      return { ...s, mastery: { ...s.mastery, [a.id]: { ...cur, done: !cur.done } } }
    }
    case 'setEnforceGates':
      return { ...s, enforceGates: a.value }
    case 'addWeapon': {
      const name = a.name.trim()
      if (!name) return s
      let id = slug(name)
      while (s.weapons.some((w) => w.id === id)) id += '-x'
      return { ...s, weapons: [...s.weapons, { id, name, cls: a.cls, custom: true, countsForMastery: true }] }
    }
    case 'updateWeapon':
      return { ...s, weapons: s.weapons.map((w) => (w.id === a.id ? { ...w, ...a.patch } : w)) }
    case 'removeWeapon': {
      const progress = { ...s.progress }
      const notes = { ...s.notes }
      delete progress[a.id]
      delete notes[a.id]
      return {
        ...s,
        weapons: s.weapons.filter((w) => w.id !== a.id),
        pinned: s.pinned.filter((x) => x !== a.id),
        progress,
        notes,
      }
    }
    case 'restoreDefaultWeapons': {
      const missing = DEFAULT_WEAPONS.filter((d) => !s.weapons.some((w) => w.id === d.id))
      return { ...s, weapons: [...s.weapons, ...missing.map((w) => ({ ...w }))] }
    }
    case 'replace':
      return a.state
    case 'reset':
      return initialState()
  }
}

export function useTracker() {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* armazenamento indisponível (modo privado etc.) */
    }
  }, [state])
  return [state, dispatch] as const
}
