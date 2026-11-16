// Monta a lista da tela de Grind (MW4 e jogos antigos) num formato comum.
import type { Dispatch, ReactNode } from 'react'
import { LADDER, classLabel, isReleased, stepInfo, stepName } from './data'
import { stepTexture } from './data/camoImages'
import {
  legacyDone,
  legacyFixed,
  legacyGate,
  legacyImg,
  legacyText,
  legacyToggle,
  legacyUnlockText,
  type LegacyGame,
} from './data/legacy'
import { allWeapons, gateReason, isDone, type Action, type State } from './store'
import { WeaponThumb } from './components/WeaponThumb'

/** Uma arma no grind, já resolvida para a próxima camuflagem (formato comum aos jogos). */
export interface GrindItem {
  /** Chave do pin e do contador ("han-86" no MW4, "mw3:mcw" nos antigos). */
  key: string
  weaponId: string
  name: string
  cls: string
  thumb: ReactNode
  /** Próxima camuflagem; null quando a arma está completa. */
  camo: {
    name: string
    image: string | null
    challenge: string | null
    unlock: string | null
    /** Meta do contador (null = não dá para contar, ex.: nível da arma). */
    target: number | null
    /** Motivo do bloqueio, quando nenhuma camuflagem está liberada agora. */
    blocked: string | null
  } | null
  done: number
  total: number
  complete: () => void
}

/** Meta numérica de um texto em inglês: "… 10 times" usa as vezes; senão, o primeiro número. */
function targetFromText(en: string | null): number | null {
  if (!en) return null
  const times = en.match(/(\d[\d,]*) times/i)
  const n = (times ?? en.match(/(\d[\d,]*)/))?.[1]
  return n ? Number(n.replace(/,/g, '')) : null
}

export function grindItemsMW4(s: State, dispatch: Dispatch<Action>): GrindItem[] {
  const weapons = allWeapons(s)
  return s.pinned
    .map((id) => weapons.find((w) => w.id === id))
    .filter((w): w is NonNullable<typeof w> => !!w && isReleased(w))
    .map((w) => {
      const pending = LADDER.filter((st) => !isDone(s, w.id, st.index))
      const open = pending.find((st) => !gateReason(s, w, st.index))
      const step = open ?? pending[0]
      const info = step ? stepInfo(w, step, s.mode) : null
      return {
        key: w.id,
        weaponId: w.id,
        name: w.name,
        cls: classLabel(w.cls),
        thumb: <WeaponThumb weapon={w} size="sm" />,
        camo:
          step && info
            ? {
                name: stepName(w, step),
                image: stepTexture(w, step),
                challenge: info.challenge ?? null,
                unlock: info.unlock ?? null,
                target: info.target && info.target > 0 ? info.target : null,
                blocked: open ? null : gateReason(s, w, step.index),
              }
            : null,
        done: LADDER.length - pending.length,
        total: LADDER.length,
        complete: () => step && dispatch({ type: 'toggleStep', id: w.id, step: step.index }),
      }
    })
}

export function grindItemsLegacy(g: LegacyGame, s: State, dispatch: Dispatch<Action>): GrindItem[] {
  const p = s.legacy[g.game] ?? {}
  const prefix = `${g.game}:`
  return s.pinned
    .filter((k) => k.startsWith(prefix))
    .map((k) => g.weapons.find((w) => w.id === k.slice(prefix.length)))
    .filter((w): w is NonNullable<typeof w> => !!w)
    .map((w) => {
      const pending = w.steps.map((st, i) => ({ ...st, i })).filter((st) => !legacyDone(p, w.id, st.i))
      const open = pending.find((st) => !legacyGate(g, p, w, st.i, s.enforceGates))
      const step = open ?? pending[0]
      const key = `${prefix}${w.id}`
      const pic = w.icon || w.photo
      const challenge = step?.challenge && !legacyFixed(step.challenge) ? legacyText(step.challenge) : null
      return {
        key,
        weaponId: w.id,
        name: w.name,
        cls: g.classes.find((c) => c.id === w.cls)?.label ?? '',
        thumb: pic ? (
          <span className="grind-thumb-img">
            <img src={legacyImg(pic, 'thumb')!} alt="" />
          </span>
        ) : (
          <span className="grind-thumb-img empty">{g.classes.find((c) => c.id === w.cls)?.short}</span>
        ),
        camo: step
          ? {
              name: step.name,
              image: legacyImg(step.image ?? step.photo ?? null, 'swatch'),
              challenge,
              unlock: legacyUnlockText(g, step, w),
              target: challenge ? targetFromText(step.challenge) : null,
              blocked: open ? null : legacyGate(g, p, w, step.i, s.enforceGates),
            }
          : null,
        done: w.steps.length - pending.length,
        total: w.steps.length,
        complete: () => {
          if (!step) return
          const next = legacyToggle(g, p, w, step.i, s.enforceGates)
          if (next !== p) dispatch({ type: 'setLegacyProgress', game: g.game, progress: next })
          dispatch({ type: 'setChallengeCount', id: key, count: 0 })
        },
      }
    })
}
