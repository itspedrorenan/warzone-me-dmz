import type { Dispatch } from 'react'
import { GAMES } from '../data/games'
import type { Action } from '../store'
import { GameLogo } from './GameSwitch'

/** Tela inicial: imagem de fundo que escurece até a cor do app e a grade com os logos dos jogos. */
export function HomeView({ dispatch, onPick }: { dispatch: Dispatch<Action>; onPick: () => void }) {
  return (
    <div className="home">
      <div className="home-bg" aria-hidden="true">
        <img src="./home/bg.webp" alt="" />
      </div>
      <div className="home-body">
        <header className="home-head">
          <h1>Camo Tracker</h1>
          <p>Escolha o jogo</p>
        </header>
        <ul className="home-grid">
          {GAMES.map((g) => (
            <li key={g.id}>
              <button
                className="home-tile"
                data-game={g.id}
                onClick={() => {
                  dispatch({ type: 'setGame', game: g.id })
                  onPick()
                }}
                aria-label={g.label}
              >
                <GameLogo game={g} className="home-logo" />
                <span className="home-tile-label">{g.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
