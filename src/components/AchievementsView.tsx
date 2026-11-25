import { Lock, Trophy } from 'lucide-react'
import { ACHIEVEMENT_ICONS } from './achievementIcons'
import { TIER_LABEL, TIER_POINTS, achievementStatus, maxPoints, points } from '../achievements'
import type { State } from '../store'
import { PctRing } from './PctRing'

const dateBR = (ms: number) => new Date(ms).toLocaleDateString('pt-BR')

/** Tela de Conquistas: metas do app com progresso, nível (bronze a platina) e pontos. */
export function AchievementsView({ state }: { state: State }) {
  const list = achievementStatus(state)
  const unlocked = list.filter((x) => x.unlocked).length
  const pts = points(list)
  const groups = [...new Set(list.map((x) => x.a.group))]

  return (
    <div className="achievements-view">
      <section className="pg-hero ach-hero" aria-label="Resumo das conquistas">
        <p className="pg-eyebrow">Conquistas do Camo Tracker</p>
        <p className="pg-hero-number">
          <PctRing pct={(unlocked / list.length) * 100} size="lg">
            {unlocked}
            <span>/{list.length}</span>
          </PctRing>
        </p>
        <p className="pg-hero-sub ach-points">
          <Trophy size={14} aria-hidden="true" /> {pts} de {maxPoints} pontos
        </p>
      </section>

      {groups.map((g) => (
        <section key={g} className="pg-section">
          <h2 className="pg-title">{g}</h2>
          <ul className="ach-list">
            {list
              .filter((x) => x.a.group === g)
              .map(({ a, have, need, unlocked: on, at }) => {
                const Icon = ACHIEVEMENT_ICONS[a.icon]
                return (
                  <li key={a.id} className={`ach-card tier-${a.tier} ${on ? 'on' : ''}`}>
                    <span className="ach-icon" aria-hidden="true">
                      {on ? <Icon size={22} /> : <Lock size={18} />}
                    </span>
                    <span className="ach-text">
                      <span className="ach-name">{a.name}</span>
                      <span className="ach-desc">{a.desc}</span>
                      {on ? (
                        <span className="ach-date">{at ? `Desbloqueada em ${dateBR(at)}` : 'Desbloqueada'}</span>
                      ) : (
                        <span className="ach-progress">
                          <span className="ach-bar">
                            <span style={{ width: `${need ? (have / need) * 100 : 0}%` }} />
                          </span>
                          <span className="ach-count">
                            {have}/{need}
                          </span>
                        </span>
                      )}
                    </span>
                    <span className="ach-tier">
                      {TIER_LABEL[a.tier]}
                      <small>{TIER_POINTS[a.tier]} pts</small>
                    </span>
                  </li>
                )
              })}
          </ul>
        </section>
      ))}
    </div>
  )
}
