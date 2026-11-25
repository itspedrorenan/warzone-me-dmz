import { WcProgress } from './WcProgress'
import { ListTools } from './ListTools'
import { applyListPrefs, listTitle, prefsActive, useListPrefs } from '../listFilter'
import { useMemo, useState, type Dispatch } from 'react'
import { CLASSES, GOLD_STEP, goldRequired, isReleased, seasonLabel, type Weapon, type WeaponClass } from '../data'
import { allWeapons, countWithStep, lastDoneName, weaponTotals, classGoldDone, type Action, type State } from '../store'
import { vibrate } from '../hooks'
import { WeaponThumb } from './WeaponThumb'
import { Flame, Search } from 'lucide-react'

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

  const [prefs, setPrefs] = useListPrefs()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = weapons.filter((w) => {
      if (cls !== 'all' && w.cls !== cls) return false
      if (q && !w.name.toLowerCase().includes(q)) return false
      return true
    })
    return applyListPrefs(
      list,
      (w) => ({
        name: w.name,
        ...weaponTotals(state, w),
        complete: (({ done, total }) => done >= total)(weaponTotals(state, w)),
        pinned: state.pinned.includes(w.id),
      }),
      prefs,
    )
  }, [weapons, query, cls, prefs, state])

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
        {CLASSES.filter((c) => weapons.some((w) => w.cls === c.id)).map((c) => (
          <button key={c.id} className={`chip ${cls === c.id ? 'active' : ''}`} onClick={() => setCls(c.id)}>
            {c.short}
          </button>
        ))}
      </div>
      <ListTools prefs={prefs} setPrefs={setPrefs} />

      {prefsActive(prefs) && filtered.length > 0 && (
        // Com ordem ou filtro escolhido, a lista é única: sem grupos de classe.
        <section className="class-group">
          <header className="class-head">
            <h2>{listTitle(prefs)}</h2>
            <span className="badge">{filtered.length === 1 ? '1 arma' : `${filtered.length} armas`}</span>
          </header>
          <ul className="weapon-list">
            {filtered.map((w) => (
              <WeaponRow key={w.id} weapon={w} state={state} dispatch={dispatch} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      )}

      {!prefsActive(prefs) &&
        CLASSES.map((c) => {
          const list = filtered.filter((w) => w.cls === c.id)
          if (!list.length) return null
          const platOpen = classGoldDone(state, c.id)
          return (
            <section key={c.id} className="class-group">
              <header className="class-head">
                <h2>{c.label}</h2>
                <span className={`badge ${platOpen ? 'badge-plat' : ''}`}>
                  Gold {countWithStep(state, GOLD_STEP, c.id)}/{goldRequired(c.id)}
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

      {filtered.length === 0 && (
        <p className="empty">{prefs.hideComplete ? 'Nenhuma arma com esses filtros.' : 'Nenhuma arma encontrada.'}</p>
      )}
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
  const { done: count, total } = weaponTotals(state, weapon)
  const pinned = state.pinned.includes(weapon.id)
  const season = seasonLabel(weapon)
  const current = lastDoneName(state, weapon) ?? 'Nenhuma'

  return (
    <li className={`weapon-card ${count >= total ? 'complete' : ''} ${isReleased(weapon) ? '' : 'unreleased'}`}>
      <button className="wc-main" onClick={() => onOpen(weapon.id)}>
        <span className="wc-thumb">
          <WeaponThumb weapon={weapon} size="card" state={state} />
        </span>
        <span className="name">{weapon.name}</span>
        {season && <span className="season-tag">{season}</span>}
        <span className="current">
          {current} · {count}/{total}
        </span>
        <WcProgress done={count} total={total} />
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
        <Flame size={18} aria-hidden="true" fill={pinned ? 'currentColor' : 'none'} />
      </button>
    </li>
  )
}
