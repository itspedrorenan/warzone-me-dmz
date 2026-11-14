import { useEffect, useReducer } from 'react'
import {
  DEFAULT_WEAPONS,
  GOLD_LEVEL,
  HB_LEVEL,
  LAUNCH_WEAPONS,
  MASTERIES,
  MAX_LEVEL,
  PLAT_LEVEL,
  goldRequired,
  isReleased,
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
  version: 2
  /** Armas criadas pelo usuário (as padrão vêm dos dados importados). */
  customWeapons: Weapon[]
  /** IDs de armas padrão ocultadas. */
  hiddenWeapons: string[]
  progress: Record<string, number>
  notes: Record<string, string>
  pinned: string[]
  mastery: Record<string, MasteryState>
  mode: Mode
  /** Respeita os pré-requisitos do jogo (Platinum exige Gold na classe etc.). */
  enforceGates: boolean
}

export const initialState = (): State => ({
  version: 2,
  customWeapons: [],
  hiddenWeapons: [],
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

const CLASS_IDS: WeaponClass[] = ['ar', 'smg', 'shotgun', 'lmg', 'marksman', 'sniper', 'pistol', 'launcher', 'melee']

function customWeapon(id: string, name: string, cls: unknown): Weapon {
  return {
    id,
    name,
    cls: CLASS_IDS.includes(cls as WeaponClass) ? (cls as WeaponClass) : 'ar',
    season: 0,
    releaseDate: null,
    military: null,
    specials: [],
    custom: true,
  }
}

/** Aceita dados salvos/importados (inclusive o formato v1) e preenche o que faltar. */
export function sanitize(input: unknown): State {
  const base = initialState()
  if (!input || typeof input !== 'object') return base
  const s = input as Record<string, unknown>
  const defaultIds = new Set(DEFAULT_WEAPONS.map((w) => w.id))

  let customWeapons: Weapon[] = []
  let hiddenWeapons: string[] = []
  if (Array.isArray(s.customWeapons)) {
    customWeapons = s.customWeapons
      .filter((w) => w && typeof w.id === 'string' && typeof w.name === 'string' && !defaultIds.has(w.id))
      .map((w) => customWeapon(w.id, w.name, w.cls))
    hiddenWeapons = Array.isArray(s.hiddenWeapons) ? s.hiddenWeapons.filter((x) => defaultIds.has(x)) : []
  } else if (Array.isArray(s.weapons)) {
    // v1: a lista completa ficava no estado. Armas que não estão nos dados viram personalizadas;
    // armas padrão que o usuário tinha removido ficam ocultas.
    const v1 = s.weapons.filter((w) => w && typeof w.id === 'string' && typeof w.name === 'string')
    customWeapons = v1.filter((w) => !defaultIds.has(w.id)).map((w) => customWeapon(w.id, w.name, w.cls))
    const kept = new Set(v1.map((w) => w.id))
    hiddenWeapons = DEFAULT_WEAPONS.filter((w) => w.season === 0 && !kept.has(w.id)).map((w) => w.id)
  }

  const clampLevel = (n: unknown) => Math.max(0, Math.min(MAX_LEVEL, Math.round(Number(n) || 0)))
  const progress: Record<string, number> = {}
  for (const [k, v] of Object.entries((s.progress as object) ?? {})) progress[k] = clampLevel(v)
  return {
    version: 2,
    customWeapons,
    hiddenWeapons,
    progress,
    notes: typeof s.notes === 'object' && s.notes ? { ...(s.notes as Record<string, string>) } : {},
    pinned: Array.isArray(s.pinned) ? s.pinned.filter((x) => typeof x === 'string') : [],
    mastery: typeof s.mastery === 'object' && s.mastery ? { ...(s.mastery as Record<string, MasteryState>) } : {},
    mode: s.mode === 'dmz' || s.mode === 'wz' ? s.mode : 'mp',
    enforceGates: s.enforceGates !== false,
  }
}

// ---------------------------------------------------------------------------
// Seletores
// ---------------------------------------------------------------------------

export const allWeapons = (s: State): Weapon[] => [
  ...DEFAULT_WEAPONS.filter((w) => !s.hiddenWeapons.includes(w.id)),
  ...s.customWeapons,
]

export const levelOf = (s: State, id: string) => s.progress[id] ?? 0

/** Quantas armas (lançadas) já chegaram a um nível da escada. */
export const countAtLeast = (s: State, level: number, cls?: WeaponClass) =>
  allWeapons(s).filter((w) => (!cls || w.cls === cls) && isReleased(w) && levelOf(s, w.id) >= level).length

export const classGoldDone = (s: State, cls: WeaponClass) => countAtLeast(s, GOLD_LEVEL, cls) >= goldRequired(cls)
export const platinumGateDone = (s: State) => countAtLeast(s, PLAT_LEVEL) >= LAUNCH_WEAPONS
export const hbGateDone = (s: State) => countAtLeast(s, HB_LEVEL) >= LAUNCH_WEAPONS
/** Divergence é concedida ao completar Harmonic Break em 33 armas. */
export const divergenceUnlocked = hbGateDone

/** Motivo pelo qual um nível ainda não pode ser marcado (ou null). */
export function gateReason(s: State, weapon: Weapon, level: number): string | null {
  if (!s.enforceGates) return null
  if (!isReleased(weapon)) return 'Arma ainda não lançada.'
  if (level >= PLAT_LEVEL && !classGoldDone(s, weapon.cls)) {
    return `Platinum exige Gold em ${goldRequired(weapon.cls)} armas da classe.`
  }
  if (level >= HB_LEVEL && !platinumGateDone(s)) {
    return `Harmonic Break exige Platinum em ${LAUNCH_WEAPONS} armas.`
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

/** O pré-requisito da maestria (anterior na cadeia, Divergence ou Harmonic Break) foi cumprido? */
export function masteryUnlocked(s: State, id: string) {
  if (!s.enforceGates) return true
  const def = MASTERIES.find((m) => m.id === id)
  if (!def) return false
  const chain = MASTERIES.filter((m) => m.mode === def.mode)
  const idx = chain.findIndex((m) => m.id === id)
  if (idx === 0) return def.requires === 'harmonic-break' ? hbGateDone(s) : divergenceUnlocked(s)
  return masteryState(s, chain[idx - 1].id).done
}

export function masteryPrereqLabel(id: string) {
  const def = MASTERIES.find((m) => m.id === id)
  if (!def) return ''
  const chain = MASTERIES.filter((m) => m.mode === def.mode)
  const idx = chain.findIndex((m) => m.id === id)
  if (idx > 0) return chain[idx - 1].name
  return def.requires === 'harmonic-break' ? `Harmonic Break em ${LAUNCH_WEAPONS} armas` : 'Divergence'
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
  | { type: 'updateCustomWeapon'; id: string; patch: Partial<Pick<Weapon, 'name' | 'cls'>> }
  | { type: 'removeCustomWeapon'; id: string }
  | { type: 'toggleHidden'; id: string }
  | { type: 'replace'; state: State }
  | { type: 'reset' }

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'arma'
}

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'setLevel': {
      const weapon = allWeapons(s).find((w) => w.id === a.id)
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
      const taken = new Set(allWeapons(s).map((w) => w.id).concat(DEFAULT_WEAPONS.map((w) => w.id)))
      let id = slug(name)
      while (taken.has(id)) id += '-x'
      return { ...s, customWeapons: [...s.customWeapons, customWeapon(id, name, a.cls)] }
    }
    case 'updateCustomWeapon':
      return { ...s, customWeapons: s.customWeapons.map((w) => (w.id === a.id ? { ...w, ...a.patch } : w)) }
    case 'removeCustomWeapon': {
      const progress = { ...s.progress }
      const notes = { ...s.notes }
      delete progress[a.id]
      delete notes[a.id]
      return {
        ...s,
        customWeapons: s.customWeapons.filter((w) => w.id !== a.id),
        pinned: s.pinned.filter((x) => x !== a.id),
        progress,
        notes,
      }
    }
    case 'toggleHidden':
      return {
        ...s,
        hiddenWeapons: s.hiddenWeapons.includes(a.id)
          ? s.hiddenWeapons.filter((x) => x !== a.id)
          : [...s.hiddenWeapons, a.id],
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
