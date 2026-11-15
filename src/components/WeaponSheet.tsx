import { useEffect, useState, type Dispatch, type UIEvent } from 'react'
import {
  LADDER,
  classLabel,
  prestigePending,
  prestigeReqText,
  seasonLabel,
  stepInfo,
  stepName,
  type LadderStep,
  type Weapon,
} from '../data'
import { allWeapons, doneCount, gateReason, isDone, prestigeOf, type Action, type State } from '../store'
import { ModeSwitch } from './ModeSwitch'
import { vibrate } from '../hooks'
import { WeaponThumb } from './WeaponThumb'
import { camoImage, stepTexture } from '../data/camoImages'
import { renderImage, stepRenderKey, type RenderFrame } from '../data/renderImages'
import { CamoTex } from './CamoTex'
import { Check, Flame, Info, Lock, X } from 'lucide-react'
import { RenderImage } from './RenderImage'

/** Camuflagem escolhida para ver na foto: um degrau da escada ou um prestígio. */
type Preview = { kind: 'step'; index: number } | { kind: 'prestige'; id: string } | null

function previewInfo(weapon: Weapon, p: Preview): { name: string; src: RenderFrame | null } | null {
  if (!p) return null
  if (p.kind === 'step') {
    const step = LADDER[p.index]
    return { name: stepName(weapon, step), src: renderImage(weapon.id, stepRenderKey(weapon, step)) }
  }
  const camo = weapon.prestige.find((c) => c.id === p.id)
  return camo ? { name: camo.name, src: renderImage(weapon.id, camo.id) } : null
}

export function WeaponSheet({
  id,
  state,
  dispatch,
  onClose,
}: {
  id: string
  state: State
  dispatch: Dispatch<Action>
  onClose: () => void
}) {
  const weapon = allWeapons(state).find((w) => w.id === id)
  const [preview, setPreview] = useState<Preview>(null)
  // TESTE TEMPORÁRIO: duas versões da lista (borda em todos os cards × divisórias). Remover após a escolha.
  const [listStyle, setListStyle] = useState<'stroke' | 'divider'>(() => {
    try {
      return localStorage.getItem('camo-tracker:list-test') === 'divider' ? 'divider' : 'stroke'
    } catch {
      return 'stroke'
    }
  })
  const chooseList = (v: 'stroke' | 'divider') => {
    setListStyle(v)
    try {
      localStorage.setItem('camo-tracker:list-test', v)
    } catch {
      /* sem armazenamento */
    }
  }
  // Cabeçalho compacto ao rolar (título menor, sem a dica); a foto da arma continua visível.
  const [collapsed, setCollapsed] = useState(false)
  const onScroll = (e: UIEvent<HTMLElement>) => {
    const y = e.currentTarget.scrollTop
    if (y < 8) {
      if (collapsed) setCollapsed(false)
    } else if (!collapsed && y > 64) {
      setCollapsed(true)
    }
  }
  const showPreview = (p: Preview) => setPreview(p)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.classList.add('sheet-open')
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.classList.remove('sheet-open')
    }
  }, [onClose])

  if (!weapon) return null
  const count = doneCount(state, weapon.id)
  const nextStep = LADDER.findIndex((st) => !isDone(state, weapon.id, st.index))
  const pcount = prestigeOf(state, weapon.id)
  const season = seasonLabel(weapon)
  const pinned = state.pinned.includes(weapon.id)
  const shown = previewInfo(weapon, preview)

  const toggleStep = (step: LadderStep) => {
    dispatch({ type: 'toggleStep', id: weapon.id, step: step.index })
    vibrate(state.haptics)
  }
  const togglePrestige = (i: number) => {
    const done = pcount > i
    dispatch({ type: 'setPrestige', id: weapon.id, count: done && pcount === i + 1 ? i : i + 1 })
    vibrate(state.haptics)
  }
  const isSelected = (p: Preview) =>
    !!preview && !!p && preview.kind === p.kind && JSON.stringify(preview) === JSON.stringify(p)

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <aside
        className="sheet"
        onScroll={onScroll}
        role="dialog"
        aria-modal="true"
        aria-label={`Desafios de ${weapon.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`sheet-top ${collapsed ? 'collapsed' : ''}`}>
          <div className="sheet-grip" aria-hidden="true" />
          <header className="sheet-head">
            <div>
              <p className="eyebrow">
                {classLabel(weapon.cls)}
                {season && ` · ${season}`}
              </p>
              <h2>{weapon.name}</h2>
              <p className="muted">
                {count}/{LADDER.length} camuflagens
                <span className="prestige-count">
                  {' '}
                  · prestígio {pcount}/{weapon.prestige.length}
                </span>
              </p>
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Fechar">
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="sheet-thumb">
            {shown?.src ? (
              <RenderImage frame={shown.src} label={`${weapon.name} com ${shown.name}`} />
            ) : (
              <WeaponThumb weapon={weapon} size="lg" />
            )}
            <p className="preview-label">
              {shown ? (
                <>
                  <span className="preview-name">{shown.name}</span>
                  {!shown.src && <span className="muted"> · sem foto com esta camuflagem</span>}
                  <button className="link-btn" onClick={() => setPreview(null)}>
                    Voltar
                  </button>
                </>
              ) : (
                <span className="muted preview-hint">Toque no quadrado para ver na arma.</span>
              )}
            </p>
          </div>
        </div>

        <div className="sheet-actions">
          <ModeSwitch mode={state.mode} dispatch={dispatch} small />
          <button
            className={`btn ${pinned ? '' : 'primary'}`}
            onClick={() => {
              dispatch({ type: 'togglePin', id: weapon.id })
              vibrate(state.haptics)
            }}
          >
            <Flame size={16} aria-hidden="true" fill={pinned ? 'currentColor' : 'none'} />
            {pinned ? 'No grind' : 'Grindar'}
          </button>
        </div>

        <div className="list-test" role="group" aria-label="Teste de estilo da lista">
          <span>Teste</span>
          <button className={listStyle === 'stroke' ? 'on' : ''} onClick={() => chooseList('stroke')}>
            A · Stroke
          </button>
          <button className={listStyle === 'divider' ? 'on' : ''} onClick={() => chooseList('divider')}>
            B · Divisor
          </button>
        </div>

        <ol className={`ladder list-${listStyle}`}>
          {LADDER.map((step) => {
            const done = isDone(state, weapon.id, step.index)
            const blocked = !done ? gateReason(state, weapon, step.index) : null
            const info = stepInfo(weapon, step, state.mode)
            const name = stepName(weapon, step)
            const p: Preview = { kind: 'step', index: step.index }
            return (
              <li
                key={step.index}
                className={`ladder-step ${done ? 'done' : ''} ${step.index === nextStep ? 'next' : ''} ${blocked ? 'blocked' : ''}`}
              >
                <button
                  className={`swatch tier-${step.tier} ${done ? 'done' : ''} ${isSelected(p) ? 'previewing' : ''} has-tex`}
                  onClick={() => showPreview(p)}
                  aria-label={`Ver ${weapon.name} com ${name}`}
                >
                  <CamoTex url={stepTexture(weapon, step)} muted={!done} />
                </button>
                <button
                  className="ladder-text"
                  onClick={() => toggleStep(step)}
                  disabled={!!blocked}
                  aria-pressed={done}
                  aria-label={`${done ? 'Desmarcar' : 'Marcar'} ${name}`}
                >
                  <strong>
                    {name}
                    {info.pending && <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />}
                  </strong>
                  {info.challenge && <span className="challenge">{info.challenge}</span>}
                  {info.unlock && <span className="hint">Abre com: {info.unlock}</span>}
                  {blocked && (
                    <span className="blocked-text">
                      <Lock size={12} aria-hidden="true" /> {blocked}
                    </span>
                  )}
                  {done && <Check className="step-check" size={20} strokeWidth={3} aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ol>
        <p className="notice">
          <Info size={14} aria-hidden="true" />
          <span>Toque no card para marcar ou desmarcar. Marcar uma militar marca as anteriores.</span>
        </p>

        {weapon.prestige.length > 0 && (
          <section className="prestige">
            <h3 className="section-title">
              Prestígio <span className="muted">{pcount}/{weapon.prestige.length}</span>
            </h3>
            <ol className={`ladder list-${listStyle}`}>
              {weapon.prestige.map((camo, i) => {
                const done = pcount > i
                const p: Preview = { kind: 'prestige', id: camo.id }
                return (
                  <li
                    key={camo.id}
                    className={`ladder-step ${done ? 'done' : ''} ${i === pcount ? 'next' : ''}`}
                  >
                    <button
                      className={`swatch tier-prestige ${done ? 'done' : ''} ${isSelected(p) ? 'previewing' : ''} has-tex`}
                      onClick={() => showPreview(p)}
                      aria-label={`Ver ${weapon.name} com ${camo.name}`}
                    >
                      <CamoTex url={camoImage(camo.id)} muted={!done} />
                    </button>
                    <button
                      className="ladder-text"
                      onClick={() => togglePrestige(i)}
                      aria-pressed={done}
                      aria-label={`${done ? 'Desmarcar' : 'Marcar'} ${camo.name}`}
                    >
                      <strong>
                        {camo.name}
                        {prestigePending(camo) && <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />}
                      </strong>
                      <span className="challenge">{camo.requirements.map(prestigeReqText).join(' + ')}</span>
                      {done && <Check className="step-check" size={20} strokeWidth={3} aria-hidden="true" />}
                    </button>
                  </li>
                )
              })}
            </ol>
          </section>
        )}

        <label className="notes">
          <span>Anotações</span>
          <textarea
            value={state.notes[weapon.id] ?? ''}
            onChange={(e) => dispatch({ type: 'setNote', id: weapon.id, note: e.target.value })}
            rows={3}
            placeholder="Ex.: build para longshots"
          />
        </label>

        <p className="credits">
          Imagens das armas e camuflagens © Activision. Fotos com camuflagem e texturas das especiais:{' '}
          <a href="https://codcentral.net/blog/mw4-dmz-camo-challenges/" target="_blank" rel="noreferrer">
            CodCentral
          </a>
          , com autorização. Dados:{' '}
          <a href="https://github.com/ItchyBeard/Divergence" target="_blank" rel="noreferrer">
            Divergence
          </a>{' '}
          (MIT).
        </p>
      </aside>
    </div>
  )
}
