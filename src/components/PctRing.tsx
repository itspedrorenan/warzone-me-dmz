import type { CSSProperties, ReactNode } from 'react'

/** Círculo pontilhado com a porcentagem no meio (como o "4%" do menu de Desafios do jogo).
 *  O arco na cor do jogo mostra o quanto já foi feito. */
export function PctRing({ pct, size = 'sm', children }: { pct: number; size?: 'sm' | 'lg'; children?: ReactNode }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <span className={`pct-ring ${size} ${p >= 100 ? 'full' : ''}`} style={{ '--p': p } as CSSProperties}>
      <span className="pct-ring-value">{children ?? `${p}%`}</span>
    </span>
  )
}
