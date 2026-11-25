import { Trophy } from 'lucide-react'
import type { Achievement } from '../achievements'
import { ACHIEVEMENT_ICONS } from './achievementIcons'

/** Aviso que desce no topo quando uma conquista é desbloqueada. */
export function AchievementToast({ items, onOpen }: { items: Achievement[]; onOpen: () => void }) {
  if (!items.length) return null
  const one = items.length === 1 ? items[0] : null
  const Icon = one ? ACHIEVEMENT_ICONS[one.icon] : Trophy
  return (
    <button className={`ach-toast ${one ? `tier-${one.tier}` : 'tier-gold'}`} onClick={onOpen} role="status">
      <span className="ach-icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <span className="ach-toast-text">
        <span className="ach-toast-label">Conquista desbloqueada</span>
        <span className="ach-toast-name">{one ? one.name : `${items.length} conquistas novas`}</span>
      </span>
    </button>
  )
}
