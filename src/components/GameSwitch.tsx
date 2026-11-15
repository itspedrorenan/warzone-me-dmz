import { useEffect, useRef, useState, type Dispatch } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { LEGACY_GAMES } from '../data/legacy'
import type { Action } from '../store'

/** Logos dos jogos em public/games/ (MW4 e MW3 nas cores originais, MW 2019 em branco). */
const LOGOS: Record<string, string> = {
  mw4: './games/mw4.webp',
  mw19: './games/mw19.webp',
  mw3: './games/mw3.webp',
}

function GameLogo({ id, label }: { id: string; label: string }) {
  const src = LOGOS[id]
  return src ? <img className="game-logo" src={src} alt={label} draggable={false} /> : <span>{label}</span>
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
  const games = [
    { id: 'mw4', label: 'Modern Warfare 4' },
    ...LEGACY_GAMES.map((g) => ({ id: g.game, label: g.label })),
  ]
  const current = games.find((g) => g.id === game) ?? games[0]

  return (
    <div className="game-switch" ref={ref}>
      <button
        className="game-current"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Jogo: ${current.label}`}
      >
        <GameLogo id={current.id} label={current.label} />
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
                <GameLogo id={g.id} label={g.label} />
                {g.id === current.id && <Check size={16} aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
