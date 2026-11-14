import type { Dispatch } from 'react'
import { LADDER, MASTERIES, MAX_LEVEL, MODES, CLASSES, seasonLabel, stepInfo, stepName, type Weapon } from '../data'
import {
  allWeapons,
  gateReason,
  levelOf,
  masteryPrereqLabel,
  masteryState,
  masteryTarget,
  masteryUnlocked,
  type Action,
  type State,
} from '../store'
import { vibrate } from '../hooks'
import type { Tab } from '../App'
import { WeaponThumb } from './WeaponThumb'

export function GrindView({
  state,
  dispatch,
  onOpen,
  goTo,
}: {
  state: State
  dispatch: Dispatch<Action>
  onOpen: (id: string) => void
  goTo: (t: Tab) => void
}) {
  const weapons = allWeapons(state)
  const pinned = state.pinned.map((id) => weapons.find((w) => w.id === id)).filter((w): w is Weapon => !!w)
  const modeLabel = MODES.find((m) => m.id === state.mode)?.label

  return (
    <div className="grind">
      <p className="mode-hint">
        Desafios do <strong>{modeLabel}</strong>
      </p>

      {pinned.length === 0 ? (
        <div className="empty-card">
          <p className="empty-title">Nenhuma arma no grind</p>
          <p className="muted">Escolha as armas que você vai upar agora. Elas aparecem aqui com o desafio atual e um contador.</p>
          <button className="btn primary big" onClick={() => goTo('weapons')}>
            Escolher armas
          </button>
        </div>
      ) : (
        pinned.map((w) => <GrindCard key={w.id} weapon={w} state={state} dispatch={dispatch} onOpen={onOpen} />)
      )}

      <MasteryCard state={state} dispatch={dispatch} />
    </div>
  )
}

function GrindCard({
  weapon,
  state,
  dispatch,
  onOpen,
}: {
  weapon: Weapon
  state: State
  dispatch: Dispatch<Action>
  onOpen: (id: string) => void
}) {
  const level = levelOf(state, weapon.id)
  const done = level >= MAX_LEVEL
  const step = done ? null : LADDER[level]
  const info = step ? stepInfo(weapon, step, state.mode) : null
  const blocked = step ? gateReason(state, weapon, level + 1) : null
  const count = state.challengeCount[weapon.id] ?? 0
  const target = info?.target ?? 0
  const hasCounter = !!step && step.tier !== 'military' && target > 0
  const ready = hasCounter && count >= target
  const season = seasonLabel(weapon)

  const add = (n: number) => {
    const next = Math.max(0, count + n)
    dispatch({ type: 'setChallengeCount', id: weapon.id, count: next })
    vibrate(state.haptics, next >= target && count < target ? [30, 40, 30] : 12)
  }
  const complete = () => {
    dispatch({ type: 'setLevel', id: weapon.id, level: level + 1 })
    vibrate(state.haptics, [20, 30, 60])
  }

  return (
    <article className={`grind-card ${ready ? 'ready' : ''} ${done ? 'finished' : ''}`}>
      <header className="gc-head">
        <button className="gc-title" onClick={() => onOpen(weapon.id)}>
          <span className="gc-name">{weapon.name}</span>
          <span className="gc-meta">
            {CLASSES.find((c) => c.id === weapon.cls)?.short}
            {season && ` · ${season}`} · {level}/{MAX_LEVEL}
          </span>
        </button>
        <button
          className="icon-btn"
          onClick={() => dispatch({ type: 'togglePin', id: weapon.id })}
          aria-label={`Tirar ${weapon.name} do grind`}
          title="Tirar do grind"
        >
          ×
        </button>
      </header>

      <button className="gc-thumb" onClick={() => onOpen(weapon.id)} aria-label={`Ver desafios de ${weapon.name}`}>
        <WeaponThumb weapon={weapon} size="lg" />
      </button>

      <div className="mini-ladder" aria-hidden="true">
        {LADDER.map((s) => (
          <span key={s.index} className={`seg tier-${s.tier} ${level > s.index ? 'done' : ''} ${level === s.index ? 'now' : ''}`} />
        ))}
      </div>

      {done ? (
        <p className="gc-finished">Harmonic Break concluído ✓</p>
      ) : (
        step &&
        info && (
          <>
            <div className="gc-now">
              <span className={`swatch-sm tier-${step.tier}`} aria-hidden="true" />
              <div>
                <span className="gc-label">Agora</span>
                <strong className="gc-camo">
                  {stepName(weapon, step)}
                  {info.pending && <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />}
                </strong>
              </div>
            </div>
            <p className="gc-challenge">{info.challenge}</p>
            {info.unlock && <p className="gc-unlock">Abre com: {info.unlock}</p>}

            {blocked ? (
              <p className="blocked-text">🔒 {blocked}</p>
            ) : (
              <>
                {hasCounter && (
                  <div className="counter-big">
                    <button className="cb-minus" onClick={() => add(-1)} disabled={count === 0} aria-label="Menos 1">
                      −1
                    </button>
                    <div className="cb-value" aria-live="polite">
                      <span className="cb-count">{count}</span>
                      <span className="cb-target">/ {target}</span>
                    </div>
                    <button className="cb-plus" onClick={() => add(1)} aria-label="Mais 1">
                      +1
                    </button>
                  </div>
                )}
                {hasCounter && (
                  <div className="cb-bar" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, (count / target) * 100)}%` }} />
                  </div>
                )}
                {hasCounter && target >= 20 && (
                  <div className="cb-quick">
                    <button onClick={() => add(5)}>+5</button>
                    <button onClick={() => add(10)}>+10</button>
                  </div>
                )}
                <button className={`btn big ${ready || !hasCounter ? 'primary' : ''}`} onClick={complete}>
                  Concluir {stepName(weapon, step)}
                </button>
              </>
            )}
          </>
        )
      )}
    </article>
  )
}

function MasteryCard({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const chain = MASTERIES.filter((m) => m.mode === state.mode)
  const current = chain.find((m) => !masteryState(state, m.id).done)
  const modeShort = MODES.find((m) => m.id === state.mode)?.short
  if (!current) {
    return (
      <article className="mastery-mini done">
        <span className="gc-label">Maestria {modeShort}</span>
        <strong>Todas concluídas ✓</strong>
      </article>
    )
  }
  const unlocked = masteryUnlocked(state, current.id)
  const ms = masteryState(state, current.id)
  const target = masteryTarget(state, current.id)
  const add = (n: number) => {
    dispatch({ type: 'setMasteryCount', id: current.id, count: ms.count + n })
    vibrate(state.haptics)
  }
  return (
    <article className={`mastery-mini ${unlocked ? '' : 'locked'}`}>
      <span className="gc-label">Maestria {modeShort}</span>
      <strong>{current.name}</strong>
      <p className="gc-challenge small">{current.requirement}</p>
      {!unlocked ? (
        <p className="blocked-text">🔒 Requer {masteryPrereqLabel(current.id)}</p>
      ) : target > 0 ? (
        <>
          <div className="cb-bar" aria-hidden="true">
            <span style={{ width: `${Math.min(100, (ms.count / target) * 100)}%` }} />
          </div>
          <div className="mm-row">
            <span className="mm-count">
              {ms.count.toLocaleString('pt-BR')} / {target.toLocaleString('pt-BR')}
            </span>
            <button onClick={() => add(-1)} disabled={ms.count === 0} aria-label="Menos 1">
              −1
            </button>
            <button className="primary" onClick={() => add(1)} aria-label="Mais 1">
              +1
            </button>
          </div>
        </>
      ) : (
        <button className="btn" onClick={() => dispatch({ type: 'toggleMasteryDone', id: current.id })}>
          Marcar como concluída
        </button>
      )}
    </article>
  )
}
