// Fotos de cada arma com cada camuflagem aplicada (CodCentral, com autorização; imagens © Activision).
// Cada arma tem uma tira vertical em public/renders/<arma>.webp com uma faixa por camuflagem, na ordem
// de renderImages.generated.json. Gerado por scripts/codcentral/build-sprites.py.
import list from './renderImages.generated.json'
import type { LadderStep, Weapon } from './index'
import { extraPhoto } from './mw4Extras'
import { cutout } from './cutouts'

const RENDERS = list as Record<string, string[]>

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

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

export interface RenderFrame {
  src: string
  /** Posição da faixa na tira e total de faixas. */
  index: number
  count: number
}

export function renderImage(weaponId: string, key: string): RenderFrame | null {
  // Recorte sem fundo (Magnific) da foto do CodCentral, quando existe.
  const cut = key ? cutout(`mw4-cc:${weaponId}:${key}`) : null
  if (cut) return { src: cut, index: 0, count: 1 }
  const keys = RENDERS[weaponId]
  const index = key && keys ? keys.indexOf(key) : -1
  if (index >= 0) return { src: `./renders/${weaponId}.webp`, index, count: keys.length }
  // Sem foto do CodCentral: tenta a do Game8 (Divergence e maestrias de modo; uso local).
  const photo = key ? extraPhoto(weaponId, key) : null
  return photo ? { src: photo, index: 0, count: 1 } : null
}

/** Foto padrão da arma: a da Militar 1 (camuflagem mais discreta). */
export const defaultRender = (weaponId: string) => renderImage(weaponId, 'military-camo-1')
