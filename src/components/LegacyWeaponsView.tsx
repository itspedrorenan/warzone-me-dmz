import { useMemo, useState, type Dispatch } from 'react'
import { Flame, Search } from 'lucide-react'
import { CLASSES, type WeaponClass } from '../data'
import {
  legacyCount,
  legacyDone,
  legacyDoneCount,
  type LegacyGame,
  type LegacyProgress,
  type LegacyWeapon,
} from '../data/legacy'
import type { Action, State } from '../store'
import { vibrate } from '../hooks'
import { CamoTex } from './CamoTex'

/** Lista de armas de um jogo antigo (mesmo visual da tela de Armas do MW4). */
export function LegacyWeaponsView({
  game,
  state,
  dispatch,
  onOpen,
}: {
  game: LegacyGame
  state: State
  dispatch: Dispatch<Action>
  onOpen: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [cls, setCls] = useState<WeaponClass | 'all'>('all')
  const progress = state.legacy[game.game] ?? {}
  const gold = game.ladder.findIndex((s) => s.tier === 'gold')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return game.weapons.filter((w) => (cls === 'all' || w.cls === cls) && (!q || w.name.toLowerCase().includes(q)))
  }, [game, query, cls])

  return (
    <div className="weapons-view">
      <div className="filters">
        <Search className="search-icon" size={18} aria-hidden="true" />
        <input
          className="search"
          type="search"
          placeholder="Buscar arma…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar arma"
        />
      </div>
      <div className="chips" role="group" aria-label="Filtrar por classe">
        <button className={`chip ${cls === 'all' ? 'active' : ''}`} onClick={() => setCls('all')}>
          Todas
        </button>
        {CLASSES.filter((c) => game.weapons.some((w) => w.cls === c.id)).map((c) => (
          <button key={c.id} className={`chip ${cls === c.id ? 'active' : ''}`} onClick={() => setCls(c.id)}>
            {c.short}
          </button>
        ))}
      </div>

      {CLASSES.map((c) => {
        const list = filtered.filter((w) => w.cls === c.id)
        if (!list.length) return null
        const total = game.weapons.filter((w) => w.cls === c.id).length
        return (
          <section key={c.id} className="class-group">
            <header className="class-head">
              <h2>{c.label}</h2>
              <span className="badge">
                Gold {legacyCount(game, progress, gold, c.id)}/{total}
              </span>
            </header>
            <ul className="weapon-list">
              {list.map((w) => (
                <LegacyCard
                  key={w.id}
                  game={game}
                  weapon={w}
                  progress={progress}
                  state={state}
                  dispatch={dispatch}
                  onOpen={onOpen}
                />
              ))}
            </ul>
          </section>
        )
      })}

      {filtered.length === 0 && <p className="empty">Nenhuma arma encontrada.</p>}
      <p className="credits">
        Dados: <a href={game.source.url}>{game.source.name}</a> (uso local, com autorização).
      </p>
    </div>
  )
}

function LegacyCard({
  game,
  weapon,
  progress,
  state,
  dispatch,
  onOpen,
}: {
  game: LegacyGame
  weapon: LegacyWeapon
  progress: LegacyProgress
  state: State
  dispatch: Dispatch<Action>
  onOpen: (id: string) => void
}) {
  const count = legacyDoneCount(progress, weapon.id)
  const pinKey = `${game.game}:${weapon.id}`
  const pinned = state.pinned.includes(pinKey)
  let last: string | null = null
  for (const s of game.ladder) if (legacyDone(progress, weapon.id, s.index)) last = s.name
  const top = game.ladder[game.ladder.length - 1]

  return (
    <li className={`weapon-card legacy ${legacyDone(progress, weapon.id, top.index) ? 'complete' : ''}`}>
      <button className="wc-main" onClick={() => onOpen(weapon.id)}>
        <span className="wc-thumb legacy-thumb">
          <img src={weapon.icon} alt={weapon.name} loading="lazy" decoding="async" />
        </span>
        <span className="name">{weapon.name}</span>
        <span className="current">
          {last ?? 'Nenhuma'} · {count}/{game.ladder.length}
        </span>
        <span className="mini-ladder" aria-hidden="true">
          {game.ladder.map((s) => {
            const done = legacyDone(progress, weapon.id, s.index)
            return (
              <span key={s.index} className={`seg legacy-${s.tier} ${done ? 'done' : ''}`}>
                <CamoTex url={s.image} muted={!done} />
              </span>
            )
          })}
        </span>
      </button>
      <button
        className={`pin ${pinned ? 'on' : ''}`}
        onClick={() => {
          dispatch({ type: 'togglePin', id: pinKey })
          vibrate(state.haptics)
        }}
        aria-pressed={pinned}
        aria-label={pinned ? `Tirar ${weapon.name} do grind` : `Colocar ${weapon.name} no grind`}
      >
        <Flame size={18} aria-hidden="true" fill={pinned ? 'currentColor' : 'none'} />
      </button>
    </li>
  )
}
