// Foto da arma com a última camuflagem concluída (o que aparece no card da lista e no topo do painel).
import { HB_STEP, LADDER, MASTERIES, type Weapon } from './index'
import { hbGateDone, isDone, modeMasteryDone, type State } from '../store'
import { defaultRender, renderImage, stepRenderKey, type RenderFrame } from './renderImages'
import { legacyDone, type LegacyProgress, type LegacyWeapon } from './legacy'

/** MW4: maestria de modo mais alta (primeiro o modo escolhido) → Divergence → degrau mais alto da escada.
 *  Usa a primeira que tiver foto; sem nenhuma concluída, a foto padrão (Militar 1). */
export function lastDoneRender(state: State, weapon: Weapon): RenderFrame | null {
  const byMode = MASTERIES.map((m, i) => ({ m, i })).sort(
    (a, b) => Number(b.m.mode === state.mode) - Number(a.m.mode === state.mode) || b.i - a.i,
  )
  for (const { m, i } of byMode) {
    if (!modeMasteryDone(state, weapon.id, i)) continue
    const frame = renderImage(weapon.id, m.id)
    if (frame) return frame
  }
  if (hbGateDone(state) && isDone(state, weapon.id, HB_STEP)) {
    const frame = renderImage(weapon.id, 'divergence')
    if (frame) return frame
  }
  for (let i = HB_STEP; i >= 0; i--) {
    if (!isDone(state, weapon.id, i)) continue
    const frame = renderImage(weapon.id, stepRenderKey(weapon, LADDER[i]))
    if (frame) return frame
  }
  return defaultRender(weapon.id)
}

/** Jogos antigos: foto da camuflagem concluída mais alta que tiver foto; senão a imagem da arma. */
export function lastDoneLegacyPhoto(progress: LegacyProgress, weapon: LegacyWeapon): string | null {
  for (let i = weapon.steps.length - 1; i >= 0; i--) {
    if (legacyDone(progress, weapon.id, i) && weapon.steps[i].photo) return weapon.steps[i].photo!
  }
  return weapon.icon || weapon.photo || null
}
