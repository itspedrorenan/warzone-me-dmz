import { useRef, useState, type Dispatch } from 'react'
import { CLASSES, DEFAULT_WEAPONS, type WeaponClass } from '../data'
import { sanitize, type Action, type State } from '../store'

export function SettingsView({ state, dispatch }: { state: State; dispatch: Dispatch<Action> }) {
  const [name, setName] = useState('')
  const [cls, setCls] = useState<WeaponClass>('ar')
  const [msg, setMsg] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const missingDefaults = DEFAULT_WEAPONS.filter((d) => !state.weapons.some((w) => w.id === d.id)).length

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
          Respeitar pré-requisitos do jogo (Platinum exige Gold na classe, Harmonic Break exige Platinum em todas, maestrias
          em sequência)
        </label>
      </section>

      <section className="panel">
        <h2>Armas ({state.weapons.length})</h2>
        <p className="muted">
          Novas armas de temporada? Adicione aqui. Desmarque “Conta” para tirar uma arma da contagem de Harmonic Break /
          Divergence.
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

        <div className="weapon-table" role="table" aria-label="Lista de armas">
          {state.weapons.map((w) => (
            <div className="weapon-table-row" role="row" key={w.id}>
              <input
                value={w.name}
                onChange={(e) => dispatch({ type: 'updateWeapon', id: w.id, patch: { name: e.target.value } })}
                aria-label="Nome"
              />
              <select
                value={w.cls}
                onChange={(e) => dispatch({ type: 'updateWeapon', id: w.id, patch: { cls: e.target.value as WeaponClass } })}
                aria-label="Classe"
              >
                {CLASSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.short}
                  </option>
                ))}
              </select>
              <label className="check small" title="Conta para Harmonic Break / Divergence">
                <input
                  type="checkbox"
                  checked={w.countsForMastery}
                  onChange={(e) => dispatch({ type: 'updateWeapon', id: w.id, patch: { countsForMastery: e.target.checked } })}
                />
                Conta
              </label>
              <button
                className="btn ghost danger"
                onClick={() => {
                  if (confirm(`Remover ${w.name}? O progresso dela será apagado.`)) dispatch({ type: 'removeWeapon', id: w.id })
                }}
                aria-label={`Remover ${w.name}`}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
        {missingDefaults > 0 && (
          <button className="btn" onClick={() => dispatch({ type: 'restoreDefaultWeapons' })}>
            Restaurar {missingDefaults} arma(s) padrão removida(s)
          </button>
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
    </div>
  )
}
