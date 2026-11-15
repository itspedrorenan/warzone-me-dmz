import type { Dispatch } from 'react'
import {
  DIVERGENCE,
  FLASHPOINT,
  GOLD_LEVEL,
  HB_LEVEL,
  LAUNCH_WEAPONS,
  MASTERIES,
  MODES,
  PLAT_LEVEL,
  isReleased,
  type Mode,
} from '../data'
import {
  allWeapons,
  countAtLeast,
  divergenceUnlocked,
  flashpointUnlocked,
  levelOf,
  masteryPrereqLabel,
  masteryState,
  masteryTarget,
  masteryUnlocked,
  type Action,
  type State,
} from '../store'
import { vibrate } from '../hooks'
import { camoImage } from '../data/camoImages'
import { CamoTex } from './CamoTex'

const pct = (n: number, d: number) => (d ? Math.min(100, Math.round((n / d) * 100)) : 0)

export function ProgressView({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const total = LAUNCH_WEAPONS
  // Como no jogo, qualquer arma lançada substitui outra: contam as 33 mais avançadas.
  const best = allWeapons(state)
    .filter(isReleased)
    .map((w) => levelOf(state, w.id))
    .sort((a, b) => b - a)
    .slice(0, total)
  const sum = best.reduce((a, b) => a + b, 0)
  const ladderPct = sum >= total * HB_LEVEL ? 100 : Math.min(99, Math.round((sum / (total * HB_LEVEL)) * 100))
  const gold = countAtLeast(state, GOLD_LEVEL)
  const plat = countAtLeast(state, PLAT_LEVEL)
  const hb = countAtLeast(state, HB_LEVEL)
  const masteriesDone = MASTERIES.filter((m) => masteryState(state, m.id).done).length
  const modes = [...MODES].sort((a, b) => (a.id === state.mode ? -1 : b.id === state.mode ? 1 : 0))

  return (
    <div className="progress-view">
      <div className="stats">
        <Stat label="Escada" value={`${ladderPct}%`} pct={ladderPct} tone="neutral" />
        <Stat label="Gold" value={`${gold}/${total}`} pct={pct(gold, total)} tone="gold" />
        <Stat label="Platinum" value={`${plat}/${total}`} pct={pct(plat, total)} tone="platinum" />
        <Stat label="Harmonic" value={`${hb}/${total}`} pct={pct(hb, total)} tone="harmonic" />
      </div>

      <div className={`milestone camo-divergence ${divergenceUnlocked(state) ? 'unlocked' : ''}`}>
        <div
          className="milestone-swatch"
          aria-hidden="true"
        >
          {divergenceUnlocked(state) && <CamoTex url={camoImage('divergence')} />}
        </div>
        <div>
          <h3>{DIVERGENCE.name}</h3>
          <p>{DIVERGENCE.requirement}</p>
          <p className="muted">{divergenceUnlocked(state) ? 'Liberada ✓' : `${hb}/${total} armas`}</p>
        </div>
      </div>
      <div className={`milestone camo-flashpoint ${flashpointUnlocked(state) ? 'unlocked' : ''}`}>
        <div className="milestone-swatch" aria-hidden="true" />
        <div>
          <h3>{FLASHPOINT.name}</h3>
          <p>{FLASHPOINT.requirement}</p>
          <p className="muted">{flashpointUnlocked(state) ? 'Liberada ✓' : `${masteriesDone}/9 maestrias`}</p>
        </div>
      </div>

      {modes.map((m) => (
        <ModeChain key={m.id} mode={m.id} label={m.label} state={state} dispatch={dispatch} />
      ))}
    </div>
  )
}

function Stat({ label, value, pct, tone }: { label: string; value: string; pct: number; tone: string }) {
  return (
    <div className={`stat tone-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </span>
    </div>
  )
}

function ModeChain({
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
    <section className={`mode-chain mode-${mode}`}>
      <header>
        <h2>Maestria · {label}</h2>
        <span className="muted">
          {done}/{chain.length}
        </span>
      </header>
      {chain.map((def, i) => {
        const ms = masteryState(state, def.id)
        const target = masteryTarget(state, def.id)
        const unlocked = masteryUnlocked(state, def.id)
        const add = (n: number) => {
          dispatch({ type: 'setMasteryCount', id: def.id, count: ms.count + n })
          vibrate(state.haptics)
        }
        return (
          <article key={def.id} className={`mastery-card ${ms.done ? 'done' : ''} ${unlocked ? '' : 'locked'}`}>
            <div
              className={`mastery-swatch m-${mode}-${i}`}
              aria-hidden="true"
            >
              {ms.done && <CamoTex url={camoImage(def.id)} />}
            </div>
            <div className="mastery-body">
              <h3>
                {def.name}
                {def.verify && <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />}
              </h3>
              <p className="req">{def.requirement}</p>
              {!unlocked && <p className="blocked-text">🔒 Requer {masteryPrereqLabel(def.id)}</p>}
              {target > 0 && (
                <>
                  <div className="cb-bar" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, (ms.count / target) * 100)}%` }} />
                  </div>
                  <div className="mm-row">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={ms.count}
                      disabled={!unlocked}
                      onChange={(e) => dispatch({ type: 'setMasteryCount', id: def.id, count: Number(e.target.value) })}
                      aria-label={`Progresso de ${def.name}`}
                    />
                    <span className="muted">/ {target.toLocaleString('pt-BR')}</span>
                    <button onClick={() => add(-1)} disabled={!unlocked || ms.count === 0} aria-label="Menos 1">
                      −1
                    </button>
                    <button className="primary" onClick={() => add(1)} disabled={!unlocked} aria-label="Mais 1">
                      +1
                    </button>
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
