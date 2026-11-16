import type { Dispatch, SetStateAction } from 'react'
import { ArrowDownUp, Check, Flame } from 'lucide-react'
import type { ListPrefs, SortMode } from '../listFilter'

const SORTS: { id: SortMode; label: string }[] = [
  { id: 'default', label: 'Ordem do jogo' },
  { id: 'closest', label: 'Mais perto de terminar' },
  { id: 'least', label: 'Menos feitas' },
  { id: 'name', label: 'Nome (A–Z)' },
]

/** Linha de ordem e filtros da lista de armas (abaixo das classes). */
export function ListTools({ prefs, setPrefs }: { prefs: ListPrefs; setPrefs: Dispatch<SetStateAction<ListPrefs>> }) {
  return (
    <div className="list-tools">
      <label className="lt-sort">
        <ArrowDownUp size={16} aria-hidden="true" />
        <span className="sr-only">Ordenar</span>
        <select value={prefs.sort} onChange={(e) => setPrefs((p) => ({ ...p, sort: e.target.value as SortMode }))}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <button
        className={`lt-toggle ${prefs.hideComplete ? 'on' : ''}`}
        aria-pressed={prefs.hideComplete}
        onClick={() => setPrefs((p) => ({ ...p, hideComplete: !p.hideComplete }))}
      >
        <Check size={14} strokeWidth={3} aria-hidden="true" /> Esconder completas
      </button>
      <button
        className={`lt-toggle ${prefs.onlyPinned ? 'on' : ''}`}
        aria-pressed={prefs.onlyPinned}
        onClick={() => setPrefs((p) => ({ ...p, onlyPinned: !p.onlyPinned }))}
      >
        <Flame size={14} aria-hidden="true" /> Só no grind
      </button>
    </div>
  )
}
