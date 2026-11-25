import { useEffect, useRef, useState, type Dispatch } from 'react'
import { Check, ChevronDown, House } from 'lucide-react'
import { GAMES, GAME_LOGOS, type GameEntry } from '../data/games'
import type { Action } from '../store'

export function GameLogo({ game, className = 'game-logo' }: { game: GameEntry; className?: string }) {
  const src = GAME_LOGOS[game.id]
  // Sem logo (ainda): mostra o nome curto em texto, ex.: "MW II".
  return src ? (
    <img className={className} src={src} alt={game.label} draggable={false} />
  ) : (
    <span className="game-logo-text" aria-label={game.label}>
      {game.short}
    </span>
  )
}

/** Seletor de jogo no topo: botão com o logo do jogo atual que abre a lista de logos
 *  (e o atalho para a tela inicial). Só aparece quando há mais de um jogo. */
export function GameSwitch({
  game,
  dispatch,
  onHome,
}: {
  game: string
  dispatch: Dispatch<Action>
  onHome: () => void
}) {
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

  // Um jogo só (MW4): o logo leva de volta à tela inicial.
  if (GAMES.length < 2) {
    return (
      <div className="game-switch">
        <button className="game-current" onClick={onHome} aria-label="Voltar ao início">
          <GameLogo game={GAMES[0]} />
          <House size={14} aria-hidden="true" />
        </button>
      </div>
    )
  }
  const current = GAMES.find((g) => g.id === game) ?? GAMES[GAMES.length - 1]

  return (
    <div className="game-switch" ref={ref}>
      <button
        className="game-current"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Jogo: ${current.label}`}
      >
        <GameLogo game={current} />
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <ul className="game-menu" role="listbox" aria-label="Jogo">
          {GAMES.map((g) => (
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
                <GameLogo game={g} />
                {g.id === current.id && <Check size={16} aria-hidden="true" />}
              </button>
            </li>
          ))}
          <li className="game-menu-home">
            <button
              onClick={() => {
                setOpen(false)
                onHome()
              }}
            >
              <span>
                <House size={16} aria-hidden="true" /> Início
              </span>
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
