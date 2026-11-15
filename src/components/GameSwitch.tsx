import { useEffect, useRef, useState, type Dispatch } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { LEGACY_GAMES } from '../data/legacy'
import type { Action } from '../store'

/** Logos dos jogos em public/games/ (MW4, MW II e MW III nas cores originais, MW 2019 em branco). */
const LOGOS: Record<string, string> = {
  mw4: './games/mw4.webp',
  mw19: './games/mw19.webp',
  mw2: './games/mw2.webp',
  mw3: './games/mw3.webp',
}

function GameLogo({ id, label, short }: { id: string; label: string; short: string }) {
  const src = LOGOS[id]
  // Sem logo (ainda): mostra o nome curto em texto, ex.: "MW II".
  return src ? (
    <img className="game-logo" src={src} alt={label} draggable={false} />
  ) : (
    <span className="game-logo-text" aria-label={label}>
      {short}
    </span>
  )
}

/** Seletor de jogo no topo: botão com o logo do jogo atual que abre a lista de logos.
 *  Só aparece quando há algum jogo antigo nesta máquina. */
export function GameSwitch({ game, dispatch }: { game: string; dispatch: Dispatch<Action> }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  if (!LEGACY_GAMES.length) return null
  // Do mais antigo ao mais novo: MW 2019, MW II, MW III e, por último, MW4.
  const games = [
    ...LEGACY_GAMES.map((g) => ({ id: g.game, label: g.label, short: g.short })),
    { id: 'mw4', label: 'Modern Warfare 4', short: 'MW4' },
  ]
  const current = games.find((g) => g.id === game) ?? games[games.length - 1]

  return (
    <div className="game-switch" ref={ref}>
      <button
        className="game-current"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Jogo: ${current.label}`}
      >
        <GameLogo id={current.id} label={current.label} short={current.short} />
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <ul className="game-menu" role="listbox" aria-label="Jogo">
          {games.map((g) => (
            <li key={g.id}>
              <button
                role="option"
                aria-selected={g.id === current.id}
                className={g.id === current.id ? 'active' : ''}
                onClick={() => {
                  dispatch({ type: 'setGame', game: g.id })
                  setOpen(false)
                }}
              >
                <GameLogo id={g.id} label={g.label} short={g.short} />
                {g.id === current.id && <Check size={16} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
