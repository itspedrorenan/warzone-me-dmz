import type { RenderFrame } from '../data/renderImages'

/** Mostra uma faixa da tira de fotos da arma (uma faixa por camuflagem). */
export function RenderImage({ frame, label, className = '' }: { frame: RenderFrame; label: string; className?: string }) {
  return (
    <div className={`render ${className}`} role="img" aria-label={label}>
      <img
        src={frame.src}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ transform: `translateY(-${(frame.index * 100) / frame.count}%)` }}
      />
    </div>
  )
}
