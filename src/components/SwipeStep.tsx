import { useRef, useState, type ReactNode, type PointerEvent } from 'react'
import { Check, Lock, Undo2 } from 'lucide-react'

/** Distância (fração da largura do card) para valer como "concluir". */
const THRESHOLD = 0.35

/**
 * Card de camuflagem que se completa arrastando para a direita (e se desfaz do mesmo jeito).
 * Tocar não marca mais: o toque fica livre para rolar a lista e ver a camuflagem no quadrado.
 * Pelo teclado/leitor de tela, o botão do card continua marcando (ver `keyboardOnly`).
 */
export function SwipeStep({
  className,
  done,
  blocked,
  onToggle,
  children,
}: {
  className: string
  done: boolean
  blocked?: boolean
  onToggle: () => void
  children: ReactNode
}) {
  const [dx, setDx] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [width, setWidth] = useState(0)
  const start = useRef<{ x: number; y: number; id: number; horizontal: boolean | null; width: number } | null>(null)
  const moved = useRef(false)

  const down = (e: PointerEvent<HTMLLIElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    start.current = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      horizontal: null,
      width: e.currentTarget.offsetWidth,
    }
    moved.current = false
  }
  const move = (e: PointerEvent<HTMLLIElement>) => {
    const s = start.current
    if (!s || s.id !== e.pointerId) return
    const x = e.clientX - s.x
    const y = e.clientY - s.y
    if (s.horizontal === null) {
      if (Math.abs(x) < 8 && Math.abs(y) < 8) return
      s.horizontal = Math.abs(x) > Math.abs(y)
      if (!s.horizontal) return (start.current = null) // gesto vertical: deixa rolar
      e.currentTarget.setPointerCapture(e.pointerId)
      setDragging(true)
      setWidth(s.width)
    }
    moved.current = true
    // Só para a direita; bloqueado arrasta pouco, com resistência.
    const max = s.width * 0.6
    setDx(Math.max(0, Math.min(blocked ? x / 6 : x, blocked ? 28 : max)))
  }
  const up = () => {
    const s = start.current
    start.current = null
    if (s?.horizontal && !blocked && dx >= s.width * THRESHOLD) onToggle()
    setDragging(false)
    setDx(0)
  }

  const armed = !blocked && dragging && width > 0 && dx >= width * THRESHOLD
  return (
    <li
      className={`${className} swipe ${dragging ? 'dragging' : ''} ${armed ? 'armed' : ''}`}
      style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      // Depois de arrastar, o "clique" que o navegador gera não deve abrir a prévia.
      onClickCapture={(e) => {
        if (moved.current) {
          e.stopPropagation()
          e.preventDefault()
          moved.current = false
        }
      }}
    >
      <span className="swipe-label" aria-hidden="true">
        {blocked ? (
          <>
            <Lock size={16} /> Bloqueada
          </>
        ) : done ? (
          <>
            <Undo2 size={16} /> Desfazer
          </>
        ) : (
          <>
            <Check size={16} strokeWidth={3} /> Concluir
          </>
        )}
      </span>
      {children}
    </li>
  )
}
