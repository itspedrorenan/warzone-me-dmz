import { useMemo, useState, type Dispatch } from 'react'
import {
  CLASSES,
  LADDER,
  GOLD_LEVEL,
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
import { stepTexture } from '../data/camoImages'
import { CamoTex } from './CamoTex'

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

  const weapons = useMemo(() => allWeapons(state), [state])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return weapons.filter((w) => {
      if (cls !== 'all' && w.cls !== cls) return false
      if (q && !w.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [weapons, query, cls])

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
    <li className={`weapon-card ${level >= HB_LEVEL ? 'complete' : ''} ${isReleased(weapon) ? '' : 'unreleased'}`}>
      <button className="wc-main" onClick={() => onOpen(weapon.id)}>
        <span className="wc-thumb">
          <WeaponThumb weapon={weapon} size="card" />
        </span>
        <span className="name">{weapon.name}</span>
        {season && <span className="season-tag">{season}</span>}
        <span className="current">
          {current} · {level}/{LADDER.length}
        </span>
        <span className="mini-ladder" aria-hidden="true">
          {LADDER.map((s) => (
            <span key={s.index} className={`seg tier-${s.tier} ${level > s.index ? 'done' : ''}`}>
              <CamoTex url={stepTexture(weapon, s)} muted={level <= s.index} />
            </span>
          ))}
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
