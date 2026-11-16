import { CLASSES, type Weapon } from '../data'
import { weaponImage } from '../data/weaponImages'
import { defaultRender } from '../data/renderImages'
import { RenderImage } from './RenderImage'
import { extraIcon } from '../data/mw4Extras'

/** Imagem padrão da arma: foto do CodCentral com a Militar 1 (fundo de estúdio).
 *  Sem essa foto, usa a imagem oficial recortada; sem nenhuma, mostra a classe. */
export function WeaponThumb({ weapon, size = 'sm' }: { weapon: Weapon; size?: 'sm' | 'lg' | 'card' }) {
  const frame = defaultRender(weapon.id)
  if (frame) return <RenderImage frame={frame} label={weapon.name} className={`thumb-${size}`} />
  const src = weaponImage(weapon.id) ?? extraIcon(weapon.id)
  if (!src) {
    return (
      <span className={`thumb thumb-${size} thumb-empty`} aria-hidden="true">
        {CLASSES.find((c) => c.id === weapon.cls)?.short}
      </span>
    )
  }
  return <img className={`thumb thumb-${size}`} src={src} alt={weapon.name} loading="lazy" decoding="async" />
}
