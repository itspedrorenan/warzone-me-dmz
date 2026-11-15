import type { Dispatch } from 'react'
import { MODES, type Mode } from '../data'
import type { Action } from '../store'

export function ModeSwitch({ mode, dispatch, small }: { mode: Mode; dispatch: Dispatch<Action>; small?: boolean }) {
  return (
    <div className={`mode-switch ${small ? 'small' : ''}`} role="radiogroup" aria-label="Modo de jogo">
      {MODES.map((m) => (
        <button
          key={m.id}
          role="radio"
          aria-checked={mode === m.id}
          className={`mode-btn mode-${m.id} ${mode === m.id ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'setMode', mode: m.id })}
          aria-label={m.label}
        >
          <img className="mode-logo" src={`./modes/${m.id}.webp`} alt="" draggable={false} />
        </button>
      ))}
    </div>
  )
}
