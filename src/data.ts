// Dados do jogo: armas, escada de camuflagens e maestrias por modo.
//
// As fontes públicas divergem em vários detalhes (contagem de armas, requisitos
// de alguns desafios). Tudo aqui pode ser editado no app (aba "Ajustes") e os
// valores marcados com `verify: true` aparecem com um aviso de "confirme no jogo".

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

export interface Weapon {
  id: string
  name: string
  cls: WeaponClass
  /** Arma adicionada pelo usuário (ex.: armas de temporada). */
  custom?: boolean
  /** Se a arma entra na contagem de Harmonic Break / Divergence. */
  countsForMastery: boolean
}

const w = (name: string, cls: WeaponClass): Weapon => ({
  id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
  name,
  cls,
  countsForMastery: true,
})

/** Arsenal de lançamento (33 armas). Armas de temporada podem ser adicionadas no app. */
export const DEFAULT_WEAPONS: Weapon[] = [
  w('Han 86', 'ar'),
  w('M4', 'ar'),
  w('Hyeon Burst', 'ar'),
  w('Patriot XMR', 'ar'),
  w('Kastov 762', 'ar'),
  w('Oden', 'ar'),
  w('Axion', 'ar'),
  w('Cronen Squall', 'ar'),

  w('ISO Nightshade', 'smg'),
  w('VEL 46', 'smg'),
  w('Wz.55 Striga', 'smg'),
  w('PPSh-41', 'smg'),
  w('X-58 Nyx', 'smg'),

  w('Rezi 12', 'shotgun'),
  w('Warlord', 'shotgun'),

  w('FiNN LMG', 'lmg'),
  w('Type 73', 'lmg'),
  w('APOC-338', 'lmg'),

  w('MAR-9', 'marksman'),
  w('Oris 8.6', 'marksman'),
  w('Mosin-Nagant', 'marksman'),

  w('KG-7 Vulcan', 'sniper'),
  w('Astaroth .57', 'sniper'),
  w('Signal 50', 'sniper'),

  w('Krait P68', 'pistol'),
  w('Sang 9mm', 'pistol'),
  w('.50 GS', 'pistol'),
  w('Mojave .357', 'pistol'),

  w('PILA', 'launcher'),
  w('RPG-8', 'launcher'),
  w('JOKR', 'launcher'),
  w('PM-40 Anvil', 'launcher'),

  w('FSS Carbon Edge 1095', 'melee'),
]

// ---------------------------------------------------------------------------
// Escada de camuflagens por arma (linear): 8 militares → 3 especiais → Gold →
// Platinum → Harmonic Break. O progresso de cada arma é um número 0..LADDER.length
// (quantas camuflagens da escada já foram concluídas).
// ---------------------------------------------------------------------------

export type Tier = 'military' | 'special' | 'gold' | 'platinum' | 'harmonic'

export interface LadderStep {
  index: number
  tier: Tier
  name: string
}

export const LADDER: LadderStep[] = [
  ...Array.from({ length: 8 }, (_, i) => ({ index: i, tier: 'military' as Tier, name: `Militar ${i + 1}` })),
  ...Array.from({ length: 3 }, (_, i) => ({ index: 8 + i, tier: 'special' as Tier, name: `Especial ${i + 1}` })),
  { index: 11, tier: 'gold', name: 'Gold' },
  { index: 12, tier: 'platinum', name: 'Platinum' },
  { index: 13, tier: 'harmonic', name: 'Harmonic Break' },
]

export const MAX_LEVEL = LADDER.length // 14
export const GOLD_LEVEL = 12 // progresso >= 12 => Gold concluído
export const PLAT_LEVEL = 13
export const HB_LEVEL = 14

export interface Hint {
  text: string
  verify?: boolean
}

type ModeHints = Partial<Record<Mode, Hint>>

export const TIER_HINTS: Record<Tier, ModeHints> = {
  military: {
    mp: { text: 'Desbloqueada pelos desafios/níveis da arma. Veja o desafio exato no menu de camuflagens.', verify: true },
    dmz: { text: 'Desbloqueada pelos desafios/níveis da arma. Abates em inimigos NPC também contam no DMZ.', verify: true },
    wz: { text: 'Desbloqueada pelos desafios/níveis da arma.', verify: true },
  },
  special: {
    mp: { text: 'Requer todas as camuflagens militares da arma. Desafio específico por arma.', verify: true },
    dmz: { text: 'Requer todas as militares. No DMZ os números costumam ser maiores (NPCs contam).', verify: true },
    wz: { text: 'Requer todas as camuflagens militares da arma.', verify: true },
  },
  gold: {
    mp: { text: '15 abates em uma única partida de Multiplayer (após as especiais).' },
    dmz: { text: '100 abates em uma única partida de DMZ (após as especiais).' },
    wz: { text: 'Requer as especiais. Requisito em Warzone pode variar.', verify: true },
  },
  platinum: {},
  harmonic: {},
}

/** Desafios de classe (Multiplayer) para Platinum e Harmonic Break. */
export const CLASS_CHALLENGES: Record<WeaponClass, { platinum: Hint; harmonic: Hint }> = {
  ar: { platinum: { text: '50 abates com headshot' }, harmonic: { text: '25 abates duplos' } },
  smg: { platinum: { text: 'Abates pelas costas', verify: true }, harmonic: { text: 'Abates sem mirar (hipfire)' } },
  shotgun: { platinum: { text: 'Abates sem mirar (hipfire)' }, harmonic: { text: 'Abates sem recarregar' } },
  lmg: { platinum: { text: 'Abates sem morrer' }, harmonic: { text: 'Abates sem soltar o gatilho' } },
  marksman: { platinum: { text: 'Abates deitado (prone)' }, harmonic: { text: 'Abates com um tiro' } },
  sniper: { platinum: { text: 'Abates deitado (prone)' }, harmonic: { text: 'Abates com um tiro' } },
  pistol: { platinum: { text: 'Abates pelas costas' }, harmonic: { text: '40 abates sem mirar (hipfire)' } },
  launcher: { platinum: { text: 'Desafio de classe', verify: true }, harmonic: { text: 'Desafio de classe', verify: true } },
  melee: { platinum: { text: 'Desafio de classe', verify: true }, harmonic: { text: 'Desafio de classe', verify: true } },
}

// ---------------------------------------------------------------------------
// Maestrias por modo (globais, desbloqueiam em sequência após Divergence).
// ---------------------------------------------------------------------------

export interface MasteryDef {
  id: string
  mode: Mode
  name: string
  requirement: string
  /** Meta numérica sugerida (contador). 0 = só marcar como concluído. */
  target: number
  verify?: boolean
}

export const MASTERIES: MasteryDef[] = [
  { id: 'mercurial-drift', mode: 'mp', name: 'Mercurial Drift', requirement: 'Divergence + 250 partidas com multi-abate', target: 250 },
  { id: 'polyatomic-reforged', mode: 'mp', name: 'Polyatomic Reforged', requirement: 'Requer Mercurial Drift', target: 0, verify: true },
  { id: 'orion-reforged', mode: 'mp', name: 'Orion Reforged', requirement: 'Requer Polyatomic Reforged', target: 0, verify: true },

  { id: 'chiral', mode: 'dmz', name: 'Chiral', requirement: 'Divergence + 2.500 abates em inimigos Tier 3+ no DMZ', target: 2500, verify: true },
  { id: 'ripple-tide', mode: 'dmz', name: 'Ripple Tide', requirement: 'Chiral + 50 incursões extraindo 2 dog tags de tenente', target: 50 },
  { id: 'helio', mode: 'dmz', name: 'Helio', requirement: 'Ripple Tide + 25.000 abates com armas Lendárias em Operador nível máximo (fontes divergem)', target: 25000, verify: true },

  { id: 'parallax', mode: 'wz', name: 'Parallax', requirement: 'Divergence + 300 partidas com 5+ abates (fontes divergem)', target: 300, verify: true },
  { id: 'damascus-reforged', mode: 'wz', name: 'Damascus Reforged', requirement: 'Requer Parallax', target: 0, verify: true },
  { id: 'empyros', mode: 'wz', name: 'Empyros', requirement: 'Requer Damascus Reforged', target: 0, verify: true },
]

export const FLASHPOINT = {
  name: 'Flashpoint',
  requirement: 'Conclua as 9 camuflagens de Maestria (3 de cada modo).',
}

export const DIVERGENCE = {
  name: 'Divergence',
  requirement: 'Harmonic Break em todas as armas que contam para maestria.',
}
