import { useEffect, useState } from 'react'

interface WakeLockSentinelLike {
  release: () => Promise<void>
  addEventListener: (type: 'release', cb: () => void) => void
}

/** Mantém a tela ligada (Screen Wake Lock API) enquanto `enabled` e a aba estiver visível. */
export function useWakeLock(enabled: boolean) {
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!enabled || !supported) return
    let sentinel: WakeLockSentinelLike | null = null
    let cancelled = false

    const acquire = async () => {
      if (document.visibilityState !== 'visible' || sentinel) return
      try {
        const wl = (navigator as unknown as { wakeLock: { request: (t: 'screen') => Promise<WakeLockSentinelLike> } })
          .wakeLock
        const s = await wl.request('screen')
        if (cancelled) {
          s.release()
          return
        }
        sentinel = s
        setActive(true)
        s.addEventListener('release', () => {
          sentinel = null
          setActive(false)
        })
      } catch {
        setActive(false)
      }
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') acquire()
    }
    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      sentinel?.release().catch(() => {})
      sentinel = null
      setActive(false)
    }
  }, [enabled, supported])

  return { supported, active }
}

export function vibrate(enabled: boolean, pattern: number | number[] = 12) {
  if (!enabled) return
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* sem suporte */
  }
}
