import { CLASSES, type Weapon } from '../data'
import { weaponImage } from '../data/weaponImages'

/** Miniatura da arma no estilo dos ícones de build do jogo (arma clara, detalhes em cinza). */
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
