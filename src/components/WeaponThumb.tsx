import { CLASSES, type Weapon } from '../data'
import { weaponImage } from '../data/weaponImages'

/** Miniatura da arma: imagem oficial recortada do fundo, com as cores originais. */
export function WeaponThumb({ weapon, size = 'sm' }: { weapon: Weapon; size?: 'sm' | 'lg' }) {
  const src = weaponImage(weapon.id)
  if (!src) {
    return (
      <span className={`thumb thumb-${size} thumb-empty`} aria-hidden="true">
        {CLASSES.find((c) => c.id === weapon.cls)?.short}
      </span>
    )
  }
  return <img className={`thumb thumb-${size}`} src={src} alt={weapon.name} loading="lazy" decoding="async" />
}
