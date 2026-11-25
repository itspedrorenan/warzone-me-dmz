import { useEffect, useState, type ComponentType } from 'react'
import { ChartNoAxesColumn, Crosshair, Flame, Settings, Sun, Trophy, type LucideProps } from 'lucide-react'
import { useTracker } from './store'
import { useCloudSync } from './sync'
import { ImportPrompt } from './components/ImportPrompt'
import { AchievementsView } from './components/AchievementsView'
import { AchievementToast } from './components/AchievementToast'
import { ACHIEVEMENTS, newlyUnlocked, type Achievement } from './achievements'
import { vibrate } from './hooks'
import { useWakeLock } from './hooks'
import { ModeSwitch } from './components/ModeSwitch'
import { WeaponsView } from './components/WeaponsView'
import { WeaponSheet } from './components/WeaponSheet'
import { GameSwitch } from './components/GameSwitch'
import { LegacyWeaponsView } from './components/LegacyWeaponsView'
import { LegacySheet } from './components/LegacySheet'
import { legacyGame } from './data/legacy'
import { HomeView } from './components/HomeView'
import { ProgressView } from './components/ProgressView'
import { GrindView } from './components/GrindView'
import { SettingsView } from './components/SettingsView'
import { grindItemsLegacy, grindItemsMW4 } from './grind'
import { summaryLegacy, summaryMW4 } from './progress'

export type Tab = 'grind' | 'weapons' | 'progress' | 'achievements' | 'settings'

const TABS: { id: Tab; label: string; Icon: ComponentType<LucideProps>; ready: boolean }[] = [
  { id: 'grind', label: 'Grind', Icon: Flame, ready: true },
  { id: 'weapons', label: 'Armas', Icon: Crosshair, ready: true },
  { id: 'progress', label: 'Progresso', Icon: ChartNoAxesColumn, ready: true },
  { id: 'achievements', label: 'Conquistas', Icon: Trophy, ready: true },
  { id: 'settings', label: 'Ajustes', Icon: Settings, ready: true },
]

export default function App() {
  const [state, dispatch] = useTracker()
  const sync = useCloudSync(state, dispatch)
  // Conquistas: guarda a data das recém-batidas (espera o progresso da nuvem chegar) e mostra o aviso
  // das desbloqueadas desde que o app abriu.
  const syncReady = sync.status !== 'loading' && !sync.askImport
  useEffect(() => {
    if (!syncReady) return
    const fresh = newlyUnlocked(state)
    if (!fresh.length) return
    dispatch({ type: 'unlockAchievements', ids: fresh.map((a) => a.id), at: Date.now() })
    vibrate(state.haptics)
  }, [state, syncReady, dispatch])
  const [openedAt] = useState(() => Date.now())
  const [seenUntil, setSeenUntil] = useState(0)
  const latestAt = Math.max(0, ...Object.values(state.achievements))
  const toast: Achievement[] =
    latestAt > openedAt && latestAt > seenUntil ? ACHIEVEMENTS.filter((a) => state.achievements[a.id] === latestAt) : []
  useEffect(() => {
    if (latestAt <= openedAt) return
    const t = setTimeout(() => setSeenUntil(latestAt), 4500)
    return () => clearTimeout(t)
  }, [latestAt, openedAt])
  const [tab, setTab] = useState<Tab>('weapons')
  // Tela inicial ("Grindar" e a versão) ao abrir o app.
  const [home, setHome] = useState(true)
  // Painel aberto, junto com o jogo a que pertence (trocar de jogo fecha o painel).
  const [open, setOpen] = useState<{ game: string; id: string } | null>(null)
  const openId = open && open.game === state.game ? open.id : null
  const setOpenId = (id: string | null) => setOpen(id ? { game: state.game, id } : null)
  const wake = useWakeLock(state.keepAwake)
  // Jogo antigo aberto (só existe quando o arquivo local foi gerado nesta máquina).
  const legacy = state.game === 'mw4' ? null : legacyGame(state.game)

  if (home) {
    return (
      <div className="app" data-game={legacy ? legacy.game : 'mw4'}>
        <HomeView
          onStart={() => {
            setTab('weapons')
            setHome(false)
          }}
        />
        {sync.askImport && <ImportPrompt username={sync.username} onAnswer={sync.answerImport} />}
      </div>
    )
  }

  return (
    <div className="app" data-game={legacy ? legacy.game : 'mw4'}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <h1>Camo Tracker</h1>
          <GameSwitch game={legacy ? legacy.game : 'mw4'} dispatch={dispatch} onHome={() => setHome(true)} />
        </div>
        {!legacy && <ModeSwitch mode={state.mode} dispatch={dispatch} />}
      </header>

      <main className="content">
        {tab === 'weapons' ? (
          legacy ? (
            <LegacyWeaponsView key={legacy.game} game={legacy} state={state} dispatch={dispatch} onOpen={setOpenId} />
          ) : (
            <WeaponsView state={state} dispatch={dispatch} onOpen={setOpenId} />
          )
        ) : tab === 'grind' ? (
          <GrindView
            items={legacy ? grindItemsLegacy(legacy, state, dispatch) : grindItemsMW4(state, dispatch)}
            state={state}
            dispatch={dispatch}
            onOpen={setOpenId}
            onBrowse={() => setTab('weapons')}
          />
        ) : tab === 'achievements' ? (
          <AchievementsView state={state} />
        ) : tab === 'settings' ? (
          <SettingsView state={state} dispatch={dispatch} wakeSupported={wake.supported} sync={sync} />
        ) : tab === 'progress' ? (
          <ProgressView
            summary={legacy ? summaryLegacy(legacy, state) : summaryMW4(state)}
            gameLabel={legacy ? legacy.label : 'Modern Warfare 4'}
            onOpen={setOpenId}
          />
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
        {wake.supported && (
          <button
            className={`awake nav-awake ${wake.active ? 'on' : ''}`}
            onClick={() => dispatch({ type: 'setKeepAwake', value: !state.keepAwake })}
            aria-pressed={state.keepAwake}
            title={state.keepAwake ? 'Tela sempre ligada: ativado' : 'Tela sempre ligada: desativado'}
          >
            <Sun size={20} aria-hidden="true" />
            <span className="sr-only">Tela sempre ligada</span>
          </button>
        )}
      </nav>

      {openId &&
        (legacy ? (
          <LegacySheet game={legacy} id={openId} state={state} dispatch={dispatch} onClose={() => setOpenId(null)} />
        ) : (
          <WeaponSheet id={openId} state={state} dispatch={dispatch} onClose={() => setOpenId(null)} />
        ))}
      <AchievementToast
        items={toast}
        onOpen={() => {
          setSeenUntil(latestAt)
          setTab('achievements')
        }}
      />
      {sync.askImport && <ImportPrompt username={sync.username} onAnswer={sync.answerImport} />}
    </div>
  )
}
