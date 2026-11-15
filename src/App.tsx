import { useState, type ComponentType } from 'react'
import { ChartNoAxesColumn, Crosshair, Flame, Settings, Sun, type LucideProps } from 'lucide-react'
import { useTracker } from './store'
import { useWakeLock } from './hooks'
import { ModeSwitch } from './components/ModeSwitch'
import { WeaponsView } from './components/WeaponsView'
import { WeaponSheet } from './components/WeaponSheet'

export type Tab = 'grind' | 'weapons' | 'progress' | 'settings'

const TABS: { id: Tab; label: string; Icon: ComponentType<LucideProps>; ready: boolean }[] = [
  { id: 'grind', label: 'Grind', Icon: Flame, ready: false },
  { id: 'weapons', label: 'Armas', Icon: Crosshair, ready: true },
  { id: 'progress', label: 'Progresso', Icon: ChartNoAxesColumn, ready: false },
  { id: 'settings', label: 'Ajustes', Icon: Settings, ready: false },
]

export default function App() {
  const [state, dispatch] = useTracker()
  const [tab, setTab] = useState<Tab>('weapons')
  const [openId, setOpenId] = useState<string | null>(null)
  const wake = useWakeLock(state.keepAwake)

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <h1>Camo Tracker</h1>
        </div>
        {wake.supported && (
          <button
            className={`awake ${wake.active ? 'on' : ''}`}
            onClick={() => dispatch({ type: 'setKeepAwake', value: !state.keepAwake })}
            aria-pressed={state.keepAwake}
            title={state.keepAwake ? 'Tela sempre ligada: ativado' : 'Tela sempre ligada: desativado'}
          >
            <Sun size={20} aria-hidden="true" />
            <span className="sr-only">Tela sempre ligada</span>
          </button>
        )}
        <ModeSwitch mode={state.mode} dispatch={dispatch} />
      </header>

      <main className="content">
        {tab === 'weapons' ? (
          <WeaponsView state={state} dispatch={dispatch} onOpen={setOpenId} />
        ) : (
          <div className="empty-card">
            <p className="empty-title">{TABS.find((t) => t.id === tab)?.label}</p>
            <p className="muted">Em construção. Esta tela vem depois da sua aprovação da tela de Armas.</p>
          </div>
        )}
      </main>

      <nav className="bottom-nav" aria-label="Seções">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? 'active' : ''} ${t.ready ? '' : 'soon'}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <t.Icon size={24} aria-hidden="true" />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {openId && <WeaponSheet id={openId} state={state} dispatch={dispatch} onClose={() => setOpenId(null)} />}
    </div>
  )
}
