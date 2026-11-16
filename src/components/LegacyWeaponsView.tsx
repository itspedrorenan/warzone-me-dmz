import { WcProgress } from './WcProgress'
import { ListTools } from './ListTools'
import { applyListPrefs, listTitle, prefsActive, useListPrefs } from '../listFilter'
import { useMemo, useState, type Dispatch } from 'react'
import { Flame, Search } from 'lucide-react'
import {
  legacyCount,
  legacyDone,
  legacyImg,
  legacyTotals,
  type LegacyGame,
  type LegacyProgress,
  type LegacyWeapon,
} from '../data/legacy'
import type { Action, State } from '../store'
import { vibrate } from '../hooks'

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
  const [cls, setCls] = useState<string>('all')
  const progress = state.legacy[game.game] ?? {}
  // Primeira camuflagem de maestria do jogo (Gold no MW 2019, Gilded no MW III) para o resumo da classe.
  const firstMastery = game.tiers[0]

  const [prefs, setPrefs] = useListPrefs()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = game.weapons.filter(
      (w) => (cls === 'all' || w.cls === cls) && (!q || w.name.toLowerCase().includes(q)),
    )
    return applyListPrefs(
      list,
      (w) => {
        const t = legacyTotals(game, state.legacy[game.game] ?? {}, w)
        return {
          name: w.name,
          ...t,
          complete: t.done >= t.total,
          pinned: state.pinned.includes(`${game.game}:${w.id}`),
        }
      },
      prefs,
    )
  }, [game, query, cls, prefs, state.legacy, state.pinned])

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
        {game.classes.map((c) => (
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
      )}

      {!prefsActive(prefs) &&
        game.classes.map((c) => {
          const list = filtered.filter((w) => w.cls === c.id)
          if (!list.length) return null
          const total = game.weapons.filter((w) => w.cls === c.id).length
          return (
            <section key={c.id} className="class-group">
              <header className="class-head">
                <h2>{c.label}</h2>
                <span className="badge">
                  {firstMastery.label} {legacyCount(game, progress, firstMastery.tier, c.id)}/{total}
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

      {filtered.length === 0 && (
        <p className="empty">
          {prefs.onlyPinned || prefs.hideComplete ? 'Nenhuma arma com esses filtros.' : 'Nenhuma arma encontrada.'}
        </p>
      )}
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
  const { done: count, total } = legacyTotals(game, progress, weapon)
  const pinKey = `${game.game}:${weapon.id}`
  const pinned = state.pinned.includes(pinKey)
  let last: string | null = null
  weapon.steps.forEach((s, i) => legacyDone(progress, weapon.id, i) && (last = s.name))

  return (
    <li className={`weapon-card legacy ${count >= total ? 'complete' : ''}`}>
      <button className="wc-main" onClick={() => onOpen(weapon.id)}>
        <span className="wc-thumb legacy-thumb">
          {weapon.icon || weapon.photo ? (
            <img
              src={legacyImg(weapon.icon || weapon.photo!, 'thumb')!}
              alt={weapon.name}
              loading="lazy"
              decoding="async"
            />
          ) : (
            // A fonte não tem imagem desta arma (ex.: MW II): mostra a classe.
            <span className="legacy-noimg" aria-hidden="true">
              {game.classes.find((c) => c.id === weapon.cls)?.short}
            </span>
          )}
        </span>
        <span className="name">{weapon.name}</span>
        <span className="current">
          {last ?? 'Nenhuma'} · {count}/{total}
        </span>
        <WcProgress done={count} total={total} />
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
