import type { Dispatch } from 'react'
import { ChevronDown } from 'lucide-react'
import { LEGACY_GAMES } from '../data/legacy'
import type { Action } from '../store'

/** Seletor de jogo no topo. Só aparece quando há algum jogo antigo nesta máquina. */
export function GameSwitch({ game, dispatch }: { game: string; dispatch: Dispatch<Action> }) {
  if (!LEGACY_GAMES.length) return null
  const games = [{ id: 'mw4', short: 'MW4' }, ...LEGACY_GAMES.map((g) => ({ id: g.game, short: g.short }))]
  return (
    <label className="game-switch">
      <span className="sr-only">Jogo</span>
      <select value={game} onChange={(e) => dispatch({ type: 'setGame', game: e.target.value })}>
        {games.map((g) => (
          <option key={g.id} value={g.id}>
            {g.short}
          </option>
        ))}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
    </label>
  )
}
