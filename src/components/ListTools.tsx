import type { Dispatch, SetStateAction } from 'react'
import { ArrowDownUp, Check } from 'lucide-react'
import { SORTS, type ListPrefs, type SortMode } from '../listFilter'

/** Linha de filtro e ordem da lista de armas (abaixo das classes): "Esconder completas" e, ao lado,
 *  a ordenação só como ícone (o seletor do sistema abre ao tocar; fica na cor do jogo quando há ordem). */
export function ListTools({ prefs, setPrefs }: { prefs: ListPrefs; setPrefs: Dispatch<SetStateAction<ListPrefs>> }) {
  const sorted = prefs.sort !== 'default'
  return (
    <div className="list-tools">
      <button
        className={`lt-toggle ${prefs.hideComplete ? 'on' : ''}`}
        aria-pressed={prefs.hideComplete}
        onClick={() => setPrefs((p) => ({ ...p, hideComplete: !p.hideComplete }))}
      >
        <Check size={14} strokeWidth={3} aria-hidden="true" /> Esconder completas
      </button>
      <label className={`lt-sort-icon ${sorted ? 'on' : ''}`} title="Ordenar">
        <ArrowDownUp size={18} aria-hidden="true" />
        <span className="sr-only">Ordenar: {SORTS.find((s) => s.id === prefs.sort)?.label}</span>
        <select value={prefs.sort} onChange={(e) => setPrefs((p) => ({ ...p, sort: e.target.value as SortMode }))}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
