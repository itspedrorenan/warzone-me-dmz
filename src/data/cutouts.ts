// Fotos das armas com o fundo removido (Magnific), só no site privado: src/data/local/cutouts.json e
// public/cutouts/ são baixados do Blob privado da Vercel no build (scripts/import-cutouts.mjs).
// A chave é a URL original da foto ou, nas fotos do CodCentral, "mw4-cc:<arma>:<camuflagem>".

const files = import.meta.glob<{ map: Record<string, string> }>('./local/cutouts.json', {
  eager: true,
  import: 'default',
})
const map: Record<string, string> = Object.values(files)[0]?.map ?? {}

export const cutout = (key: string | null | undefined): string | null => (key ? (map[key] ?? null) : null)
