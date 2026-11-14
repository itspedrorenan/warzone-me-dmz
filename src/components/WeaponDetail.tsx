import { useEffect, type Dispatch } from 'react'
import { LADDER, MODES, classLabel, seasonLabel, stepInfo, stepName, type Weapon } from '../data'
import { gateReason, levelOf, type Action, type State } from '../store'

export function WeaponDetail({
  weapon,
  state,
  dispatch,
  onClose,
}: {
  weapon: Weapon
  state: State
  dispatch: Dispatch<Action>
  onClose: () => void
}) {
  const level = levelOf(state, weapon.id)
  const season = seasonLabel(weapon)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Desafios de ${weapon.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <p className="eyebrow">
              {classLabel(weapon.cls)}
              {season && ` · ${season}`}
            </p>
            <h2>{weapon.name}</h2>
            <p className="muted">
              {level}/{LADDER.length} camuflagens
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="mode-switch small" role="tablist" aria-label="Desafios do modo">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={state.mode === m.id}
              className={`mode-btn mode-${m.id} ${state.mode === m.id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'setMode', mode: m.id })}
            >
              {m.short}
            </button>
          ))}
        </div>

        <p className="shared-note">
          O progresso das camuflagens é compartilhado entre Multiplayer, DMZ e Warzone. Conclua cada desafio no modo
          que for mais fácil: os números mudam conforme o modo.
        </p>

        <ol className="ladder">
          {LADDER.map((step) => {
            const done = level > step.index
            const blocked = !done ? gateReason(state, weapon, step.index + 1) : null
            const info = stepInfo(weapon, step, state.mode)
            const isNext = step.index === level
            const name = stepName(weapon, step)
            return (
              <li key={step.index} className={`ladder-step ${done ? 'done' : ''} ${isNext ? 'next' : ''}`}>
                <button
                  className={`swatch tier-${step.tier} ${done ? 'done' : ''}`}
                  onClick={() =>
                    dispatch({
                      type: 'setLevel',
                      id: weapon.id,
                      level: done && level === step.index + 1 ? step.index : step.index + 1,
                    })
                  }
                  disabled={!!blocked}
                  aria-label={done ? `Desmarcar ${name}` : `Marcar ${name}`}
                >
                  {done ? '✓' : ''}
                </button>
                <div className="ladder-text">
                  <strong>
                    {name}
                    {info.pending && <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />}
                  </strong>
                  {info.challenge && <span className="challenge">{info.challenge}</span>}
                  {info.unlock && <span className="hint">Abre com: {info.unlock}</span>}
                  {blocked && <span className="blocked-text">🔒 {blocked}</span>}
                </div>
              </li>
            )
          })}
        </ol>

        <label className="notes">
          <span>Anotações (progresso, attachments, dicas…)</span>
          <textarea
            value={state.notes[weapon.id] ?? ''}
            onChange={(e) => dispatch({ type: 'setNote', id: weapon.id, note: e.target.value })}
            rows={4}
            placeholder="Ex.: Stormwave — 32/50 com silenciador"
          />
        </label>
      </aside>
    </div>
  )
}
