// Progresso de cada convidado salvo no Supabase (tabela public.progress, uma linha por pessoa).
//
// O app continua guardando tudo no aparelho (funciona offline); este módulo envia as mudanças
// para a nuvem e, ao abrir, traz a versão salva. Se o mesmo progresso mudou em dois lugares,
// vale o mais recente. Sem login (prévia, desenvolvimento) fica só no aparelho, como antes.
import { useCallback, useEffect, useRef, useState, type Dispatch } from 'react'
import { createClient, type Session } from '@supabase/supabase-js'
import { SESSION_COOKIE, SUPABASE_KEY, SUPABASE_URL, usernameOf } from './authConfig'
import { initialState, sanitize, type Action, type State } from './store'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
})

/** Mantém o cookie lido pelo porteiro da Vercel igual ao token atual (que a biblioteca renova sozinha). */
function writeCookie(session: Session | null) {
  document.cookie = session
    ? `${SESSION_COOKIE}=${encodeURIComponent(session.access_token)}; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`
    : `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`
}
supabase.auth.onAuthStateChange((_event, session) => writeCookie(session))

// Situação da sincronização guardada no aparelho: de quem é o progresso local e se há mudança não enviada.
const META_KEY = 'camo-tracker:sync'
interface Meta {
  userId?: string
  dirty?: boolean
  /** Quando o progresso local mudou pela última vez (ms). */
  changedAt?: number
}
const readMeta = (): Meta => {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? '{}')
  } catch {
    return {}
  }
}
const writeMeta = (m: Meta) => {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m))
  } catch {
    /* armazenamento indisponível */
  }
}

/** Há algo marcado neste aparelho? (para oferecer importar no primeiro login) */
const hasProgress = (s: State) =>
  [s.progress, s.prestige, s.modeMastery, s.challengeCount].some((o) => Object.values(o ?? {}).some(Boolean)) ||
  Object.values(s.legacy ?? {}).some((g) => Object.values(g ?? {}).some(Boolean))

export type SyncStatus = 'local' | 'loading' | 'saving' | 'saved' | 'offline' | 'error'

export interface CloudSync {
  status: SyncStatus
  username: string | null
  /** Primeiro login neste aparelho com progresso já marcado: perguntar se é desta pessoa. */
  askImport: boolean
  answerImport: (keep: boolean) => void
  signOut: () => Promise<void>
}

export function useCloudSync(state: State, dispatch: Dispatch<Action>): CloudSync {
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [user, setUser] = useState<{ id: string; name: string } | null>(null)
  const [askImport, setAskImport] = useState(false)
  const ready = useRef(false)
  const stateRef = useRef(state)
  // Sempre o estado mais recente para as funções assíncronas (atualizado antes dos outros efeitos).
  useEffect(() => {
    stateRef.current = state
  }, [state])

  const push = useCallback(async (userId: string, s: State) => {
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }
    setStatus('saving')
    const updated_at = new Date().toISOString()
    const { error } = await supabase.from('progress').upsert({ user_id: userId, state: s, updated_at })
    if (error) {
      setStatus(navigator.onLine ? 'error' : 'offline')
      return
    }
    // Só limpa "não enviado" se nada mudou enquanto enviava.
    if (stateRef.current === s) writeMeta({ userId, dirty: false, changedAt: Date.parse(updated_at) })
    setStatus('saved')
  }, [])

  // Ao abrir: descobre quem está logado e acerta o progresso local com o da nuvem.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled) return
      if (!session) {
        setStatus('local')
        return
      }
      writeCookie(session)
      const uid = session.user.id
      setUser({ id: uid, name: usernameOf(session.user.email) })
      const meta = readMeta()
      const { data: row, error } = await supabase
        .from('progress')
        .select('state, updated_at')
        .eq('user_id', uid)
        .maybeSingle()
      if (cancelled) return
      if (error) {
        // Sem conexão: segue com o que está no aparelho e envia depois.
        if (meta.userId !== uid) writeMeta({ userId: uid, dirty: true, changedAt: Date.now() })
        setStatus(navigator.onLine ? 'error' : 'offline')
        ready.current = true
        return
      }
      const local = stateRef.current
      if (row) {
        const remoteAt = Date.parse(row.updated_at)
        const localNewer = meta.userId === uid && meta.dirty && (meta.changedAt ?? 0) > remoteAt
        if (localNewer) {
          ready.current = true
          await push(uid, local)
        } else {
          dispatch({ type: 'replace', state: sanitize(row.state) })
          writeMeta({ userId: uid, dirty: false, changedAt: remoteAt })
          setStatus('saved')
          ready.current = true
        }
      } else if (!meta.userId && hasProgress(local)) {
        // Primeira vez na nuvem, com progresso já marcado neste aparelho: pergunta antes de enviar.
        setAskImport(true)
        setStatus('saved')
      } else {
        // Primeira vez na nuvem. Se o aparelho tinha o progresso de outra pessoa, começa do zero.
        const start = meta.userId && meta.userId !== uid ? initialState() : local
        if (start !== local) dispatch({ type: 'replace', state: start })
        ready.current = true
        await push(uid, start)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dispatch, push])

  // A cada mudança: marca como "não enviado" na hora e envia depois de um respiro.
  useEffect(() => {
    if (!ready.current || !user) return
    writeMeta({ userId: user.id, dirty: true, changedAt: Date.now() })
    const t = setTimeout(() => push(user.id, state), 1500)
    return () => clearTimeout(t)
  }, [state, user, push])

  // Voltou a internet: envia o que ficou pendente.
  useEffect(() => {
    if (!user) return
    const onOnline = () => {
      if (readMeta().dirty) push(user.id, stateRef.current)
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [user, push])

  const answerImport = useCallback(
    (keep: boolean) => {
      if (!user) return
      setAskImport(false)
      const start = keep ? stateRef.current : initialState()
      if (!keep) dispatch({ type: 'replace', state: start })
      ready.current = true
      push(user.id, start)
    },
    [user, dispatch, push],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    writeCookie(null)
    location.replace('./login.html')
  }, [])

  return { status, username: user?.name ?? null, askImport, answerImport, signOut }
}
