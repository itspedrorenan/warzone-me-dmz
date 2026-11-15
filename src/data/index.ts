// Dados do jogo: armas, escada de camuflagens e maestrias por modo.
//
// A base vem do projeto open source Divergence (ItchyBeard, licença MIT) e é
// gerada por `scripts/import-divergence.mjs` em `divergence.generated.json`.
// Não edite o JSON à mão: rode o script de novo quando sair temporada nova.

import raw from './divergence.generated.json'

export type Mode = 'mp' | 'dmz' | 'wz'

export const MODES: { id: Mode; label: string; short: string }[] = [
  { id: 'mp', label: 'Multiplayer (MW4)', short: 'MW4' },
  { id: 'dmz', label: 'DMZ', short: 'DMZ' },
  { id: 'wz', label: 'Warzone', short: 'WZ' },
]

export type WeaponClass =
  | 'ar'
  | 'smg'
  | 'shotgun'
  | 'lmg'
  | 'marksman'
  | 'sniper'
  | 'pistol'
  | 'launcher'
  | 'melee'

export const CLASSES: { id: WeaponClass; label: string; short: string }[] = [
  { id: 'ar', label: 'Fuzis de Assalto', short: 'AR' },
  { id: 'smg', label: 'Submetralhadoras', short: 'SMG' },
  { id: 'shotgun', label: 'Escopetas', short: 'SG' },
  { id: 'lmg', label: 'Metralhadoras Leves', short: 'LMG' },
  { id: 'marksman', label: 'Fuzis de Precisão', short: 'DMR' },
  { id: 'sniper', label: 'Fuzis de Sniper', short: 'SNP' },
  { id: 'pistol', label: 'Pistolas', short: 'PST' },
  { id: 'launcher', label: 'Lançadores', short: 'LCH' },
  { id: 'melee', label: 'Corpo a Corpo', short: 'MEL' },
]

export const classLabel = (c: WeaponClass) => CLASSES.find((x) => x.id === c)?.label ?? c

// ---------------------------------------------------------------------------
// Desafios
// ---------------------------------------------------------------------------

export type Challenge =
  | { status: 'available'; type: string; amount: number; target: string; times?: number; description?: string }
  | { status: 'unavailable'; reason?: string }

type ByMode = Record<Mode, Challenge>

export interface Unlock {
  type: 'unlocks' | 'level'
  value: number
}

export interface SpecialCamo {
  name: string
  unlock: Unlock | null
  challenges: ByMode
}

export type PrestigeReq =
  | { type: 'weapon_prestige' }
  | { type: 'prestige_master'; level: number }
  | { type: 'player_level'; level: number }
  | { type: 'pending'; reason?: string }
  | { type: 'other'; description?: string }

export interface PrestigeCamo {
  id: string
  name: string
  requirements: PrestigeReq[]
}

export interface Weapon {
  id: string
  name: string
  cls: WeaponClass
  season: number
  releaseDate: string | null
  military: { unit: 'level' | 'unlocks'; values: number[] } | null
  specials: SpecialCamo[]
  /** Camuflagens de prestígio da arma (Pyroclast e variantes), em ordem. */
  prestige: PrestigeCamo[]
  /** Arma adicionada pelo usuário. */
  custom?: boolean
}

interface Generated {
  source: { name: string; repo: string; commit: string; license: string; importedAt: string }
  launch: { weapons: number; categories: Record<WeaponClass, number> }
  gold: ByMode
  classes: Record<WeaponClass, { goldRequired: number; platinum: ByMode; harmonic: ByMode }>
  masteries: Record<
    Mode,
    { availableFromSeason: number; chain: { id: string; name: string; requires: string | null; challenge: Challenge }[] }
  >
  weapons: Weapon[]
}

const data = raw as unknown as Generated

export const DATA_SOURCE = data.source
export const DEFAULT_WEAPONS: Weapon[] = data.weapons

/** Contagens fixas do arsenal de lançamento (armas de temporada substituem qualquer uma). */
export const LAUNCH_WEAPONS = data.launch.weapons // 33
export const goldRequired = (cls: WeaponClass) => data.classes[cls]?.goldRequired ?? 1

const OBJECTIVES: Record<string, string> = {
  ads_kills: 'kills mirando (ADS)',
  akimbo_kills: 'kills com akimbo',
  behind_kills: 'kills pelas costas',
  kills_from_behind: 'kills pelas costas',
  crouched_kills: 'kills agachado',
  direct_shot_kills: 'kills com acerto direto',
  double_kills: 'kills duplos',
  eliminations_in_match: 'kills em uma única partida',
  focused_kills: 'kills com Focused',
  grenade_launcher_kills: 'kills com lança-granadas acoplado',
  headshot_kills: 'kills com headshot',
  headshots: 'headshots',
  heavy_melee_finisher_kills: 'kills com golpe pesado (finalizador)',
  hipfire_kills: 'kills sem mirar (hipfire)',
  jumping_kills: 'kills pulando',
  kills_while_moving: 'kills em movimento',
  moving_kills: 'kills em movimento',
  kills_without_damage: 'kills sem sofrer dano',
  kills_without_damage_from_target: 'kills sem levar dano do alvo',
  kills_without_dying: 'kills sem morrer',
  kills_without_plating: 'kills sem colocar placas',
  kills_without_releasing_trigger: 'kills sem soltar o gatilho',
  kills_without_reloading: 'kills sem recarregar',
  killstreaks_or_vehicles_destroyed: 'sequências de kills ou veículos destruídos',
  ledge_hanging_kills: 'kills pendurado em beirada',
  legendary_weapon_kills_max_level_operator: 'kills com armas Lendárias em Operador de nível máximo',
  longshot_kills: 'kills de longa distância',
  mounted_kills: 'kills com a arma apoiada',
  one_shot_kills: 'kills com um tiro',
  point_blank_kills: 'kills à queima-roupa',
  prone_kills: 'kills deitado',
  quickscope_kills: 'kills com quickscope',
  silenced_kills: 'kills com silenciador',
  sliding_kills: 'kills deslizando',
  tier_3_plus_kills: 'kills em inimigos Tier 3+',
}

const fmt = (n: number) => n.toLocaleString('pt-BR')

/** Texto em português de um desafio. */
export function challengeText(c: Challenge | undefined): string {
  if (!c || c.status !== 'available') return 'Requisito ainda não confirmado.'
  const times = c.times !== undefined ? `, ${fmt(c.times)} vezes` : ''
  const who = c.target === 'enemies' ? ' em inimigos' : ''
  switch (c.type) {
    case 'kills_in_match':
      return `${fmt(c.amount)} kills${who} em uma partida${times}`
    case 'eliminations_in_match':
      return `${fmt(c.amount)} kills${who} em uma única partida${times}`
    case 'rapid_kills': {
      const secs = c.description?.match(/(\d+)\s*seconds?/i)?.[1] ?? '5'
      return `${fmt(c.amount)} kills${who} em ${secs} segundos${times}`
    }
    case 'lt_dog_tags_exfil_in_deployment':
      return `Extrair ${fmt(c.amount)} dog tags de tenente em uma incursão${times}`
    case 'top_5_with_kills':
      return `Terminar no Top 5 com pelo menos ${fmt(c.amount)} kills${times}`
    case 'tier_3_plus_kills':
    case 'legendary_weapon_kills_max_level_operator':
      return `${fmt(c.amount)} ${OBJECTIVES[c.type]}${times}`
  }
  const obj = OBJECTIVES[c.type]
  if (!obj) return c.description ?? `${fmt(c.amount)} ${c.type.replaceAll('_', ' ')}${times}`
  return `${fmt(c.amount)} ${obj}${who}${times}`
}

/** Meta numérica de um desafio para o contador (repetições, se houver). */
export const challengeTarget = (c: Challenge) => (c.status === 'available' ? (c.times ?? c.amount) : 0)

export const isPending = (c: Challenge | undefined) => !c || c.status !== 'available'

export function unlockText(u: Unlock | null) {
  if (!u) return 'Desbloqueio ainda não confirmado.'
  return u.type === 'level' ? `Arma nível ${u.value}` : `${u.value} desbloqueios da arma`
}

// ---------------------------------------------------------------------------
// Escada de camuflagens por arma (linear): 8 militares → 3 especiais → Gold →
// Platinum → Harmonic Break. O progresso de cada arma é um número 0..LADDER.length.
// ---------------------------------------------------------------------------

export type Tier = 'military' | 'special' | 'gold' | 'platinum' | 'harmonic'

export interface LadderStep {
  index: number
  tier: Tier
}

export const LADDER: LadderStep[] = [
  ...Array.from({ length: 8 }, (_, i) => ({ index: i, tier: 'military' as Tier })),
  ...Array.from({ length: 3 }, (_, i) => ({ index: 8 + i, tier: 'special' as Tier })),
  { index: 11, tier: 'gold' },
  { index: 12, tier: 'platinum' },
  { index: 13, tier: 'harmonic' },
]

export const MAX_LEVEL = LADDER.length // 14
export const GOLD_LEVEL = 12 // progresso >= 12 => Gold concluído
export const PLAT_LEVEL = 13
export const HB_LEVEL = 14

export function stepName(weapon: Weapon, step: LadderStep) {
  switch (step.tier) {
    case 'military':
      return `Militar ${step.index + 1}`
    case 'special':
      return weapon.specials[step.index - 8]?.name ?? `Especial ${step.index - 7}`
    case 'gold':
      return 'Gold'
    case 'platinum':
      return 'Platinum'
    case 'harmonic':
      return 'Harmonic Break'
  }
}

export interface StepInfo {
  /** Pré-requisito para o desafio abrir. */
  unlock?: string
  /** Desafio no modo selecionado. */
  challenge?: string
  pending?: boolean
  /** Meta numérica do desafio (para o contador da tela Grind). */
  target?: number
}

export function stepInfo(weapon: Weapon, step: LadderStep, mode: Mode): StepInfo {
  switch (step.tier) {
    case 'military': {
      const v = weapon.military?.values[step.index]
      if (v === undefined) return { challenge: 'Requisito ainda não confirmado.', pending: true }
      return { challenge: weapon.military!.unit === 'level' ? `Arma nível ${v}` : `${v} desbloqueios da arma` }
    }
    case 'special': {
      const s = weapon.specials[step.index - 8]
      if (!s) return { challenge: 'Requisito ainda não confirmado.', pending: true }
      const c = s.challenges[mode]
      return {
        unlock: unlockText(s.unlock),
        challenge: challengeText(c),
        pending: isPending(c) || !s.unlock,
        target: challengeTarget(c),
      }
    }
    case 'gold': {
      const c = data.gold[mode]
      return { unlock: 'Todas as militares e especiais', challenge: challengeText(c), pending: isPending(c), target: challengeTarget(c) }
    }
    case 'platinum': {
      const c = data.classes[weapon.cls]?.platinum[mode]
      return {
        unlock: `Gold em ${goldRequired(weapon.cls)} armas da classe`,
        challenge: challengeText(c),
        pending: isPending(c),
        target: c ? challengeTarget(c) : 0,
      }
    }
    case 'harmonic': {
      const c = data.classes[weapon.cls]?.harmonic[mode]
      return {
        unlock: `Platinum em ${LAUNCH_WEAPONS} armas`,
        challenge: challengeText(c),
        pending: isPending(c),
        target: c ? challengeTarget(c) : 0,
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Maestrias por modo (globais, desbloqueiam em sequência).
// ---------------------------------------------------------------------------

export interface MasteryDef {
  id: string
  mode: Mode
  name: string
  /** Pré-requisito global da primeira maestria do modo. */
  requires: 'divergence' | 'harmonic-break' | null
  requirement: string
  /** Meta numérica sugerida (contador). 0 = só marcar como concluído. */
  target: number
  verify?: boolean
}

export const MASTERIES: MasteryDef[] = MODES.flatMap(({ id: mode }) =>
  data.masteries[mode].chain.map((m) => ({
    id: m.id,
    mode,
    name: m.name,
    requires: (m.requires as MasteryDef['requires']) ?? null,
    requirement: challengeText(m.challenge),
    target: challengeTarget(m.challenge),
    verify: isPending(m.challenge),
  }))
)

export const FLASHPOINT = {
  name: 'Flashpoint',
  requirement: 'Conclua as 9 camuflagens de Maestria (3 de cada modo).',
}

export const DIVERGENCE = {
  name: 'Divergence',
  requirement: `Harmonic Break em ${LAUNCH_WEAPONS} armas.`,
}

/** Data de hoje no formato AAAA-MM-DD (fuso local). */
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const isReleased = (w: Weapon) => !!w.custom || (!!w.releaseDate && w.releaseDate <= today())

export function seasonLabel(w: Weapon) {
  if (w.custom) return 'Personalizada'
  const s = w.season ? `Season ${w.season}` : ''
  if (isReleased(w)) return s
  const when = w.releaseDate
    ? `chega em ${new Date(w.releaseDate + 'T00:00:00').toLocaleDateString('pt-BR')}`
    : 'em breve'
  return [s, when].filter(Boolean).join(' · ')
}

// ---------------------------------------------------------------------------
// Prestígio da arma
// ---------------------------------------------------------------------------

export function prestigeReqText(r: PrestigeReq): string {
  switch (r.type) {
    case 'weapon_prestige':
      return 'Dar prestígio na arma'
    case 'prestige_master':
      return `Prestige Master nível ${r.level} da arma`
    case 'player_level':
      return `Jogador nível ${r.level}`
    case 'pending':
      return 'Requisito ainda não confirmado.'
    case 'other':
      return r.description ?? 'Requisito ainda não confirmado.'
  }
}

export const prestigePending = (c: PrestigeCamo) =>
  !c.requirements.length || c.requirements.some((r) => r.type === 'pending')
