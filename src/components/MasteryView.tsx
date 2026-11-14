import type { Dispatch } from 'react'
import { DIVERGENCE, FLASHPOINT, MASTERIES, MODES, HB_LEVEL, LAUNCH_WEAPONS, type Mode } from '../data'
import {
  countAtLeast,
  divergenceUnlocked,
  flashpointUnlocked,
  masteryPrereqLabel,
  masteryState,
  masteryTarget,
  masteryUnlocked,
  type Action,
  type State,
} from '../store'

export function MasteryView({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const hb = countAtLeast(state, HB_LEVEL)
  const div = divergenceUnlocked(state)
  // Modo selecionado primeiro.
  const modes = [...MODES].sort((a, b) => (a.id === state.mode ? -1 : b.id === state.mode ? 1 : 0))

  return (
    <div className="mastery-view">
      <div className="milestones">
        <div className={`milestone camo-divergence ${div ? 'unlocked' : ''}`}>
          <div className="milestone-swatch" aria-hidden="true" />
          <div>
            <h3>{DIVERGENCE.name}</h3>
            <p>{DIVERGENCE.requirement}</p>
            <div className="bar">
              <span style={{ width: `${Math.min(100, (hb / LAUNCH_WEAPONS) * 100)}%` }} />
            </div>
            <p className="muted">
              {hb}/{LAUNCH_WEAPONS} armas com Harmonic Break {div && '· liberada ✓'}
            </p>
          </div>
        </div>
        <div className={`milestone camo-flashpoint ${flashpointUnlocked(state) ? 'unlocked' : ''}`}>
          <div className="milestone-swatch" aria-hidden="true" />
          <div>
            <h3>{FLASHPOINT.name}</h3>
            <p>{FLASHPOINT.requirement}</p>
            <p className="muted">
              {MASTERIES.filter((m) => masteryState(state, m.id).done).length}/9 maestrias
              {flashpointUnlocked(state) && ' · liberada ✓'}
            </p>
          </div>
        </div>
      </div>

      <div className="mastery-columns">
        {modes.map((m) => (
          <ModeColumn key={m.id} mode={m.id} label={m.label} state={state} dispatch={dispatch} />
        ))}
      </div>
    </div>
  )
}

function ModeColumn({
  mode,
  label,
  state,
  dispatch,
}: {
  mode: Mode
  label: string
  state: State
  dispatch: Dispatch<Action>
}) {
  const chain = MASTERIES.filter((m) => m.mode === mode)
  const done = chain.filter((m) => masteryState(state, m.id).done).length
  return (
    <section className={`mode-column mode-${mode} ${state.mode === mode ? 'current' : ''}`}>
      <header>
        <h2>{label}</h2>
        <span className="muted">
          {done}/{chain.length}
        </span>
      </header>
      {chain.map((def, i) => {
        const ms = masteryState(state, def.id)
        const target = masteryTarget(state, def.id)
        const unlocked = masteryUnlocked(state, def.id)
        const pct = target ? Math.min(100, (ms.count / target) * 100) : ms.done ? 100 : 0
        const add = (n: number) => dispatch({ type: 'setMasteryCount', id: def.id, count: ms.count + n })
        return (
          <article key={def.id} className={`mastery-card ${ms.done ? 'done' : ''} ${unlocked ? '' : 'locked'}`}>
            <div className={`mastery-swatch m-${mode}-${i}`} aria-hidden="true" />
            <div className="mastery-body">
              <h3>
                {def.name}
                {def.verify && <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />}
              </h3>
              <p className="req">{def.requirement}</p>
              {!unlocked && (
                <p className="blocked-text">🔒 Requer {masteryPrereqLabel(def.id)}</p>
              )}
              {target > 0 && (
                <>
                  <div className="bar">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <div className="counter">
                    <div className="counter-values">
                      <input
                        type="number"
                        min={0}
                        value={ms.count}
                        disabled={!unlocked}
                        onChange={(e) => dispatch({ type: 'setMasteryCount', id: def.id, count: Number(e.target.value) })}
                        aria-label={`Progresso de ${def.name}`}
                      />
                      <span className="muted">/</span>
                      <input
                        type="number"
                        min={0}
                        className="target"
                        value={target}
                        onChange={(e) => dispatch({ type: 'setMasteryTarget', id: def.id, target: Number(e.target.value) })}
                        aria-label={`Meta de ${def.name}`}
                        title="Meta (editável)"
                      />
                    </div>
                    <div className="counter-buttons">
                      <button onClick={() => add(-1)} disabled={!unlocked || ms.count === 0} aria-label="Diminuir 1">
                        −1
                      </button>
                      <button onClick={() => add(1)} disabled={!unlocked} aria-label="Somar 1">
                        +1
                      </button>
                      <button onClick={() => add(10)} disabled={!unlocked} aria-label="Somar 10">
                        +10
                      </button>
                    </div>
                  </div>
                </>
              )}
              <label className="check">
                <input
                  type="checkbox"
                  checked={ms.done}
                  disabled={!ms.done && !unlocked}
                  onChange={() => dispatch({ type: 'toggleMasteryDone', id: def.id })}
                />
                Concluída
              </label>
            </div>
          </article>
        )
      })}
    </section>
  )
}
