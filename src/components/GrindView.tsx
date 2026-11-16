import type { Dispatch } from 'react'
import { Check, ChevronRight, Flame, Lock, Minus, Plus, X } from 'lucide-react'
import type { Action, State } from '../store'
import type { GrindItem } from '../grind'
import { vibrate } from '../hooks'
import { CamoTex } from './CamoTex'

function GrindCard({
  item,
  state,
  dispatch,
  onOpen,
}: {
  item: GrindItem
  state: State
  dispatch: Dispatch<Action>
  onOpen: (id: string) => void
}) {
  const c = item.camo
  const count = state.challengeCount[item.key] ?? 0
  const set = (n: number) => {
    dispatch({ type: 'setChallengeCount', id: item.key, count: Math.max(0, n) })
    vibrate(state.haptics)
  }
  const ready = !!c?.target && count >= c.target
  const quick = c?.target && c.target >= 50 ? [5, 10] : c?.target && c.target >= 10 ? [2, 5] : []

  return (
    <li className={`grind-card ${ready ? 'ready' : ''} ${!c ? 'finished' : ''}`}>
      <div className="gc-head">
        <button className="gc-title" onClick={() => onOpen(item.weaponId)}>
          <span className="gc-thumb">{item.thumb}</span>
          <span className="gc-title-text">
            <span className="gc-name">{item.name}</span>
            <span className="gc-meta">
              {item.cls} · {item.done}/{item.total}
            </span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button
          className="gc-unpin"
          onClick={() => dispatch({ type: 'togglePin', id: item.key })}
          aria-label={`Tirar ${item.name} do grind`}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {!c ? (
        <p className="gc-finished">
          <Check size={16} strokeWidth={3} aria-hidden="true" /> Todas as camuflagens desta arma estão feitas.
        </p>
      ) : (
        <>
          <div className="gc-now">
            <span className="gc-swatch">
              <CamoTex url={c.image} muted={false} />
            </span>
            <span className="gc-now-text">
              <span className="gc-label">Agora</span>
              <span className="gc-camo">{c.name}</span>
            </span>
          </div>
          {c.challenge && <p className="gc-challenge">{c.challenge}</p>}
          {c.blocked && (
            <p className="gc-blocked">
              <Lock size={14} aria-hidden="true" /> {c.blocked}
            </p>
          )}

          {c.target && !c.blocked && (
            <>
              <div className="counter-big">
                <button onClick={() => set(count - 1)} disabled={count === 0} aria-label="Menos um">
                  <Minus size={26} aria-hidden="true" />
                </button>
                <div className="cb-value" aria-live="polite">
                  <span className="cb-count">{count}</span>
                  <span className="cb-target">de {c.target}</span>
                </div>
                <button className="cb-plus" onClick={() => set(count + 1)} aria-label="Mais um">
                  <Plus size={30} aria-hidden="true" />
                </button>
              </div>
              <div className="cb-bar" aria-hidden="true">
                <span style={{ width: `${Math.min(100, (count / c.target) * 100)}%` }} />
              </div>
              {quick.length > 0 && (
                <div className="cb-quick">
                  {quick.map((q) => (
                    <button key={q} onClick={() => set(count + q)}>
                      +{q}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {!c.blocked && (
            <button
              className={`btn gc-complete ${ready || !c.target ? 'primary' : ''}`}
              onClick={() => {
                item.complete()
                vibrate(state.haptics)
              }}
            >
              <Check size={16} strokeWidth={3} aria-hidden="true" /> Concluir {c.name}
            </button>
          )}
        </>
      )}
    </li>
  )
}

/** Tela de Grind: as armas marcadas com o fogo, cada uma com a próxima camuflagem e um contador. */
export function GrindView({
  items,
  state,
  dispatch,
  onOpen,
  onBrowse,
}: {
  items: GrindItem[]
  state: State
  dispatch: Dispatch<Action>
  onOpen: (id: string) => void
  onBrowse: () => void
}) {
  if (!items.length) {
    return (
      <div className="grind">
        <div className="grind-empty">
          <Flame size={32} aria-hidden="true" />
          <p className="grind-empty-title">Nenhuma arma no grind</p>
          <p className="grind-empty-text">
            Na tela de Armas, toque no fogo das armas que você vai jogar. Elas aparecem aqui com a próxima camuflagem e
            um contador.
          </p>
          <button className="btn primary" onClick={onBrowse}>
            Escolher armas
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="grind">
      <ul className="grind-list">
        {items.map((it) => (
          <GrindCard key={it.key} item={it} state={state} dispatch={dispatch} onOpen={onOpen} />
        ))}
      </ul>
    </div>
  )
}
