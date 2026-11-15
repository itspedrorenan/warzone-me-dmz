// Fotos de cada arma com cada camuflagem aplicada (CodCentral, com autorização; imagens © Activision).
// Ficam em public/renders/<arma>/<camuflagem>.webp; a lista é gerada por scripts/codcentral/list-renders.mjs.
import list from './renderImages.generated.json'
import type { LadderStep, Weapon } from './index'

const RENDERS: Record<string, Set<string>> = Object.fromEntries(
  Object.entries(list as Record<string, string[]>).map(([w, names]) => [w, new Set(names)])
)

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/** Nome do arquivo da foto para um degrau da escada. */
export function stepRenderKey(weapon: Weapon, step: LadderStep): string {
  switch (step.tier) {
    case 'military':
      return `military-camo-${step.index + 1}`
    case 'special': {
      const s = weapon.specials[step.index - 8]
      return s ? slug(s.name) : ''
    }
    case 'gold':
      return 'gold'
    case 'platinum':
      return 'platinum'
    case 'harmonic':
      return 'harmonic-break'
  }
}

export const renderImage = (weaponId: string, key: string) =>
  key && RENDERS[weaponId]?.has(key) ? `./renders/${weaponId}/${key}.webp` : null
