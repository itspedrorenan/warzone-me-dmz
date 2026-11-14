import { useEffect, type Dispatch } from 'react'
import { CLASS_CHALLENGES, LADDER, MODES, TIER_HINTS, classLabel, type Hint, type LadderStep, type Weapon } from '../data'
import { gateReason, levelOf, type Action, type State } from '../store'

function hintFor(step: LadderStep, weapon: Weapon, mode: State['mode']): Hint | undefined {
  if (step.tier === 'platinum') {
    const h = CLASS_CHALLENGES[weapon.cls].platinum
    return {
      text: `Gold em todas as armas da classe + ${h.text.toLowerCase()}${mode === 'mp' ? '' : ' (valores do Multiplayer; no ' + modeName(mode) + ' podem diferir)'}`,
      verify: h.verify || mode !== 'mp',
    }
  }
  if (step.tier === 'harmonic') {
    const h = CLASS_CHALLENGES[weapon.cls].harmonic
    return {
      text: `Platinum em todas as armas + ${h.text.toLowerCase()}${mode === 'mp' ? '' : ' (valores do Multiplayer; no ' + modeName(mode) + ' podem diferir)'}`,
      verify: h.verify || mode !== 'mp',
    }
  }
  return TIER_HINTS[step.tier][mode]
}

const modeName = (m: State['mode']) => MODES.find((x) => x.id === m)?.short ?? m

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
        aria-label={`Detalhes de ${weapon.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="drawer-head">
          <div>
            <p className="eyebrow">{classLabel(weapon.cls)}</p>
            <h2>{weapon.name}</h2>
            <p className="muted">
              {level}/{LADDER.length} camuflagens · dicas para {MODES.find((m) => m.id === state.mode)?.label}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <p className="shared-note">
          O progresso das camuflagens base é compartilhado entre Multiplayer, DMZ e Warzone — concluir em qualquer modo
          conta para todos.
        </p>

        <ol className="ladder">
          {LADDER.map((step) => {
            const done = level > step.index
            const blocked = !done ? gateReason(state, weapon, step.index + 1) : null
            const hint = hintFor(step, weapon, state.mode)
            const isNext = step.index === level
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
                  aria-label={done ? `Desmarcar ${step.name}` : `Marcar ${step.name}`}
                >
                  {done ? '✓' : ''}
                </button>
                <div className="ladder-text">
                  <strong>{step.name}</strong>
                  {hint && (
                    <span className="hint">
                      {hint.text}
                      {hint.verify && <span className="verify-dot" title="Confirme no jogo" />}
                    </span>
                  )}
                  {blocked && <span className="blocked-text">🔒 {blocked}</span>}
                </div>
              </li>
            )
          })}
        </ol>

        <label className="notes">
          <span>Anotações (desafios exatos, attachments, progresso…)</span>
          <textarea
            value={state.notes[weapon.id] ?? ''}
            onChange={(e) => dispatch({ type: 'setNote', id: weapon.id, note: e.target.value })}
            rows={4}
            placeholder="Ex.: Especial 2 — 30 abates com mira térmica (12/30)"
          />
        </label>
      </aside>
    </div>
  )
}
