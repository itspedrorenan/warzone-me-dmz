import { CLASSES, type Weapon } from '../data'
import { weaponImage } from '../data/weaponImages'

/** Miniatura em traço. A imagem é usada como máscara, então a cor do traço vem do token --text. */
export function WeaponThumb({ weapon, size = 'sm' }: { weapon: Weapon; size?: 'sm' | 'lg' }) {
  const src = weaponImage(weapon.id)
  if (!src) {
    return (
      <span className={`thumb thumb-${size} thumb-empty`} aria-hidden="true">
        {CLASSES.find((c) => c.id === weapon.cls)?.short}
      </span>
    )
  }
  return (
    <span
      className={`thumb thumb-${size}`}
      role="img"
      aria-label={weapon.name}
      style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }}
    />
  )
}
