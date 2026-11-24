import { Download, X } from 'lucide-react'

/** Primeiro login num aparelho que já tinha progresso marcado: é desta pessoa? */
export function ImportPrompt({ username, onAnswer }: { username: string | null; onAnswer: (keep: boolean) => void }) {
  return (
    <div className="sheet-backdrop import-backdrop">
      <div className="import-card" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <h2 id="import-title" className="pg-title">
          Progresso neste aparelho
        </h2>
        <p>
          Este aparelho já tem camuflagens marcadas. Elas são suas{username ? `, ${username}` : ''}? Se forem, elas
          passam a ficar salvas na sua conta.
        </p>
        <button className="btn primary" onClick={() => onAnswer(true)}>
          <Download size={16} aria-hidden="true" /> Sim, salvar na minha conta
        </button>
        <button className="btn" onClick={() => onAnswer(false)}>
          <X size={16} aria-hidden="true" /> Não, começar do zero
        </button>
      </div>
    </div>
  )
}
