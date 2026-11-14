import { useMemo, useState, type Dispatch } from 'react'
import {
  CLASSES,
  LADDER,
  MAX_LEVEL,
  GOLD_LEVEL,
  PLAT_LEVEL,
  HB_LEVEL,
  goldRequired,
  isReleased,
  seasonLabel,
  stepInfo,
  stepName,
  type Weapon,
  type WeaponClass,
} from '../data'
import {
  allWeapons,
  countAtLeast,
  levelOf,
  gateReason,
  classGoldDone,
  platinumGateDone,
  type Action,
  type State,
} from '../store'
import { WeaponDetail } from './WeaponDetail'

type StatusFilter = 'all' | 'todo' | 'gold' | 'platinum' | 'done'

const STATUS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'todo', label: 'Sem Gold' },
  { id: 'gold', label: 'Falta Platinum' },
  { id: 'platinum', label: 'Falta Harmonic' },
  { id: 'done', label: 'Concluídas' },
]

function currentCamo(weapon: Weapon, level: number) {
  return level === 0 ? 'Nenhuma' : stepName(weapon, LADDER[level - 1])
}

export function WeaponsView({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [query, setQuery] = useState('')
  const [cls, setCls] = useState<WeaponClass | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [openId, setOpenId] = useState<string | null>(null)

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

  const pinned = filtered.filter((w) => state.pinned.includes(w.id))
  const open = weapons.find((w) => w.id === openId) ?? null
  const hbOpen = platinumGateDone(state)

  return (
    <div className="weapons-view">
      <div className="toolbar">
        <input
          className="search"
          type="search"
          placeholder="Buscar arma…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar arma"
        />
        <div className="chips" aria-label="Filtrar por classe">
          <button className={`chip ${cls === 'all' ? 'active' : ''}`} onClick={() => setCls('all')}>
            Todas
          </button>
          {CLASSES.filter((c) => weapons.some((w) => w.cls === c.id)).map((c) => (
            <button
              key={c.id}
              className={`chip ${cls === c.id ? 'active' : ''}`}
              onClick={() => setCls(c.id)}
              title={c.label}
            >
              {c.short}
            </button>
          ))}
        </div>
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

      {pinned.length > 0 && (
        <section className="class-group pinned-group">
          <header className="class-head">
            <h2>Grind atual</h2>
            <span className="muted">{pinned.length} fixada(s)</span>
          </header>
          <ul className="weapon-list">
            {pinned.map((w) => (
              <WeaponRow key={w.id} weapon={w} state={state} dispatch={dispatch} onOpen={setOpenId} />
            ))}
          </ul>
        </section>
      )}

      {CLASSES.map((c) => {
        const list = filtered.filter((w) => w.cls === c.id)
        if (!list.length) return null
        const platOpen = classGoldDone(state, c.id)
        return (
          <section key={c.id} className="class-group">
            <header className="class-head">
              <h2>{c.label}</h2>
              <span className="muted">
                Gold {countAtLeast(state, GOLD_LEVEL, c.id)}/{goldRequired(c.id)}
              </span>
              <span className={`badge ${platOpen ? 'badge-plat' : 'badge-locked'}`}>
                {platOpen ? 'Platinum liberado' : 'Platinum bloqueado'}
              </span>
              {hbOpen && <span className="badge badge-hb">Harmonic liberado</span>}
            </header>
            <ul className="weapon-list">
              {list.map((w) => (
                <WeaponRow key={w.id} weapon={w} state={state} dispatch={dispatch} onOpen={setOpenId} />
              ))}
            </ul>
          </section>
        )
      })}

      {filtered.length === 0 && <p className="empty">Nenhuma arma encontrada com esses filtros.</p>}

      {open && <WeaponDetail weapon={open} state={state} dispatch={dispatch} onClose={() => setOpenId(null)} />}
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
  const nextBlocked = level < MAX_LEVEL ? gateReason(state, weapon, level + 1) : null
  const released = isReleased(weapon)
  const season = seasonLabel(weapon)
  const next = level < MAX_LEVEL ? stepInfo(weapon, LADDER[level], state.mode) : null

  const setLevel = (l: number) => dispatch({ type: 'setLevel', id: weapon.id, level: l })

  return (
    <li className={`weapon-row ${level >= HB_LEVEL ? 'complete' : ''} ${released ? '' : 'unreleased'}`}>
      <button
        className={`pin ${pinned ? 'on' : ''}`}
        onClick={() => dispatch({ type: 'togglePin', id: weapon.id })}
        aria-pressed={pinned}
        aria-label={pinned ? `Desafixar ${weapon.name}` : `Fixar ${weapon.name}`}
        title={pinned ? 'Desafixar' : 'Fixar no grind atual'}
      >
        ★
      </button>
      <button className="weapon-name" onClick={() => onOpen(weapon.id)} title="Ver desafios">
        <span className="name">
          {weapon.name}
          {season && <span className="season-tag">{season}</span>}
        </span>
        <span className={`current tier-text-${level ? LADDER[level - 1].tier : 'none'}`}>
          {currentCamo(weapon, level)}
          {next && released && (
            <span className="next-up">
              {' '}
              · próx.: {stepName(weapon, LADDER[level])} — {next.challenge}
            </span>
          )}
        </span>
      </button>
      <div className="pips" role="group" aria-label={`Progresso de ${weapon.name}`}>
        {LADDER.map((step) => {
          const done = level > step.index
          const blocked = !done && gateReason(state, weapon, step.index + 1)
          const name = stepName(weapon, step)
          return (
            <button
              key={step.index}
              className={`pip tier-${step.tier} ${done ? 'done' : ''} ${blocked ? 'blocked' : ''}`}
              title={blocked ? `${name} — ${blocked}` : `${name} — ${stepInfo(weapon, step, state.mode).challenge ?? ''}`}
              aria-label={`${name}${done ? ' (concluída)' : ''}`}
              onClick={() => setLevel(done && level === step.index + 1 ? step.index : step.index + 1)}
              disabled={!!blocked}
            />
          )
        })}
      </div>
      <div className="stepper">
        <button onClick={() => setLevel(level - 1)} disabled={level === 0} aria-label="Voltar uma camuflagem">
          −
        </button>
        <button
          onClick={() => setLevel(level + 1)}
          disabled={level >= MAX_LEVEL || !!nextBlocked}
          title={nextBlocked ?? 'Próxima camuflagem'}
          aria-label="Avançar uma camuflagem"
        >
          +
        </button>
      </div>
    </li>
  )
}
