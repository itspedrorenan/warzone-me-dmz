/** Textura da camuflagem como imagem normal (mesmo mecanismo das fotos das armas), cobrindo o elemento pai.
 *  `muted`: camuflagem ainda não conquistada (em cinza e apagada). */
export function CamoTex({ url, muted = false }: { url: string | null; muted?: boolean }) {
  if (!url) return null
  return (
    <img className={`tex ${muted ? 'muted' : ''}`} src={url} alt="" aria-hidden="true" decoding="async" draggable={false} />
  )
}
