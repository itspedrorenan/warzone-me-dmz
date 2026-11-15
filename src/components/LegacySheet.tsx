import { useEffect, useState, type Dispatch, type UIEvent } from 'react'
import { Check, Flame, Info, Lock, X } from 'lucide-react'
import { classLabel } from '../data'
import {
  legacyDone,
  legacyDoneCount,
  legacyGate,
  legacyText,
  legacyToggle,
  legacyUnlockText,
  type LegacyGame,
} from '../data/legacy'
import type { Action, State } from '../store'
import { vibrate } from '../hooks'
import { CamoTex } from './CamoTex'

type Group = 'all' | 'base' | 'mastery'

/** Painel de uma arma de jogo antigo (mesmo visual do painel do MW4). */
export function LegacySheet({
  game,
  id,
  state,
  dispatch,
  onClose,
}: {
  game: LegacyGame
  id: string
  state: State
  dispatch: Dispatch<Action>
  onClose: () => void
}) {
  const weapon = game.weapons.find((w) => w.id === id)
  const [group, setGroup] = useState<Group>('all')
  const [preview, setPreview] = useState<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const onScroll = (e: UIEvent<HTMLElement>) => {
    const y = e.currentTarget.scrollTop
    if (y < 8) {
      if (collapsed) setCollapsed(false)
    } else if (!collapsed && y > 64) {
      setCollapsed(true)
    }
  }

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
  const progress = state.legacy[game.game] ?? {}
  const count = legacyDoneCount(progress, weapon.id)
  const pinKey = `${game.game}:${weapon.id}`
  const pinned = state.pinned.includes(pinKey)
  const noteKey = pinKey
  const nextStep = game.ladder.findIndex((s) => !legacyDone(progress, weapon.id, s.index))
  const inGroup = (g: Group) => game.ladder.filter((s) => g === 'all' || (g === 'base') === (s.tier === 'base'))
  const doneIn = (g: Group) => inGroup(g).filter((s) => legacyDone(progress, weapon.id, s.index)).length
  const groups: { id: Group; label: string }[] = [
    { id: 'all', label: 'Todas' },
    { id: 'base', label: 'Base' },
    { id: 'mastery', label: 'Maestria' },
  ]
  const shown = preview === null ? null : game.ladder[preview]

  const toggle = (i: number) => {
    const next = legacyToggle(game, progress, weapon, i, state.enforceGates)
    if (next !== progress) dispatch({ type: 'setLegacyProgress', game: game.game, progress: next })
    vibrate(state.haptics)
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <aside
        className="sheet"
        onScroll={onScroll}
        role="dialog"
        aria-modal="true"
        aria-label={`Desafios de ${weapon.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sheet-top ${collapsed ? 'collapsed' : ''}`}>
          <header className="sheet-head">
            <div>
              <p className="eyebrow">
                {classLabel(weapon.cls)} · {game.short}
              </p>
              <h2>{weapon.name}</h2>
              <p className="muted">
                {count}/{game.ladder.length} camuflagens
              </p>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="sheet-thumb">
            {shown ? (
              <div className="legacy-preview" aria-label={`Camuflagem ${shown.name}`}>
                <img src={shown.image} alt="" />
              </div>
            ) : (
              <div className="legacy-hero">
                <img src={weapon.icon} alt={weapon.name} />
              </div>
            )}
            <p className="preview-label">
              {shown ? (
                <>
                  <span className="preview-name">{shown.name}</span>
                  <button className="link-btn" onClick={() => setPreview(null)}>
                    Voltar
                  </button>
                </>
              ) : (
                <span className="muted preview-hint">Toque no quadrado para ver a camuflagem.</span>
              )}
            </p>
          </div>
        </div>

        <div className="sheet-actions">
          <span className="legacy-unlock muted">{weapon.unlock ? `Desbloqueio: ${weapon.unlock}` : ''}</span>
          <button
            className={`btn ${pinned ? '' : 'primary'}`}
            onClick={() => {
              dispatch({ type: 'togglePin', id: pinKey })
              vibrate(state.haptics)
            }}
          >
            <Flame size={16} aria-hidden="true" fill={pinned ? 'currentColor' : 'none'} />
            {pinned ? 'No grind' : 'Grindar'}
          </button>
        </div>

        <div className="chips group-tabs" role="tablist" aria-label="Grupos de camuflagens">
          {groups.map((g) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={group === g.id}
              className={`chip ${group === g.id ? 'active' : ''}`}
              onClick={() => setGroup(g.id)}
            >
              {g.label}{' '}
              <span className="chip-count">
                {doneIn(g.id)}/{inGroup(g.id).length}
              </span>
            </button>
          ))}
        </div>

        <ol className="ladder">
          {inGroup(group).map((step) => {
            const done = legacyDone(progress, weapon.id, step.index)
            const blocked = !done ? legacyGate(game, progress, weapon, step.index, state.enforceGates) : null
            const unlock = legacyUnlockText(game, step, weapon)
            // Gold/Platinum/Damascus não têm desafio próprio: o texto da fonte só repete o pré-requisito.
            const challenge = unlock && step.tier !== 'obsidian' ? null : weapon.challenges[step.index]
            return (
              <li
                key={step.index}
                className={`ladder-step ${done ? 'done' : ''} ${step.index === nextStep ? 'next' : ''} ${blocked ? 'blocked' : ''}`}
              >
                <button
                  className={`swatch legacy-${step.tier} ${done ? 'done' : ''} ${preview === step.index ? 'previewing' : ''} has-tex`}
                  onClick={() => setPreview(step.index)}
                  aria-label={`Ver ${step.name}`}
                >
                  <CamoTex url={step.image} muted={!done} />
                </button>
                <button
                  className="ladder-text"
                  onClick={() => toggle(step.index)}
                  disabled={!!blocked}
                  aria-pressed={done}
                  aria-label={`${done ? 'Desmarcar' : 'Marcar'} ${step.name}`}
                >
                  <strong>{step.name}</strong>
                  {challenge && <span className="challenge">{legacyText(challenge)}</span>}
                  {unlock && <span className="hint">Abre com: {unlock}</span>}
                  {blocked && (
                    <span className="blocked-text">
                      <Lock size={12} aria-hidden="true" /> {blocked}
                    </span>
                  )}
                  {done && <Check className="step-check" size={20} strokeWidth={3} aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ol>
        <p className="notice">
          <Info size={14} aria-hidden="true" />
          <span>Toque no card para marcar ou desmarcar.</span>
        </p>

        <label className="notes">
          <span>Anotações</span>
          <textarea
            value={state.notes[noteKey] ?? ''}
            onChange={(e) => dispatch({ type: 'setNote', id: noteKey, note: e.target.value })}
            rows={3}
            placeholder="Ex.: build para longshots"
          />
        </label>

        <p className="credits">
          Desafios e imagens: <a href={game.source.url}>{game.source.name}</a>, para uso local com autorização. ©
          Activision.
        </p>
      </aside>
    </div>
  )
}
