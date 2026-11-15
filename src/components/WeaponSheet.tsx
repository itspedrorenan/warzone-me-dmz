import { useEffect, type Dispatch } from 'react'
import { LADDER, classLabel, prestigePending, prestigeReqText, seasonLabel, stepInfo, stepName } from '../data'
import { allWeapons, gateReason, levelOf, prestigeOf, type Action, type State } from '../store'
import { ModeSwitch } from './ModeSwitch'
import { vibrate } from '../hooks'
import { WeaponThumb } from './WeaponThumb'
import { camoImage, stepTexture } from '../data/camoImages'
import { CamoTex } from './CamoTex'

export function WeaponSheet({
  id,
  state,
  dispatch,
  onClose,
}: {
  id: string
  state: State
  dispatch: Dispatch<Action>
  onClose: () => void
}) {
  const weapon = allWeapons(state).find((w) => w.id === id)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('sheet-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('sheet-open')
    }
  }, [onClose])

  if (!weapon) return null
  const level = levelOf(state, weapon.id)
  const season = seasonLabel(weapon)
  const pinned = state.pinned.includes(weapon.id)

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <aside
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`Desafios de ${weapon.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <header className="sheet-head">
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

        <div className="sheet-thumb">
          <WeaponThumb weapon={weapon} size="lg" />
        </div>

        <div className="sheet-actions">
          <ModeSwitch mode={state.mode} dispatch={dispatch} small />
          <button
            className={`btn ${pinned ? '' : 'primary'}`}
            onClick={() => {
              dispatch({ type: 'togglePin', id: weapon.id })
              vibrate(state.haptics)
            }}
          >
            {pinned ? '★ No grind' : '☆ Pôr no grind'}
          </button>
        </div>

        <ol className="ladder">
          {LADDER.map((step) => {
            const done = level > step.index
            const blocked = !done ? gateReason(state, weapon, step.index + 1) : null
            const info = stepInfo(weapon, step, state.mode)
            const name = stepName(weapon, step)
            return (
              <li key={step.index}>
                <button
                  className={`ladder-step ${done ? 'done' : ''} ${step.index === level ? 'next' : ''}`}
                  onClick={() => {
                    dispatch({
                      type: 'setLevel',
                      id: weapon.id,
                      level: done && level === step.index + 1 ? step.index : step.index + 1,
                    })
                    vibrate(state.haptics)
                  }}
                  disabled={!!blocked}
                  aria-pressed={done}
                >
                  <span
                    className={`swatch tier-${step.tier} ${done ? 'done' : ''} ${stepTexture(weapon, step) ? 'has-tex' : ''}`}
                    aria-hidden="true"
                  >
                    <CamoTex url={stepTexture(weapon, step)} muted={!done} />
                    {done ? <span className="check-mark">✓</span> : ''}
                  </span>
                  <span className="ladder-text">
                    <strong>
                      {name}
                      {info.pending && <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />}
                    </strong>
                    {info.challenge && <span className="challenge">{info.challenge}</span>}
                    {info.unlock && <span className="hint">Abre com: {info.unlock}</span>}
                    {blocked && <span className="blocked-text">🔒 {blocked}</span>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="muted tip">Toque numa camuflagem para marcar até ela. Toque de novo na última para desmarcar.</p>

        {weapon.prestige.length > 0 && (
          <section className="prestige">
            <h3 className="section-title">
              Prestígio <span className="muted">{prestigeOf(state, weapon.id)}/{weapon.prestige.length}</span>
            </h3>
            <ol className="ladder">
              {weapon.prestige.map((camo, i) => {
                const count = prestigeOf(state, weapon.id)
                const done = count > i
                return (
                  <li key={camo.id}>
                    <button
                      className={`ladder-step ${done ? 'done' : ''} ${i === count ? 'next' : ''}`}
                      onClick={() => {
                        dispatch({ type: 'setPrestige', id: weapon.id, count: done && count === i + 1 ? i : i + 1 })
                        vibrate(state.haptics)
                      }}
                      aria-pressed={done}
                    >
                      <span className={`swatch tier-prestige ${done ? 'done' : ''} has-tex`} aria-hidden="true">
                        <CamoTex url={camoImage(camo.id)} muted={!done} />
                      </span>
                      <span className="ladder-text">
                        <strong>
                          {camo.name}
                          {prestigePending(camo) && <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />}
                        </strong>
                        <span className="challenge">{camo.requirements.map(prestigeReqText).join(' + ')}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        <label className="notes">
          <span>Anotações</span>
          <textarea
            value={state.notes[weapon.id] ?? ''}
            onChange={(e) => dispatch({ type: 'setNote', id: weapon.id, note: e.target.value })}
            rows={3}
            placeholder="Ex.: build para longshots"
          />
        </label>
      </aside>
    </div>
  )
}
