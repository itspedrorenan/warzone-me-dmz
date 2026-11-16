import { useRef, useState, type Dispatch, type ReactNode } from 'react'
import { Download, Smartphone, Trash2, Upload, Vibrate, LockKeyhole } from 'lucide-react'
import { DATA_SOURCE } from '../data'
import { GAMES } from '../data/games'
import { LEGACY_GAMES } from '../data/legacy'
import { sanitize, type Action, type State } from '../store'

function Toggle({
  id,
  icon,
  title,
  text,
  checked,
  onChange,
  note,
}: {
  id: string
  icon: ReactNode
  title: string
  text: string
  checked: boolean
  onChange: (v: boolean) => void
  note?: string
}) {
  return (
    <label className="set-row" htmlFor={id}>
      <span className="set-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="set-text">
        <span className="set-title">{title}</span>
        <span className="set-desc">{text}</span>
        {note && <span className="set-note">{note}</span>}
      </span>
      <input id={id} className="switch" type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

const dateBR = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR')
}

/** Tela de Ajustes: preferências de jogo, backup do progresso, apagar progresso e fontes dos dados. */
export function SettingsView({
  state,
  dispatch,
  wakeSupported,
}: {
  state: State
  dispatch: Dispatch<Action>
  wakeSupported: boolean
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  // Confirmação em dois toques: guarda qual "apagar" está esperando o segundo toque.
  const [confirming, setConfirming] = useState<string | null>(null)

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `camo-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 1000)
    setMessage({ kind: 'ok', text: 'Backup baixado. Guarde o arquivo para restaurar depois.' })
  }

  const importBackup = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      if (!data || typeof data !== 'object' || !('progress' in data)) throw new Error('formato')
      dispatch({ type: 'replace', state: sanitize(data) })
      setMessage({ kind: 'ok', text: `Backup de ${file.name} restaurado.` })
    } catch {
      setMessage({ kind: 'error', text: 'Não consegui ler esse arquivo. Escolha um backup baixado por este app (.json).' })
    }
  }

  const reset = (id: string, run: () => void, done: string) => {
    if (confirming !== id) {
      setConfirming(id)
      return
    }
    run()
    setConfirming(null)
    setMessage({ kind: 'ok', text: done })
  }

  return (
    <div className="settings-view">
      <section className="set-section">
        <h2 className="pg-title">Durante o jogo</h2>
        <div className="set-card">
          <Toggle
            id="set-awake"
            icon={<Smartphone size={18} />}
            title="Tela sempre ligada"
            text="A tela do celular não apaga enquanto o app está aberto."
            checked={state.keepAwake}
            onChange={(v) => dispatch({ type: 'setKeepAwake', value: v })}
            note={wakeSupported ? undefined : 'Este navegador não permite manter a tela ligada.'}
          />
          <Toggle
            id="set-haptics"
            icon={<Vibrate size={18} />}
            title="Vibração"
            text="Vibra ao tocar no contador e ao marcar camuflagens."
            checked={state.haptics}
            onChange={(v) => dispatch({ type: 'setHaptics', value: v })}
          />
          <Toggle
            id="set-gates"
            icon={<LockKeyhole size={18} />}
            title="Regras de desbloqueio"
            text="Só deixa marcar uma camuflagem quando o jogo libera (ex.: Smoke depois da Militar 3)."
            checked={state.enforceGates}
            onChange={(v) => dispatch({ type: 'setEnforceGates', value: v })}
          />
        </div>
      </section>

      <section className="set-section">
        <h2 className="pg-title">Backup</h2>
        <p className="set-help">Seu progresso fica só neste aparelho. Baixe um backup antes de trocar de celular ou limpar o navegador.</p>
        <div className="set-actions">
          <button className="btn primary" onClick={exportBackup}>
            <Download size={16} aria-hidden="true" /> Baixar backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden="true" /> Restaurar backup
          </button>
          <input
            ref={fileRef}
            id="set-import"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importBackup(f)
              e.target.value = ''
            }}
          />
        </div>
        {message && (
          <p className={`set-message ${message.kind}`} role="status">
            {message.text}
          </p>
        )}
      </section>

      <section className="set-section">
        <h2 className="pg-title">Apagar progresso</h2>
        <p className="set-help">Apaga camuflagens marcadas, contadores, armas no grind e anotações. Não dá para desfazer.</p>
        <ul className="set-list">
          {GAMES.map((g) => (
            <li key={g.id}>
              <span>{g.label}</span>
              <button
                className={`btn danger ${confirming === g.id ? 'confirm' : ''}`}
                onClick={() =>
                  reset(g.id, () => dispatch({ type: 'resetGame', game: g.id }), `Progresso do ${g.label} apagado.`)
                }
              >
                <Trash2 size={16} aria-hidden="true" /> {confirming === g.id ? 'Toque de novo para apagar' : 'Apagar'}
              </button>
            </li>
          ))}
          {GAMES.length > 1 && (
            <li>
              <span>Todos os jogos</span>
              <button
                className={`btn danger ${confirming === 'all' ? 'confirm' : ''}`}
                onClick={() => reset('all', () => dispatch({ type: 'reset' }), 'Todo o progresso foi apagado.')}
              >
                <Trash2 size={16} aria-hidden="true" /> {confirming === 'all' ? 'Toque de novo para apagar' : 'Apagar tudo'}
              </button>
            </li>
          )}
        </ul>
      </section>

      <section className="set-section">
        <h2 className="pg-title">Sobre os dados</h2>
        <dl className="set-sources">
          <div>
            <dt>Modern Warfare 4</dt>
            <dd>
              Desafios do{' '}
              <a href={DATA_SOURCE.repo} target="_blank" rel="noreferrer">
                Divergence
              </a>{' '}
              (licença MIT), atualizados em {dateBR(DATA_SOURCE.importedAt)}. Fotos com camuflagem: CodCentral, com
              autorização.
            </dd>
          </div>
          {LEGACY_GAMES.map((g) => (
            <div key={g.game}>
              <dt>{g.label}</dt>
              <dd>
                Desafios do{' '}
                <a href={g.source.url} target="_blank" rel="noreferrer">
                  {g.source.name}
                </a>
                {g.game !== 'mw19' && ' e fotos do Game8'}, para uso local com autorização. Atualizado em{' '}
                {dateBR(g.source.importedAt)}.
              </dd>
            </div>
          ))}
        </dl>
        <p className="set-help">Imagens das armas e camuflagens © Activision. Este app não tem afiliação com a Activision.</p>
      </section>
    </div>
  )
}
