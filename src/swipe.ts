import type { MouseEvent } from 'react'

/** Clique que só vale pelo teclado ou leitor de tela (detail 0): no toque, o card se completa arrastando. */
export const keyboardOnly = (fn: () => void) => (e: MouseEvent) => {
  if (e.detail === 0) fn()
}
