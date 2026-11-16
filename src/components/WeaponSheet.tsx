import { SwipeStep } from './SwipeStep'
import { keyboardOnly } from '../swipe'
import { useEffect, useState, type Dispatch, type UIEvent } from 'react'
import {
  LADDER,
  LAUNCH_WEAPONS,
  MASTERIES,
  classLabel,
  prestigePending,
  prestigeReqText,
  seasonLabel,
  seasonStarted,
  stepInfo,
  stepName,
  type LadderStep,
  type Mode,
  type Weapon,
} from '../data'
import {
  allWeapons,
  doneCount,
  gateReason,
  hbGateDone,
  isDone,
  modeMasteryDone,
  modeMasteryGate,
  modeMasteryUnlockText,
  prestigeOf,
  type Action,
  type State,
} from '../store'
import { ModeSwitch } from './ModeSwitch'
import { vibrate } from '../hooks'
import { WeaponThumb } from './WeaponThumb'
import { camoImage, stepTexture } from '../data/camoImages'
import { renderImage, stepRenderKey, type RenderFrame } from '../data/renderImages'
import { CamoTex } from './CamoTex'
import { Check, Flame, Info, Lock, X } from 'lucide-react'
import { RenderImage } from './RenderImage'

/** Grupos de camuflagens (abas do painel). */
type Group = 'all' | 'military' | 'special' | 'completionist' | 'prestige' | 'mastery'
const STEP_GROUP = (step: LadderStep): Group =>
  step.tier === 'military' ? 'military' : step.tier === 'special' ? 'special' : 'completionist'
const MODE_LABEL: Record<Mode, string> = { mp: 'MW4', dmz: 'DMZ', wz: 'Warzone' }

/** Camuflagem escolhida para ver na foto: um degrau da escada ou um prestígio. */
type Preview =
  | { kind: 'step'; index: number }
  | { kind: 'prestige'; id: string }
  | { kind: 'mastery'; index: number }
  | { kind: 'divergence' }
  | null

function previewInfo(weapon: Weapon, p: Preview): { name: string; src: RenderFrame | null } | null {
  if (!p) return null
  if (p.kind === 'step') {
    const step = LADDER[p.index]
    return {
      name: stepName(weapon, step),
      src: renderImage(weapon.id, stepRenderKey(weapon, step)),
    }
  }
  if (p.kind === 'divergence') return { name: 'Divergence', src: renderImage(weapon.id, 'divergence') }
  if (p.kind === 'mastery') {
    const m = MASTERIES[p.index]
    return m ? { name: m.name, src: renderImage(weapon.id, m.id) } : null
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
  const [group, setGroup] = useState<Group>('all')
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
  const pcount = prestigeOf(state, weapon.id)
  const nextStep = LADDER.findIndex((st) => !isDone(state, weapon.id, st.index))
  const countIn = (g: Group) => LADDER.filter((st) => STEP_GROUP(st) === g)
  const doneIn = (g: Group) => countIn(g).filter((st) => isDone(state, weapon.id, st.index)).length
  const divergenceDone = hbGateDone(state)
  const masteryIdx = MASTERIES.map((_, i) => i)
  const masteryDone = masteryIdx.filter((i) => modeMasteryDone(state, weapon.id, i)).length
  const tab = (id: Group, label: string, done: number, total: number) => ({ id, label, done, total })
  const groups = [
    tab(
      'all',
      'Todas',
      count + (divergenceDone ? 1 : 0) + pcount + masteryDone,
      LADDER.length + 1 + weapon.prestige.length + MASTERIES.length,
    ),
    tab('military', 'Militar', doneIn('military'), countIn('military').length),
    tab('special', 'Especial', doneIn('special'), countIn('special').length),
    tab(
      'completionist',
      'Completista',
      doneIn('completionist') + (divergenceDone ? 1 : 0),
      countIn('completionist').length + 1,
    ),
    tab('prestige', 'Prestígio', pcount, weapon.prestige.length),
    tab('mastery', 'Maestria', masteryDone, MASTERIES.length),
  ].filter((g) => g.total > 0)
  const toggleMastery = (i: number) => {
    dispatch({ type: 'toggleModeMastery', id: weapon.id, index: i })
    vibrate(state.haptics)
  }
  const season = seasonLabel(weapon)
  const pinned = state.pinned.includes(weapon.id)
  const shown = previewInfo(weapon, preview)

  const toggleStep = (step: LadderStep) => {
    dispatch({ type: 'toggleStep', id: weapon.id, step: step.index })
    vibrate(state.haptics)
  }
  const togglePrestige = (i: number) => {
    const done = pcount > i
    dispatch({
      type: 'setPrestige',
      id: weapon.id,
      count: done && pcount === i + 1 ? i : i + 1,
    })
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
                {groups[0].done}/{groups[0].total} camuflagens
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

        <div className="chips group-tabs" role="tablist" aria-label="Grupos de camuflagens">
          {groups.map((g) => (
            <button
              key={g.id}
              role="tab"
              aria-selected={group === g.id}
              className={`chip ${group === g.id ? 'active' : ''}`}
              onClick={() => setGroup(g.id)}
            >
              {g.label}{' '}
              <span className="chip-count">
                {g.done}/{g.total}
              </span>
            </button>
          ))}
        </div>

        {group !== 'prestige' && group !== 'mastery' && (
          <>
            <ol className="ladder">
              {LADDER.filter((st) => group === 'all' || STEP_GROUP(st) === group).map((step) => {
                const done = isDone(state, weapon.id, step.index)
                const blocked = !done ? gateReason(state, weapon, step.index) : null
                const info = stepInfo(weapon, step, state.mode)
                const name = stepName(weapon, step)
                const p: Preview = { kind: 'step', index: step.index }
                return (
                  <SwipeStep
                    key={step.index}
                    className={`ladder-step ${done ? 'done' : ''} ${step.index === nextStep ? 'next' : ''} ${blocked ? 'blocked' : ''}`}
                    done={done}
                    blocked={!!blocked}
                    onToggle={() => toggleStep(step)}
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
                      onClick={keyboardOnly(() => toggleStep(step))}
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
                  </SwipeStep>
                )
              })}
              {(group === 'all' || group === 'completionist') && (
                <li className={`ladder-step divergence ${divergenceDone ? 'done' : 'blocked'}`}>
                  <button
                    className={`swatch tier-divergence has-tex ${isSelected({ kind: 'divergence' }) ? 'previewing' : ''}`}
                    onClick={() => showPreview({ kind: 'divergence' })}
                    aria-label={`Ver ${weapon.name} com Divergence`}
                  >
                    <CamoTex url={camoImage('divergence')} muted={!divergenceDone} />
                  </button>
                  <span className="ladder-text">
                    <strong>Divergence</strong>
                    <span className="challenge">Sem desafio: vem para todas as armas juntas.</span>
                    <span className="hint">Abre com: Harmonic Break em {LAUNCH_WEAPONS} armas</span>
                    {!divergenceDone && (
                      <span className="blocked-text">
                        <Lock size={12} aria-hidden="true" /> Termine o Harmonic Break em {LAUNCH_WEAPONS} armas.
                      </span>
                    )}
                    {divergenceDone && <Check className="step-check" size={20} strokeWidth={3} aria-hidden="true" />}
                  </span>
                </li>
              )}
            </ol>
            <p className="notice">
              <Info size={14} aria-hidden="true" />
              <span>
                Arraste o card para a direita para concluir ou desfazer.
                {group === 'all' || group === 'military' ? ' Marcar uma militar marca as anteriores.' : ''}
              </span>
            </p>
          </>
        )}

        {weapon.prestige.length > 0 && (group === 'all' || group === 'prestige') && (
          <section className={`prestige ${group === 'prestige' ? 'solo' : ''}`}>
            {group === 'all' && (
              <h3 className="section-title">
                Prestígio{' '}
                <span className="muted">
                  {pcount}/{weapon.prestige.length}
                </span>
              </h3>
            )}
            <ol className="ladder">
              {weapon.prestige.map((camo, i) => {
                const done = pcount > i
                const p: Preview = { kind: 'prestige', id: camo.id }
                return (
                  <SwipeStep
                    key={camo.id}
                    className={`ladder-step ${done ? 'done' : ''} ${i === pcount ? 'next' : ''}`}
                    done={done}
                    onToggle={() => togglePrestige(i)}
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
                      onClick={keyboardOnly(() => togglePrestige(i))}
                      aria-pressed={done}
                      aria-label={`${done ? 'Desmarcar' : 'Marcar'} ${camo.name}`}
                    >
                      <strong>
                        {camo.name}
                        {prestigePending(camo) && (
                          <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />
                        )}
                      </strong>
                      <span className="challenge">{camo.requirements.map(prestigeReqText).join(' + ')}</span>
                      {done && <Check className="step-check" size={20} strokeWidth={3} aria-hidden="true" />}
                    </button>
                  </SwipeStep>
                )
              })}
            </ol>
          </section>
        )}

        {(group === 'all' || group === 'mastery') && (
          <section className={`prestige mastery ${group === 'mastery' ? 'solo' : ''}`}>
            {group === 'all' && (
              <h3 className="section-title">
                Maestria{' '}
                <span className="muted">
                  {masteryDone}/{MASTERIES.length}
                </span>
              </h3>
            )}
            {(['mp', 'dmz', 'wz'] as Mode[]).map((mode) => {
              const chain = masteryIdx.filter((i) => MASTERIES[i].mode === mode)
              if (!chain.length) return null
              const season = MASTERIES[chain[0]].season
              return (
                <div key={mode} className="mastery-mode">
                  <p className="mastery-mode-title">
                    {MODE_LABEL[mode]}
                    {!seasonStarted(season) && <span className="muted"> · a partir da Temporada {season}</span>}
                  </p>
                  <ol className="ladder">
                    {chain.map((i) => {
                      const m = MASTERIES[i]
                      const done = modeMasteryDone(state, weapon.id, i)
                      const blocked = !done ? modeMasteryGate(state, weapon, i) : null
                      const p: Preview = { kind: 'mastery', index: i }
                      return (
                        <SwipeStep
                          key={m.id}
                          className={`ladder-step ${done ? 'done' : ''} ${blocked ? 'blocked' : ''}`}
                          done={done}
                          blocked={!!blocked}
                          onToggle={() => toggleMastery(i)}
                        >
                          <button
                            className={`swatch tier-mastery ${done ? 'done' : ''} ${isSelected(p) ? 'previewing' : ''} has-tex`}
                            onClick={() => showPreview(p)}
                            aria-label={`Ver ${m.name}`}
                          >
                            <CamoTex url={camoImage(m.id)} muted={!done} />
                          </button>
                          <button
                            className="ladder-text"
                            onClick={keyboardOnly(() => toggleMastery(i))}
                            disabled={!!blocked}
                            aria-pressed={done}
                            aria-label={`${done ? 'Desmarcar' : 'Marcar'} ${m.name}`}
                          >
                            <strong>
                              {m.name}
                              {m.verify && <span className="verify-dot" title="Ainda não confirmado — veja no jogo" />}
                            </strong>
                            <span className="challenge">{m.requirement}</span>
                            <span className="hint">Abre com: {modeMasteryUnlockText(i)}</span>
                            {blocked && (
                              <span className="blocked-text">
                                <Lock size={12} aria-hidden="true" /> {blocked}
                              </span>
                            )}
                            {done && <Check className="step-check" size={20} strokeWidth={3} aria-hidden="true" />}
                          </button>
                        </SwipeStep>
                      )
                    })}
                  </ol>
                </div>
              )
            })}
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
