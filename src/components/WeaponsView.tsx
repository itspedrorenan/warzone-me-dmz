import { useMemo, useState, type Dispatch } from 'react'
import {
  CLASSES,
  LADDER,
  GOLD_LEVEL,
  PLAT_LEVEL,
  HB_LEVEL,
  goldRequired,
  isReleased,
  seasonLabel,
  stepName,
  type Weapon,
  type WeaponClass,
} from '../data'
import { allWeapons, countAtLeast, levelOf, classGoldDone, type Action, type State } from '../store'
import { vibrate } from '../hooks'
import { WeaponThumb } from './WeaponThumb'
import { stepTexture, texStyle } from '../data/camoImages'

type StatusFilter = 'all' | 'todo' | 'gold' | 'platinum' | 'done'

const STATUS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'todo', label: 'Sem Gold' },
  { id: 'gold', label: 'Falta Platinum' },
  { id: 'platinum', label: 'Falta Harmonic' },
  { id: 'done', label: 'Concluídas' },
]

export function WeaponsView({
  state,
  dispatch,
  onOpen,
}: {
  state: State
  dispatch: Dispatch<Action>
  onOpen: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [cls, setCls] = useState<WeaponClass | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  const weapons = useMemo(() => allWeapons(state), [state])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return weapons.filter((w) => {
      if (cls !== 'all' && w.cls !== cls) return false
      if (q && !w.name.toLowerCase().includes(q)) return false
      const l = levelOf(state, w.id)
      switch (status) {
        case 'todo':
          return l < GOLD_LEVEL
        case 'gold':
          return l >= GOLD_LEVEL && l < PLAT_LEVEL
        case 'platinum':
          return l >= PLAT_LEVEL && l < HB_LEVEL
        case 'done':
          return l >= HB_LEVEL
        default:
          return true
      }
    })
  }, [weapons, state, query, cls, status])

  return (
    <div className="weapons-view">
      <div className="filters">
        <input
          className="search"
          type="search"
          placeholder="Buscar arma…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar arma"
        />
        <select
          className="select"
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          aria-label="Filtrar por status"
        >
          {STATUS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="chips" role="group" aria-label="Filtrar por classe">
        <button className={`chip ${cls === 'all' ? 'active' : ''}`} onClick={() => setCls('all')}>
          Todas
        </button>
        {CLASSES.filter((c) => weapons.some((w) => w.cls === c.id)).map((c) => (
          <button key={c.id} className={`chip ${cls === c.id ? 'active' : ''}`} onClick={() => setCls(c.id)}>
            {c.short}
          </button>
        ))}
      </div>

      {CLASSES.map((c) => {
        const list = filtered.filter((w) => w.cls === c.id)
        if (!list.length) return null
        const platOpen = classGoldDone(state, c.id)
        return (
          <section key={c.id} className="class-group">
            <header className="class-head">
              <h2>{c.label}</h2>
              <span className={`badge ${platOpen ? 'badge-plat' : ''}`}>
                Gold {countAtLeast(state, GOLD_LEVEL, c.id)}/{goldRequired(c.id)}
              </span>
            </header>
            <ul className="weapon-list">
              {list.map((w) => (
                <WeaponRow key={w.id} weapon={w} state={state} dispatch={dispatch} onOpen={onOpen} />
              ))}
            </ul>
          </section>
        )
      })}

      {filtered.length === 0 && <p className="empty">Nenhuma arma encontrada.</p>}
    </div>
  )
}

function WeaponRow({
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
  const pinned = state.pinned.includes(weapon.id)
  const season = seasonLabel(weapon)
  const current = level === 0 ? 'Nenhuma' : stepName(weapon, LADDER[level - 1])

  return (
    <li className={`weapon-row ${level >= HB_LEVEL ? 'complete' : ''} ${isReleased(weapon) ? '' : 'unreleased'}`}>
      <button className="wr-main" onClick={() => onOpen(weapon.id)}>
        <WeaponThumb weapon={weapon} />
        <span className="wr-body">
        <span className="wr-top">
          <span className="name">{weapon.name}</span>
          {season && <span className="season-tag">{season}</span>}
        </span>
        <span className={`current tier-text-${level ? LADDER[level - 1].tier : 'none'}`}>
          {current} · {level}/{LADDER.length}
        </span>
        <span className="mini-ladder" aria-hidden="true">
          {LADDER.map((s) => (
            <span
              key={s.index}
              className={`seg tier-${s.tier} ${level > s.index ? 'done' : ''}`}
              style={level > s.index ? texStyle(stepTexture(weapon, s)) : undefined}
            />
          ))}
        </span>
        </span>
      </button>
      <button
        className={`pin ${pinned ? 'on' : ''}`}
        onClick={() => {
          dispatch({ type: 'togglePin', id: weapon.id })
          vibrate(state.haptics)
        }}
        aria-pressed={pinned}
        aria-label={pinned ? `Tirar ${weapon.name} do grind` : `Colocar ${weapon.name} no grind`}
      >
        ★
      </button>
    </li>
  )
}
