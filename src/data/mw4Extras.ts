// Extras do MW4 com autorização só para uso local (Game8: fotos com Divergence e maestrias de modo;
// CODMunity: ícones). Ficam em src/data/local/mw4-extras.json (no .gitignore), gerado por
// `npm run import:mw4-extras`. Sem o arquivo, o app só fica sem essas fotos.

interface Mw4Extras {
  kind: 'mw4-extras'
  photos: Record<string, Record<string, string>>
  icons: Record<string, string>
}

const files = import.meta.glob<Mw4Extras>('./local/mw4-extras.json', { eager: true, import: 'default' })
const extras: Mw4Extras | null = Object.values(files)[0] ?? null

/** Foto da arma com a camuflagem (Game8), se houver. `camo` = id da camuflagem (ex.: 'divergence', 'chiral'). */
export const extraPhoto = (weaponId: string, camo: string): string | null => extras?.photos[weaponId]?.[camo] ?? null

/** Ícone da arma (CODMunity), para armas sem imagem própria no app. */
export const extraIcon = (weaponId: string): string | null => extras?.icons[weaponId] ?? null

export const hasMw4Extras = !!extras
