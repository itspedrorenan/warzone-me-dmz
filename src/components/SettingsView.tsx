import { useRef, useState, type Dispatch } from 'react'
import { CLASSES, DATA_SOURCE, DEFAULT_WEAPONS, seasonLabel, type WeaponClass } from '../data'
import { sanitize, type Action, type State } from '../store'

export function SettingsView({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [name, setName] = useState('')
  const [cls, setCls] = useState<WeaponClass>('ar')
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `camo-tracker-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJson = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      dispatch({ type: 'replace', state: sanitize(data) })
      setMsg('Backup importado com sucesso.')
    } catch {
      setMsg('Não foi possível ler esse arquivo.')
    }
  }

  return (
    <div className="settings-view">
      <section className="panel">
        <h2>Regras</h2>
        <label className="check">
          <input
            type="checkbox"
            checked={state.enforceGates}
            onChange={(e) => dispatch({ type: 'setEnforceGates', value: e.target.checked })}
          />
          Respeitar pré-requisitos do jogo (Platinum exige Gold na classe, Harmonic Break exige Platinum em 33 armas,
          maestrias em sequência, armas não lançadas bloqueadas)
        </label>
      </section>

      <section className="panel">
        <h2>Armas do jogo ({DEFAULT_WEAPONS.length})</h2>
        <p className="muted">
          Vêm dos dados importados. Oculte as que não quer ver. Qualquer arma lançada conta para os requisitos de 33
          armas, inclusive as de temporada.
        </p>
        <div className="weapon-table" role="table" aria-label="Armas do jogo">
          {DEFAULT_WEAPONS.map((w) => {
            const hidden = state.hiddenWeapons.includes(w.id)
            return (
              <div className={`weapon-table-row defaults ${hidden ? 'is-hidden' : ''}`} role="row" key={w.id}>
                <span className="wt-name">
                  {w.name}
                  {seasonLabel(w) && <span className="season-tag">{seasonLabel(w)}</span>}
                </span>
                <span className="muted">{CLASSES.find((c) => c.id === w.cls)?.short}</span>
                <button className="btn ghost" onClick={() => dispatch({ type: 'toggleHidden', id: w.id })}>
                  {hidden ? 'Mostrar' : 'Ocultar'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="panel">
        <h2>Armas personalizadas ({state.customWeapons.length})</h2>
        <p className="muted">
          Saiu uma arma que ainda não está nos dados? Adicione aqui. Os desafios dela ficam em branco; use as
          anotações.
        </p>
        <form
          className="add-weapon"
          onSubmit={(e) => {
            e.preventDefault()
            dispatch({ type: 'addWeapon', name, cls })
            setName('')
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da arma" aria-label="Nome da arma" />
          <select value={cls} onChange={(e) => setCls(e.target.value as WeaponClass)} aria-label="Classe">
            {CLASSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <button type="submit" className="btn primary" disabled={!name.trim()}>
            Adicionar
          </button>
        </form>

        {state.customWeapons.length > 0 && (
          <div className="weapon-table" role="table" aria-label="Armas personalizadas">
            {state.customWeapons.map((w) => (
              <div className="weapon-table-row" role="row" key={w.id}>
                <input
                  value={w.name}
                  onChange={(e) => dispatch({ type: 'updateCustomWeapon', id: w.id, patch: { name: e.target.value } })}
                  aria-label="Nome"
                />
                <select
                  value={w.cls}
                  onChange={(e) =>
                    dispatch({ type: 'updateCustomWeapon', id: w.id, patch: { cls: e.target.value as WeaponClass } })
                  }
                  aria-label="Classe"
                >
                  {CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.short}
                    </option>
                  ))}
                </select>
                <button
                  className="btn ghost danger"
                  onClick={() => {
                    if (confirm(`Remover ${w.name}? O progresso dela será apagado.`))
                      dispatch({ type: 'removeCustomWeapon', id: w.id })
                  }}
                  aria-label={`Remover ${w.name}`}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Backup</h2>
        <p className="muted">O progresso fica salvo só neste navegador. Exporte para levar a outro aparelho.</p>
        <div className="row">
          <button className="btn primary" onClick={exportJson}>
            Exportar JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Importar JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) importJson(f)
              e.target.value = ''
            }}
          />
          <button
            className="btn danger"
            onClick={() => {
              if (confirm('Apagar todo o progresso e voltar ao padrão?')) {
                dispatch({ type: 'reset' })
                setMsg('Progresso apagado.')
              }
            }}
          >
            Zerar tudo
          </button>
        </div>
        {msg && <p className="toast" role="status">{msg}</p>}
      </section>

      <section className="panel">
        <h2>Fonte dos dados</h2>
        <p className="muted">
          Armas e desafios importados de{' '}
          <a href={DATA_SOURCE.repo} target="_blank" rel="noreferrer">
            {DATA_SOURCE.name}
          </a>{' '}
          (licença {DATA_SOURCE.license}), commit <code>{DATA_SOURCE.commit.slice(0, 7)}</code>, em{' '}
          {new Date(DATA_SOURCE.importedAt + 'T00:00:00').toLocaleDateString('pt-BR')}. Para atualizar, veja o README.
        </p>
      </section>
    </div>
  )
}
