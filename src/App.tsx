import { useState } from 'react'
import { useTracker } from './store'
import { useWakeLock } from './hooks'
import { ModeSwitch } from './components/ModeSwitch'
import { WeaponsView } from './components/WeaponsView'
import { WeaponSheet } from './components/WeaponSheet'

export type Tab = 'grind' | 'weapons' | 'progress' | 'settings'

const TABS: { id: Tab; label: string; icon: string; ready: boolean }[] = [
  { id: 'grind', label: 'Grind', ready: false, icon: 'M12 2l2.4 6.9H22l-6 4.6 2.3 7.1L12 16.3 5.7 20.6 8 13.5 2 8.9h7.6z' },
  { id: 'weapons', label: 'Armas', ready: true, icon: 'M3 10h13l2-2h3v4h-3l-1 1H9l-1 5H5l1-5H3z' },
  { id: 'progress', label: 'Progresso', ready: false, icon: 'M4 20V10h3v10zm6.5 0V4h3v16zM17 20v-7h3v7z' },
  { id: 'settings', label: 'Ajustes', ready: false, icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zm8.4 5.5l1.9 1.5-2 3.4-2.3-.9a8 8 0 01-2 1.2L15.7 21h-4l-.4-2.4a8 8 0 01-2-1.2l-2.3.9-2-3.4L7 13.5a8 8 0 010-2.9L5 9l2-3.4 2.3.9a8 8 0 012-1.2L11.7 3h4l.3 2.4a8 8 0 012 1.2l2.3-.9 2 3.4-1.9 1.5a8 8 0 010 2.9z' },
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
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 7a5 5 0 100 10 5 5 0 000-10zM11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1l1.4-1.4 2.1 2.1-1.4 1.4zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1z" />
            </svg>
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
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={t.icon} />
            </svg>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {openId && <WeaponSheet id={openId} state={state} dispatch={dispatch} onClose={() => setOpenId(null)} />}
    </div>
  )
}
