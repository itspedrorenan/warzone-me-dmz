/** Textura da camuflagem como imagem normal (mesmo mecanismo das fotos das armas), cobrindo o elemento pai. */
export function CamoTex({ url }: { url: string | null }) {
  if (!url) return null
  return <img className="tex" src={url} alt="" aria-hidden="true" decoding="async" draggable={false} />
}
