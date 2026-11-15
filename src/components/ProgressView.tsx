import { Check, ChevronRight, Flame, Lock } from 'lucide-react'
import type { Summary, WeaponRow } from '../progress'

const pct = (have: number, of: number) => (of > 0 ? Math.round((have / of) * 100) : 0)

/** Barra de progresso de uma série só (cor do jogo), com trilho neutro. */
function Meter({ have, of, label }: { have: number; of: number; label: string }) {
  const p = of > 0 ? Math.min(100, (have / of) * 100) : 0
  return (
    <span
      className="meter"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={of}
      aria-valuenow={have}
    >
      <span className="meter-fill" style={{ width: `${p}%` }} />
    </span>
  )
}

function WeaponLine({ row, onOpen }: { row: WeaponRow; onOpen: (id: string) => void }) {
  return (
    <li>
      <button className="pg-weapon" onClick={() => onOpen(row.id)}>
        <span className="pg-weapon-main">
          <span className="pg-weapon-name">{row.name}</span>
          <span className="pg-weapon-meta">
            {row.missing > 0
              ? `faltam ${row.missing} para o ${row.next}`
              : `${row.next} conquistado`}
          </span>
          <Meter have={row.done} of={row.total} label={`${row.name}: ${row.done} de ${row.total}`} />
        </span>
        <span className="pg-weapon-count">
          {row.done}/{row.total}
        </span>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </li>
  )
}

/** Tela de Progresso: os números principais do jogo escolhido. */
export function ProgressView({ summary: s, gameLabel, onOpen }: { summary: Summary; gameLabel: string; onOpen: (id: string) => void }) {
  const total = pct(s.done, s.total)
  return (
    <div className="progress-view">
      {/* Número principal */}
      <section className="pg-hero" aria-label="Progresso geral">
        <p className="pg-eyebrow">{gameLabel}</p>
        <p className="pg-hero-number">
          {total}
          <span>%</span>
        </p>
        <p className="pg-hero-sub">
          {s.done.toLocaleString('pt-BR')} de {s.total.toLocaleString('pt-BR')} camuflagens · {s.weapons} armas
        </p>
        <Meter have={s.done} of={s.total} label={`${s.done} de ${s.total} camuflagens`} />
      </section>

      {/* Marcos de maestria */}
      <section className="pg-section">
        <h2 className="pg-title">Maestria</h2>
        <ul className="pg-tiles">
          {s.milestones.map((m) => (
            <li key={m.label} className="pg-tile">
              <span className="pg-tile-head">
                <span className="pg-swatch">{m.image && <img src={m.image} alt="" />}</span>
                <span className="pg-tile-label">{m.label}</span>
              </span>
              <span className="pg-tile-value">
                {m.have}
                <span>/{m.of}</span>
              </span>
              <Meter have={m.have} of={m.of} label={`${m.label}: ${m.have} de ${m.of} armas`} />
            </li>
          ))}
          {s.finale && (
            <li className={`pg-tile pg-finale ${s.finale.done ? 'done' : ''}`}>
              <span className="pg-tile-head">
                <span className="pg-swatch">{s.finale.image && <img src={s.finale.image} alt="" />}</span>
                <span className="pg-tile-label">{s.finale.label}</span>
                {s.finale.done ? (
                  <Check size={16} strokeWidth={3} className="pg-finale-icon" aria-label="Conquistada" />
                ) : (
                  <Lock size={14} className="pg-finale-icon" aria-label="Travada" />
                )}
              </span>
              <span className="pg-tile-value">
                {s.finale.have}
                <span>/{s.finale.need}</span>
              </span>
              <Meter have={s.finale.have} of={s.finale.need} label={`${s.finale.label}: ${s.finale.have} de ${s.finale.need}`} />
              <span className="pg-tile-note">{s.finale.requirement}</span>
            </li>
          )}
        </ul>
      </section>

      {/* Por classe */}
      <section className="pg-section">
        <h2 className="pg-title">
          {s.firstLabel} por classe <span>libera o {s.secondLabel}</span>
        </h2>
        <ul className="pg-classes">
          {s.classes.map((c) => {
            const open = c.have >= c.need
            return (
              <li key={c.id} className={`pg-class ${open ? 'open' : ''}`}>
                <span className="pg-class-label">{c.label}</span>
                <Meter have={Math.min(c.have, c.need)} of={c.need} label={`${c.label}: ${c.have} de ${c.need}`} />
                <span className="pg-class-value">
                  {open && <Check size={14} strokeWidth={3} aria-hidden="true" />}
                  {c.have}/{c.need}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Mais perto do próximo marco */}
      {s.closest.length > 0 && (
        <section className="pg-section">
          <h2 className="pg-title">Mais perto do {s.firstLabel}</h2>
          <ul className="pg-weapons">
            {s.closest.map((r) => (
              <WeaponLine key={r.id} row={r} onOpen={onOpen} />
            ))}
          </ul>
        </section>
      )}

      {/* No grind */}
      <section className="pg-section">
        <h2 className="pg-title">No grind</h2>
        {s.pinned.length > 0 ? (
          <ul className="pg-weapons">
            {s.pinned.map((r) => (
              <WeaponLine key={r.id} row={r} onOpen={onOpen} />
            ))}
          </ul>
        ) : (
          <p className="pg-empty">
            <Flame size={14} aria-hidden="true" /> Toque no fogo de uma arma para ela aparecer aqui.
          </p>
        )}
      </section>
    </div>
  )
}
