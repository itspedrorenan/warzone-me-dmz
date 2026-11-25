import { InstallGuide } from './InstallGuide'
import { APP_VERSION } from '../version'

/** Tela inicial: a arte de fundo, que escurece até a cor do app, e "Grindar" na base.
 *  Tocar em "Grindar" abre o app no último jogo usado (o jogo troca pelo seletor do topo). */
export function HomeView({ onStart }: { onStart: () => void }) {
  return (
    <div className="home">
      <div className="home-bg" aria-hidden="true">
        <img src="./home/bg.webp" alt="" />
      </div>
      <div className="home-body">
        <h1 className="sr-only">Camo Tracker</h1>
        <button className="home-start" onClick={onStart}>
          Grindar
        </button>
        <InstallGuide />
        <p className="home-version">Versão {APP_VERSION}</p>
      </div>
    </div>
  )
}
