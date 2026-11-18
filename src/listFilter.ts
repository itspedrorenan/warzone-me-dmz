import { useEffect, useState } from 'react'

/** Ordem da lista de armas (dentro de cada classe). */
export type SortMode = 'default' | 'closest' | 'least' | 'name'

export interface ListPrefs {
  sort: SortMode
  hideComplete: boolean
}

const KEY = 'camo-tracker:list'
const DEFAULTS: ListPrefs = { sort: 'default', hideComplete: false }

const load = (): ListPrefs => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { sort: saved.sort ?? DEFAULTS.sort, hideComplete: !!saved.hideComplete }
  } catch {
    return DEFAULTS
  }
}

/** Preferências de ordem/filtro da lista, lembradas neste aparelho (valem para todos os jogos). */
export function useListPrefs() {
  const [prefs, setPrefs] = useState<ListPrefs>(load)
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs))
    } catch {
      // sem armazenamento (aba anônima etc.): só não lembra
    }
  }, [prefs])
  return [prefs, setPrefs] as const
}

export const SORTS: { id: SortMode; label: string }[] = [
  { id: 'default', label: 'Ordem do jogo' },
  { id: 'closest', label: 'Mais perto de terminar' },
  { id: 'least', label: 'Menos feitas' },
  { id: 'name', label: 'Nome (A–Z)' },
]

/** Título da lista única (sem grupos de classe) quando há ordem ou filtro escolhido. */
export const listTitle = (p: ListPrefs) =>
  p.sort !== 'default' ? SORTS.find((s) => s.id === p.sort)!.label : 'Faltando terminar'

export const prefsActive = (p: ListPrefs) => p.sort !== 'default' || p.hideComplete

/** O que a lista precisa saber de cada arma para filtrar e ordenar. */
export interface ListInfo {
  name: string
  done: number
  total: number
  complete: boolean
  pinned: boolean
}

/** Aplica "esconder completas", "só no grind" e a ordem escolhida. Mantém a ordem original nos empates. */
export function applyListPrefs<T>(items: T[], info: (item: T) => ListInfo, p: ListPrefs): T[] {
  const rows = items.map((item, i) => ({ item, i, ...info(item) }))
  const kept = rows.filter((r) => !(p.hideComplete && r.complete))
  const pct = (r: ListInfo) => (r.total ? r.done / r.total : 0)
  if (p.sort === 'closest') {
    // Mais perto de terminar primeiro; as já completas vão para o fim.
    kept.sort((a, b) => Number(a.complete) - Number(b.complete) || pct(b) - pct(a) || a.i - b.i)
  } else if (p.sort === 'least') {
    kept.sort((a, b) => pct(a) - pct(b) || a.i - b.i)
  } else if (p.sort === 'name') {
    kept.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }) || a.i - b.i)
  }
  return kept.map((r) => r.item)
}
