import { useState } from 'react'
import { MODES, MASTERIES, GOLD_LEVEL, PLAT_LEVEL, HB_LEVEL, LAUNCH_WEAPONS, DATA_SOURCE, isReleased } from './data'
import {
  useTracker,
  levelOf,
  allWeapons,
  countAtLeast,
  divergenceUnlocked,
  flashpointUnlocked,
  masteryState,
} from './store'
import { WeaponsView } from './components/WeaponsView'
import { MasteryView } from './components/MasteryView'
import { SettingsView } from './components/SettingsView'

type Tab = 'weapons' | 'mastery' | 'settings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'weapons', label: 'Armas' },
  { id: 'mastery', label: 'Maestrias' },
  { id: 'settings', label: 'Ajustes' },
]

export default function App() {
  const [state, dispatch] = useTracker()
  const [tab, setTab] = useState<Tab>('weapons')

  const total = LAUNCH_WEAPONS
  const count = (lvl: number) => countAtLeast(state, lvl)
  const masteriesDone = MASTERIES.filter((m) => masteryState(state, m.id).done).length
  // Como no jogo, qualquer arma lançada substitui outra: contam as 33 mais avançadas.
  const best = allWeapons(state)
    .filter(isReleased)
    .map((w) => levelOf(state, w.id))
    .sort((a, b) => b - a)
    .slice(0, total)
  const ladderSum = best.reduce((a, b) => a + b, 0)
  const ladderPct = ladderSum >= total * HB_LEVEL ? 100 : Math.min(99, Math.round((ladderSum / (total * HB_LEVEL)) * 100))

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <h1>Camo Tracker</h1>
            <p className="sub">Modern Warfare 4 · DMZ · Warzone</p>
          </div>
        </div>
        <div className="mode-switch" role="tablist" aria-label="Modo de jogo">
          {MODES.map((m) => (
            <button
              key={m.id}
              role="tab"
              aria-selected={state.mode === m.id}
              className={`mode-btn mode-${m.id} ${state.mode === m.id ? 'active' : ''}`}
              onClick={() => dispatch({ type: 'setMode', mode: m.id })}
              title={m.label}
            >
              {m.short}
            </button>
          ))}
        </div>
      </header>

      <section className="summary" aria-label="Resumo">
        <Stat label="Escada" value={`${ladderPct}%`} pct={ladderPct} tone="neutral" />
        <Stat label="Gold" value={`${count(GOLD_LEVEL)}/${total}`} pct={pct(count(GOLD_LEVEL), total)} tone="gold" />
        <Stat label="Platinum" value={`${count(PLAT_LEVEL)}/${total}`} pct={pct(count(PLAT_LEVEL), total)} tone="platinum" />
        <Stat label="Harmonic Break" value={`${count(HB_LEVEL)}/${total}`} pct={pct(count(HB_LEVEL), total)} tone="harmonic" />
        <Stat label="Divergence" value={divergenceUnlocked(state) ? 'Liberada' : 'Bloqueada'} pct={divergenceUnlocked(state) ? 100 : 0} tone="divergence" />
        <Stat label="Maestrias" value={`${masteriesDone}/9`} pct={pct(masteriesDone, 9)} tone="mastery" />
        <Stat label="Flashpoint" value={flashpointUnlocked(state) ? 'Liberada' : 'Bloqueada'} pct={flashpointUnlocked(state) ? 100 : 0} tone="flashpoint" />
      </section>

      <nav className="tabs" role="tablist" aria-label="Seções">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'weapons' && <WeaponsView state={state} dispatch={dispatch} />}
        {tab === 'mastery' && <MasteryView state={state} dispatch={dispatch} />}
        {tab === 'settings' && <SettingsView state={state} dispatch={dispatch} />}
      </main>

      <footer className="footer">
        Projeto de fã, sem afiliação com a Activision. Dados de camuflagens:{' '}
        <a href={DATA_SOURCE.repo} target="_blank" rel="noreferrer">
          {DATA_SOURCE.name}
        </a>{' '}
        (licença {DATA_SOURCE.license}, importado em {new Date(DATA_SOURCE.importedAt + 'T00:00:00').toLocaleDateString('pt-BR')}
        ). Itens com <span className="verify-dot" aria-hidden="true" /> ainda não foram confirmados — veja no jogo.
        Progresso salvo neste navegador.
      </footer>
    </div>
  )
}

const pct = (n: number, d: number) => (d ? Math.min(100, Math.round((n / d) * 100)) : 0)

function Stat({ label, value, pct, tone }: { label: string; value: string; pct: number; tone: string }) {
  return (
    <div className={`stat tone-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-bar" aria-hidden="true">
        <span style={{ width: `${pct}%` }} />
      </span>
    </div>
  )
}
