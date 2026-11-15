import { useEffect, useReducer } from 'react'
import {
  ALL_STEPS_MASK,
  DEFAULT_WEAPONS,
  GOLD_STEP,
  HB_STEP,
  LADDER,
  LAUNCH_WEAPONS,
  MASTERIES,
  PLAT_STEP,
  goldRequired,
  isReleased,
  militaryForUnlock,
  stepName,
  unlockText,
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
  version: 3
  /** Armas criadas pelo usuário (as padrão vêm dos dados importados). */
  customWeapons: Weapon[]
  /** IDs de armas padrão ocultadas. */
  hiddenWeapons: string[]
  /** Camuflagens marcadas por arma: bit i = degrau i de LADDER (v2 guardava um nível linear). */
  progress: Record<string, number>
  notes: Record<string, string>
  pinned: string[]
  mastery: Record<string, MasteryState>
  mode: Mode
  /** Respeita os pré-requisitos do jogo (Platinum exige Gold na classe etc.). */
  enforceGates: boolean
  /** Contador do desafio atual de cada arma (zera ao trocar de camuflagem). */
  challengeCount: Record<string, number>
  /** Mantém a tela do celular ligada enquanto o app está aberto. */
  keepAwake: boolean
  /** Vibra ao tocar nos contadores. */
  haptics: boolean
  /** Quantas camuflagens de prestígio (em ordem) cada arma já tem. */
  prestige: Record<string, number>
}

export const initialState = (): State => ({
  version: 3,
  customWeapons: [],
  hiddenWeapons: [],
  progress: {},
  notes: {},
  pinned: [],
  mastery: {},
  mode: 'mp',
  enforceGates: true,
  challengeCount: {},
  keepAwake: true,
  haptics: true,
  prestige: {},
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
    prestige: [],
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

  // v1/v2: progresso era um nível linear n (as n primeiras marcadas) → vira a máscara com os n primeiros bits.
  const linear = s.version !== 3
  const progress: Record<string, number> = {}
  for (const [k, v] of Object.entries((s.progress as object) ?? {})) {
    const n = Math.max(0, Math.round(Number(v) || 0))
    progress[k] = linear ? (1 << Math.min(n, 14)) - 1 : n & ALL_STEPS_MASK
  }
  return {
    version: 3,
    customWeapons,
    hiddenWeapons,
    progress,
    notes: typeof s.notes === 'object' && s.notes ? { ...(s.notes as Record<string, string>) } : {},
    pinned: Array.isArray(s.pinned) ? s.pinned.filter((x) => typeof x === 'string') : [],
    mastery: typeof s.mastery === 'object' && s.mastery ? { ...(s.mastery as Record<string, MasteryState>) } : {},
    mode: s.mode === 'dmz' || s.mode === 'wz' ? s.mode : 'mp',
    enforceGates: s.enforceGates !== false,
    challengeCount: Object.fromEntries(
      Object.entries((s.challengeCount as object) ?? {}).map(([k, v]) => [k, Math.max(0, Math.round(Number(v) || 0))])
    ),
    keepAwake: s.keepAwake !== false,
    haptics: s.haptics !== false,
    prestige: Object.fromEntries(
      Object.entries((s.prestige as object) ?? {}).map(([k, v]) => [k, Math.max(0, Math.min(4, Math.round(Number(v) || 0)))])
    ),
  }
}

// ---------------------------------------------------------------------------
// Seletores
// ---------------------------------------------------------------------------

export const allWeapons = (s: State): Weapon[] => [
  ...DEFAULT_WEAPONS.filter((w) => !s.hiddenWeapons.includes(w.id)),
  ...s.customWeapons,
]

export const maskOf = (s: State, id: string) => s.progress[id] ?? 0
export const isDone = (s: State, id: string, step: number) => (maskOf(s, id) & (1 << step)) !== 0
export const doneCount = (s: State, id: string) => {
  let m = maskOf(s, id)
  let n = 0
  while (m) {
    n += m & 1
    m >>= 1
  }
  return n
}
export const prestigeOf = (s: State, id: string) => s.prestige[id] ?? 0

/** Quantas armas (lançadas) já têm um degrau marcado. */
export const countWithStep = (s: State, step: number, cls?: WeaponClass) =>
  allWeapons(s).filter((w) => (!cls || w.cls === cls) && isReleased(w) && isDone(s, w.id, step)).length

export const classGoldDone = (s: State, cls: WeaponClass) => countWithStep(s, GOLD_STEP, cls) >= goldRequired(cls)
export const platinumGateDone = (s: State) => countWithStep(s, PLAT_STEP) >= LAUNCH_WEAPONS
export const hbGateDone = (s: State) => countWithStep(s, HB_STEP) >= LAUNCH_WEAPONS
/** Divergence é concedida ao completar Harmonic Break em 33 armas. */
export const divergenceUnlocked = hbGateDone

const MILITARY_STEPS = [0, 1, 2, 3, 4, 5, 6, 7]
const BEFORE_GOLD = (1 << GOLD_STEP) - 1

/** Motivo pelo qual um degrau ainda não pode ser marcado (ou null). */
export function gateReason(s: State, weapon: Weapon, step: number): string | null {
  if (!s.enforceGates) return null
  if (!isReleased(weapon)) return 'Arma ainda não lançada.'
  const mask = maskOf(s, weapon.id)
  const has = (i: number) => (mask & (1 << i)) !== 0
  if (step >= 8 && step < GOLD_STEP) {
    // Especial: o nível da arma pedido precisa estar comprovado por uma militar marcada.
    const u = weapon.specials[step - 8]?.unlock
    if (!u) return null
    const need = militaryForUnlock(weapon, u)
    if (need !== null) {
      return has(need) ? null : `Conclua a Militar ${need + 1} antes (${unlockText(u)}).`
    }
    if (weapon.military?.unit === u.type && !MILITARY_STEPS.every(has)) {
      return `Conclua todas as militares antes (${unlockText(u)}).`
    }
    return null
  }
  if (step === GOLD_STEP && (mask & BEFORE_GOLD) !== BEFORE_GOLD) {
    return 'Termine todas as militares e especiais.'
  }
  if (step === PLAT_STEP) {
    if (!has(GOLD_STEP)) return 'Termine o Gold desta arma.'
    if (!classGoldDone(s, weapon.cls)) return `Termine o Gold em ${goldRequired(weapon.cls)} armas da classe.`
  }
  if (step === HB_STEP) {
    if (!has(PLAT_STEP)) return 'Termine o Platinum desta arma.'
    if (!platinumGateDone(s)) return `Termine o Platinum em ${LAUNCH_WEAPONS} armas.`
  }
  return null
}

/** Último degrau marcado, na ordem da escada (para o resumo do card). */
export function lastDoneName(s: State, weapon: Weapon): string | null {
  const mask = maskOf(s, weapon.id)
  for (let i = HB_STEP; i >= 0; i--) if (mask & (1 << i)) return stepName(weapon, LADDER[i])
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
  | { type: 'toggleStep'; id: string; step: number }
  | { type: 'setNote'; id: string; note: string }
  | { type: 'togglePin'; id: string }
  | { type: 'setMode'; mode: Mode }
  | { type: 'setMasteryCount'; id: string; count: number }
  | { type: 'setMasteryTarget'; id: string; target: number }
  | { type: 'toggleMasteryDone'; id: string }
  | { type: 'setEnforceGates'; value: boolean }
  | { type: 'setChallengeCount'; id: string; count: number }
  | { type: 'setKeepAwake'; value: boolean }
  | { type: 'setHaptics'; value: boolean }
  | { type: 'setPrestige'; id: string; count: number }
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
    case 'toggleStep': {
      // Militares seguem o nível da arma: marcar uma marca as anteriores; desmarcar desmarca as seguintes.
      // As demais (especiais, Gold, Platinum, HB) são marcadas uma a uma, respeitando gateReason.
      const weapon = allWeapons(s).find((w) => w.id === a.id)
      if (!weapon || a.step < 0 || a.step > HB_STEP) return s
      const mask = maskOf(s, a.id)
      const bit = 1 << a.step
      const military = a.step < 8
      let next: number
      if (mask & bit) {
        next = military ? mask & ~(((1 << 8) - 1) & ~(bit - 1)) : mask & ~bit
      } else {
        if (gateReason(s, weapon, a.step)) return s
        next = military ? mask | (bit << 1) - 1 : mask | bit
      }
      let out: State = { ...s, progress: { ...s.progress, [a.id]: next } }
      // Ao desmarcar, o que dependia disso nesta arma também sai (ex.: Smoke sem a Militar 3).
      if (mask & bit) {
        for (let changed = true; changed; ) {
          changed = false
          const cur = maskOf(out, a.id)
          for (let i = 0; i <= HB_STEP; i++) {
            if (cur & (1 << i) && gateReason(out, weapon, i)) {
              out = { ...out, progress: { ...out.progress, [a.id]: cur & ~(1 << i) } }
              changed = true
              break
            }
          }
        }
      }
      const challengeCount = { ...s.challengeCount }
      delete challengeCount[a.id]
      return { ...out, challengeCount }
    }
    case 'setChallengeCount':
      return { ...s, challengeCount: { ...s.challengeCount, [a.id]: Math.max(0, Math.round(a.count) || 0) } }
    case 'setKeepAwake':
      return { ...s, keepAwake: a.value }
    case 'setHaptics':
      return { ...s, haptics: a.value }
    case 'setPrestige':
      return { ...s, prestige: { ...s.prestige, [a.id]: Math.max(0, Math.min(4, a.count)) } }
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
      const challengeCount = { ...s.challengeCount }
      delete challengeCount[a.id]
      return {
        ...s,
        customWeapons: s.customWeapons.filter((w) => w.id !== a.id),
        pinned: s.pinned.filter((x) => x !== a.id),
        progress,
        notes,
        challengeCount,
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
