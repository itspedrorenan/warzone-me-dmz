// Texturas das camuflagens, recortadas das imagens oficiais do post de progressão do MW4
// (callofduty.com). Imagens © Activision. Geradas por scripts/camo-textures/swatches.py.
// Ficam em public/camos/<id>.webp. Especiais usam o nome da camuflagem como id (ex.: "hot-rod").

import type { LadderStep, Weapon } from './index'

const IDS = new Set<string>(["autumn", "chiral", "damascus-reforged", "deathbed", "divergence", "empyros", "gold", "harmonic-break", "helio", "hot-rod", "kitty-kaos", "mercurial-drift", "military-1", "military-2", "military-3", "military-4", "military-5", "military-6", "military-7", "military-8", "orion-reforged", "parallax", "platinum", "polyatomic-reforged", "red", "ripple-tide", "smoke", "snakeskin", "space-time", "stellation", "sticker-shock", "stormwave", "sunburn", "urban-flamingo", "yellow"])

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const camoImage = (id: string) => (IDS.has(id) ? `./camos/${id}.webp` : null)

/** Textura da camuflagem de um degrau da escada de uma arma (ou null se não houver imagem). */
export function stepTexture(weapon: Weapon, step: LadderStep): string | null {
  switch (step.tier) {
    case 'military':
      return camoImage(`military-${step.index + 1}`)
    case 'special': {
      const s = weapon.specials[step.index - 8]
      return s ? camoImage(slug(s.name)) : null
    }
    case 'gold':
      return camoImage('gold')
    case 'platinum':
      return camoImage('platinum')
    case 'harmonic':
      return camoImage('harmonic-break')
  }
}
