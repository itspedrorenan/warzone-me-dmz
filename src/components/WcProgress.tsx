/** Barra de progresso do card da arma, com a porcentagem no fim. O "x/y" já está no texto acima. */
export function WcProgress({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <span className={`wc-progress ${pct === 100 ? 'full' : ''}`} aria-hidden="true">
      <span className="wc-bar">
        <span style={{ width: `${pct}%` }} />
      </span>
      <span className="wc-pct">{pct}%</span>
    </span>
  )
}
