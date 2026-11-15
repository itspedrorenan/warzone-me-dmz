// Texturas das camuflagens. Militares, completionist, maestrias, prestígio e 14 especiais: recortes
// das imagens oficiais do post de progressão do MW4 (callofduty.com), gerados por
// scripts/camo-textures/swatches.py. As demais especiais: CodCentral (codcentral.net), com
// autorização (ver THIRD_PARTY_NOTICES.md). Imagens das camuflagens © Activision.
// Ficam em public/camos/<id>.webp. Especiais usam o nome da camuflagem como id (ex.: "hot-rod").

import type { LadderStep, Weapon } from './index'

const IDS = new Set<string>(["anaconda", "ash-pine", "asphalt", "autumn", "backcountry", "black-grip", "black-topo", "blackwell", "blue-tiger", "brown", "brushstroke", "bubblegum-ops", "carbonated", "chained", "chiral", "corrupted-clay", "currents", "cyan", "damascus-reforged", "dark-ichor", "dark-moss", "dark-tan", "deathbed", "deep-space", "desert-tactics", "digi-bark", "digital-fall", "disperse", "divergence", "dread-plague", "dry-brush", "dune-sea", "empyros", "fire-topo", "foxtrail", "fractal-snow", "frontier", "frosted", "fungal-grid", "garland", "ghast", "gold", "green-tiger", "green", "gunmetal", "harmonic-break", "helio", "hibiscus", "hot-rod", "ice-sheer", "in-the-weeds", "iron", "jungle-shadow", "kitty-kaos", "lime", "magma-ire", "mangrove", "mercurial-drift", "miami", "military-1", "military-2", "military-3", "military-4", "military-5", "military-6", "military-7", "military-8", "mineral", "myriad", "night-ops", "night-snow", "off-grid", "oni", "optical-reverb", "orion-reforged", "outcrop", "parallax", "phantom-flux", "platinum", "polyatomic-reforged", "polyhedron", "ponderosa", "pyroclast-cascade", "pyroclast-scatter", "pyroclast-terminus", "pyroclast", "raster-aux", "raster-lite", "rattlesnake", "recursive", "red-rain", "red-tiger", "red", "redshift", "rind", "ripple-tide", "ripplewave", "samnim", "sandwash", "scorch", "shale", "smoke", "smokescreen", "snakeskin", "sniper-veil", "space-time", "spidersilk", "splatter-ops", "splinter-rock", "stellation", "sticker-shock", "stockpile", "stone-bits", "stormwave", "struck-oil", "sunburn", "sunset-tropic", "tectonic", "tension", "thicket", "thunderhead", "tiger-swipe", "treeline", "urban-flamingo", "urban-smoke", "urban-standard", "wallpaper", "white-pine", "white", "yellow"])

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
