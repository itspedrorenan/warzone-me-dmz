import { LEGACY_GAMES } from './legacy'

/** Logos dos jogos em public/games/ (MW4, MW II e MW III nas cores originais, MW 2019 em branco).
 *  Todos numa régua comum: o "MW" ocupa a mesma altura e a mesma linha em todos. */
export const GAME_LOGOS: Record<string, string> = {
  mw4: './games/mw4.webp',
  mw19: './games/mw19.webp',
  mw2: './games/mw2.webp',
  mw3: './games/mw3.webp',
}

export interface GameEntry {
  id: string
  label: string
  short: string
}

/** Jogos disponíveis, do mais antigo ao mais novo: MW 2019, MW II, MW III e, por último, MW4.
 *  Os antigos só existem quando os dados locais foram gerados (ver data/legacy). */
export const GAMES: GameEntry[] = [
  ...LEGACY_GAMES.map((g) => ({ id: g.game, label: g.label, short: g.short })),
  { id: 'mw4', label: 'Modern Warfare 4', short: 'MW4' },
]
